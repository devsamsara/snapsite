/**
 * lib/i18n.ts
 *
 * i18next configuration for SnapSite.
 * Supports Spanish (es) and English (en).
 * Language is persisted in AsyncStorage and defaults to the device locale.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from '@/locales/es.json';
import en from '@/locales/en.json';

export const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
] as const;

export type LangCode = typeof LANGUAGES[number]['code'];

const STORAGE_KEY = '@snapsite_lang';

/** Returns the device locale code ('es' or 'en'), falling back to 'es'. */
function getDeviceLocale(): LangCode {
  const locales = getLocales();
  const code = locales[0]?.languageCode ?? 'es';
  return (code === 'en' ? 'en' : 'es') as LangCode;
}

/** Initialises i18n. Call once at app startup (in _layout.tsx). */
export async function initI18n(): Promise<void> {
  // Try to load persisted language
  let lng: LangCode;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    lng = (stored as LangCode) ?? getDeviceLocale();
  } catch {
    lng = getDeviceLocale();
  }

  await i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

/** Persists and changes the active language at runtime. */
export async function changeLanguage(code: LangCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore storage errors
  }
}

export default i18n;
