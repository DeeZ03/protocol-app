import Svg, { Circle, Line, Polyline, Ellipse, Rect, Path } from 'react-native-svg';
import { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Keyboard } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';
import { useScreenStyles } from '../../src/darkStyles';
import { useLanguage, type TranslationKey } from '../../src/i18n';
import { getHealthCopy, spanishMarkerNames } from '../../src/healthCopy';

const KEY = 'protocol-app:health-measurements:v1';
const UNIT_KEY='protocol-app:health-units:v1';
const MARKERS = [
 {key:'weight',name:'Weight',unit:'kg',hint:'e.g. 78.5'},
 {key:'systolic',name:'Blood pressure',unit:'mmHg',hint:'e.g. 120'},
 {key:'diastolic',name:'Blood pressure (diastolic)',unit:'mmHg',hint:'e.g. 80'},
 {key:'heart',name:'Resting heart rate',unit:'bpm',hint:'e.g. 65'},
 {key:'bodyfat',name:'Body fat',unit:'%',hint:'e.g. 22'},
 {key:'waist',name:'Waist circumference',unit:'cm',hint:'e.g. 85'},
 {key:'neck',name:'Neck',unit:'cm',hint:'e.g. 38'},
 {key:'chest',name:'Chest',unit:'cm',hint:'e.g. 100'},
 {key:'hips',name:'Hips',unit:'cm',hint:'e.g. 100'},
 {key:'glutes',name:'Glutes',unit:'cm',hint:'e.g. 100'},
 {key:'armLeft',name:'Left upper arm',unit:'cm',hint:'e.g. 35'},
 {key:'armRight',name:'Right upper arm',unit:'cm',hint:'e.g. 35'},
 {key:'thighLeft',name:'Left thigh',unit:'cm',hint:'e.g. 55'},
 {key:'thighRight',name:'Right thigh',unit:'cm',hint:'e.g. 55'},
 {key:'calfLeft',name:'Left calf',unit:'cm',hint:'e.g. 38'},
 {key:'calfRight',name:'Right calf',unit:'cm',hint:'e.g. 38'},
 {key:'steps',name:'Daily steps',unit:'steps',hint:'e.g. 8000'},
 {key:'sleep',name:'Sleep duration',unit:'hours',hint:'e.g. 7.5'},
] as const;
type Marker = typeof MARKERS[number]['key'];
type RecordItem = {id:string;marker:Marker;value:number;date:string;note:string;time?:string};
const dateKey=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const titleFor=(key:Marker)=>MARKERS.find(m=>m.key===key)!;
const BODY_MARKERS:Marker[]=['neck','chest','waist','hips','glutes','armLeft','armRight','thighLeft','thighRight','calfLeft','calfRight'];
const isCircumference=(m:Marker)=>BODY_MARKERS.includes(m);
export default function Health(){
  const styles = useScreenStyles(baseStyles);
 const insets=useSafeAreaInsets();
 const {language,t}=useLanguage();
 const hc=getHealthCopy(language);
 const translatedName=(m:Marker)=>{const keys:Partial<Record<Marker,TranslationKey>>={weight:'health.weight',systolic:'health.bloodPressure',heart:'health.heart',steps:'health.steps',bodyfat:'health.bodyFat',sleep:'health.sleep',waist:'health.waist',neck:'health.neck',chest:'health.chest',hips:'health.hips'};return language==='es'?(spanishMarkerNames[m]||titleFor(m).name):keys[m]?t(keys[m]):titleFor(m).name;};
 const [items,setItems]=useState<RecordItem[]>([]);
 const [visible,setVisible]=useState(false);
 const [detail,setDetail]=useState<Marker|null>(null);
 const [marker,setMarker]=useState<Marker>('weight');
 const [value,setValue]=useState('');
 const [secondValue,setSecondValue]=useState('');
 const [chartWidth,setChartWidth]=useState(270);
 const [range,setRange]=useState<'7D'|'30D'|'90D'|'All'>('30D');
 const [note,setNote]=useState('');
 const [saving,setSaving]=useState(false);
 const [weightUnit,setWeightUnit]=useState<'kg'|'lb'|'st'>('kg');
 const [waistUnit,setWaistUnit]=useState<'cm'|'in'>('cm');
 const [bodyGroup,setBodyGroup]=useState<'Arms'|'Thighs'|'Calves'|null>(null);
 const [measureGuide,setMeasureGuide]=useState(false);
 const [bodyDiagram,setBodyDiagram]=useState<'male'|'female'>('male');
 const [figureSide,setFigureSide]=useState<'Front'|'Back'>('Front');
 const [healthSection,setHealthSection]=useState<'overview'|'measurements'|'metrics'|'activity'>('overview');
 const localizedUnit=(m:Marker)=>m==='steps'?(hc.steps):m==='sleep'?(hc.hours):unitFor(m);
 const localizedQuantity=(m:Marker,v:number)=>{const raw=display(m,v);if(language!=='es')return raw;return raw.replace(/\\d+(?:\\.\\d+)?/g,part=>{const [whole,fraction]=part.split('.');return whole.replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.')+(fraction===undefined?'':','+fraction);});};
 const localizedDuration=(v:number)=>v===1?hc.hour:hc.hours;
 const unitFor=(m:Marker)=>m==='weight'?weightUnit==='st'?'st & lb':weightUnit:isCircumference(m)?waistUnit==='in'?'in':'cm':titleFor(m).unit;
 const display=(m:Marker,v:number)=>m==='weight'?(weightUnit==='lb'?(v*2.20462262).toFixed(1):weightUnit==='st'?`${Math.floor(Math.round(v*2.20462262*10)/10/14)} st ${(Math.round(v*2.20462262*10)/10%14).toFixed(1)} lb`:v.toFixed(1)):isCircumference(m)&&waistUnit==='in'?(v/2.54).toFixed(1):String(v);
 const displayChange=(m:Marker,v:number)=>m==='weight'&&weightUnit==='st'?`${language==='es'?(v*2.20462262).toFixed(1).replace('.',','):(v*2.20462262).toFixed(1)} lb`: `${localizedQuantity(m,v)} ${m==='sleep'?localizedDuration(v):localizedUnit(m)}`;
 const dateFiltered=(m:Marker)=>{const now=Date.now();const days=range==='7D'?7:range==='30D'?30:range==='90D'?90:Infinity;return items.filter(i=>i.marker===m&&(days===Infinity||(new Date(i.date+'T12:00:00').getTime()<=now&&now-new Date(i.date+'T12:00:00').getTime()<=days*86400000))).sort((a,b)=>a.date.localeCompare(b.date));};
 const dailyPoints=(m:Marker)=>{
  const readings=dateFiltered(m);
  const byDay=new Map<string,RecordItem[]>();
  for(const reading of readings)byDay.set(reading.date,[...(byDay.get(reading.date)||[]),reading]);
  return Array.from(byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,day])=>{
   // Preserve raw records; display the most recently saved value for single-entry markers.
   const latest=[...day].sort((a,b)=>b.id.localeCompare(a.id))[0];
   const average=(m==='heart'||m==='systolic'||m==='diastolic');
   return {...latest,date,value:average?day.reduce((sum,item)=>sum+item.value,0)/day.length:latest.value};
  });
 };
 const bpDaily=(m:'systolic'|'diastolic')=>dailyPoints(m);
 const bpLatest=(systolic:RecordItem)=>items.find(i=>i.marker==='diastolic'&&i.id.replace(/-[ab]$/,'')===systolic.id.replace(/-[ab]$/,''))??items.find(i=>i.marker==='diastolic'&&i.date===systolic.date);
 const load=useCallback(async()=>{try{const raw=await AsyncStorage.getItem(KEY);const data=raw?JSON.parse(raw):[];setItems(Array.isArray(data)?data:[]);const prefs=await AsyncStorage.getItem(UNIT_KEY);if(prefs){const p=JSON.parse(prefs);if(['kg','lb','st'].includes(p.weight))setWeightUnit(p.weight);if(['cm','in'].includes(p.waist))setWaistUnit(p.waist);}}catch{Alert.alert(t('health.unableLoad'),t('health.retryHealth'));}},[]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 useFocusEffect(useCallback(()=>{if(Platform.OS!=='android'||healthSection==='overview')return;const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(detail!==null||visible)return false;if(bodyGroup){setBodyGroup(null);}else{setHealthSection('overview');}return true;});return()=>sub.remove();},[healthSection,detail,visible,bodyGroup]));
 const save=async()=>{
  let num=Number(value.trim().replace(',','.'));
  if(marker==='weight'&&weightUnit==='lb')num/=2.20462262;
  if(marker==='weight'&&weightUnit==='st')num=(num*14+Number(secondValue.replace(',','.')||0))/2.20462262;
  if(isCircumference(marker)&&waistUnit==='in')num*=2.54;
  if(marker==='weight'&&weightUnit==='st'&&(!Number.isFinite(Number(secondValue.replace(',','.')||0))||Number(secondValue||0)<0||Number(secondValue||0)>=14)){Alert.alert(t('health.checkPounds'),t('health.poundsRange'));return;}
  const bpOther=Number(secondValue.trim().replace(',','.'));
  if(marker==='systolic'&&(!secondValue.trim()||!Number.isFinite(bpOther)||bpOther<=0||bpOther>300)){Alert.alert(t('health.checkBP'),t('health.bpBothRequired'));return;}
  if(!value.trim()||!Number.isFinite(num)||num<=0||num>(marker==='steps'?100000:10000)||(marker==='steps'&&!Number.isInteger(num))||(marker==='sleep'&&num>24)){Alert.alert(t('health.checkMeasurement'),t('health.validPositive'));return;}
  // Soft plausibility checks: unusual measurements may be genuine, so allow confirmation.
  const rawPrimary=Number(value.trim().replace(',','.'));
  const unusual:string[]=[];
  if(marker==='weight'&&(num<20||num>350))unusual.push('weight');
  if(isCircumference(marker)&&(num<15||num>250))unusual.push(titleFor(marker).name.toLowerCase());
  if(marker==='bodyfat'&&(num<2||num>70))unusual.push('body fat percentage');
  if(marker==='heart'&&(num<30||num>150))unusual.push('resting heart rate');
  if(marker==='sleep'&&num>16)unusual.push('sleep duration');
  if(marker==='steps'&&num>60000)unusual.push('daily steps');
  if(marker==='systolic'&&(num<70||num>250||bpOther<40||bpOther>150||num<=bpOther))unusual.push('blood pressure');
  if(marker==='weight'&&weightUnit==='st'&&!Number.isInteger(rawPrimary)){Alert.alert(t('health.checkStones'),t('health.stonesWhole'));return;}
  const entryDate=dateKey(new Date());
  const singleDaily=(['weight','bodyfat','steps','sleep'] as Marker[]).includes(marker)||isCircumference(marker);
  const existing=singleDaily?items.filter(i=>i.date===entryDate&&i.marker===marker):[];
  const persist=async()=>{
   setSaving(true);
   try{
    const now=new Date();const pairId=now.getTime().toString();const entryTime=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});
    const next=[{id:pairId+'-a',marker,value:num,date:entryDate,time:entryTime,note:note.trim()},...(marker==='systolic'?[{id:pairId+'-b',marker:'diastolic' as Marker,value:bpOther,date:entryDate,time:entryTime,note:note.trim()}]:[]),...items.filter(i=>!existing.some(e=>e.id===i.id))];
    await AsyncStorage.setItem(KEY,JSON.stringify(next));
    setItems(next);setVisible(false);setValue('');setSecondValue('');setNote('');
   }catch{Alert.alert(t('health.couldNotSave'),t('health.notSaved'));}
   finally{setSaving(false);}
  };
  const confirmSave=()=>{Keyboard.dismiss();if(unusual.length){Alert.alert(t('health.unusualTitle'),t('health.unusualBody'),[{text:t('health.editReading'),style:'cancel'},{text:t('health.saveAnyway'),onPress:()=>{void persist();}}]);}else{void persist();}};
  if(existing.length){
   Keyboard.dismiss();
   Alert.alert(t('health.updateToday'),t('health.replaceToday'),[
    {text:t('health.keepExisting'),style:'cancel'},
    {text:t('health.replaceReading'),onPress:confirmSave}
   ]);
   return;
  }
  Keyboard.dismiss();
  confirmSave();
 };
 const remove=(entry:RecordItem)=>Alert.alert(t('health.deleteQuestion'),t('health.deleteBody'),[{text:t('health.cancel'),style:'cancel'},{text:t('health.copy25'),style:'destructive',onPress:async()=>{try{const paired=entry.marker==='systolic'||entry.marker==='diastolic';const pairPrefix=entry.id.replace(/-[ab]$/,'');const next=items.filter(i=>i.id!==entry.id&&!(paired&&i.id.replace(/-[ab]$/,'')===pairPrefix&&(i.marker==='systolic'||i.marker==='diastolic')));await AsyncStorage.setItem(KEY,JSON.stringify(next));setItems(next);}catch{Alert.alert(t('health.couldNotDelete'),t('health.tryAgain'));}}}]);
 return <View style={styles.screen}>
  <FlatList data={[] as RecordItem[]} keyExtractor={i=>i.id} contentContainerStyle={styles.content}
   ListHeaderComponent={<>
    <View style={styles.top}><View style={styles.titleArea}>{healthSection==='overview'?<View><Text style={styles.eyebrow}>{t('health.yourHealth')}</Text><Text style={styles.heading}>{t('health.copy01')}</Text></View>:<Pressable accessibilityRole="button" accessibilityLabel="Back to Health overview" onPress={()=>{setBodyGroup(null);setHealthSection('overview');}} style={styles.sectionHeader}><Text style={styles.headerArrow}>‹</Text><Text numberOfLines={2} style={styles.sectionHeading}>{healthSection==='measurements'?t('health.measurements'):healthSection==='metrics'?t('health.composition'):t('health.activity')}</Text></Pressable>}</View><View style={styles.topActions}><Pressable accessibilityRole="button" onPress={()=>setVisible(true)} style={styles.add}><Text style={styles.addText}>{t('health.add')}</Text></Pressable></View></View>
    {healthSection==='overview'?<>
      <Text style={styles.panelSubtitle}>{t('health.atGlance')}</Text>
      <View style={styles.overviewPanel}><View style={styles.grid}>{(['weight','systolic','heart','steps'] as Marker[]).map(key=>{const readings=items.filter(i=>i.marker===key).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));const latest=readings[0];const previous=readings.find(i=>i.date!==latest?.date);return <Pressable key={key} accessibilityRole="button" onPress={()=>setDetail(key)} style={styles.tile}><Text style={styles.tileTitle}>{translatedName(key)}</Text><Text style={styles.tileValue}>{latest?(key==='systolic'?String(latest.value)+'/'+String(bpLatest(latest)?.value??'—'):localizedQuantity(key,latest.value)):'—'} <Text style={styles.unit}>{latest&&!(key==='weight'&&weightUnit==='st')?localizedUnit(key):''}</Text></Text><Text style={styles.small}>{latest?latest.date:t('health.noEntries')}</Text>{latest&&previous&&key!=='systolic'&&<Text style={styles.trend}>{latest.value===previous.value?t('health.copy02'):(latest.value>previous.value?'↑ ':'↓ ')+displayChange(key,Math.abs(latest.value-previous.value))}</Text>}</Pressable>})}</View></View>
      {([{key:'measurements',title:t('health.copy03'),description:t('health.copy04'),symbol:'◎'},{key:'metrics',title:t('health.copy05'),description:t('health.copy06'),symbol:'◇'},{key:'activity',title:t('health.copy07'),description:t('health.copy08'),symbol:'☾'}] as const).map(section=><Pressable key={section.key} accessibilityRole="button" style={styles.featureRow} onPress={()=>setHealthSection(section.key)}><View style={styles.featureIcon}><Text style={styles.featureEmoji}>{section.symbol}</Text></View><View style={{flex:1}}><Text style={styles.featureTitle}>{section.title}</Text><Text style={styles.featureDescription}>{section.description}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}
    </>:<>
      <Text style={styles.panelSubtitle}>{healthSection==='measurements'?t('health.copy09'):healthSection==='metrics'?t('health.copy10'):t('health.copy11')}</Text>
      {healthSection==='measurements'&&<View style={styles.diagramCard}>
        <View style={styles.diagramSwitch}>{(['male','female'] as const).map(shape=><Pressable key={shape} accessibilityRole="button" accessibilityState={{selected:bodyDiagram===shape}} onPress={()=>setBodyDiagram(shape)} style={[styles.diagramChoice,bodyDiagram===shape&&styles.selected]}><Text style={[styles.optionText,bodyDiagram===shape&&styles.selectedText]}>{shape==='male'?t('health.male'):t('health.female')}</Text></Pressable>)}</View>
        <Pressable onPress={()=>setMeasureGuide(v=>!v)} style={styles.guideButton}><Text style={styles.guideButtonText}>{measureGuide?t('health.hideGuide'):t('health.howToMeasure')+'  ›'}</Text></Pressable>{measureGuide&&<Text style={styles.diagramHint} >{hc.measureGuide}</Text>}
        <Text style={styles.diagramHint}>{t('health.copy12')}</Text>
        <View style={styles.diagramSwitch}>{(['Front','Back'] as const).map(side=><Pressable key={side} accessibilityRole="button" accessibilityState={{selected:figureSide===side}} onPress={()=>setFigureSide(side)} style={[styles.diagramChoice,figureSide===side&&styles.selected]}><Text style={[styles.optionText,figureSide===side&&styles.selectedText]}>{t(side==='Front'?'health.front':'health.back')}</Text></Pressable>)}</View>
        <View style={styles.figureRow}>{([figureSide] as const).map(side=><View key={side} style={styles.figureColumn}><Svg viewBox="0 0 150 300" width={195} height={390}>
          {/* Anatomical front/back silhouette, with independent touch targets below. */}
          <Path d="M75 6 C61 6 57 17 59 30 Q59 40 65 45 L67 52 L83 52 L85 45 Q91 40 91 30 C93 17 89 6 75 6 Z" fill="#E5F1F5" stroke="#7899AE" strokeWidth="1.7"/>
          <Path d="M60 24 Q57 21 57 29 Q57 35 62 37 M90 24 Q93 21 93 29 Q93 35 88 37" fill="none" stroke="#7899AE" strokeWidth="1.4"/>
          <Path d="M66 46 L65 56 Q75 62 85 56 L84 46" fill="#E5F1F5" stroke="#7899AE" strokeWidth="1.5"/>
          {/* Arms extend naturally from the shoulder, with elbows, wrists and hands. */}
          <Path d="M45 63 Q36 66 32 80 L26 114 Q24 125 20 137 L12 165 Q10 171 13 175 L16 176 L14 186 Q14 192 17 193 Q20 195 21 189 L23 180 L22 194 Q23 198 26 196 L29 182 L28 194 Q30 197 33 192 L35 174 Q38 167 35 158 L39 137 L49 103 Z" fill="#D9EAF1" stroke="#7899AE" strokeWidth="1.8" strokeLinejoin="round"/>
          <Path d="M105 63 Q114 66 118 80 L124 114 Q126 125 130 137 L138 165 Q140 171 137 175 L134 176 L136 186 Q136 192 133 193 Q130 195 129 189 L127 180 L128 194 Q127 198 124 196 L121 182 L122 194 Q120 197 117 192 L115 174 Q112 167 115 158 L111 137 L101 103 Z" fill="#D9EAF1" stroke="#7899AE" strokeWidth="1.8" strokeLinejoin="round"/>
          {/* Torso, waist, pelvis: distinct male/female anatomy. */}
          <Path d={bodyDiagram==='female'
            ? 'M64 55 Q56 57 46 62 Q38 67 40 81 Q43 94 48 105 Q52 115 50 127 Q45 141 42 161 Q40 179 46 197 Q57 207 75 206 Q93 207 104 197 Q110 179 108 161 Q105 141 100 127 Q98 115 102 105 Q107 94 110 81 Q112 67 104 62 Q94 57 86 55 Q75 63 64 55 Z'
            : 'M64 55 Q55 57 42 62 Q34 67 38 83 Q42 96 49 109 Q53 123 50 137 L44 166 Q41 181 46 197 Q57 205 75 204 Q93 205 104 197 Q109 181 106 166 L100 137 Q97 123 101 109 Q108 96 112 83 Q116 67 108 62 Q95 57 86 55 Q75 63 64 55 Z'}
            fill="#E8F4F8" stroke="#7899AE" strokeWidth="2" strokeLinejoin="round"/>
          {/* Full-length legs and feet. */}
          <Path d="M46 197 Q44 211 45 226 L43 245 Q40 260 43 273 L42 280 Q35 286 32 289 Q29 294 36 296 L56 296 Q62 294 62 289 L63 279 Q67 263 69 247 L74 211 L75 204 Q76 222 81 247 Q83 263 87 279 L88 289 Q88 294 94 296 L114 296 Q121 294 118 289 Q115 286 108 280 L107 273 Q110 260 107 245 L105 226 Q106 211 104 197" fill="#D9EAF1" stroke="#7899AE" strokeWidth="2" strokeLinejoin="round"/>
          <Path d="M75 204 L75 215 M49 252 Q56 257 64 253 M86 253 Q94 257 101 252" fill="none" stroke="#A4BDCB" strokeWidth="1.3"/>
          {side==='Front'?<>
            <Path d="M49 91 Q60 98 75 96 Q90 98 101 91 M75 103 L75 138 M67 140 Q75 145 83 140" fill="none" stroke="#B0C8D4" strokeWidth="1.1"/>
            {bodyDiagram==='female'&&<Path d="M48 98 Q58 109 72 103 M78 103 Q92 109 102 98" fill="none" stroke="#A4BDCB" strokeWidth="1.2"/>}
          </>:<Path d="M75 64 L75 148 M48 87 Q59 110 75 107 Q91 110 102 87 M53 111 Q61 120 69 120 M81 120 Q89 120 97 111" fill="none" stroke="#A4BDCB" strokeWidth="1.3"/>}
          {/* Circumference bands, rather than dots, match the measurement reference. */}
          {side==='Front'?<>
            <Path d="M65 52 Q75 56 85 52 M47 103 Q75 110 103 103 M47 144 Q75 151 103 144 M45 183 Q75 190 105 183 M25 111 Q31 115 40 113 M110 113 Q119 115 125 111 M45 231 Q57 235 69 231 M81 231 Q93 235 105 231 M43 260 Q54 264 65 260 M85 260 Q96 264 107 260" stroke="#24C0C6" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.92"/>
          </>:<Path d="M46 187 Q75 196 104 187 M47 144 Q75 151 103 144" stroke="#24C0C6" strokeWidth="3.2" fill="none" strokeLinecap="round"/>}
          {(side==='Front'?[{m:'neck',x:75,y:52},{m:'chest',x:75,y:103},{m:'waist',x:75,y:145},{m:'hips',x:75,y:183},{m:'armLeft',x:30,y:112},{m:'armRight',x:120,y:112},{m:'thighLeft',x:57,y:231},{m:'thighRight',x:93,y:231},{m:'calfLeft',x:54,y:260},{m:'calfRight',x:96,y:260}]:[{m:'glutes',x:75,y:187}]).map(p=><Circle key={p.m} cx={p.x} cy={p.y} r="4.5" fill="#22C1C8" stroke="#F7FCFF" strokeWidth="1.4"/>)}
        </Svg>
        <View style={styles.figureHotspots}>{(side==='Front'?[{m:'neck',top:'13%',left:'44%'},{m:'chest',top:'29%',left:'44%'},{m:'waist',top:'44%',left:'44%'},{m:'hips',top:'55%',left:'44%'},{m:'armLeft',top:'35%',left:'12%'},{m:'armRight',top:'35%',left:'77%'},{m:'thighLeft',top:'70%',left:'33%'},{m:'thighRight',top:'70%',left:'57%'},{m:'calfLeft',top:'82%',left:'30%'},{m:'calfRight',top:'82%',left:'61%'} ]:[{m:'glutes',top:'57%',left:'44%'}]).map(p=><Pressable key={p.m} accessibilityRole="button" accessibilityLabel={'View '+titleFor(p.m as Marker).name} onPress={()=>setDetail(p.m as Marker)} style={[styles.hotspot,{top:p.top as any,left:p.left as any}]}/>)}</View>
        </View>)}</View>
        <Text style={styles.diagramHint}>{t('health.copy13')}</Text>
      </View>}
      {healthSection==='measurements'&&bodyGroup&&<View style={styles.groupPanel}><Pressable onPress={()=>setBodyGroup(null)}><Text style={styles.guideButtonText}>‹ {t('health.copy14')}</Text></Pressable><Text style={styles.featureTitle}>{bodyGroup}</Text>{(bodyGroup==='Arms'?['armLeft','armRight']:bodyGroup==='Thighs'?['thighLeft','thighRight']:['calfLeft','calfRight']).map(k=>{const m=k as Marker;const latest=items.filter(i=>i.marker===m).sort((a,b)=>b.date.localeCompare(a.date))[0];return <Pressable key={k} style={styles.featureRow} onPress={()=>setDetail(m)}><View style={{flex:1}}><Text style={styles.featureTitle}>{translatedName(m)}</Text><Text style={styles.featureDescription}>{latest?localizedQuantity(m,latest.value)+' '+localizedUnit(m):t('health.copy15')}</Text></View><Text style={styles.chevron}>›</Text></Pressable>})}</View>}
      {(healthSection==='measurements'&&bodyGroup?[]:healthSection==='measurements'?(['neck','chest','waist','hips','Arms','Thighs','Calves'] as const):healthSection==='metrics'?['bodyfat']:['sleep','steps']).map(key=>{const grouped=key==='Arms'||key==='Thighs'||key==='Calves';const m=(grouped?(key==='Arms'?'armLeft':key==='Thighs'?'thighLeft':'calfLeft'):key) as Marker;const latest=items.filter(i=>i.marker===m).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))[0];return <Pressable key={key} accessibilityRole="button" style={styles.featureRow} onPress={()=>grouped?setBodyGroup(key as 'Arms'|'Thighs'|'Calves'):setDetail(m)}><View style={{flex:1}}><Text style={styles.featureTitle}>{grouped?t(('health.'+key.toLowerCase()) as TranslationKey):key==='hips'?t('health.hips'):translatedName(m)}</Text><Text style={styles.featureDescription}>{grouped?t('health.copy16'):latest?localizedQuantity(m,latest.value)+' '+(m==='sleep'?localizedDuration(latest.value):localizedUnit(m))+' · '+latest.date:t('health.copy17')}</Text></View><Text style={styles.chevron}>›</Text></Pressable>})}
      {healthSection==='metrics'&&<View style={styles.featureRow}><View style={{flex:1}}><Text style={styles.featureTitle}>{t('health.copy18')}</Text><Text style={styles.featureDescription}>{t('health.copy19')}</Text></View></View>}
    </>}

   </>}
   ListEmptyComponent={null}
   renderItem={({item})=>{const m=titleFor(item.marker);return <View style={styles.entry}><View style={{flex:1}}><Text style={styles.entryTitle}>{m.name}: {item.value} {m.unit}</Text><Text style={styles.small}>{item.date}</Text>{!!item.note&&<Text style={styles.note}>{item.note}</Text>}</View><Pressable accessibilityRole="button" accessibilityLabel={'Delete '+m.name+' measurement'} onPress={()=>remove(item)}><Text style={styles.delete}>{t('health.copy20')}</Text></Pressable></View>}}
   ListFooterComponent={<Text style={styles.footer}>{t('health.copy21')}</Text>}/>
  <Modal visible={detail!==null} transparent animationType="fade" onRequestClose={()=>setDetail(null)}><View style={styles.overlay}><Pressable accessibilityRole="button" accessibilityLabel={t('health.copy22')} onPress={()=>setDetail(null)} style={StyleSheet.absoluteFill} /><View style={styles.detail}><View style={styles.modalHeader}><Text style={[styles.heading,{flex:1,flexShrink:1,fontSize:23,marginRight:12}]}>{detail==='diastolic'?t('health.bloodPressure'):detail?translatedName(detail):''}</Text><Pressable style={{flexShrink:0,paddingVertical:6}} onPress={()=>setDetail(null)}><Text style={styles.cancel}>{t('health.copy22')}</Text></Pressable></View><ScrollView style={{maxHeight:440}}>{detail&&<View style={styles.graph}><Text style={styles.tileTitle}>{t('health.copy23')}</Text><View style={styles.rangeRow}>{(['7D','30D','90D','All'] as const).map(r=><Pressable key={r} onPress={()=>setRange(r)} style={[styles.rangeButton,range===r&&styles.rangeSelected]}><Text style={[styles.rangeText,range===r&&styles.rangeTextSelected]}>{r==='All'?(hc.all):r}</Text></Pressable>)}</View>{(()=>{const points=dailyPoints(detail);if(points.length<2)return <Text style={styles.small}>{t('health.copy24')}</Text>;
 const bp=detail==='systolic';const secondary=bp?bpDaily('diastolic'):[];const all=[...points,...secondary];const vals=all.map(p=>p.value);const lo=Math.min(...vals),hi=Math.max(...vals);const spread=Math.max(hi-lo,0.1);const width=Math.max(220,chartWidth-12),height=145;
 const firstDay=new Date(points[0].date+'T12:00:00').getTime();const lastDay=new Date(points[points.length-1].date+'T12:00:00').getTime();const dateSpan=Math.max(1,lastDay-firstDay);
 const coordsFor=(data:RecordItem[])=>data.filter(p=>new Date(p.date+'T12:00:00').getTime()>=firstDay&&new Date(p.date+'T12:00:00').getTime()<=lastDay).map(p=>({id:p.id,x:10+(new Date(p.date+'T12:00:00').getTime()-firstDay)/dateSpan*(width-20),y:height-15-(p.value-lo)/spread*(height-35)}));
 const coords=coordsFor(points),other=bp?coordsFor(secondary):[];
 const diff=points[points.length-1].value-points[0].value;
 const changeText=diff===0?hc.noChange:`${diff>0?'↑':'↓'} ${displayChange(detail,Math.abs(diff))}`;
 return <View><View style={styles.chartArea} onLayout={e=>setChartWidth(e.nativeEvent.layout.width)}><Text style={styles.chartMax}>{localizedQuantity(detail,hi)}</Text><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Line x1="10" y1={height-15} x2={width-10} y2={height-15} stroke="#DCE6ED" strokeWidth="1"/><Polyline points={coords.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={theme.teal} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>{coords.map(p=><Circle key={p.id} cx={p.x} cy={p.y} r="5" fill={theme.teal} stroke="white" strokeWidth="2"/>)}{bp&&other.length>0&&<><Polyline points={other.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={theme.navy} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>{other.map(p=><Circle key={p.id} cx={p.x} cy={p.y} r="5" fill={theme.navy} stroke="white" strokeWidth="2"/>)}</>}</Svg><Text style={styles.chartMin}>{localizedQuantity(detail,lo)}</Text></View><View style={styles.chartDates}><Text style={styles.small}>{points[0].date}</Text><Text style={styles.small}>{points[points.length-1].date}</Text></View>{bp&&<Text style={styles.small}>{hc.bpLegend}</Text>}<Text style={styles.small}>{points.length} {points.length===1?hc.day:hc.days} · {changeText}{detail==='heart'?(' · '+hc.dailyAverages):''}</Text></View>})()}</View>}{items.filter(i=>i.marker===detail).sort((a,b)=>b.date.localeCompare(a.date)).map(i=><View key={i.id} style={styles.entry}><View style={{flex:1}}><Text style={styles.entryTitle}>{localizedQuantity(i.marker,i.value)} {i.marker==='weight'&&weightUnit==='st'?'':i.marker==='sleep'?localizedDuration(i.value):localizedUnit(i.marker)}</Text><Text style={styles.small}>{i.date}</Text>{!!i.note&&<Text style={styles.note}>{i.note}</Text>}</View><Pressable onPress={()=>remove(i)}><Text style={styles.delete}>{t('health.copy25')}</Text></Pressable></View>)}{!items.some(i=>i.marker===detail)&&<Text style={styles.small}>{t('health.copy26')}</Text>}</ScrollView><Pressable style={styles.save} onPress={()=>{if(detail)setMarker(detail==='diastolic'?'systolic':detail);setDetail(null);setVisible(true);}}><Text style={styles.saveText}>{hc.addReading}</Text></Pressable></View></View></Modal>
  <Modal visible={visible} animationType="slide" onRequestClose={()=>setVisible(false)}>
   <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={[styles.modal,{paddingTop:Math.max(insets.top+16,28),paddingBottom:Math.max(insets.bottom,16)}]}>
    <View style={styles.modalHeader}><Text style={[styles.heading,{flex:1,flexShrink:1,marginRight:12}]}>{hc.addMeasurement}</Text><Pressable onPress={()=>setVisible(false)}><Text style={styles.cancel}>{hc.cancel}</Text></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{paddingBottom:110}}>
     <Text style={styles.label}>{language==='es'?'Medición':'Measurement'}</Text><View style={styles.options}>{MARKERS.filter(m=>m.key!=='diastolic').map(m=><Pressable key={m.key} onPress={()=>{setMarker(m.key);setValue('');setSecondValue('');}} style={[styles.option,marker===m.key&&styles.selected]}><Text style={[styles.optionText,marker===m.key&&styles.selectedText]}>{m.key==='systolic'?t('health.bpBoth'):translatedName(m.key)}</Text></Pressable>)}</View>
     <Text style={styles.label}>{marker==='systolic'?t('health.systolicInput'):marker==='weight'&&weightUnit==='st'?t('health.stones'):`${t('health.value')} (${unitFor(marker)})`}</Text><TextInput keyboardType="decimal-pad" placeholder={marker==='weight'&&weightUnit==='st'?'e.g. 12':titleFor(marker).hint} value={value} onChangeText={setValue} style={styles.input}/>
     {(marker==='systolic'||(marker==='weight'&&weightUnit==='st'))&&<><Text style={styles.label}>{marker==='systolic'?t('health.diastolicInput'):t('health.poundsInput')}</Text><TextInput keyboardType="decimal-pad" placeholder={marker==='systolic'?'e.g. 80':'e.g. 7.5'} value={secondValue} onChangeText={setSecondValue} style={styles.input}/></>}
     <Text style={styles.label}>{language==='es'?'Notas (opcional)':'Notes (optional)'}</Text><TextInput multiline placeholder={t('health.notesHint')} value={note} onChangeText={setNote} style={[styles.input,{minHeight:100,textAlignVertical:'top'}]}/>

    </ScrollView><Pressable onPress={()=>Keyboard.dismiss()} style={{alignSelf:'flex-end',padding:10}}><Text style={styles.cancel}>{language==='es'?'Terminar de escribir':'Done typing'}</Text></Pressable><Pressable disabled={saving} onPress={()=>void save()} style={styles.save}><Text style={styles.saveText}>{saving?t('health.saving'):t('health.saveMeasurement')}</Text></Pressable>
   </KeyboardAvoidingView>
  </Modal>
 </View>;
}
const baseStyles=StyleSheet.create({
 guideButton:{alignSelf:'flex-start',paddingVertical:8},guideButtonText:{color:theme.teal,fontSize:14,fontWeight:'800'},groupPanel:{padding:12,borderRadius:14,backgroundColor:'#EAF4F6',marginBottom:12},
 diagramCard:{backgroundColor:'white',borderRadius:16,borderWidth:1,borderColor:theme.border,padding:12,marginBottom:12},diagramSwitch:{flexDirection:'row',gap:8,marginBottom:8},diagramChoice:{flex:1,padding:11,borderRadius:10,alignItems:'center',backgroundColor:theme.background},diagramHint:{fontSize:12,color:theme.slate,lineHeight:18,marginVertical:7},figureRow:{flexDirection:'row',justifyContent:'center',paddingVertical:10},figureColumn:{width:195,position:'relative',alignItems:'center'},figureLabel:{fontSize:13,fontWeight:'700',color:theme.navy},figureHotspots:{position:'absolute',top:10,left:0,right:0,height:390},hotspot:{position:'absolute',width:36,height:36,borderRadius:18},
 topActions:{flexDirection:'row',alignItems:'center',gap:10},settingsIcon:{padding:10,borderRadius:12,backgroundColor:'white',borderWidth:1,borderColor:theme.border},settingsText:{fontSize:20,color:theme.navy},backLink:{alignSelf:'flex-start',paddingVertical:10,marginTop:12},backText:{color:theme.teal,fontSize:15,fontWeight:'800'},
 healthNav:{flexDirection:'row',gap:6,marginTop:18,marginBottom:20},healthNavTab:{flex:1,backgroundColor:'#E9F0F4',paddingVertical:12,paddingHorizontal:3,borderRadius:12,alignItems:'center',borderWidth:1,borderColor:theme.border},healthNavSelected:{backgroundColor:theme.navy,borderColor:theme.navy},healthNavText:{fontSize:12,fontWeight:'700',color:theme.navy},healthNavTextSelected:{color:'white'},overviewPanel:{backgroundColor:'#F0F6F8',borderRadius:16,padding:12,borderWidth:1,borderColor:theme.border},panelTitle:{fontSize:18,fontWeight:'800',color:theme.navy},panelSubtitle:{fontSize:13,color:theme.slate,marginTop:5,marginBottom:14,lineHeight:19},featureRow:{flexDirection:'row',alignItems:'center',backgroundColor:'white',borderWidth:1,borderColor:theme.border,borderRadius:14,padding:16,marginTop:12,gap:12},featureIcon:{width:40,height:40,borderRadius:10,backgroundColor:'#E2F4F3',alignItems:'center',justifyContent:'center'},featureEmoji:{fontSize:25,color:theme.teal},featureTitle:{fontSize:16,fontWeight:'800',color:theme.navy},featureDescription:{fontSize:12,color:theme.slate,lineHeight:18,marginTop:4},chevron:{fontSize:28,color:theme.slate},
 trend:{fontSize:11,color:theme.teal,marginTop:6,fontWeight:'600'},rangeRow:{flexDirection:'row',gap:6,marginVertical:12},rangeButton:{flex:1,alignItems:'center',padding:8,borderRadius:8,backgroundColor:theme.background},rangeSelected:{backgroundColor:theme.navy},rangeText:{color:theme.navy,fontSize:12,fontWeight:'700'},rangeTextSelected:{color:'white'},chartArea:{alignItems:'center'},chartMax:{color:theme.slate,fontSize:12,alignSelf:'flex-start'},chartMin:{color:theme.slate,fontSize:12,alignSelf:'flex-start'},chartDates:{flexDirection:'row',justifyContent:'space-between'},
 unitButton:{alignSelf:'flex-start',backgroundColor:'white',borderWidth:1,borderColor:theme.border,borderRadius:10,padding:12,marginBottom:16},unitRow:{flexDirection:'row',gap:8,marginBottom:24},unitChoice:{flex:1,borderWidth:1,borderColor:theme.border,padding:12,borderRadius:10,alignItems:'center'},graph:{padding:12,backgroundColor:'white',borderRadius:12,marginBottom:12},bars:{height:110,flexDirection:'row',alignItems:'flex-end',gap:5,paddingTop:12},barWrap:{flex:1,justifyContent:'flex-end'},bar:{backgroundColor:theme.teal,borderRadius:4},
 overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.55)',justifyContent:'center',padding:20},detail:{backgroundColor:theme.background,borderRadius:18,padding:20,maxHeight:'85%'},
 titleArea:{flex:1,marginRight:10},sectionHeader:{flexDirection:'row',alignItems:'center',minHeight:52,gap:10},headerArrow:{fontSize:38,color:theme.navy,fontWeight:'500',lineHeight:45},sectionHeading:{fontSize:22,fontWeight:'800',color:theme.navy,flexShrink:1},
 screen:{flex:1,backgroundColor:theme.background},content:{padding:20,paddingBottom:38},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{color:theme.teal,fontSize:12,fontWeight:'800',letterSpacing:1.5},heading:{color:theme.navy,fontSize:27,fontWeight:'800'},add:{backgroundColor:theme.navy,paddingHorizontal:20,paddingVertical:14,borderRadius:12},addText:{color:'white',fontWeight:'800'},intro:{color:theme.slate,marginTop:16,marginBottom:18,fontSize:15},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:12},tile:{backgroundColor:'white',borderColor:theme.border,borderWidth:1,borderRadius:14,padding:16,width:'47.5%',minHeight:116},tileTitle:{color:theme.slate,fontSize:13,fontWeight:'600'},tileValue:{color:theme.navy,fontSize:24,fontWeight:'800',marginTop:10},unit:{fontSize:12,color:theme.slate},small:{color:theme.muted,fontSize:13,marginTop:5},section:{fontSize:20,fontWeight:'800',color:theme.navy,marginTop:28,marginBottom:12},empty:{padding:24,backgroundColor:'white',borderRadius:14},entry:{flexDirection:'row',alignItems:'center',backgroundColor:'white',borderRadius:12,borderWidth:1,borderColor:theme.border,padding:16,marginBottom:10},entryTitle:{fontSize:15,fontWeight:'700',color:theme.navy},note:{color:theme.slate,marginTop:7},delete:{color:'#B42318',fontWeight:'700',padding:8},footer:{fontSize:12,color:theme.muted,marginTop:22,lineHeight:18},modal:{flex:1,backgroundColor:theme.background,paddingHorizontal:20},modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:30},cancel:{color:theme.teal,fontWeight:'700',fontSize:16},label:{fontSize:16,fontWeight:'700',color:theme.navy,marginBottom:12},options:{gap:8,marginBottom:24},option:{backgroundColor:'white',padding:14,borderRadius:12,borderWidth:1,borderColor:theme.border},selected:{backgroundColor:theme.navy,borderColor:theme.navy},optionText:{color:theme.navy,fontWeight:'600'},selectedText:{color:'white'},input:{backgroundColor:'white',borderWidth:1,borderColor:theme.border,borderRadius:12,padding:15,fontSize:17,marginBottom:24,color:theme.navy},save:{backgroundColor:theme.navy,borderRadius:12,padding:18,alignItems:'center'},saveText:{color:'white',fontWeight:'800',fontSize:16}
});
