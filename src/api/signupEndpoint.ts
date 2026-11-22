import type { TestUser } from '../data/userFactory';
import type { Lang } from '../lang';

export const CREATE_ACCOUNT_PATH = '/api/accounts';

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
 * Mirrors what the form sends, not the minimum: every field below can be dropped and the
 * endpoint still returns 201.
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

/** Note the renames: province is `region`, language is `preferredLanguage`. */
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
