import { test, expect } from '../../src/fixtures/test';

/**
 * Compares the form with screenshots kept next to this file. Only the form is captured,
 * so a change to the header or footer does not fail these tests.
 */
test.describe('Signup form appearance @visual', () => {
  // Fonts render differently on each operating system, so a baseline recorded on one
  // fails on another. The baselines here were recorded on macOS.
  test.skip(process.platform !== 'darwin', 'visual baselines are recorded on macOS only');
  // A visible browser is a different Chromium build and renders text slightly
  // differently: the form comes out 2px shorter, so it can never match.
  test.skip(({ headless }) => !headless, 'visual baselines are recorded without --headed');

  // Tall enough for the whole form. In the default 720px window the form with errors
  // has to scroll, and the sticky header then covers the first field in the screenshot.
  test.use({ viewport: { width: 1280, height: 1200 } });

  test.beforeEach(async ({ signupPage }) => {
    // The default province cannot be relied on (A-04), so pin it.
    await signupPage.province.selectOption('QC');
  });

  test('the empty form looks as recorded', async ({ signupPage }) => {
    await expect(signupPage.form).toHaveScreenshot('empty-form.png');
  });

  test('the form with its error messages looks as recorded', async ({
    signupPage,
    page,
    errors,
  }) => {
    await signupPage.submit.click();
    await expect(page.getByText(errors.fieldRequired).first()).toBeVisible();

    await expect(signupPage.form).toHaveScreenshot('form-with-errors.png');
  });
});
