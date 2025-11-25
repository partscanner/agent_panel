import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import heCommon from './locales/he/common.json';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
    },
    he: {
      common: heCommon,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

