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
 'white':'#151C2E',
 '#F4F8FB':'#090D18',
 '#F5F9FC':'#090D18',
 '#F0F6FA':'#111827',
 '#EDF5F8':'#151C2E',
 '#F8FAFC':'#151C2E',
 '#F2F7FA':'#151C2E',
 '#F0F6F8':'#151C2E',
 '#E2F4F4':'#163747',
 '#E2F4F3':'#203049',
 '#E2F4F5':'#203049',
 '#F0F7FA':'#151C2E',
 '#9AAABD':'#8A9BB5',
 '#E6F7F7':'#123840',
 '#E4EBF0':'#263247',
 '#F1F7FA':'#202C3D',
 '#F5F9FB':'#1B2940',
 '#B42318':'#FF7C84',
};
const preserveTextWhite=(key:string,value:string)=>key==='color'&&(value==='white'||value==='#FFFFFF');
function darkStyle<T>(value:T):T{
 if(Array.isArray(value))return value.map(darkStyle) as T;
 if(value&&typeof value==='object'){
  return Object.fromEntries(Object.entries(value).map(([key,item])=>{
   if(typeof item==='string'&&!preserveTextWhite(key,item)&&(key==='color'||key==='backgroundColor'||key==='borderColor'||key==='borderBottomColor'||key==='borderTopColor'))return [key,key==='backgroundColor'&&item===theme.navy?'#2454D3':key==='borderColor'&&item===theme.navy?'#3D65E8':colors[item]??item];
   return [key,darkStyle(item)];
  })) as T;
 }
 return value;
}
export function useScreenStyles<T extends Record<string,any>>(styles:T):T{
 const {dark}=useAppearance();
 return useMemo(()=>{
  if(!dark)return styles;
  const converted=darkStyle(styles) as Record<string,any>;
  // Named surfaces receive consistent dark elevation and readable contrast.
  // This is deliberately scoped to dark mode; light appearance is unchanged.
  const raised=new Set(['modalPanel','detailsSheet','detail','picker','pickerSheet']);
  const metrics=new Set(['volumeMetric']);
  const overrides:Record<string,any>={};
  for(const [name,style] of Object.entries(converted)){
   if(!style||typeof style!=='object'||Array.isArray(style))continue;
   if(raised.has(name))overrides[name]={...style,backgroundColor:'#1C263B',borderWidth:1,borderColor:'#586684',elevation:12};
   if(metrics.has(name))overrides[name]={...style,backgroundColor:'#1D2B43',borderColor:'#435572'};
   if(name==='metricLabel')overrides[name]={...style,color:'#A8C7DE'};
   if(name==='metricValue'||name==='metricUnit')overrides[name]={...style,color:'#F2F7FF'};
   if(name==='diagramCard')overrides[name]={...style,backgroundColor:'#1B2539',borderColor:'#435572'};
   if(name==='figureLabel')overrides[name]={...style,color:'#F2F7FF'};
   if(name==='graduationLabel')overrides[name]={...style,color:'#DCE9FA'};
   if(name==='detailsHeader'||name==='modalHeader')overrides[name]={...style};
  }
  return {...converted,...overrides} as T;
 },[dark,styles]);
}
