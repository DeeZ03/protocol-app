import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type Entry = { name: string; aliases?: string; tags: string[]; conditions?: string[] };
const entries: Entry[] = [
 {name:'GHK-Cu',tags:['Peptides']},
 {name:'Semaglutide',aliases:'Ozempic Wegovy',tags:['Peptides','Medications'],conditions:['Type 2 diabetes']},
 {name:'Tirzepatide',aliases:'Mounjaro Zepbound',tags:['Peptides','Medications'],conditions:['Type 2 diabetes']},
 {name:'Somatropin',aliases:'HGH',tags:['TRT & Hormones']},
 {name:'Testosterone Cypionate',aliases:'Test C',tags:['TRT & Hormones','PEDs & PCT']},
 {name:'Testosterone Enanthate',aliases:'Test E',tags:['TRT & Hormones','PEDs & PCT']},
 {name:'Clomiphene',aliases:'Clomid',tags:['PEDs & PCT','Medications']},
 {name:'Tamoxifen',aliases:'Nolvadex',tags:['PEDs & PCT','Medications']},
 {name:'hCG',aliases:'Human chorionic gonadotropin',tags:['TRT & Hormones','PEDs & PCT']},
 {name:'Levothyroxine',aliases:'T4 Synthroid',tags:['Medications'],conditions:['Hypothyroidism']},
 {name:'Liothyronine',aliases:'T3',tags:['Medications'],conditions:['Hypothyroidism']},
 {name:'Metformin',tags:['Medications'],conditions:['Type 2 diabetes']},
 {name:'Insulin Aspart',aliases:'NovoRapid',tags:['Medications'],conditions:['Type 1 diabetes','Type 2 diabetes']},
 {name:'Hydroxychloroquine',aliases:'Plaquenil',tags:['Medications'],conditions:['Lupus','Rheumatoid arthritis']},
 {name:'Mycophenolate Mofetil',aliases:'CellCept',tags:['Medications'],conditions:['Lupus']},
 {name:'Salbutamol',aliases:'Albuterol Ventolin',tags:['Medications'],conditions:['Asthma']},
 {name:'Amlodipine',tags:['Medications'],conditions:['High blood pressure']},
 {name:'Sertraline',aliases:'Zoloft',tags:['Medications'],conditions:['Depression and anxiety']},
];
const categories = [
 {name:'Peptides',icon:'flask-outline',subtitle:'Research & therapeutic'},
 {name:'TRT & Hormones',icon:'pulse-outline',subtitle:'Testosterone, HGH & more'},
 {name:'PEDs & PCT',icon:'barbell-outline',subtitle:'Anabolics & related'},
 {name:'Medications',icon:'medkit-outline',subtitle:'Prescription & OTC'},
 {name:'Health Conditions',icon:'heart-outline',subtitle:'Browse by condition'},
 {name:'Manual Entry',icon:'create-outline',subtitle:'Enter your own name'},
] as const;
type Props = {visible:boolean; selected:string; onSelect:(name:string)=>void; onClose:()=>void};
export default function CompoundSelector({visible,selected,onSelect,onClose}:Props) {
 const [category,setCategory]=useState('');
 const [condition,setCondition]=useState('');
 const [query,setQuery]=useState('');
 const [manual,setManual]=useState('');
 const reset=()=>{setCategory('');setCondition('');setQuery('');setManual('');};
 const exit=()=>{reset();onClose();};
 const choose=(value:string)=>{onSelect(value);exit();};
 const conditions=Array.from(new Set(entries.flatMap(e=>e.conditions??[]))).sort();
 const term=query.trim().toLowerCase();
 const results=entries.filter(e=>{
  const matches=!term || [e.name,e.aliases??'',...(e.conditions??[])].some(s=>s.toLowerCase().includes(term));
  const section=!term && category && category!=='Health Conditions' ? e.tags.includes(category) : true;
  const conditionMatch=!term && condition ? e.conditions?.includes(condition) : true;
  return matches && section && conditionMatch;
 });
 return <Modal visible={visible} animationType="slide" onRequestClose={exit}>
  <View style={styles.page}>
   <View style={styles.header}><Pressable onPress={()=>{if(condition)setCondition('');else if(category)setCategory('');else exit();}}><Ionicons name="arrow-back" size={25} color={theme.navy}/></Pressable><Text style={styles.title}>Choose compound</Text><Pressable onPress={exit}><Text style={styles.link}>Cancel</Text></Pressable></View>
   <TextInput style={styles.search} placeholder="Search compounds, brands or conditions" value={query} onChangeText={setQuery} autoCorrect={false}/>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    {!category && !term ? <View style={styles.grid}>{categories.map(c=><Pressable key={c.name} style={styles.tile} onPress={()=>{if(c.name==='Manual Entry')setCategory('Manual Entry');else setCategory(c.name);}}><Ionicons name={c.icon} size={25} color={theme.teal}/><Text style={styles.tileTitle}>{c.name}</Text><Text style={styles.subtitle}>{c.subtitle}</Text></Pressable>)}</View> : null}
    {category==='Manual Entry' && !term ? <><Text style={styles.section}>Enter a compound or medication</Text><TextInput style={styles.search} value={manual} onChangeText={setManual} placeholder="Type a name" maxLength={100}/><Pressable style={[styles.primary,!manual.trim()&&styles.disabled]} disabled={!manual.trim()} onPress={()=>choose(manual.trim())}><Text style={styles.primaryText}>Use this name</Text></Pressable></> : null}
    {category==='Health Conditions' && !condition && !term ? <><Text style={styles.section}>Browse by condition</Text>{conditions.map(name=><Pressable key={name} style={styles.result} onPress={()=>setCondition(name)}><Text style={styles.resultName}>{name}</Text><Ionicons name="chevron-forward" size={18} color={theme.slate}/></Pressable>)}</> : null}
    {(!!term || (!!category && category!=='Manual Entry' && category!=='Health Conditions') || !!condition) ? <><Text style={styles.section}>{term?'Search results':condition||category}</Text><Text style={styles.note}>Associated listings are for browsing only, not treatment recommendations.</Text>{results.map(e=><Pressable key={e.name} style={styles.result} onPress={()=>choose(e.name)}><View style={{flex:1}}><Text style={styles.resultName}>{e.name}</Text><Text style={styles.subtitle}>{e.tags.join(' · ')}</Text></View><Ionicons name="add-circle-outline" size={24} color={theme.teal}/></Pressable>)}{results.length===0&&<Text style={styles.note}>No matches in this starter catalogue. Use Manual Entry to add your own.</Text>}</> : null}
    {(!!term || category && category!=='Manual Entry') && <Pressable style={styles.manualLink} onPress={()=>{setCategory('Manual Entry');setQuery('');setCondition('');setManual(query);}}><Ionicons name="create-outline" size={20} color={theme.teal}/><Text style={styles.link}>Enter a name manually</Text></Pressable>}
    <Text style={styles.footer}>Starter catalogue for navigation testing. More entries will be added later. No dosing or medical guidance.</Text>
   </ScrollView>
  </View>
 </Modal>;
}
const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:theme.background,paddingHorizontal:20,paddingTop:40},
 header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:20},
 title:{fontSize:21,fontWeight:'800',color:theme.navy},link:{color:theme.teal,fontWeight:'700'},
 search:{backgroundColor:theme.white,borderWidth:1,borderColor:theme.border,borderRadius:12,padding:14,fontSize:16,color:theme.text,marginBottom:18},
 content:{paddingBottom:48},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},
 tile:{width:'48%',flexGrow:1,backgroundColor:theme.white,borderWidth:1,borderColor:theme.border,borderRadius:15,padding:17,minHeight:125,justifyContent:'center',gap:7},
 tileTitle:{color:theme.navy,fontWeight:'800',fontSize:15},subtitle:{color:theme.slate,fontSize:12,lineHeight:18},
 section:{fontSize:18,fontWeight:'800',color:theme.navy,marginBottom:12},
 result:{backgroundColor:theme.white,borderWidth:1,borderColor:theme.border,borderRadius:12,padding:15,marginBottom:9,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
 resultName:{fontSize:16,fontWeight:'700',color:theme.navy},
 note:{color:theme.slate,fontSize:13,lineHeight:20,marginBottom:15},
 manualLink:{flexDirection:'row',gap:8,alignItems:'center',paddingVertical:18},
 primary:{backgroundColor:theme.navy,borderRadius:12,padding:16,alignItems:'center'},primaryText:{color:theme.white,fontWeight:'700'},
 disabled:{opacity:0.4},footer:{color:theme.muted,fontSize:12,lineHeight:18,marginTop:22},
});