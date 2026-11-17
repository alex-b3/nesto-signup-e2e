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

  // Playwright's own rules apply to the tests, not to page objects or config.
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },

  // The config file is not part of the TypeScript project.
  { files: ['eslint.config.mjs'], ...tseslint.configs.disableTypeChecked },
);
