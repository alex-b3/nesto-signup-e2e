import type { Page } from '@playwright/test';
import { expect } from '../fixtures/test';
import type { SignupPage } from '../pages/SignupPage';

/**
 * Submits the form and checks it was refused before anything reached the server: the
 * message is shown and no create-account request was sent. The second part matters more -
 * the API accepts almost anything the form refuses (BUG-06), so a form that submitted
 * despite showing an error would create the account.
 */
export async function submitAndExpectRefusal(
  signupPage: SignupPage,
  page: Page,
  message: string,
): Promise<void> {
  const sent = signupPage.recordCreateAccountCalls();
  await signupPage.submit.click();
  await expect(page.getByText(message).first()).toBeVisible();
  expect(sent, 'the form must refuse before asking the server').toHaveLength(0);
}
