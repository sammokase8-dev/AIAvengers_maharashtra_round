import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const LANGUAGE_KEY = 'creatorai_language';
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) || 'en' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const changeAppLanguage = (lang: 'en' | 'hi' | 'mr') => {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // ignore
  }
};

export default i18n;
