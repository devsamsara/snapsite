
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  config: {
    withHooks: true,
    withComponent: false,
    withHOC: false,
  },
  schema: 'http://192.168.1.65:4000/api/graphql',
  documents: 'graphql/**/*.graphql',
  generates: {
    'gql/': {
      preset: 'client',
      plugins: [],
    },
    './graphql.schema.json': {
      plugins: ['typescript', 'typescript-operations'],
    },
  },
};

export default config;
