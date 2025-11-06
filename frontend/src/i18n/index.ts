import { es } from './translations/es';
import { en } from './translations/en';
import { pt } from './translations/pt';
import { fr } from './translations/fr';
import { zhTW } from './translations/zh-TW';
import { getDefaultLanguage } from './languages';

export type TranslationKey = keyof typeof es;
export type NestedTranslationKey<T> = T extends object 
  ? { [K in keyof T]: T[K] extends object 
      ? `${string & K}.${NestedTranslationKey<T[K]>}` 
      : string & K 
    }[keyof T]
  : never;

export type AllTranslationKeys = NestedTranslationKey<typeof es>;

const translations = {
  es,
  en,
  pt,
  fr,
  'zh-TW': zhTW
};

class I18n {
  private currentLanguage: string;
  private translations: typeof translations;

  constructor() {
    // Get language from localStorage or use default
    const savedLanguage = localStorage.getItem('sereno-language');
    const defaultLang = getDefaultLanguage();
    
    this.currentLanguage = savedLanguage || defaultLang.code;
    this.translations = translations;

    // Ensure the language exists in our translations
    if (!this.translations[this.currentLanguage as keyof typeof translations]) {
      this.currentLanguage = 'es'; // Fallback to Spanish
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  setLanguage(languageCode: string): void {
    if (this.translations[languageCode as keyof typeof translations]) {
      this.currentLanguage = languageCode;
      localStorage.setItem('sereno-language', languageCode);
      
      // Trigger a custom event to notify components of language change
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: languageCode } 
      }));
    }
  }

  t(key: string, params?: Record<string, string | number>): string {
    const translation = this.getNestedTranslation(key);
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${this.currentLanguage}`);
      return key; // Return the key if translation is missing
    }

    // Replace parameters in the translation
    if (params) {
      return Object.entries(params).reduce((text, [param, value]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      }, translation);
    }

    return translation;
  }

  private getNestedTranslation(key: string): string {
    const keys = key.split('.');
    const currentTranslations = this.translations[this.currentLanguage as keyof typeof translations];
    
    let result: any = currentTranslations;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return '';
      }
    }
    
    return typeof result === 'string' ? result : '';
  }

  // Helper method to get all translations for a specific section
  getSection(section: string): Record<string, any> {
    const currentTranslations = this.translations[this.currentLanguage as keyof typeof translations];
    return (currentTranslations as any)[section] || {};
  }
}

// Create a singleton instance
export const i18n = new I18n();

// Export a hook for React components
export const useTranslation = () => {
  return {
    t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    currentLanguage: i18n.getCurrentLanguage(),
    setLanguage: (lang: string) => i18n.setLanguage(lang),
    getSection: (section: string) => i18n.getSection(section)
  };
};