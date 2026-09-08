import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.yarn/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    // shared/ui components follow the design system naming (Button, Badge, Toast, Modal, Field)
    // which are deliberately single-word; the multi-word rule does not apply here.
    files: ['**/shared/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
);
