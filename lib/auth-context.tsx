import React, { createContext, useCallback, useContext, useEffect, useState, } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { apolloClient, restoreAuthToken, setAuthToken, } from '@/lib/graphql-client';
import {
  Company,
  ConfirmAccountDocument,
  CreateCompanyDocument,
  CreateCompanyInput,
  ForgotPasswordDocument,
  LoginDocument,
  MeDocument,
  RegisterDocument,
  User,
} from '@/gql/graphql';

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
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // ─── Restore session on launch ──────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        // 1. Restore token
        const token = await restoreAuthToken();
        
        // 2. Restore user from cache immediately for instant UI
        const cachedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser) as User);
        }

        if (token) {
          // 3. Validate/Refresh user data in background
          const { data, error } = await apolloClient.query({
            query: MeDocument,
            fetchPolicy: 'network-only',
          }).catch(err => ({ data: null, error: err }));

          if (data?.me) {
            const freshUser = data.me as User;
            setUser(freshUser);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(freshUser));
          } else if (error) {
            const isAuthError = error.graphQLErrors?.some(
              (ge: any) => ge.extensions?.code === 'UNAUTHENTICATED' || ge.message.includes('unauthorized')
            );
            
            if (isAuthError) {
              await setAuthToken(null);
              await AsyncStorage.removeItem(AUTH_USER_KEY);
              setUser(null);
            }
          }
        } else {
          // No token, ensure no user
          setUser(null);
          await AsyncStorage.removeItem(AUTH_USER_KEY);
        }
      } catch (e) {
        console.error('[Auth] Restore session error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  // ─── Route guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    // modals/terms-modal and modals/privacy-modal must be accessible
    // without a session (reachable from the register screen)
    const inPublicModal =
      segments[0] === 'modals' &&
      (segments[1] === 'terms-modal' || segments[1] === 'privacy-modal');
    const isPublic = inAuthGroup || inOnboarding || inPublicModal;

    if (!user && !isPublic) {
      // Not authenticated and not on a public screen → go to login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Authenticated and still on auth screen
      // Check if onboarding is needed
      AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((done) => {
        if (done === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      });
    }
  }, [user, segments, isLoading]);

  // ─── signIn ─────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const input = email.trim().toLowerCase();

      // ── Real GraphQL login ────────────────────────────────────────────────
      const { data, error } = await apolloClient.mutate({
        mutation: LoginDocument,
        variables: {
          input: {
            email: input,
            password,
          },
        },
      });

      if (error || !data) {
        throw new Error(error?.message);
      }

      const { token, user: userData } = data.login;
      await setAuthToken(token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      setUser(userData as User);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  // ─── signUp ─────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (input: CreateCompanyInput) => {
      const {contactPassword, contactEmail, contactName, size, industry} = input;
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

        if(!data || error) {
          throw new Error('An unexpected error occurred.');
        }
        const { user, token } = data.createCompany;
        await setAuthToken(token);
        await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        setUser(user as User);
        router.replace('/onboarding');
      } catch (error) {
        throw new Error(extractMessage(error));
      }
    },
    []
  );

  // ─── signOut ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await setAuthToken(null);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      await apolloClient.clearStore();
    } finally {
      setUser(null);
    }
  }, []);

  // ─── forgotPassword ─────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    try {
      await apolloClient.mutate({
        mutation: ForgotPasswordDocument,
        variables: {
          input: {
            email: email.trim().toLowerCase(),
          },
        },
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  // ─── confirmEmail ───────────────────────────────────────────────────────────
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

  // ─── updateUser ─────────────────────────────────────────────────────────────
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
