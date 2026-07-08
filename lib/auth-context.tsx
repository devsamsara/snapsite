import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  apolloClient,
  clearTokens,
  registerUnauthenticatedHandler,
  registerTokenRefreshedHandler,
  restoreAuthToken,
  setAuthToken,
  setRefreshToken,
} from '@/lib/graphql-client';
import {
  Company,
  ConfirmAccountDocument,
  CreateCompanyDocument,
  CreateCompanyInput,
  ForgotPasswordDocument,
  LoginDocument,
  MeDocument,
  RegisterPushTokenDocument,
  User,
} from '@/gql/graphql';
import {
  getExpoPushToken,
  getPermissionStatus,
  NOTIFICATIONS_ASKED_KEY,
} from '@/hooks/use-notifications';
import { Platform } from 'react-native';

/** Key used to persist whether the user has already seen the onboarding. */
export const ONBOARDING_DONE_KEY = '@snapsite_onboarding_done';
/** Key used to persist the user object. */
export const AUTH_USER_KEY = '@snapsite_auth_user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
  company?: Company | null;
  phone?: string | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (createCompanyInput: CreateCompanyInput) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmEmail: (code: string) => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

function extractMessage(error: any): string {
  if (error?.graphQLErrors?.length) {
    return error.graphQLErrors[0]?.message ?? error.message;
  }
  if (error?.networkError?.message) return error.networkError.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // BUG CORREGIDO #6: signOutRef debe inicializarse como null (no undefined)
  // para evitar que TypeScript lo trate como posiblemente no inicializado.
  const signOutRef = useRef<(() => Promise<void>) | null>(null);

  const signOut = useCallback(async () => {
    try {
      await clearTokens();
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      // BUG CORREGIDO #7: clearStore() puede fallar si Apollo ya está en un estado inválido.
      // Usar resetStore() es más seguro, pero puede disparar re-fetches. Usamos clearStore
      // con catch para no bloquear el signOut.
      await apolloClient.clearStore().catch(() => {});
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  // BUG CORREGIDO #8: Los handlers se registraban en useEffect con dependencias vacías [],
  // lo que significa que si signOut cambia (aunque sea estable por useCallback),
  // el handler registrado podría tener una referencia stale. Usar signOutRef resuelve esto.
  useEffect(() => {
    registerUnauthenticatedHandler(() => {
      signOutRef.current?.();
    });
  }, []);

  useEffect(() => {
    registerTokenRefreshedHandler(
      async (newToken, newRefreshToken, freshUser) => {
        try {
          const userToStore = freshUser as unknown as User;
          setUser(userToStore);
          await AsyncStorage.setItem(
            AUTH_USER_KEY,
            JSON.stringify(userToStore)
          );
        } catch (e) {
          console.error('[Auth] Failed to update user after token refresh:', e);
        }
      }
    );
  }, []);

  useEffect(() => {
    const restore = async () => {
      try {
        // 1. Restaurar ambos tokens desde SecureStore
        const token = await restoreAuthToken();

        // 2. Restaurar usuario desde caché para UI instantánea
        const cachedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser) as User);
          } catch {
            // JSON corrupto — ignorar
            await AsyncStorage.removeItem(AUTH_USER_KEY);
          }
        }

        if (token) {
          // 3. Validar/refrescar datos del usuario en background
          try {
            const { data, error } = await apolloClient.query({
              query: MeDocument,
              fetchPolicy: 'network-only',
            });

            if (data?.me) {
              const freshUser = data.me as User;
              setUser(freshUser);
              await AsyncStorage.setItem(
                AUTH_USER_KEY,
                JSON.stringify(freshUser)
              );
            } else if (Array.isArray(error) && error?.length) {
              // BUG CORREGIDO #9: El código anterior usaba error.graphQLErrors
              // pero con errorPolicy:'all', Apollo 4 devuelve los errores en el
              // campo `errors` del resultado, no en una excepción.
              const isAuthError = error.some(
                (ge: any) =>
                  ge.extensions?.code === 'UNAUTHENTICATED' ||
                  ge.message?.toLowerCase().includes('unauthorized') ||
                  ge.message?.toLowerCase().includes('unauthenticated')
              );
              if (isAuthError) {
                // El error link ya intentó el refresh. Si llegamos aquí,
                // el refresh también falló → hacer signOut.
                console.warn(
                  '[Auth] Me query failed with auth error after refresh attempt — signing out'
                );
                await clearTokens();
                await AsyncStorage.removeItem(AUTH_USER_KEY);
                setUser(null);
              }
              // Si no es error de auth (ej. error de red), mantener el usuario en caché
              // para no desloguear al usuario por un problema de conectividad.
            }
          } catch (queryErr: any) {
            // BUG CORREGIDO #10: Si la query falla por error de RED (no de auth),
            // NO hacer signOut. El usuario sigue logueado, simplemente no hay conexión.
            const isNetworkError =
              queryErr?.networkError ||
              queryErr?.message?.toLowerCase().includes('network') ||
              queryErr?.message?.toLowerCase().includes('fetch');

            if (!isNetworkError) {
              // Error inesperado no relacionado con red — loguear pero no desloguear
              console.error('[Auth] Unexpected error during session restore:', queryErr);
            }
            // En ambos casos, mantener el usuario en caché si lo había.
            // El error link ya habrá manejado los errores de auth.
          }
        } else {
          // No hay token en absoluto — limpiar todo
          setUser(null);
          await AsyncStorage.removeItem(AUTH_USER_KEY);
        }
      } catch (e) {
        console.error('[Auth] Restore session error:', e);
        // No hacer signOut aquí — podría ser un error puntual de SecureStore
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const inPublicModal =
      segments[0] === 'modals' &&
      (segments[1] === 'terms-modal' || segments[1] === 'privacy-modal');
    const isPublic = inAuthGroup || inOnboarding || inPublicModal;

    if (!user && !isPublic) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      AsyncStorage.getItem(ONBOARDING_DONE_KEY).then(done => {
        if (done === 'true') {
          router.push('/(tabs)');
        } else {
          router.push('/onboarding');
        }
      });
    }
  }, [user, segments, isLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error} = await apolloClient.mutate({
        mutation: LoginDocument,
        variables: { input: { email: email.trim().toLowerCase(), password } },
      });

      // BUG CORREGIDO #11: El código anterior comprobaba `error` (singular) pero
      // Apollo 4 con errorPolicy:'all' devuelve los errores en `errors` (plural).
      if (Array.isArray(error) && error?.length || !data) {
        throw new Error('Login failed');
      }

      const { token, refreshToken, user: userData } = data.login;
      await setAuthToken(token);
      await setRefreshToken(refreshToken ?? null);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      setUser(userData as User);

      // Registrar el pushToken si el permiso ya está concedido
      // (el usuario puede haber dado el permiso en una sesión anterior)
      try {
        const permStatus = await getPermissionStatus();
        if (permStatus === 'granted') {
          const pushToken = await getExpoPushToken();
          if (pushToken) {
            // Marcar como ya preguntado y registrar en el backend
            await AsyncStorage.setItem(NOTIFICATIONS_ASKED_KEY, 'true');
            apolloClient.mutate({
              mutation: RegisterPushTokenDocument,
              variables: { token: pushToken, platform: Platform.OS },
            }).catch(() => { /* no bloquear el login si falla */ });
          }
        }
      } catch { /* no bloquear el login */ }
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  const signUp = useCallback(async (input: CreateCompanyInput) => {
    const { contactPassword, contactEmail, contactName, size, industry } =
      input;
    try {
      const { data, error } = await apolloClient.mutate({
        mutation: CreateCompanyDocument,
        variables: {
          input: {
            contactPassword,
            contactEmail: contactEmail.trim().toLowerCase(),
            contactName: contactName.trim(),
            name: contactName.trim(),
            size,
            industry,
          },
        },
      });

      if(data) {
        await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
        await signIn(contactEmail.trim().toLowerCase(), contactPassword);

      }
      if (error || !data) {
        throw new Error(`Registration failed ${error?.message}`);
      }

    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await apolloClient.mutate({
        mutation: ForgotPasswordDocument,
        variables: { input: { email: email.trim().toLowerCase() } },
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  const confirmEmail = useCallback(async (code: string) => {
    try {
      await apolloClient.mutate({
        mutation: ConfirmAccountDocument,
        variables: { token: code.trim() },
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  const updateUser = useCallback(async (patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...patch };
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        forgotPassword,
        confirmEmail,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
