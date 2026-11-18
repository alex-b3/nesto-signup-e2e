import type { Locator, Page } from '@playwright/test';
import type { Lang } from '../lang';
import type { TestUser } from '../data/userFactory';

/**
 * The signup page. Holds locators and actions; assertions belong in the tests.
 *
 * Locators use `data-testid` because it is the only anchor that stays the same in English
 * and French. The `id` attributes are generated (field-2, field-4, ...) and shift with
 * render order, so they are not used.
 */
export class SignupPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly phone: Locator;
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

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('first-name-input');
    this.lastName = page.getByTestId('last-name-input');
    this.phone = page.getByTestId('phoneInput');
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
    this.heading = page.getByRole('heading');
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

  /**
   * Where a successful signup ends up, after a callback hop.
   * The language marker is a suffix here, unlike the /fr prefix on signup itself.
   */
  static landingPathFor(lang: Lang): string {
    return lang === 'fr' ? '/getaquote/fr' : '/getaquote';
  }

  async goto(lang: Lang): Promise<void> {
    await this.page.goto(SignupPage.pathFor(lang));
    // The form is client-rendered, so wait for it rather than for the load event.
    await this.submit.waitFor();

    // Painted is not the same as ready. Until the page's JavaScript has started up,
    // anything typed into the form is discarded when it renders from its own state -
    // measured at 6 attempts out of 6. Waiting for the network to go quiet is the
    // closest signal to "the app has finished starting"; the page offers no marker of
    // its own. Playwright discourages networkidle because a page that polls forever
    // never reaches it; this one settles in about half a second.
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

  /** Every option in the province dropdown, in the order the page lists them. */
  async provinceOptions(): Promise<{ value: string; text: string }[]> {
    return this.province.locator('option').evaluateAll((options) =>
      options.map((option) => ({
        value: option.getAttribute('value') ?? '',
        text: option.textContent?.trim() ?? '',
      })),
    );
  }

  async documentLang(): Promise<string | null> {
    return this.page.locator('html').getAttribute('lang');
  }
}
