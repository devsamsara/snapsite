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
  "";

if (!GRAPHQL_URL && __DEV__) {
  console.warn(
    "[Apollo] GRAPHQL_URL is not set. " +
    "Add it to your .env file or EAS secrets."
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

// Internal cache so the sync ApolloLink can access the latest token.
let _cachedToken: string | null = null;

/** Call this from AuthContext after login to keep the Apollo header in sync. */
export async function setAuthToken(token: string | null): Promise<void> {
  _cachedToken = token;
  if (token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  }
}

/** Restore the token from SecureStore on app launch. */
export async function restoreAuthToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  _cachedToken = token;
  return token;
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
      fetchPolicy: "cache-and-network",
    },
  },
});
