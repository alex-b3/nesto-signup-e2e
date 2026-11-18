import { test, expect } from '../../src/fixtures/test';
import { SignupPage } from '../../src/pages/SignupPage';
import { buildUser } from '../../src/data/userFactory';

test.describe('Signing up @positive', () => {
  test('a valid signup opens the quote page', async ({
    page,
    signupPage,
    lang,
  }) => {
    const user = buildUser();

    await signupPage.fillForm(user);
    await signupPage.submit.click();

    // Signing up hops through a callback before settling, so this waits for the end of
    // the chain rather than the first redirect. Measured at about 8 seconds; 20 leaves
    // room without reaching the 30s test timeout, which would report a timed-out test
    // instead of a failed assertion.
    await expect(page).toHaveURL(new RegExp(`${SignupPage.landingPathFor(lang)}$`), {
      timeout: 20_000,
    });
  });
});
