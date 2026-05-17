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
} from '@/gql/graphql';

/** Key used to persist whether the user has already seen the onboarding. */
export const ONBOARDING_DONE_KEY = '@snapsite_onboarding_done';

const APP_ENV: string =
  (Constants.expoConfig?.extra?.appEnv as string | undefined) ?? 'development';

const IS_TEST_ENV = APP_ENV !== 'production';

const MOCK_TESTER: {
  email: string;
  password: string;
  token: string;
  user: AuthUser;
} = {
  email: 'tester@test.com',
  password: 'test',
  token: 'mockTokenTester',
  user: {
    id: 'mockUserTester',
    name: 'Tester',
    email: 'tester@test.com',
    avatarUrl: null,
    role: 'admin',
    company: { } as Company,
    phone: null,
  },
};

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
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (createCompanyInput: CreateCompanyInput) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmEmail: (code: string) => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // ─── Restore session on launch ──────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await restoreAuthToken();
        if (token) {
          // Mock token: resolve locally without hitting the server
          // (only valid in development / preview builds)
          if (IS_TEST_ENV && token === MOCK_TESTER.token) {
            // 'mockTokenTester'
            setUser(MOCK_TESTER.user);
            return;
          }

          // Real token: validate against the GraphQL server
          const { data } = await apolloClient.query({
            query: MeDocument,
            fetchPolicy: 'network-only',
          });
          if (data?.me) {
            setUser(data.me as AuthUser);
          } else {
            // Token exists but server rejected it — clear it
            await setAuthToken(null);
          }
        }
      } catch {
        // Network error or invalid token — silently clear
        await setAuthToken(null);
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

      if (IS_TEST_ENV) {
        if (
          (input === MOCK_TESTER.email || input === 'tester') &&
          password === MOCK_TESTER.password
        ) {
          await setAuthToken(MOCK_TESTER.token);
          setUser(MOCK_TESTER.user);
          return;
        }
      }

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
      setUser(userData as AuthUser);
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
        setUser(user as AuthUser);
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
  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => (prev ? { ...prev, ...patch } : prev));
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
