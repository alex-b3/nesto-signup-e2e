import { test, expect } from '../../src/fixtures/test';
import { buildUser } from '../../src/data/userFactory';
import {
  CREATE_ACCOUNT_PATH,
  buildCreateAccountPayload,
  HTTP_CREATED,
  withCountryCode,
  type CreateAccountRequest,
  type CreateAccountResponse,
} from '../../src/api/signupEndpoint';

/**
 * The brief asks that the create-account API returns 201 and that "the body response
 * contains the entered information in the form". That reads two ways - the endpoint's
 * own contract, or the round trip starting at the form - so both are covered. See A-06.
 */
test.describe('Create-account API @api', () => {
  test('the endpoint returns 201 and echoes the payload', async ({ request, lang }) => {
    const user = buildUser();
    const payload = buildCreateAccountPayload(user, lang);

    const response = await request.post(CREATE_ACCOUNT_PATH, { data: payload });
    expect(response.status()).toBe(HTTP_CREATED);
    // The reply is the whole new account; a password, if it ever appeared, would be visible
    // in the browser and in anything that logs responses.
    expect(await response.text()).not.toContain(user.password);

    const { account } = (await response.json()) as CreateAccountResponse;
    expect(account.firstName).toBe(user.firstName);
    expect(account.lastName).toBe(user.lastName);
    expect(account.email).toBe(user.email);
    expect(account.region).toBe(user.province);
    expect(account.phone).toBe(withCountryCode(user.phone));
    expect(account.preferredLanguage).toBe(lang);
    expect(account.leadDistributeConsentAgreement).toBe(false);
  });

  test('submitting the form returns 201 and echoes what was typed', async ({
    signupPage,
    lang,
  }) => {
    const user = buildUser();
    await signupPage.fillForm(user);

    const response = await signupPage.submitAndCaptureCreateCall();
    expect(response.status()).toBe(HTTP_CREATED);

    await test.step('the form sends what was typed', () => {
      // Checking the request as well as the reply means a mismatch points at one side or
      // the other, instead of only saying the two disagree.
      const sent = response.request().postDataJSON() as CreateAccountRequest;
      expect(sent.firstName).toBe(user.firstName);
      expect(sent.lastName).toBe(user.lastName);
      expect(sent.email).toBe(user.email);
      expect(sent.region).toBe(user.province);
      expect(sent.phone).toBe(withCountryCode(user.phone));
      expect(sent.language).toBe(lang);
      // fillForm leaves consent alone, so the form should report it as not given.
      expect(sent.leadDistributeConsentAgreement).toBe(false);
    });

    await test.step('the reply carries it back', async () => {
      const { account } = (await response.json()) as CreateAccountResponse;
      expect(account.firstName).toBe(user.firstName);
      expect(account.lastName).toBe(user.lastName);
      expect(account.email).toBe(user.email);
      expect(account.region).toBe(user.province);
      expect(account.phone).toBe(withCountryCode(user.phone));
      expect(account.preferredLanguage).toBe(lang);
      expect(account.leadDistributeConsentAgreement).toBe(false);
    });
  });

  test('the phone country chooses the dialling code that is sent', async ({ signupPage }) => {
    const user = buildUser();
    await signupPage.fillForm(user);
    // France rather than the default Canada, so the code sent has to change with it.
    await signupPage.phoneCountry.selectOption('FR');

    const response = await signupPage.submitAndCaptureCreateCall();
    expect(response.status()).toBe(HTTP_CREATED);

    const sent = response.request().postDataJSON() as CreateAccountRequest;
    expect(sent.phone).toBe(`+33${user.phone}`);
  });
});