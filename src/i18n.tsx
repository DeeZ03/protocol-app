import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en-GB' | 'es';
const KEY = 'protocol-app:language:v1';
const strings = {
  'en-GB': {
    'tab.dashboard':'Dashboard','tab.protocols':'Protocols','tab.health':'Health','tab.library':'Library','tab.community':'Community',
    'health.yourHealth':'YOUR HEALTH','health.atGlance':'Your health at a glance','health.add':'+ Add',
    'health.measurements':'Body measurements','health.composition':'Body composition','health.activity':'Sleep & activity',
    'health.measurementsDesc':'Waist, chest, hips, arms, thighs and more',
    'health.compositionDesc':'Body fat and future visceral fat tracking',
    'health.activityDesc':'Sleep and daily steps','health.noEntries':'No entries yet',
    'health.settings':'Settings','health.units':'Units','health.done':'Done',
    'settings.language':'App language','settings.languageHint':'Choose the language used in Protocol. More screens will be translated progressively.',
    'health.howToMeasure':'How to measure','health.hideGuide':'Hide measuring guide',
    'health.male':'Male diagram','health.female':'Female diagram','health.front':'Front','health.back':'Back',
    'health.neck':'Neck','health.chest':'Chest','health.waist':'Waist circumference','health.hips':'Hips / Glutes',
    'health.arms':'Arms','health.thighs':'Thighs','health.calves':'Calves',
    'health.weight':'Weight','health.bloodPressure':'Blood pressure','health.heart':'Resting heart rate','health.steps':'Daily steps',
    'health.bodyFat':'Body fat','health.sleep':'Sleep duration',
  },
  es: {
    'tab.dashboard':'Inicio','tab.protocols':'Protocolos','tab.health':'Salud','tab.library':'Biblioteca','tab.community':'Comunidad',
    'health.yourHealth':'TU SALUD','health.atGlance':'Tu salud de un vistazo','health.add':'+ Añadir',
    'health.measurements':'Medidas corporales','health.composition':'Composición corporal','health.activity':'Sueño y actividad',
    'health.measurementsDesc':'Cintura, pecho, caderas, brazos, muslos y más',
    'health.compositionDesc':'Grasa corporal y seguimiento futuro de grasa visceral',
    'health.activityDesc':'Sueño y pasos diarios','health.noEntries':'Sin registros todavía',
    'health.settings':'Ajustes','health.units':'Unidades','health.done':'Listo',
    'settings.language':'Idioma de la aplicación','settings.languageHint':'Elige el idioma de Protocol. Traduciremos más pantallas progresivamente.',
    'health.howToMeasure':'Cómo medir','health.hideGuide':'Ocultar instrucciones',
    'health.male':'Figura masculina','health.female':'Figura femenina','health.front':'Frente','health.back':'Espalda',
    'health.neck':'Cuello','health.chest':'Pecho','health.waist':'Circunferencia de cintura','health.hips':'Caderas / Glúteos',
    'health.arms':'Brazos','health.thighs':'Muslos','health.calves':'Pantorrillas',
    'health.weight':'Peso','health.bloodPressure':'Presión arterial','health.heart':'Frecuencia cardíaca en reposo','health.steps':'Pasos diarios',
    'health.bodyFat':'Grasa corporal','health.sleep':'Duración del sueño',
  },
} as const;
export type TranslationKey = keyof typeof strings['en-GB'];
type LanguageContextValue = {language:Language;setLanguage:(language:Language)=>Promise<void>;t:(key:TranslationKey)=>string};
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({children}:{children:React.ReactNode}){
  const [language,setCurrentLanguage]=useState<Language>('en-GB');
  useEffect(()=>{let active=true;AsyncStorage.getItem(KEY).then(saved=>{if(active&&(saved==='es'||saved==='en-GB'))setCurrentLanguage(saved);}).catch(()=>{});return()=>{active=false};},[]);
  const setLanguage=useCallback(async(next:Language)=>{setCurrentLanguage(next);try{await AsyncStorage.setItem(KEY,next);}catch(error){console.warn('Could not save language preference',error);}},[]);
  const t=useCallback((key:TranslationKey)=>strings[language][key]||strings['en-GB'][key],[language]);
  return <LanguageContext.Provider value={{language,setLanguage,t}}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){const context=useContext(LanguageContext);if(!context)throw new Error('useLanguage requires LanguageProvider');return context;}
