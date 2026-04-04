/**
 * lib/auth-context.tsx
 *
 * AuthContext completo para SnapSite.
 *
 * Expone:
 *   user           — usuario autenticado o null
 *   isLoading      — true mientras restaura sesión al arrancar
 *   signIn         — login con email + password
 *   signUp         — registro con nombre, email, password
 *   signOut        — cierra sesión y limpia token
 *   forgotPassword — envía email de recuperación
 *   confirmEmail   — verifica código de confirmación
 *   updateUser     — actualiza datos del usuario en el contexto local
 *
 * Conecta con tu backend GraphQL.
 * Reemplaza los bodies de las mutations/queries con tu schema real.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import { gql, ApolloError } from '@apollo/client';
import {
  apolloClient,
  setAuthToken,
  restoreAuthToken,
} from '@/lib/graphql-client';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  /** Currently signed-in user, or null if not authenticated */
  user: AuthUser | null;
  /** True while the app is restoring a persisted session on launch */
  isLoading: boolean;
  /** Sign in with email and password. Throws on failure. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Register a new account. Navigates to onboarding on success. */
  signUp: (name: string, email: string, password: string) => Promise<void>;
  /** Sign out and clear the stored token. */
  signOut: () => Promise<void>;
  /** Request a password-reset email. */
  forgotPassword: (email: string) => Promise<void>;
  /** Verify the email confirmation code. */
  confirmEmail: (code: string) => Promise<void>;
  /** Update the in-memory user after a profile edit. */
  updateUser: (patch: Partial<AuthUser>) => void;
}

// ─── GraphQL operations ───────────────────────────────────────────────────────
// Replace these with your real backend schema once it is ready.

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract a human-readable message from an Apollo or generic error. */
function extractMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    return (
      error.graphQLErrors[0]?.message ??
      error.networkError?.message ??
      error.message
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router                    = useRouter();
  const segments                  = useSegments();

  // ── Restore persisted session on app launch ──────────────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await restoreAuthToken();
        if (token) {
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

  // ── Navigation guard ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup  = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const isPublic     = inAuthGroup || inOnboarding;

    if (!user && !isPublic) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  // ── signIn ───────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: { email: email.trim().toLowerCase(), password },
      });
      const { token, user: userData } = data.login;
      await setAuthToken(token);
      setUser(userData as AuthUser);
      // Navigation guard redirects to /(tabs) automatically
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  }, []);

  // ── signUp ───────────────────────────────────────────────────────────────
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
        setUser(userData as AuthUser);
        // Navigate to onboarding after successful registration
        router.replace('/onboarding');
      } catch (error) {
        throw new Error(extractMessage(error));
      }
    },
    [],
  );

  // ── signOut ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await setAuthToken(null);
      await apolloClient.clearStore();
    } finally {
      setUser(null);
      // Navigation guard redirects to /auth/login automatically
    }
  }, []);

  // ── forgotPassword ───────────────────────────────────────────────────────
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

  // ── confirmEmail ─────────────────────────────────────────────────────────
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

  // ── updateUser ───────────────────────────────────────────────────────────
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
