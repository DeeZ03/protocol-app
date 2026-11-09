import {useMemo} from 'react';
import {useAppearance} from './appearance';
import {theme} from './theme';

const colors:Record<string,string>={
 [theme.background]:'#090D18',
 [theme.white]:'#151C2E',
 [theme.navy]:'#EDF4FF',
 [theme.text]:'#EDF4FF',
 [theme.slate]:'#A5B4C9',
 [theme.muted]:'#9AAAC1',
 [theme.border]:'#303A50',
 [theme.teal]:'#22D3EE',
 '#FFFFFF':'#151C2E',
 'white':'#151C2E',
 '#E6F7F7':'#123840',
 '#E4EBF0':'#263247',
 '#F1F7FA':'#202C3D',
 '#F7FAFC':'#090D18',
 '#B42318':'#FF7C84',
};
const preserveTextWhite=(key:string,value:string)=>key==='color'&&(value==='white'||value==='#FFFFFF');
function darkStyle<T>(value:T):T{
 if(Array.isArray(value))return value.map(darkStyle) as T;
 if(value&&typeof value==='object'){
  return Object.fromEntries(Object.entries(value).map(([key,item])=>{
   if(typeof item==='string'&&!preserveTextWhite(key,item)&&(key==='color'||key==='backgroundColor'||key==='borderColor'||key==='borderBottomColor'||key==='borderTopColor'))return [key,colors[item]??item];
   return [key,item];
  })) as T;
 }
 return value;
}
export function useScreenStyles<T extends Record<string,any>>(styles:T):T{
 const {dark}=useAppearance();
 return useMemo(()=>dark?darkStyle(styles):styles,[dark,styles]);
}
