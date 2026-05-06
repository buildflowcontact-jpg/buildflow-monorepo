import { fr } from './fr';

const dictionaries = {
  fr,
};

type Locale = keyof typeof dictionaries;
type TranslationKey = keyof typeof fr;

let currentLocale: Locale = 'fr';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(key: TranslationKey): string {
  return dictionaries[currentLocale][key];
}
