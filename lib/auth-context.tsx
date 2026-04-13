import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import { gql } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  apolloClient,
  setAuthToken,
  restoreAuthToken,
} from '@/lib/graphql-client';

/** Key used to persist whether the user has already seen the onboarding. */
export const ONBOARDING_DONE_KEY = '@snapsite_onboarding_done';

// ─── Environment detection ────────────────────────────────────────────────────
// APP_ENV is injected by EAS build profiles via app.config.ts → extra.appEnv:
//   development → mock login enabled (tester@test.com / test)
//   preview     → mock login enabled
//   production  → mock login disabled, real GraphQL only
const APP_ENV: string =
  (Constants.expoConfig?.extra?.appEnv as string | undefined) ?? 'development';

/** True when running in a non-production build (dev client or preview). */
const IS_TEST_ENV = APP_ENV !== 'production';

// ─── Mock user (only active in development / preview) ─────────────────────────
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
    company: 'SnapSite',
    phone: null,
  },
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
  company?: string | null;
  phone?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmEmail: (code: string) => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        avatarUrl
        role
        company
        phone
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user {
        id
        name
        email
        avatarUrl
        role
        company
        phone
      }
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      avatarUrl
      role
      company
      phone
    }
  }
`;

const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
    }
  }
`;

const CONFIRM_EMAIL_MUTATION = gql`
  mutation ConfirmEmail($code: String!) {
    confirmEmail(code: $code) {
      success
    }
  }
`;

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
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router                    = useRouter();
  const segments                  = useSegments();

  // ─── Restore session on launch ──────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await restoreAuthToken();
        if (token) {
          // Mock token: resolve locally without hitting the server
          // (only valid in development / preview builds)
          if (IS_TEST_ENV && token === MOCK_TESTER.token) { // 'mockTokenTester'
            setUser(MOCK_TESTER.user);
            return;
          }

          // Real token: validate against the GraphQL server
          const { data } = await apolloClient.query({
            query: ME_QUERY,
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

    const inAuthGroup  = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    // modals/terms-modal and modals/privacy-modal must be accessible
    // without a session (reachable from the register screen)
    const inPublicModal =
      segments[0] === 'modals' &&
      (segments[1] === 'terms-modal' || segments[1] === 'privacy-modal');
    const isPublic     = inAuthGroup || inOnboarding || inPublicModal;

    if (!user && !isPublic) {
      // Not authenticated and not on a public screen → go to login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Authenticated and still on auth screen → go to tabs
      // (onboarding is handled explicitly by signUp, not here)
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  // ─── signIn ─────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const input = email.trim().toLowerCase();

      // ── Mock login (development / preview only) ───────────────────────────
      // Disabled automatically in production builds (APP_ENV === 'production').
      // Credentials: tester@test.com / test
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
      const { data, errors } = await apolloClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: { email: input, password },
      });

      if (errors?.length) {
        throw new Error(errors[0].message);
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
    async (name: string, email: string, password: string) => {
      try {
        const { data } = await apolloClient.mutate({
          mutation: REGISTER_MUTATION,
          variables: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          },
        });
        const { token, user: userData } = data.register;
        await setAuthToken(token);
        // Mark onboarding as NOT done so it shows after registration
        await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
        setUser(userData as AuthUser);
        // Navigate to onboarding — only triggered after registration
        router.replace('/onboarding');
      } catch (error) {
        throw new Error(extractMessage(error));
      }
    },
    [],
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
        mutation: FORGOT_PASSWORD_MUTATION,
        variables: { email: email.trim().toLowerCase() },
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  // ─── confirmEmail ───────────────────────────────────────────────────────────
  const confirmEmail = useCallback(async (code: string) => {
    try {
      await apolloClient.mutate({
        mutation: CONFIRM_EMAIL_MUTATION,
        variables: { code: code.trim() },
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  // ─── updateUser ─────────────────────────────────────────────────────────────
  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
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
