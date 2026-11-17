import { test, expect } from '../../src/fixtures/test';
import { SignupPage } from '../../src/pages/SignupPage';

test.describe('Signup page smoke', () => {
  test('The form renders in the project language @smoke', async ({ page, lang }) => {
    const signup = new SignupPage(page);
    await signup.goto(lang);

    await test.step('every field is visible', async () => {
      for (const field of signup.allFields) {
        await expect(field).toBeVisible();
      }
    });

    await test.step('the account can be submitted', async () => {
      await expect(signup.submit).toBeEnabled();
    });

    await test.step(`the page is in ${lang}`, async () => {
      expect(await signup.documentLang()).toBe(lang);
      await expect(page).toHaveURL(new RegExp(`${SignupPage.pathFor(lang)}$`));
    });
  });
});
