/**
 * lib/graphql-client.ts
 *
 * Apollo Client setup for the SnapSite app.
 *
 * Usage:
 *   import { apolloClient } from "@/lib/graphql-client";
 *
 * Or wrap your app with <ApolloProvider client={apolloClient}> in _layout.tsx
 * and use useQuery / useMutation hooks directly in screens.
 *
 * Environment:
 *   Set GRAPHQL_URL in your .env file (local) or EAS secrets (staging/prod).
 *   e.g.  GRAPHQL_URL=https://api.yourdomain.com/graphql
 */
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
} from "@apollo/client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// ─── Endpoint ─────────────────────────────────────────────────────────────────

const GRAPHQL_URL: string =
  (Constants.expoConfig?.extra?.graphqlUrl as string | undefined) ??
  process.env.GRAPHQL_URL ??
  'http://localhost:4000/graphql'; // fallback for local dev

if (__DEV__ && !Constants.expoConfig?.extra?.graphqlUrl && !process.env.GRAPHQL_URL) {
  console.warn(
    '[Apollo] GRAPHQL_URL is not set. Using localhost fallback.\n' +
    'Add GRAPHQL_URL to your .env file or EAS secrets for staging/prod.',
  );
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

const AUTH_TOKEN_KEY = "@snapsite/authToken";

/** Read the stored JWT and attach it as a Bearer header on every request. */
const authLink = new ApolloLink((operation, forward) => {
  // SecureStore.getItemAsync is async; for Apollo we use a sync approach via
  // a cached token. The token is updated by AuthContext on login/logout.
  const token = _cachedToken;
  if (token) {
    operation.setContext(({ headers = {} }: Record<string, any>) => ({
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    }));
  }
  return forward(operation);
});

/**
 * In-memory token cache so the synchronous ApolloLink middleware
 * can attach the latest token without async overhead per request.
 */
let _cachedToken: string | null = null;

/**
 * Persist a new JWT to SecureStore and update the in-memory cache.
 * Pass null to clear the token on logout.
 */
export async function setAuthToken(token: string | null): Promise<void> {
  _cachedToken = token;
  if (token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {
      // Key may not exist on first logout — ignore
    });
  }
}

/**
 * Read the token from SecureStore on app launch and warm the cache.
 * Returns the token string, or null if none is stored.
 */
export async function restoreAuthToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    _cachedToken = token;
    return token;
  } catch {
    return null;
  }
}

// ─── HTTP link ────────────────────────────────────────────────────────────────

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

// ─── Apollo Client ────────────────────────────────────────────────────────────

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
