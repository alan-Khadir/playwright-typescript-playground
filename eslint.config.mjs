// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default defineConfig(
  /* Folders ESLint never checks: installed packages, generated reports, and the app under test. */
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'webapp/'],
  },

  /* Basic JavaScript rules, e.g. unused variables. */
  eslint.configs.recommended,

  /* TypeScript rules that use type information, e.g. no-floating-promises (missing await), no any. */
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        /* Let typescript-eslint read tsconfig.json so it knows every type. */
        projectService: true,
      },
    },
  },

  /* This file is plain JavaScript, not in tsconfig, so skip the type-aware rules for .mjs files. */
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  /* Playwright rules, only for test files: e.g. no waitForTimeout, await your expect. */
  {
    files: ['tests/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
  },
);