import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
  Observable,
  FetchResult,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { RefreshTokenDocument } from "@/gql/graphql";

// ─── Config ──────────────────────────────────────────────────────────────────

const GRAPHQL_URL: string =
  (Constants.expoConfig?.extra?.graphqlUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://192.168.1.65:4000/api/graphql';

export const REST_API_URL = GRAPHQL_URL.replace('/graphql', '');

if (__DEV__ && !Constants.expoConfig?.extra?.graphqlUrl && !process.env.GRAPHQL_URL) {
  console.warn(
    '[Apollo] GRAPHQL_URL is not set. Using localhost fallback.\n' +
    'Add GRAPHQL_URL to your .env file or EAS secrets for staging/prod.',
  );
}

// ─── SecureStore keys ────────────────────────────────────────────────────────

const AUTH_TOKEN_KEY    = "snapsiteAuthToken";
const REFRESH_TOKEN_KEY = "snapsiteRefreshToken";

// ─── In-memory token cache ───────────────────────────────────────────────────
// Declared BEFORE any link so every closure always references the same binding.

let _cachedToken:        string | null = null;
let _cachedRefreshToken: string | null = null;

// ─── Token helpers ────────────────────────────────────────────────────────────

/** Persist access token in memory + SecureStore. */
export async function setAuthToken(token: string | null): Promise<void> {
  _cachedToken = token;
  if (token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
  }
}

/** Persist refresh token in memory + SecureStore. */
export async function setRefreshToken(token: string | null): Promise<void> {
  _cachedRefreshToken = token;
  if (token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
  }
}

/** Restore both tokens from SecureStore on app launch. */
export async function restoreAuthToken(): Promise<string | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(AUTH_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    _cachedToken        = accessToken;
    _cachedRefreshToken = refreshToken;
    return accessToken;
  } catch {
    return null;
  }
}

/** Clear both tokens from memory and SecureStore. */
export async function clearTokens(): Promise<void> {
  _cachedToken        = null;
  _cachedRefreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
  ]);
}

// ─── Refresh state ────────────────────────────────────────────────────────────
// Prevents multiple concurrent refresh calls when several requests fail at once.

let _isRefreshing = false;
let _pendingQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: any)     => void;
}> = [];

/** Called by the error link when it successfully refreshes the token. */
function resolveQueue(newToken: string) {
  _pendingQueue.forEach(({ resolve }) => resolve(newToken));
  _pendingQueue = [];
}

/** Called by the error link when the refresh itself fails. */
function rejectQueue(err: any) {
  _pendingQueue.forEach(({ reject }) => reject(err));
  _pendingQueue = [];
}

// ─── Links ────────────────────────────────────────────────────────────────────

/**
 * Auth link: injects the Bearer token into every outgoing request.
 * Uses the in-memory _cachedToken (synchronous, zero-latency).
 * Guaranteed to be populated before any query fires because AuthProvider
 * awaits restoreAuthToken() and only sets isLoading=false afterwards.
 */
const authLink = new ApolloLink((operation, forward) => {
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
 * Error link: intercepts UNAUTHENTICATED errors (expired access token),
 * calls the RefreshToken mutation once, updates both tokens, and retries
 * the original failed operation transparently.
 *
 * If the refresh itself fails (refresh token also expired) it calls
 * onUnauthenticated() so AuthProvider can sign the user out cleanly.
 */
let _onUnauthenticated: (() => void) | null = null;

/** AuthProvider registers this callback so the error link can trigger signOut. */
export function registerUnauthenticatedHandler(handler: () => void) {
  _onUnauthenticated = handler;
}

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (!graphQLErrors) return;

  const isAuthError = graphQLErrors.some(
    (err) =>
      err.extensions?.code === 'UNAUTHENTICATED' ||
      err.message?.toLowerCase().includes('unauthorized') ||
      err.message?.toLowerCase().includes('unauthenticated') ||
      err.message?.toLowerCase().includes('token') ||
      err.message?.toLowerCase().includes('jwt')
  );

  if (!isAuthError) return;

  // Don't try to refresh if there is no refresh token at all
  if (!_cachedRefreshToken) {
    _onUnauthenticated?.();
    return;
  }

  // Don't intercept the RefreshToken mutation itself (avoid infinite loop)
  if (operation.operationName === 'RefreshToken') {
    _onUnauthenticated?.();
    return;
  }

  return new Observable<FetchResult>((observer) => {
    if (_isRefreshing) {
      // Another request is already refreshing — queue this one
      _pendingQueue.push({
        resolve: (newToken: string) => {
          operation.setContext(({ headers = {} }: Record<string, any>) => ({
            headers: { ...headers, Authorization: `Bearer ${newToken}` },
          }));
          forward(operation).subscribe(observer);
        },
        reject: (err) => observer.error(err),
      });
      return;
    }

    _isRefreshing = true;

    // Use a raw fetch so we don't go through the Apollo link chain
    // (which would try to inject the expired token again)
    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($token: String!) {
            refreshToken(token: $token) {
              token
              refreshToken
            }
          }
        `,
        variables: { token: _cachedRefreshToken },
      }),
    })
      .then((res) => res.json())
      .then(async (json) => {
        const payload = json?.data?.refreshToken;
        if (!payload?.token) throw new Error('Refresh failed: no token in response');

        // Persist the new tokens
        await setAuthToken(payload.token);
        await setRefreshToken(payload.refreshToken ?? _cachedRefreshToken);

        resolveQueue(payload.token);
        _isRefreshing = false;

        // Retry the original operation with the new token
        operation.setContext(({ headers = {} }: Record<string, any>) => ({
          headers: { ...headers, Authorization: `Bearer ${payload.token}` },
        }));
        forward(operation).subscribe(observer);
      })
      .catch((err) => {
        console.error('[Apollo] Token refresh failed:', err);
        rejectQueue(err);
        _isRefreshing = false;
        _onUnauthenticated?.();
        observer.error(err);
      });
  });
});

const httpLink = createHttpLink({ uri: GRAPHQL_URL });

// ─── Apollo Client ────────────────────────────────────────────────────────────

console.log('[Apollo] GraphQL URL:', GRAPHQL_URL);

export const apolloClient = new ApolloClient({
  // Order: errorLink → authLink → httpLink
  // errorLink must come first so it can intercept responses before they bubble up
  link: from([errorLink, authLink, httpLink]),
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
