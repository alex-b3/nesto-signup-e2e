import { test, expect } from '../../src/fixtures/test';
import { buildUser } from '../../src/data/userFactory';
import { errorsFor } from '../../src/i18n/copy';
import { CREATE_ACCOUNT_PATH, buildCreateAccountPayload } from '../../src/api/signupEndpoint';

test.describe('Signup validation @negative', () => {
  test('an empty form is refused and nothing is sent', async ({ signupPage, page, lang }) => {
    const errors = errorsFor(lang);
    const sent = signupPage.recordCreateAccountCalls();

    await signupPage.submit.click();
    await expect(page.getByText(errors.fieldRequired).first()).toBeVisible();

    // The message matters less than this: the form has to refuse before it asks the
    // server. If it ever submitted anyway, an account would be created with nothing in
    // it, and a test looking only at messages would not notice.
    expect(sent).toHaveLength(0);
  });

  test.describe('required fields', () => {
    const required = [
      { field: 'firstName', message: 'fieldRequired' },
      { field: 'email', message: 'invalidEmail' },
      { field: 'password', message: 'passwordTooShort' },
    ] as const;

    for (const { field, message } of required) {
      test(`${field} is required on its own`, async ({ signupPage, page, lang }) => {
        const errors = errorsFor(lang);
        const sent = signupPage.recordCreateAccountCalls();
        // Everything else valid, so the missing field is the only possible reason.
        await signupPage.fillForm(buildUser({ [field]: '' }));

        await signupPage.submit.click();
        await expect(page.getByText(errors[message]).first()).toBeVisible();
        expect(sent).toHaveLength(0);
      });
    }

    test('a name containing digits is refused', async ({ signupPage, page, lang }) => {
      const errors = errorsFor(lang);
      const sent = signupPage.recordCreateAccountCalls();
      // This rule is why the user factory cannot put a run id in a name.
      await signupPage.fillForm(buildUser({ firstName: 'Auto123' }));

      await signupPage.submit.click();
      await expect(page.getByText(errors.invalidName).first()).toBeVisible();
      expect(sent).toHaveLength(0);
    });

    for (const field of ['firstName', 'lastName'] as const) {
      test(`a ${field} containing HTML is refused`, async ({ signupPage, page, lang }) => {
        const errors = errorsFor(lang);
        const sent = signupPage.recordCreateAccountCalls();
        // The API stores markup as given (BUG-06), so only the form refuses it, and anyone can
        // skip the form by calling the API directly. Bold rather than a script: nothing would run.
        await signupPage.fillForm(buildUser({ [field]: '<b>x</b>' }));

        await signupPage.submit.click();
        await expect(page.getByText(errors.invalidName).first()).toBeVisible();
        expect(sent).toHaveLength(0);
      });
    }
  });

  test.describe('password rules', () => {
    const passwords = [
      { case: 'one character short', password: 'Short123abc', message: 'passwordTooShort' },
      {
        case: 'one character too long',
        password: `A1${'a'.repeat(31)}`,
        message: 'passwordTooLong',
      },
      { case: 'no uppercase letter', password: 'alllowercase123', message: 'passwordWeak' },
      { case: 'no digit', password: 'NoDigitsHereOk', message: 'passwordWeak' },
    ] as const;

    for (const rule of passwords) {
      test(`a password with ${rule.case} is refused`, async ({ signupPage, page, lang }) => {
        const errors = errorsFor(lang);
        const sent = signupPage.recordCreateAccountCalls();
        await signupPage.fillForm(buildUser({ password: rule.password }));

        await signupPage.submit.click();
        await expect(page.getByText(errors[rule.message]).first()).toBeVisible();
        expect(sent).toHaveLength(0);
      });
    }
  });

  test.describe('password confirmation', () => {
    // The confirmation is compared exactly: a different case or a stray trailing space is
    // still a mismatch. Worth pinning down - trimming one field and not the other would
    // reject two passwords that look identical on screen, and comparing them
    // case-insensitively would quietly weaken every password on the site.
    const confirmations = [
      { case: 'is empty', confirmation: () => '' },
      { case: 'is a different password', confirmation: () => 'DifferentPass123' },
      { case: 'differs only by case', confirmation: (password: string) => password.toLowerCase() },
      { case: 'has a trailing space', confirmation: (password: string) => `${password} ` },
    ] as const;

    for (const variant of confirmations) {
      test(`a confirmation that ${variant.case} is refused`, async ({
        signupPage,
        page,
        lang,
      }) => {
        const errors = errorsFor(lang);
        const user = buildUser();
        const sent = signupPage.recordCreateAccountCalls();

        await signupPage.fillForm(user);
        await signupPage.passwordConfirmation.fill(variant.confirmation(user.password));

        await signupPage.submit.click();
        await expect(page.getByText(errors.passwordsDiffer)).toBeVisible();
        expect(sent).toHaveLength(0);
      });
    }
  });

  test.describe('email format', () => {
    // One with no @ at all, one that looks almost right. The other shapes I tried -
    // a missing local part, a second address with no @ - all gave the same message.
    const badEmails = ['not-an-email', 'spaces in@mail.test'];

    for (const email of badEmails) {
      test(`"${email}" is refused as an email`, async ({ signupPage, page, lang }) => {
        const errors = errorsFor(lang);
        const sent = signupPage.recordCreateAccountCalls();
        await signupPage.fillForm(buildUser({ email }));

        await signupPage.submit.click();
        await expect(page.getByText(errors.invalidEmail).first()).toBeVisible();
        expect(sent).toHaveLength(0);
      });
    }
  });

  test('an address that is already registered is refused', async ({
    signupPage,
    request,
    lang,
  }) => {
    const user = buildUser();
    // The first account only has to exist. Creating it without a browser keeps this test
    // about the second attempt.
    const first = await request.post(CREATE_ACCOUNT_PATH, {
      data: buildCreateAccountPayload(user, lang),
    });
    expect(first.ok()).toBe(true);

    await signupPage.fillForm(user);
    const second = await signupPage.submitAndCaptureCreateCall();

    // 400 "bad format" is what the API answers today, where 409 would fit a duplicate.
    // Asserting what it should be would fail every run and tell nobody anything, so the
    // disagreement lives in the bug report instead. See A-07.
    expect(second.status()).toBe(400);
  });

  test('nothing typed into the form is sent to a third party', async ({
    signupPage,
    page,
    context,
  }) => {
    const isThirdParty = (url: string) => !new URL(url).hostname.endsWith('nesto.ca');
    const thirdPartyRequests: string[] = [];
    context.on('request', (request) => {
      if (isThirdParty(request.url())) {
        thirdPartyRequests.push(`${request.url()}\n${request.postData() ?? ''}`);
      }
    });

    // Names unlikely to appear anywhere by chance, so a match can only be a leak.
    const user = buildUser({ firstName: 'Zorblatt', lastName: 'Quixwell' });
    await signupPage.fillForm(user);

    // Not submitted. Closing the page makes the trackers send what they have batched, as
    // they do when a visitor leaves. That request arrives after close() returns, so wait
    // for it; this also fails the test if nothing was watched at all.
    const flushed = context.waitForEvent(
      'request',
      (request) => isThirdParty(request.url()) && request.postData() !== null,
    );
    await page.close({ runBeforeUnload: true });
    await flushed;

    // Session replay bodies cannot be read here, so for replay this proves nothing; it
    // relies on the page's own masking setting.
    for (const value of [user.firstName, user.lastName, user.phone, user.email, user.password]) {
      const leaks = thirdPartyRequests.filter(
        (request) => request.includes(value) || request.includes(encodeURIComponent(value)),
      );
      expect(leaks, `"${value}" was sent to a third party`).toEqual([]);
    }
  });
});
