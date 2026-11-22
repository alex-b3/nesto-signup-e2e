import type { Lang } from './lang';

// Every page's path per language, in one place. The quote page puts the language at the
// end, unlike signup (BUG-02), so paths are written out rather than built from a rule.
export const routes = {
  signup: { en: '/signup', fr: '/fr/signup' },
  quote: { en: '/getaquote', fr: '/getaquote/fr' },
} satisfies Record<string, Record<Lang, string>>;
