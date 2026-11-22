export type Lang = 'en' | 'fr';

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'fr' : 'en';
}
