import { test, expect } from '../../src/fixtures/test';
import { QuotePage } from '../../src/pages/QuotePage';
import { SignupPage } from '../../src/pages/SignupPage';
import { buildUser, initialsOf } from '../../src/data/userFactory';
import { quoteCopyFor } from '../../src/i18n/copy';
import { HTTP_CREATED, type CreateAccountResponse } from '../../src/api/signupEndpoint';
import { LoginPage } from '../../src/pages/LoginPage';

test.describe('Signing up @positive', () => {
  test('a valid signup signs the new user in on the quote page', async ({
    page,
    signupPage,
    lang,
  }) => {
    const user = buildUser();
    const quotePage = new QuotePage(page);

    await signupPage.fillForm(user);
    await signupPage.submit.click();

    // Signing up hops through a callback first and takes about 8 seconds. 20 leaves
    // room without hitting the 30s test timeout, which would hide the real failure.
    await expect(page).toHaveURL(QuotePage.pathFor(lang), { timeout: 20_000 });

    // A URL alone would pass on a page that failed to render.
    await expect(quotePage.heading).toHaveText(quoteCopyFor(lang).heading);

    // The avatar shows who is signed in, tying the new account back to this form.
    await expect(quotePage.userInitials).toHaveText(initialsOf(user));
  });

  test('the new account can sign in with the password it was given', async ({
    signupPage,
    lang,
    browser,
  }) => {
    const user = buildUser();
    await signupPage.fillForm(user);
    const response = await signupPage.submitAndCaptureCreateCall();
    expect(response.status()).toBe(HTTP_CREATED);

    // Signing up hands back a token, so nothing above has used the password. A separate
    // browser with nothing stored is the only way to find out whether it works - and the
    // API will create an account with no password at all (BUG-04).
    const returning = await browser.newPage();
    try {
      const freshSignup = new SignupPage(returning);
      await freshSignup.goto(lang);
      await freshSignup.headerLogin.click();

      await new LoginPage(returning).signIn(user.email, user.password);

      // Signing in takes about 4 seconds, including the hop back from Auth0.
      const quotePage = new QuotePage(returning);
      await expect(quotePage.userInitials).toHaveText(initialsOf(user), { timeout: 20_000 });
    } finally {
      await returning.close();
    }
  });

  test('ticking the consent box records the consent', async ({ signupPage }) => {
    const user = buildUser();
    await signupPage.fillForm(user);
    await signupPage.consent.check();

    const response = await signupPage.submitAndCaptureCreateCall();
    expect(response.status()).toBe(HTTP_CREATED);

    // The only check that a ticked box reaches the server as true. This consent covers
    // sharing mortgage details with partners, so a box that sent false would matter.
    const { account } = (await response.json()) as CreateAccountResponse;
    expect(account.leadDistributeConsentAgreement).toBe(true);
  });

  test.describe('password boundaries', () => {
    // The negative tests cover 11 and 33 characters. Without these the rule could drift
    // to "more than 12" and both of those would still pass.
    const lengths = [12, 32] as const;

    for (const length of lengths) {
      test(`a password of exactly ${length} characters is accepted`, async ({ signupPage }) => {
        // One upper, one digit, the rest lower, to satisfy every other rule.
        const password = `A1${'a'.repeat(length - 2)}`;
        expect(password).toHaveLength(length);

        await signupPage.fillForm(buildUser({ password }));
        const response = await signupPage.submitAndCaptureCreateCall();
        expect(response.status()).toBe(HTTP_CREATED);
      });
    }
  });

  test.describe('names', () => {
    // The risk is not rejection but corruption: an accented name stored as "H&eacute;l"
    // or "Hlne" looks fine in the browser and is wrong in the database.
    const names = [
      { firstName: 'Hélène', lastName: 'Dupré' },
      { firstName: 'Jean-François', lastName: "O'Neil" },
    ] as const;

    for (const name of names) {
      test(`"${name.firstName} ${name.lastName}" survives signup unchanged`, async ({
        signupPage,
      }) => {
        const user = buildUser(name);
        await signupPage.fillForm(user);

        const response = await signupPage.submitAndCaptureCreateCall();
        expect(response.status()).toBe(HTTP_CREATED);

        const { account } = (await response.json()) as CreateAccountResponse;
        expect(account.firstName).toBe(name.firstName);
        expect(account.lastName).toBe(name.lastName);
      });
    }
  });

  test('pressing Enter in a field submits the form', async ({ signupPage }) => {
    const user = buildUser();
    await signupPage.fillForm(user);

    // Plenty of people never reach for the button. If the keyboard path ever stopped
    // matching the click path, nothing else in the suite would notice.
    const [response] = await Promise.all([
      signupPage.waitForCreateAccountCall(),
      signupPage.email.press('Enter'),
    ]);
    expect(response.status()).toBe(HTTP_CREATED);
  });

  test('clicking submit repeatedly creates one account', async ({ signupPage }) => {
    await signupPage.fillForm(buildUser());
    const sent = signupPage.recordCreateAccountCalls();

    await signupPage.submit.click({ clickCount: 3, delay: 20 });

    // Disabling the button is how the form guards itself, so that is what to wait for.
    // It stays on screen while the browser leaves for the identity provider.
    await expect(signupPage.submit).toBeDisabled();

    // An impatient customer should not end up with three accounts.
    expect(sent).toHaveLength(1);
  });
});
