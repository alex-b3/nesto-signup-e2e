import type { Locator, Page, Response } from '@playwright/test';
import type { Lang } from '../lang';
import type { TestUser } from '../data/userFactory';
import { isCreateAccountCall } from '../api/signupEndpoint';

/**
 * The signup page. Locators and actions only; assertions belong in the tests.
 * Locators use `data-testid`: it is the only anchor that survives the language switch,
 * and the generated ids (field-2, field-4, ...) shift with render order.
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
    this.html = page.locator('html');
  }

  /** Every control a user fills in, in the order they appear. */
  get allFields(): Locator[] {
    return [
      this.firstName,
      this.lastName,
      this.phone,
      this.province,
      this.email,
      this.password,
      this.passwordConfirmation,
      this.consent,
    ];
  }

  static pathFor(lang: Lang): string {
    return lang === 'fr' ? '/fr/signup' : '/signup';
  }

  async goto(lang: Lang): Promise<void> {
    await this.page.goto(SignupPage.pathFor(lang));
    // The form is client-rendered, so wait for it rather than for the load event.
    await this.submit.waitFor();

    // Painted is not ready: anything typed before the page's JavaScript starts is
    // discarded, on 6 attempts out of 6. The page offers no readiness marker, so wait for
    // its network to go quiet. Playwright discourages networkidle - a page that polls
    // forever never reaches it - but this one settles in about half a second. See T-03.
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

  /**
   * Start recording create-account calls, and hand back the list they land in. Used by
   * the negative tests: the form is expected to refuse before anything is sent, and a
   * message on screen is not proof of that on its own.
   *
   * The listener is never removed because the page is thrown away at the end of the
   * test, which takes the listener with it.
   */
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

  /** Every option in the province dropdown, in the order the page lists them. */
  async provinceOptions(): Promise<{ value: string; text: string }[]> {
    return this.province.locator('option').evaluateAll((options) =>
      options.map((option) => ({
        value: option.getAttribute('value') ?? '',
        text: option.textContent?.trim() ?? '',
      })),
    );
  }
}
