import { test, expect } from '../../src/fixtures/test';
import { QuotePage } from '../../src/pages/QuotePage';
import { buildUser, initialsOf } from '../../src/data/userFactory';
import { quoteCopyFor } from '../../src/i18n/copy';

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
    await expect(page).toHaveURL(new RegExp(`${QuotePage.pathFor(lang)}$`), {
      timeout: 20_000,
    });

    // A URL alone would pass on a page that failed to render.
    await expect(quotePage.heading).toHaveText(quoteCopyFor(lang).heading);

    // The avatar shows who is signed in, tying the new account back to this form.
    await expect(quotePage.userInitials).toHaveText(initialsOf(user));
  });
});
