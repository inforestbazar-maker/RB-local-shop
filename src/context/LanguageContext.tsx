import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, getTranslation, translateCategoryName } from '../translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations.bn) => string;
  translateCategory: (catName: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'bn',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key as string,
  translateCategory: (catName) => catName,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rb_language');
    return (saved === 'bn' || saved === 'en') ? saved : 'bn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rb_language', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('rb_language') as Language;
      if (stored && (stored === 'bn' || stored === 'en')) {
        setLanguageState(stored);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = (key: keyof typeof translations.bn) => getTranslation(key, language);
  const translateCategory = (catName: string) => translateCategoryName(catName, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, translateCategory }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
