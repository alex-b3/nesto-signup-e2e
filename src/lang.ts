export type Lang = 'en' | 'fr';

/** The language the page is not in, which is the one its toggle offers. */
export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'fr' : 'en';
}
