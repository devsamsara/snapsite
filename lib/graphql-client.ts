import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
  Observable,
  FetchResult,
  CombinedGraphQLErrors,
} from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { RefreshTokenDocument, type RefreshTokenMutation } from "@/gql/graphql";

// Apollo 4 exige declarar los defaultOptions para que los resultados
// tipados (MutateResult, QueryResult) reflejen el errorPolicy real.
declare module '@apollo/client' {
  namespace ApolloClient {
    namespace DeclareDefaultOptions {
      interface WatchQuery {
        errorPolicy: 'all';
      }
      interface Query {
        errorPolicy: 'all';
      }
      interface Mutate {
        errorPolicy: 'all';
      }
    }
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

const GRAPHQL_URL: string =
  (Constants.expoConfig?.extra?.graphqlUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'https://site--backoffice--dz9c78m5fdc5.code.run/api/graphql';

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

// ─── Callbacks registrados por AuthProvider ───────────────────────────────────

let _onUnauthenticated: (() => void) | null = null;

/** AuthProvider registers this callback so the error link can trigger signOut. */
export function registerUnauthenticatedHandler(handler: () => void) {
  _onUnauthenticated = handler;
}

type TokenRefreshedUser = RefreshTokenMutation['refreshToken']['user'];
type TokenRefreshedHandler = (
  newToken: string,
  newRefreshToken: string,
  user: TokenRefreshedUser,
) => void;

let _onTokenRefreshed: TokenRefreshedHandler | null = null;

/**
 * AuthProvider registers this callback to receive the fresh user data
 * returned by the RefreshToken mutation, so it can update its state
 * without requiring a full re-login.
 */
export function registerTokenRefreshedHandler(handler: TokenRefreshedHandler) {
  _onTokenRefreshed = handler;
}

// ─── Links ────────────────────────────────────────────────────────────────────

/**
 * Auth link: injects the Bearer token into every outgoing request.
 * Uses the in-memory _cachedToken (synchronous, zero-latency).
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

// ─── Helper: detectar si un error es de autenticación ─────────────────────────

function isAuthenticationError(error: any): boolean {
  // El backend usa ErrorUtils.unauthorized() que Apollo Server 4 puede convertir
  // con extensions.code = 'UNAUTHORIZED' (del enum ErrorCode del backend) o
  // 'UNAUTHENTICATED' (estándar Apollo). También detectamos por mensaje.
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(
      (err: any) =>
        err.extensions?.code === 'UNAUTHENTICATED' ||
        err.extensions?.code === 'UNAUTHORIZED' ||
        err.message?.toLowerCase().includes('unauthorized') ||
        err.message?.toLowerCase().includes('unauthenticated') ||
        err.message?.toLowerCase().includes('must be logged in') ||
        err.message?.toLowerCase().includes('logged in') ||
        err.message?.toLowerCase().includes('token') ||
        err.message?.toLowerCase().includes('jwt')
    );
  }
  // Error de red (401, etc.)
  if (error?.statusCode === 401 || error?.status === 401) return true;
  if (error?.message?.toLowerCase().includes('unauthorized')) return true;
  if (error?.message?.toLowerCase().includes('unauthenticated')) return true;
  if (error?.message?.toLowerCase().includes('must be logged in')) return true;
  return false;
}

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  // BUG CORREGIDO #2: En la versión anterior se hacía return temprano si !error,
  // pero la firma de ErrorLink en Apollo 4 siempre pasa un error. No hay problema aquí,
  // pero sí en la detección: el código anterior solo miraba CombinedGraphQLErrors
  // e ignoraba errores de red (networkError) que también pueden ser 401.
  if (!isAuthenticationError(error)) return;

  // No intentar refresh si no hay refresh token
  if (!_cachedRefreshToken) {
    console.warn('[Apollo] Auth error but no refresh token — signing out');
    _onUnauthenticated?.();
    return;
  }

  // No interceptar la propia mutación de RefreshToken (evitar bucle infinito)
  if (operation.operationName === 'RefreshToken') {
    console.warn('[Apollo] RefreshToken itself failed — signing out');
    _onUnauthenticated?.();
    return;
  }

  return new Observable<FetchResult>((observer) => {
    if (_isRefreshing) {
      // Otra petición ya está refrescando — encolar esta
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

    // BUG CORREGIDO #3: La mutación de refresh se hacía con context: { headers: { Authorization: '' } }
    // pero authLink sobreescribe los headers AÑADIENDO el token expirado encima.
    // La solución correcta es usar un httpLink directo para el refresh, sin pasar por authLink.
    // Usamos apolloClient.mutate con un context que indica que NO se inyecte el token.
    const doRefresh = () =>
      apolloClient.mutate({
        mutation: RefreshTokenDocument,
        variables: { token: _cachedRefreshToken! },
        context: {
          // Forzar que authLink no inyecte el token expirado en esta petición
          skipAuth: true,
        },
      });

    doRefresh()
      .then(async ({ data, error }) => {
        // Apollo 4 con errorPolicy:'all' combina los errores GraphQL en `error`.
        if (error || !data?.refreshToken?.token) {
          throw error ?? new Error('Refresh failed: no token in response');
        }

        const payload = data.refreshToken;

        // Persistir los nuevos tokens
        await setAuthToken(payload.token);
        // BUG CORREGIDO #5: Si el servidor no devuelve un nuevo refreshToken,
        // hay que mantener el anterior en lugar de sobreescribir con null/undefined.
        if (payload.refreshToken) {
          await setRefreshToken(payload.refreshToken);
        }

        // Actualizar el contexto de auth con el usuario fresco
        if (payload.user) {
          _onTokenRefreshed?.(payload.token, payload.refreshToken ?? _cachedRefreshToken!, payload.user);
        }

        resolveQueue(payload.token);
        _isRefreshing = false;

        // Reintentar la operación original con el nuevo token
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

// ─── Auth link con soporte para skipAuth ─────────────────────────────────────
// BUG CORREGIDO #3 (continuación): authLink ahora respeta el flag skipAuth del context

const authLinkWithSkip = new ApolloLink((operation, forward) => {
  const { skipAuth } = operation.getContext();
  if (skipAuth) {
    // No inyectar token — usado por el refresh para no enviar el token expirado
    return forward(operation);
  }
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

const httpLink = createHttpLink({ uri: GRAPHQL_URL });

// ─── Apollo Client ────────────────────────────────────────────────────────────

console.log('[Apollo] GraphQL URL:', GRAPHQL_URL);

export const apolloClient = new ApolloClient({
  // Orden: errorLink → authLinkWithSkip → httpLink
  link: from([errorLink, authLinkWithSkip, httpLink]),
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
