import type { Locator, Page } from '@playwright/test';

/**
 * Auth0's sign-in page, not nesto's. Reached by pressing Login: the application builds
 * the address, and visiting it directly gives an empty page. See A-09.
 * Fields are located by `name` because this page has no test ids.
 */
export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.email = page.locator('input[name="email"]');
    this.password = page.locator('input[name="password"]');
    this.submit = page.locator('button[name="submit"]');
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
