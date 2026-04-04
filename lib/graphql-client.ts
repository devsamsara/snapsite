import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
} from "@apollo/client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const GRAPHQL_URL: string =
  (Constants.expoConfig?.extra?.graphqlUrl as string | undefined) ??
  process.env.GRAPHQL_URL ??
  'http://localhost:4000/graphql';

if (__DEV__ && !Constants.expoConfig?.extra?.graphqlUrl && !process.env.GRAPHQL_URL) {
  console.warn(
    '[Apollo] GRAPHQL_URL is not set. Using localhost fallback.\n' +
    'Add GRAPHQL_URL to your .env file or EAS secrets for staging/prod.',
  );
}

const AUTH_TOKEN_KEY = "@snapsite/authToken";

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

let _cachedToken: string | null = null;

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

export async function restoreAuthToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    _cachedToken = token;
    return token;
  } catch {
    return null;
  }
}

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

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
