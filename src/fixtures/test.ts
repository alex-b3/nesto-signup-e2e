import { test as base, expect } from '@playwright/test';

export type Lang = 'en' | 'fr';

export type SignupOptions = {
  /** Set by the project in playwright.config.ts, never by a test. */
  lang: Lang;
};

export const test = base.extend<SignupOptions>({
  // `option: true` means the value comes from the project config rather than a fixture.
  lang: ['en', { option: true }],
});

export { expect };
