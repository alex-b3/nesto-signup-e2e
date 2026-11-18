import { test, expect } from '../../src/fixtures/test';
import { provincesFor } from '../../src/i18n/copy';

test.describe('Signup fields and labels @labels', () => {
  test('every field announces itself with the right label', async ({ signupPage, copy }) => {
    // A field's accessible name is what a screen reader reads out, and it comes from the
    // <label> tied to that input. Asserting it covers the wording and the association in
    // one step: a label with the wrong text, or one not tied to its input, both fail.
    const fields = [
      { locator: signupPage.firstName, label: copy.firstName },
      { locator: signupPage.lastName, label: copy.lastName },
      { locator: signupPage.phone, label: copy.phone },
      { locator: signupPage.province, label: copy.province },
      { locator: signupPage.email, label: copy.email },
      { locator: signupPage.password, label: copy.password },
      { locator: signupPage.passwordConfirmation, label: copy.passwordConfirmation },
    ];

    for (const field of fields) {
      await expect(field.locator, `label "${field.label}"`).toHaveAccessibleName(field.label);
    }
  });

  test('both password fields hide what is typed', async ({ signupPage, copy, page }) => {
    await expect(signupPage.password).toHaveAttribute('type', 'password');
    await expect(signupPage.passwordConfirmation).toHaveAttribute('type', 'password');

    // This hint is the only place on the page that states the password rules. If it is
    // ever removed, people have to guess and learn them by being rejected.
    await expect(page.getByText(copy.passwordHint)).toBeVisible();
  });

  test('the province dropdown offers every province and territory', async ({
    signupPage,
    lang,
  }) => {
    const actual = await signupPage.provinceOptions();
    const expected = provincesFor(lang);

    // Order is not asserted: a missing or misspelled province matters, the order they
    // appear in does not. "same length" plus "contains every expected one" means the two
    // lists hold the same options whichever way the page chooses to sort them.
    expect(actual).toHaveLength(expected.length);
    expect(actual).toEqual(expect.arrayContaining([...expected]));
  });

  test('the consent box starts unticked and can be ticked', async ({ signupPage, copy, page }) => {
    // Consent to be contacted by partners has to be opt-in, not opt-out.
    await expect(signupPage.consent).not.toBeChecked();
    await expect(page.getByText(copy.consent)).toBeVisible();

    await signupPage.consent.check();
    await expect(signupPage.consent).toBeChecked();
  });

  test('the copy around the form is in the right language', async ({ signupPage, copy }) => {
    await expect(signupPage.heading).toHaveText(copy.heading);
    await expect(signupPage.submit).toHaveText(copy.submit);
    await expect(signupPage.loginLink).toHaveText(copy.logIn);
    await expect(signupPage.termsLink).toHaveText(copy.termsLink);
    await expect(signupPage.headerLogin).toHaveText(copy.headerLogin);
    // The toggle offers the other language, so French is advertised on the English page.
    await expect(signupPage.languageSwitch).toHaveText(copy.languageSwitch);
  });
});
