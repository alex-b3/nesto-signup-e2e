import { test, expect } from '../../src/fixtures/test';
import { SignupPage } from '../../src/pages/SignupPage';
import { buildUser } from '../../src/data/userFactory';
import { copyFor } from '../../src/i18n/copy';
import { otherLang } from '../../src/lang';

test.describe('Language switch @language', () => {
  test('the toggle moves to the other language and back', async ({ page, signupPage, lang }) => {
    const other = otherLang(lang);

    await signupPage.languageSwitch.click();
    // An exact path, not a pattern: /signup$ would also match /fr/signup, so a pattern
    // could report success while the page is still in the wrong language.
    await page.waitForURL(SignupPage.pathFor(other));
    await expect(signupPage.html).toHaveAttribute('lang', other);
    await expect(signupPage.heading).toHaveText(copyFor(other).heading);

    // The toggle always offers the language you are not reading, so it now points home.
    await expect(signupPage.languageSwitch).toHaveText(copyFor(other).languageSwitch);

    await signupPage.languageSwitch.click();
    await page.waitForURL(SignupPage.pathFor(lang));
    await expect(signupPage.html).toHaveAttribute('lang', lang);
    await expect(signupPage.heading).toHaveText(copyFor(lang).heading);
  });

  test('switching language keeps what has already been typed', async ({
    page,
    signupPage,
    lang,
  }) => {
    const other = otherLang(lang);
    // An accented name and a province that is not the one the page fills in by itself,
    // so both the characters and the fact it was chosen have to survive the trip.
    const user = buildUser({ firstName: 'Hélène', province: 'ON' });

    await signupPage.fillForm(user);
    await signupPage.consent.check();
    await signupPage.languageSwitch.click();
    await page.waitForURL(SignupPage.pathFor(other));

    // Someone half way through the form who realises they would rather read French
    // should not have to start again.
    await expect(signupPage.firstName).toHaveValue(user.firstName);
    await expect(signupPage.lastName).toHaveValue(user.lastName);
    await expect(signupPage.email).toHaveValue(user.email);
    await expect(signupPage.province).toHaveValue(user.province);
    await expect(signupPage.password).toHaveValue(user.password);
    await expect(signupPage.passwordConfirmation).toHaveValue(user.password);
    await expect(signupPage.consent).toBeChecked();
  });
});
