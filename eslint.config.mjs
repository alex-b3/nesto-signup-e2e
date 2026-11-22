import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'blob-report/',
      'discovery/',
      'scripts/',
    ],
  },

  eslint.configs.recommended,

  // Type-aware linting. Slower than the plain rules, but it is the only way to get
  // no-floating-promises, which catches a forgotten `await` anywhere in the suite.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },

  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    files: ['tests/**/*.ts'],
    // A skip with a condition is a decision; a bare skip is usually a forgotten one.
    rules: { 'playwright/no-skipped-test': ['warn', { allowConditional: true }] },
  },

  // The config file is not part of the TypeScript project.
  { files: ['eslint.config.mjs'], ...tseslint.configs.disableTypeChecked },
);
