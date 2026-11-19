import type { TestUser } from '../data/userFactory';
import type { Lang } from '../lang';

/** The call the signup form makes to create an account. */
export const CREATE_ACCOUNT_PATH = '/api/accounts';

/** What a successful create-account call answers with. */
export const HTTP_CREATED = 201;

/**
 * Matching on the parsed pathname rather than a substring: the page also posts to
 * third-party telemetry, and a looser matcher picks that up instead.
 */
export function isCreateAccountCall(url: string): boolean {
  return new URL(url).pathname === CREATE_ACCOUNT_PATH;
}

/**
 * A Canadian number as the form sends it. Typing 5145550123 produces +15145550123,
 * so the API never sees the digits exactly as they were entered.
 */
export function withCountryCode(phone: string): string {
  return `+1${phone}`;
}

/**
 * A create-account payload built from a test user, for the test that calls the endpoint
 * on its own and so has no form to assemble one.
 *
 * It mirrors what the form sends rather than the minimum the endpoint will take: every
 * field below can be dropped and the call still returns 201, including region, language
 * and the password flag. Sending a realistic request keeps this test comparable with the
 * one that goes through the form.
 */
export function buildCreateAccountPayload(
  user: Pick<TestUser, 'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'province'>,
  language: Lang,
): Record<string, unknown> {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: withCountryCode(user.phone),
    region: user.province,
    language,
    leadDistributeConsentAgreement: false,
    password: user.password,
    passwordSpecified: true,
    createdAt: 'LOGIN',
    partner: 'nesto',
    formName: 'signup',
  };
}

/** The request fields this suite checks. The form sends about thirty more, all tracking. */
export type CreateAccountRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  region: string;
  language: string;
  leadDistributeConsentAgreement: boolean;
};

/**
 * The parts of the 201 body this suite checks. The account object carries far more.
 * Note the renames: the form's province is `region`, and its language is
 * `preferredLanguage`.
 */
export type CreateAccountResponse = {
  account: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    region: string;
    preferredLanguage: string;
    leadDistributeConsentAgreement: boolean;
  };
};
