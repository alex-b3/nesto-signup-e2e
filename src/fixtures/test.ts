import { test as base, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage';
import { copyFor } from '../i18n/copy';
import { env } from '../config/env';
import type { Lang } from '../lang';

export type SignupOptions = {
  /** Set by the project in playwright.config.ts, never by a test. */
  lang: Lang;
};

type SignupFixtures = {
  /** The signup page, already open in the project's language. */
  signupPage: SignupPage;
  /** Expected page text for the project's language. */
  copy: ReturnType<typeof copyFor>;
  /** Errors the page logged during the test. Checked after every test; see below. */
  pageErrors: string[];
};

export const test = base.extend<SignupOptions & SignupFixtures>({
  // `option: true` means the value comes from the project config rather than a fixture.
  lang: ['en', { option: true }],

  signupPage: async ({ page, lang }, use) => {
    const signup = new SignupPage(page);
    await signup.goto(lang);
    await use(signup);
  },

  copy: async ({ lang }, use) => {
    await use(copyFor(lang));
  },

  // Runs around every test without being asked for, and collects script errors the user
  // never sees. With FAIL_ON_PAGE_ERRORS=true they fail the test; otherwise they are only
  // listed in the report. Errors only: warnings are often harmless notices.
  pageErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(`uncaught: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
      });
      await use(errors);

      if (env.failOnPageErrors) {
        expect(errors, 'the page logged errors that a user would not see').toEqual([]);
      } else if (errors.length > 0) {
        await testInfo.attach('page errors', { body: errors.join('\n'), contentType: 'text/plain' });
      }
    },
    { auto: true },
  ],
});

// Re-exported so a test has one import, and cannot reach for the plain
// `test` from @playwright/test, which has no lang or signupPage.
export { expect };
