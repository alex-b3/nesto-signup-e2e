import type { Locator, Page, Response } from '@playwright/test';
import type { Lang } from '../lang';
import type { TestUser } from '../data/userFactory';
import { isCreateAccountCall } from '../api/signupEndpoint';
import { routes } from '../routes';

/**
 * The signup page. Locators and actions only; assertions belong in the tests.
 * Locators use `data-testid`: it is the only anchor that survives the language switch,
 * and the generated ids (field-2, field-4, ...) shift with render order. See A-03, T-01.
 */
export class SignupPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly phone: Locator;
  /** Country for the phone number. No test id, so it is found by the name it submits under. */
  readonly phoneCountry: Locator;
  readonly province: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly passwordConfirmation: Locator;
  readonly consent: Locator;
  readonly submit: Locator;
  readonly languageSwitch: Locator;
  readonly headerLogin: Locator;
  readonly loginLink: Locator;
  readonly termsLink: Locator;
  readonly heading: Locator;
  readonly form: Locator;
  /** The <html> element, whose lang attribute says which language the page is in. */
  readonly html: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('first-name-input');
    this.lastName = page.getByTestId('last-name-input');
    this.phone = page.getByTestId('phoneInput');
    this.phoneCountry = page.locator('select[name="phoneCountry"]');
    this.province = page.getByTestId('region-select');
    this.email = page.getByTestId('email-input');
    this.password = page.getByTestId('password-input');
    this.passwordConfirmation = page.getByTestId('passwordConfirmation-input');
    this.consent = page.getByTestId('agreement-checkbox');
    this.submit = page.getByTestId('submit-button');
    this.languageSwitch = page.getByTestId('header-language-switch');
    this.headerLogin = page.getByTestId('header-login-button');
    this.loginLink = page.getByTestId('login-link');
    this.termsLink = page.getByTestId('terms-link');
    // Level 2 because the page has no h1 at all - see BUG-03.
    this.heading = page.getByRole('heading', { level: 2 });
    // The page has one <form> and it has no test id.
    this.form = page.locator('form');
    this.html = page.locator('html');
  }

  static pathFor(lang: Lang): string {
    return routes.signup[lang];
  }

  async goto(lang: Lang): Promise<void> {
    await this.page.goto(SignupPage.pathFor(lang));
    // The form is client-rendered, so wait for it rather than for the load event.
    await this.submit.waitFor();

    // Anything typed before the page's JavaScript starts is discarded, and the page gives
    // no readiness signal. Playwright discourages networkidle, since a page that polls
    // never reaches it, but this one settles in about half a second. See T-03.
    await this.page.waitForLoadState('networkidle');
  }

  /** Fill every field a signup needs. Consent is left alone: it is optional. */
  async fillForm(user: TestUser): Promise<void> {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.phone.fill(user.phone);
    await this.province.selectOption(user.province);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.passwordConfirmation.fill(user.password);
  }

  /** Records create-account calls into the returned list, so a test can count them. */
  recordCreateAccountCalls(): string[] {
    const calls: string[] = [];
    this.page.on('request', (request) => {
      if (request.method() === 'POST' && isCreateAccountCall(request.url())) {
        calls.push(request.url());
      }
    });
    return calls;
  }

  /**
   * Submit the form and hand back the create-account call it makes. Listening starts
   * before the click, or a quick response would be gone before anyone is waiting.
   */
  async submitAndCaptureCreateCall(): Promise<Response> {
    const [response] = await Promise.all([this.waitForCreateAccountCall(), this.submit.click()]);
    return response;
  }

  /** Wait for the create-account call, however it was triggered. */
  waitForCreateAccountCall(): Promise<Response> {
    return this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && isCreateAccountCall(response.url()),
    );
  }

  async provinceOptions(): Promise<{ value: string; text: string }[]> {
    return this.province.locator('option').evaluateAll((options) =>
      options.map((option) => ({
        value: option.getAttribute('value') ?? '',
        text: option.textContent?.trim() ?? '',
      })),
    );
  }
}
