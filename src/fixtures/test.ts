import { test as base, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage';
import { copyFor } from '../i18n/copy';
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
});

// Re-exported so a test has one import, and cannot reach for the plain
// `test` from @playwright/test, which has no lang or signupPage.
export { expect };
