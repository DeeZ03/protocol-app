import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en-GB' | 'es';
const KEY = 'protocol-app:language:v1';
import { enGB } from './i18n/translations/en-GB';
import { esES } from './i18n/translations/es-ES';
const strings = { 'en-GB': enGB, es: esES };
export type TranslationKey = keyof typeof strings['en-GB'];
type LanguageContextValue = {language:Language;setLanguage:(language:Language)=>Promise<void>;t:(key:TranslationKey)=>string};
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({children}:{children:React.ReactNode}){
  const [language,setCurrentLanguage]=useState<Language>('en-GB');
  useEffect(()=>{let active=true;AsyncStorage.getItem(KEY).then(saved=>{if(active&&(saved==='es'||saved==='en-GB'))setCurrentLanguage(saved);}).catch(()=>{});return()=>{active=false};},[]);
  const setLanguage=useCallback(async(next:Language)=>{setCurrentLanguage(next);try{await AsyncStorage.setItem(KEY,next);}catch(error){console.warn('Could not save language preference',error);}},[]);
  const t=useCallback((key:TranslationKey)=>strings[language][key] || strings['en-GB'][key],[language]);
  return <LanguageContext.Provider value={{language,setLanguage,t}}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){const context=useContext(LanguageContext);if(!context)throw new Error('useLanguage requires LanguageProvider');return context;}
