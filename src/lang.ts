export const languages = ['en', 'fr'] as const;
export type Lang = (typeof languages)[number];

// Every table keyed by Record<Lang, ...> stops compiling when a language is added, so a
// new language cannot be half-supported without anyone noticing.

const locales: Record<Lang, string> = { en: 'en-CA', fr: 'fr-CA' };

export function localeFor(lang: Lang): string {
  return locales[lang];
}

// The site is bilingual, so the toggle offers "the other one". A third language would
// need this table, and the language-switch tests, rethought.
const otherLanguages: Record<Lang, Lang> = { en: 'fr', fr: 'en' };

export function otherLang(lang: Lang): Lang {
  return otherLanguages[lang];
}
