/**
 * lib/auth-context.tsx
 *
 * Authentication context for SnapSite.
 *
 * Provides:
 *   - user: the currently signed-in user (or null)
 *   - isLoading: true while restoring session on app launch
 *   - signIn(email, password) — calls your GraphQL LOGIN mutation
 *   - signUp(name, email, password) — calls your GraphQL REGISTER mutation
 *   - signOut() — clears token and user
 *
 * Replace the mutation/query bodies with your real GraphQL schema once
 * your backend is ready. The auth flow and token management are fully wired.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import { gql } from '@apollo/client';
import { apolloClient, setAuthToken, restoreAuthToken } from '@/lib/graphql-client';

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
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── GraphQL operations ───────────────────────────────────────────────────────
// Replace these with your real backend schema.

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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Restore session on app launch
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
            await setAuthToken(null);
          }
        }
      } catch {
        await setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  // Navigation guard
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data } = await apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: { email, password },
    });
    const { token, user: userData } = data.login;
    await setAuthToken(token);
    setUser(userData as AuthUser);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await apolloClient.mutate({
        mutation: REGISTER_MUTATION,
        variables: { name, email, password },
      });
      const { token, user: userData } = data.register;
      await setAuthToken(token);
      setUser(userData as AuthUser);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await setAuthToken(null);
    await apolloClient.clearStore();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
