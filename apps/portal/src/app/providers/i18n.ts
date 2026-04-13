import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@engie-portal/i18n/locales/en/common.json';
import fr from '@engie-portal/i18n/locales/fr/common.json';

const resources = {
  en: { common: en },
  fr: { common: fr },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator', 'htmlTag'],
    },
  });

export { i18n };
