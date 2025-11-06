export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

export const supportedLanguages: Language[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷'
  },
  {
    code: 'zh-TW',
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    flag: '🇹🇼'
  }
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return supportedLanguages.find(lang => lang.code === code);
};

export const getDefaultLanguage = (): Language => {
  // Try to detect browser language
  const browserLang = navigator.language.toLowerCase();
  
  // Check for exact match first
  let language = supportedLanguages.find(lang => 
    lang.code.toLowerCase() === browserLang
  );
  
  // If no exact match, try partial match (e.g., 'en-US' -> 'en')
  if (!language) {
    const langCode = browserLang.split('-')[0];
    language = supportedLanguages.find(lang => 
      lang.code.toLowerCase().startsWith(langCode)
    );
  }
  
  // Default to Spanish if no match found
  return language || supportedLanguages[0];
};