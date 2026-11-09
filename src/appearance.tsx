import React, {createContext,useCallback,useContext,useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const APPEARANCE_KEY='protocol-app:appearance:v1';
type AppearanceContextValue={dark:boolean;setDark:(dark:boolean)=>Promise<void>};
const AppearanceContext=createContext<AppearanceContextValue|null>(null);
export function AppearanceProvider({children}:{children:React.ReactNode}){
 const [dark,setCurrent]=useState(false);
 useEffect(()=>{let active=true;AsyncStorage.getItem(APPEARANCE_KEY).then(value=>{if(active)setCurrent(value==='dark')}).catch(()=>{});return()=>{active=false}},[]);
 const setDark=useCallback(async(next:boolean)=>{setCurrent(next);try{await AsyncStorage.setItem(APPEARANCE_KEY,next?'dark':'light')}catch(error){console.warn('Could not save appearance preference',error)}},[]);
 return <AppearanceContext.Provider value={{dark,setDark}}>{children}</AppearanceContext.Provider>;
}
export function useAppearance(){const value=useContext(AppearanceContext);if(!value)throw new Error('useAppearance requires AppearanceProvider');return value;}
