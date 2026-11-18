import { randomBytes } from 'node:crypto';
import { env } from '../config/env';

export type TestUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  /** Province code as the form submits it, e.g. QC. */
  province: string;
};

/**
 * A fresh signup user. Every call returns a different email, so tests stay independent
 * and can run in parallel.
 *
 * Accounts cannot be deleted through the signup API, so everything this suite creates
 * stays in the QA database. The name is fixed and obvious for that reason: nesto can
 * find and remove them all with one query on "Auto Suite".
 */
export function buildUser(overrides: Partial<TestUser> = {}): TestUser {
  // Timestamp groups one run together; the random part stops parallel workers colliding.
  const unique = `${Date.now()}-${randomBytes(5).toString('hex')}`;

  return {
    // Letters only: the form rejects digits in a name with "Invalid name", so the run
    // id cannot go here. The email carries uniqueness instead.
    firstName: 'Auto',
    lastName: 'Suite',
    email: `auto-${unique}@${env.emailDomain}`,
    // 555-01xx is reserved for fiction, and the API accepts a repeated number.
    phone: '5145550123',
    // Meets the page's rule: 12-32 characters with an upper, a lower and a digit.
    password: 'AutoTest1234',
    // Deliberately not Alberta, which is what the page fills in by itself. Submitting a
    // different province proves the selection took effect instead of passing on default.
    province: 'QC',
    ...overrides,
  };
}
