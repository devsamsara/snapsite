
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  config: {
    withHooks: true,
    withComponent: false,
    withHOC: false,
  },
  schema: 'http://localhost:4000/api/graphql',
  documents: 'graphql/**/*.graphql',
  generates: {
    'gql/': {
      preset: 'client',
      plugins: [],
    },
    './graphql.schema.json': {
      plugins: [
        'typescript',
        'typescript-operations',
      ],
    },
  },
};

export default config;
