import i18next from 'i18next';

import { initReactI18next } from 'react-i18next';

import * as Localization from 'expo-localization';

import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

export type AppLanguage = 'pt' | 'es' | 'en';

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  'pt',
  'es',
  'en',
];

export function isAppLanguage(
  value: string | null | undefined,
): value is AppLanguage {
  return (
    value === 'pt' ||
    value === 'es' ||
    value === 'en'
  );
}

function resolveDeviceLanguage(): AppLanguage {
  const code =
    Localization.getLocales()[0]
      ?.languageCode ?? 'pt';

  if (code.startsWith('es')) {
    return 'es';
  }

  if (code.startsWith('en')) {
    return 'en';
  }

  return 'pt';
}

void (
  // eslint-disable-next-line import/no-named-as-default-member -- i18next instance API
  i18next.use(initReactI18next)
).init({
  resources: {
    pt: { translation: pt },
    es: { translation: es },
    en: { translation: en },
  },
  lng: resolveDeviceLanguage(),
  fallbackLng: 'pt',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18next;
