import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

export const env = {
  baseURL: process.env.BASE_URL ?? 'https://app.qa.nesto.ca',

  // Must not be example.com/.org/.net or test.com: the API rejects those with
  // 422 "placeholder email detected".
  emailDomain: process.env.EMAIL_DOMAIN ?? 'qa-automation.test',
} as const;
