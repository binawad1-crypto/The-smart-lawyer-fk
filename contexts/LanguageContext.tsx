import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, Translations } from '../types';
import { translations } from '../constants';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
  dir: 'ltr' | 'rtl';
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang) {
      return storedLang as Language;
    }
    // Default to browser language
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ar' ? Language.AR : Language.EN;
  });
  
  const [dir, setDir] = useState<'ltr' | 'rtl'>(language === Language.AR ? 'rtl' : 'ltr');

  useEffect(() => {
    const newDir = language === Language.AR ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.dir = newDir;
    setDir(newDir);
    localStorage.setItem('language', language);
  }, [language]);

  const t = useCallback((key: keyof Translations): string => {
    return translations[key]?.[language] || String(key);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};
