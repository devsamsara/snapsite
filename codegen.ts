
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  config: {
    withHooks: true,
    withComponent: false,
    withHOC: false,
  },
  schema: 'https://site--backoffice--dz9c78m5fdc5.code.run/api/graphql',
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
