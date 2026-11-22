import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import type { SignupOptions } from './src/fixtures/test';
import { languages, localeFor } from './src/lang';

// The signup page takes its language from the URL path (/signup vs /fr/signup), so each
// language is a project and every test runs once per language.
export default defineConfig<SignupOptions>({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Retry in CI only: locally a flaky test should be visible, not hidden.
  retries: process.env.CI ? 1 : 0,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: env.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: languages.map((lang) => ({
    name: `chromium-${lang}`,
    use: { ...devices['Desktop Chrome'], lang, locale: localeFor(lang) },
  })),
});
