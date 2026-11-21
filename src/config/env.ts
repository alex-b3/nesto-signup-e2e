import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });

export const env = {
  baseURL: process.env.BASE_URL ?? 'https://app.qa.nesto.ca',

  // Must not be example.com/.org/.net or test.com: the API rejects those with
  // 422 "placeholder email detected". See A-02.
  emailDomain: process.env.EMAIL_DOMAIN ?? 'qa-automation.test',

  // On unless set to exactly "false", so a typo leaves the check on rather than off.
  failOnPageErrors: process.env.FAIL_ON_PAGE_ERRORS !== 'false',
} as const;
