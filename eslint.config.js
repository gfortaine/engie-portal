import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/*.gen.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // FSD boundary rules — enforce layer dependency direction
  {
    files: ['apps/portal/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'apps/portal/src/app/**' },
        { type: 'pages', pattern: 'apps/portal/src/pages/**' },
        { type: 'widgets', pattern: 'apps/portal/src/widgets/**' },
        { type: 'features', pattern: 'apps/portal/src/features/**' },
        { type: 'entities', pattern: 'apps/portal/src/entities/**' },
        { type: 'shared', pattern: 'apps/portal/src/shared/**' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'warn',
        {
          default: 'disallow',
          rules: [
            // app can import anything
            { from: 'app', allow: ['pages', 'widgets', 'features', 'entities', 'shared'] },
            // pages can import widgets, features, entities, shared
            { from: 'pages', allow: ['widgets', 'features', 'entities', 'shared'] },
            // widgets can import features, entities, shared
            { from: 'widgets', allow: ['features', 'entities', 'shared'] },
            // features can import entities, shared
            { from: 'features', allow: ['entities', 'shared'] },
            // entities can import shared
            { from: 'entities', allow: ['shared'] },
            // shared cannot import upper layers
            { from: 'shared', allow: [] },
          ],
        },
      ],
    },
  },
);
