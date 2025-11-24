import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: localStorage.getItem('language') || 'de',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    // Enable React Suspense for proper re-renders
    react: {
      useSuspense: false,
    },
    // Ensure component re-renders on language change
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Listen to language changes and trigger storage update
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
