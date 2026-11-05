import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useLanguage, type TranslationKey } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
 {name:"BPC-157",tags:["Peptides"]},
 {name:"TB-500",aliases:"Thymosin beta 4",tags:["Peptides"]},
 {name:"Retatrutide",aliases:"Reta",tags:["Peptides"]},
 {name:"CJC-1295",tags:["Peptides"]},
 {name:"Ipamorelin",tags:["Peptides"]},
 {name:"Sermorelin",tags:["Peptides"]},
 {name:"Tesamorelin",aliases:"Egrifta",tags:["Peptides"]},
 {name:"GHRP-2",tags:["Peptides"]},
 {name:"GHRP-6",tags:["Peptides"]},
 {name:"Hexarelin",tags:["Peptides"]},
 {name:"MOTS-c",tags:["Peptides"]},
 {name:"SS-31",aliases:"Elamipretide",tags:["Peptides"]},
 {name:"Epitalon",aliases:"Epithalon",tags:["Peptides"]},
 {name:"Selank",tags:["Peptides"]},
 {name:"Semax",tags:["Peptides"]},
 {name:"KPV",tags:["Peptides"]},
 {name:"Thymosin Alpha-1",aliases:"Thymalfasin",tags:["Peptides"]},
 {name:"PT-141",aliases:"Bremelanotide",tags:["Peptides"]},
 {name:"AOD-9604",tags:["Peptides"]},
 {name:"Liraglutide",aliases:"Victoza Saxenda",tags:["Peptides","Medications"],conditions:["Type 2 diabetes"]},
 {name:"Dulaglutide",aliases:"Trulicity",tags:["Peptides","Medications"],conditions:["Type 2 diabetes"]},
 {name:"Testosterone Propionate",aliases:"Test P",tags:["TRT & Hormones","PEDs & PCT"]},
 {name:"Testosterone Undecanoate",aliases:"Nebido Aveed",tags:["TRT & Hormones","PEDs & PCT"]},
 {name:"Sustanon",aliases:"Testosterone blend",tags:["TRT & Hormones","PEDs & PCT"]},
 {name:"Somapacitan",aliases:"Sogroya",tags:["TRT & Hormones"]},
 {name:"Somatrogon",aliases:"Ngenla",tags:["TRT & Hormones"]},
 {name:"Lonapegsomatropin",aliases:"Skytrofa",tags:["TRT & Hormones"]},
 {name:"Mecasermin",aliases:"IGF-1 Increlex",tags:["TRT & Hormones"]},
 {name:"hMG",aliases:"Menotropins",tags:["TRT & Hormones","PEDs & PCT"]},
 {name:"Estradiol",aliases:"Oestradiol",tags:["TRT & Hormones","Medications"]},
 {name:"Progesterone",tags:["TRT & Hormones","Medications"]},
 {name:"Nandrolone",aliases:"Deca",tags:["PEDs & PCT"]},
 {name:"Trenbolone",tags:["PEDs & PCT"]},
 {name:"Boldenone",aliases:"Equipoise",tags:["PEDs & PCT"]},
 {name:"Oxandrolone",aliases:"Anavar",tags:["PEDs & PCT"]},
 {name:"Methenolone",aliases:"Primobolan",tags:["PEDs & PCT"]},
 {name:"Drostanolone",aliases:"Masteron",tags:["PEDs & PCT"]},
 {name:"Stanozolol",aliases:"Winstrol",tags:["PEDs & PCT"]},
 {name:"Anastrozole",aliases:"Arimidex",tags:["PEDs & PCT","Medications"]},
 {name:"Exemestane",aliases:"Aromasin",tags:["PEDs & PCT","Medications"]},
 {name:"Letrozole",aliases:"Femara",tags:["PEDs & PCT","Medications"]},
 {name:"Enclomiphene",tags:["PEDs & PCT"]},
 {name:"Raloxifene",aliases:"Evista",tags:["PEDs & PCT","Medications"]},
 {name:"Insulin Glargine",aliases:"Lantus",tags:["Medications"],conditions:["Type 1 diabetes","Type 2 diabetes"]},
 {name:"Insulin Lispro",aliases:"Humalog",tags:["Medications"],conditions:["Type 1 diabetes","Type 2 diabetes"]},
 {name:"Empagliflozin",aliases:"Jardiance",tags:["Medications"],conditions:["Type 2 diabetes","Heart failure"]},
 {name:"Dapagliflozin",aliases:"Forxiga Farxiga",tags:["Medications"],conditions:["Type 2 diabetes","Heart failure"]},
 {name:"Gliclazide",tags:["Medications"],conditions:["Type 2 diabetes"]},
 {name:"Sitagliptin",aliases:"Januvia",tags:["Medications"],conditions:["Type 2 diabetes"]},
 {name:"Glucagon",tags:["Medications"],conditions:["Type 1 diabetes"]},
 {name:"Prednisolone",tags:["Medications"],conditions:["Lupus","Rheumatoid arthritis","Asthma"]},
 {name:"Azathioprine",aliases:"Imuran",tags:["Medications"],conditions:["Lupus","Inflammatory bowel disease"]},
 {name:"Belimumab",aliases:"Benlysta",tags:["Medications"],conditions:["Lupus"]},
 {name:"Anifrolumab",aliases:"Saphnelo",tags:["Medications"],conditions:["Lupus"]},
 {name:"Methotrexate",tags:["Medications"],conditions:["Rheumatoid arthritis"]},
 {name:"Sulfasalazine",tags:["Medications"],conditions:["Rheumatoid arthritis","Inflammatory bowel disease"]},
 {name:"Adalimumab",aliases:"Humira",tags:["Medications"],conditions:["Rheumatoid arthritis","Inflammatory bowel disease"]},
 {name:"Mesalazine",aliases:"Mesalamine",tags:["Medications"],conditions:["Inflammatory bowel disease"]},
 {name:"Budesonide",tags:["Medications"],conditions:["Asthma","Inflammatory bowel disease"]},
 {name:"Beclometasone",aliases:"Beclomethasone",tags:["Medications"],conditions:["Asthma"]},
 {name:"Montelukast",aliases:"Singulair",tags:["Medications"],conditions:["Asthma"]},
 {name:"Formoterol",tags:["Medications"],conditions:["Asthma"]},
 {name:"Losartan",aliases:"Cozaar",tags:["Medications"],conditions:["High blood pressure"]},
 {name:"Ramipril",tags:["Medications"],conditions:["High blood pressure","Heart failure"]},
 {name:"Bisoprolol",tags:["Medications"],conditions:["High blood pressure","Heart failure"]},
 {name:"Sacubitril/Valsartan",aliases:"Entresto",tags:["Medications"],conditions:["Heart failure"]},
 {name:"Furosemide",aliases:"Frusemide",tags:["Medications"],conditions:["Heart failure"]},
 {name:"Atorvastatin",aliases:"Lipitor",tags:["Medications"],conditions:["High cholesterol"]},
 {name:"Rosuvastatin",aliases:"Crestor",tags:["Medications"],conditions:["High cholesterol"]},
 {name:"Ezetimibe",tags:["Medications"],conditions:["High cholesterol"]},
 {name:"Omeprazole",aliases:"Losec Prilosec",tags:["Medications"],conditions:["Acid reflux"]},
 {name:"Lansoprazole",tags:["Medications"],conditions:["Acid reflux"]},
 {name:"Pantoprazole",tags:["Medications"],conditions:["Acid reflux"]},
 {name:"Fluoxetine",aliases:"Prozac",tags:["Medications"],conditions:["Depression and anxiety"]},
 {name:"Escitalopram",aliases:"Lexapro Cipralex",tags:["Medications"],conditions:["Depression and anxiety"]},
 {name:"Citalopram",aliases:"Celexa",tags:["Medications"],conditions:["Depression and anxiety"]},
 {name:"Venlafaxine",aliases:"Effexor",tags:["Medications"],conditions:["Depression and anxiety"]},
 {name:"Methylphenidate",aliases:"Ritalin Concerta",tags:["Medications"],conditions:["ADHD"]},
 {name:"Lisdexamfetamine",aliases:"Elvanse Vyvanse",tags:["Medications"],conditions:["ADHD"]},
 {name:"Atomoxetine",aliases:"Strattera",tags:["Medications"],conditions:["ADHD"]},
 {name:"Finasteride",aliases:"Propecia Proscar",tags:["Medications"]},
 {name:"Dutasteride",aliases:"Avodart",tags:["Medications"]},
 {name:"Tadalafil",aliases:"Cialis",tags:["Medications"]},
 {name:"Sildenafil",aliases:"Viagra",tags:["Medications"]},
 {name:"Cabergoline",aliases:"Dostinex",tags:["Medications"]},
 {name:"Spironolactone",aliases:"Aldactone",tags:["Medications"],conditions:["Heart failure","High blood pressure"]},
 {name:"Warfarin",tags:["Medications"],conditions:["Atrial fibrillation"]},
 {name:"Apixaban",aliases:"Eliquis",tags:["Medications"],conditions:["Atrial fibrillation"]},
 {name:"LevETIRAcetam",aliases:"Keppra",tags:["Medications"],conditions:["Epilepsy"]},
 {name:"Lamotrigine",aliases:"Lamictal",tags:["Medications"],conditions:["Epilepsy"]},
 {name:"Levodopa/Carbidopa",aliases:"Sinemet",tags:["Medications"],conditions:["Parkinson's disease"]},
 {name:"Donepezil",aliases:"Aricept",tags:["Medications"],conditions:["Alzheimer's disease"]},
];
const compoundInfo: Record<string, { description: string; route: string; icon: 'medical-outline' | 'bandage-outline' | 'water-outline' | 'help-circle-outline' }> = {
 'GHK-Cu': {description:'A copper-binding peptide investigated in skin and tissue research. Clinical benefits are not established.',route:'Research compound; route varies',icon:'help-circle-outline'},
 'Semaglutide': {description:'A GLP-1 receptor agonist prescribed for type 2 diabetes and, in certain products, weight management.',route:'Injection or oral tablet, depending on product',icon:'medical-outline'},
 'Tirzepatide': {description:'A GIP/GLP-1 receptor agonist used in certain approved treatments for diabetes and weight management.',route:'Injection',icon:'medical-outline'},
 'Retatrutide': {description:'An investigational triple hormone-receptor agonist being studied for metabolic conditions.',route:'Investigational injection',icon:'medical-outline'},
 'BPC-157': {description:'An experimental peptide studied mainly in preclinical research. It is not an approved medicine.',route:'No established approved route',icon:'help-circle-outline'},
 'TB-500': {description:'A research peptide associated with thymosin beta-4 fragments; human clinical evidence is limited.',route:'No established approved route',icon:'help-circle-outline'},
 'Somatropin': {description:'A manufactured form of human growth hormone used for specific diagnosed growth-hormone disorders.',route:'Injection',icon:'medical-outline'},
 'Testosterone Cypionate': {description:'A long-acting testosterone ester used in prescribed testosterone replacement in some countries.',route:'Injection',icon:'medical-outline'},
 'Testosterone Enanthate': {description:'A testosterone ester used in certain testosterone replacement products.',route:'Injection',icon:'medical-outline'},
 'Clomiphene': {description:'A selective oestrogen receptor modulator used in fertility care; other uses may be off-label.',route:'Oral tablet',icon:'bandage-outline'},
 'Tamoxifen': {description:'A selective oestrogen receptor modulator used for certain hormone-sensitive breast cancers.',route:'Oral tablet or liquid',icon:'bandage-outline'},
 'hCG': {description:'Human chorionic gonadotropin, a hormone medicine used in certain fertility and endocrine treatments.',route:'Injection',icon:'medical-outline'},
 'Levothyroxine': {description:'Synthetic T4 thyroid hormone used to replace low thyroid hormone levels, including in hypothyroidism.',route:'Usually oral tablet',icon:'bandage-outline'},
 'Liothyronine': {description:'Synthetic T3 thyroid hormone used for selected thyroid conditions under medical supervision.',route:'Usually oral tablet',icon:'bandage-outline'},
 'Metformin': {description:'A medicine that helps lower blood glucose, commonly prescribed for type 2 diabetes.',route:'Oral tablet or liquid',icon:'bandage-outline'},
 'Insulin Aspart': {description:'A rapid-acting insulin used to manage blood glucose in diabetes.',route:'Injection or insulin pump',icon:'medical-outline'},
 'Hydroxychloroquine': {description:'A medicine used for autoimmune conditions including lupus and rheumatoid arthritis.',route:'Oral tablet',icon:'bandage-outline'},
 'Mycophenolate Mofetil': {description:'An immunosuppressant used in transplant care and certain autoimmune conditions.',route:'Oral or intravenous, depending on product',icon:'bandage-outline'},
 'Salbutamol': {description:'A short-acting bronchodilator used to relieve symptoms of asthma and other airway conditions.',route:'Usually inhaler or nebuliser',icon:'water-outline'},
 'Amlodipine': {description:'A calcium-channel blocker prescribed for high blood pressure and some forms of angina.',route:'Oral tablet or liquid',icon:'bandage-outline'},
 'Sertraline': {description:'An SSRI antidepressant prescribed for depression and certain anxiety-related conditions.',route:'Oral tablet or liquid',icon:'bandage-outline'},
 'Tesamorelin': {description:'A growth-hormone-releasing factor analogue approved in some countries for a specific HIV-associated condition.',route:'Injection',icon:'medical-outline'},
 'Liraglutide': {description:'A GLP-1 receptor agonist used in some treatments for type 2 diabetes and weight management.',route:'Injection',icon:'medical-outline'},
 'Dulaglutide': {description:'A GLP-1 receptor agonist used in type 2 diabetes treatment.',route:'Injection',icon:'medical-outline'},
 'Prednisolone': {description:'A corticosteroid used to reduce inflammation in various conditions.',route:'Oral and other formulations',icon:'bandage-outline'},
 'Methotrexate': {description:'A medicine used for certain inflammatory diseases and cancers, with different treatment schedules.',route:'Oral tablet or injection',icon:'bandage-outline'},
 'Adalimumab': {description:'A biologic medicine that blocks TNF-alpha in certain inflammatory conditions.',route:'Injection',icon:'medical-outline'},
 'Omeprazole': {description:'A proton-pump inhibitor that reduces stomach acid.',route:'Oral capsule or tablet',icon:'bandage-outline'},
 'Atorvastatin': {description:'A statin medicine used to lower LDL cholesterol and reduce cardiovascular risk.',route:'Oral tablet',icon:'bandage-outline'},
 'Sildenafil': {description:'A PDE5 inhibitor prescribed for erectile dysfunction or pulmonary hypertension in different products.',route:'Usually oral tablet',icon:'bandage-outline'},
 'Tadalafil': {description:'A PDE5 inhibitor used for certain erectile, urinary and pulmonary vascular conditions.',route:'Oral tablet',icon:'bandage-outline'}
};
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
 const insets = useSafeAreaInsets();
 const {t} = useLanguage();
 const conditionName = (name:string) => t(`compound.condition.${name}` as TranslationKey);
 const infoText = (name:string, field:'description'|'route') => t(`compound.info.${name}.${field}` as TranslationKey);
 const categoryName = (name:string) => ({'Peptides':t('compound.peptides'),'TRT & Hormones':t('compound.hormones'),'PEDs & PCT':t('compound.peds'),'Medications':t('compound.medications'),'Health Conditions':t('compound.conditions'),'Manual Entry':t('compound.manual')} as Record<string,string>)[name] || name;
 const categorySubtitle = (name:string) => ({'Peptides':t('compound.subPeptides'),'TRT & Hormones':t('compound.subHormones'),'PEDs & PCT':t('compound.subPeds'),'Medications':t('compound.subMedications'),'Health Conditions':t('compound.subConditions'),'Manual Entry':t('compound.subManual')} as Record<string,string>)[name] || name;
 const [infoEntry,setInfoEntry]=useState<Entry | null>(null);
 const [category,setCategory]=useState('');
 const [condition,setCondition]=useState('');
 const [query,setQuery]=useState('');
 const [manual,setManual]=useState('');
 const reset=()=>{setCategory('');setCondition('');setQuery('');setManual('');setInfoEntry(null);};
 const exit=()=>{reset();onClose();};
 const choose=(value:string)=>{onSelect(value);exit();};
 const conditions=Array.from(new Set(entries.flatMap(e=>e.conditions??[]))).sort();
 const term=query.trim().toLowerCase();
 const results=entries.filter(e=>{
  const matches=!term || [e.name,e.aliases??'',...(e.conditions??[]),...(e.conditions??[]).map(conditionName)].some(s=>s.toLowerCase().includes(term));
  const section=!term && category && category!=='Health Conditions' ? e.tags.includes(category) : true;
  const conditionMatch=!term && condition ? e.conditions?.includes(condition) : true;
  return matches && section && conditionMatch;
 });
 return <Modal visible={visible} animationType="slide" onRequestClose={exit}>
  <View style={[styles.page,{paddingTop:Math.max(insets.top+16,40)}]}>
   <View style={styles.header}><Pressable onPress={()=>{if(condition)setCondition('');else if(category)setCategory('');else exit();}}><Ionicons name="arrow-back" size={25} color={theme.navy}/></Pressable><Text style={styles.title}>{t('compound.choose')}</Text><Pressable onPress={exit}><Text style={styles.link}>{t('compound.cancel')}</Text></Pressable></View>
   {category !== 'Manual Entry' && <TextInput style={styles.search} placeholder={t('compound.search')} value={query} onChangeText={setQuery} autoCorrect={false}/> }
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    {!category && !term ? <View style={styles.grid}>{categories.map(c=><Pressable key={c.name} style={styles.tile} onPress={()=>{if(c.name==='Manual Entry')setCategory('Manual Entry');else setCategory(c.name);}}><Ionicons name={c.icon} size={25} color={theme.teal}/><Text style={styles.tileTitle}>{categoryName(c.name)}</Text><Text style={styles.subtitle}>{categorySubtitle(c.name)}</Text></Pressable>)}</View> : null}
    {category==='Manual Entry' && !term ? <><Text style={styles.section}>{t('compound.manualTitle')}</Text><TextInput style={styles.search} value={manual} onChangeText={setManual} placeholder={t('compound.manualPlaceholder')} maxLength={100}/><Pressable style={[styles.primary,!manual.trim()&&styles.disabled]} disabled={!manual.trim()} onPress={()=>choose(manual.trim())}><Text style={styles.primaryText}>{t('compound.useName')}</Text></Pressable></> : null}
    {category==='Health Conditions' && !condition && !term ? <><Text style={styles.section}>{t('compound.browseCondition')}</Text>{conditions.map(name=><Pressable key={name} style={styles.result} onPress={()=>setCondition(name)}><Text style={styles.resultName}>{conditionName(name)}</Text><Ionicons name="chevron-forward" size={18} color={theme.slate}/></Pressable>)}</> : null}
    {(!!term || (!!category && category!=='Manual Entry' && category!=='Health Conditions') || !!condition) ? <><Text style={styles.section}>{term?t('compound.results'):(condition ? conditionName(condition) : categoryName(category))}</Text><Text style={styles.note}>{t('compound.note')}</Text>{results.map(e=><Pressable key={e.name} style={styles.result} onPress={()=>choose(e.name)}><View style={{flex:1}}><Text style={styles.resultName}>{e.name}</Text><Text style={styles.subtitle}>{e.tags.map(categoryName).join(' · ')}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={t('compound.info') + e.name} hitSlop={8} onPress={(event)=>{event.stopPropagation();setInfoEntry(e);}} style={styles.infoButton}><Ionicons name="information-circle-outline" size={25} color={theme.slate}/></Pressable><Ionicons name="add-circle-outline" size={24} color={theme.teal}/></Pressable>)}{results.length===0&&<Text style={styles.note}>{t('compound.empty')}</Text>}</> : null}
    {(!!term || category && category!=='Manual Entry') && <Pressable style={styles.manualLink} onPress={()=>{setCategory('Manual Entry');setQuery('');setCondition('');setManual(query);}}><Ionicons name="create-outline" size={20} color={theme.teal}/><Text style={styles.link}>{t('compound.manualLink')}</Text></Pressable>}
    <Text style={styles.footer}>{t('compound.footer')}</Text>
   </ScrollView>
  </View>
  <Modal visible={!!infoEntry} transparent animationType="fade" onRequestClose={()=>setInfoEntry(null)}><View style={styles.infoBackdrop}><View style={styles.infoSheet}><View style={styles.infoHeader}><Text style={styles.section}>{infoEntry?.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('compound.closeInfo')} onPress={()=>setInfoEntry(null)}><Ionicons name="close" size={26} color={theme.navy}/></Pressable></View><Text style={styles.note}>{infoEntry && (compoundInfo[infoEntry.name] ? infoText(infoEntry.name, 'description') : t('compound.unknown'))}</Text><View style={styles.routeRow}><Ionicons name={infoEntry ? (compoundInfo[infoEntry.name]?.icon || 'help-circle-outline') : 'help-circle-outline'} size={22} color={theme.teal}/><Text style={styles.subtitle}>{infoEntry && (compoundInfo[infoEntry.name] ? infoText(infoEntry.name, 'route') : t('compound.routeUnknown'))}</Text></View><Text style={styles.footer}>{t('compound.infoFooter')}</Text><Pressable style={styles.primary} onPress={()=>setInfoEntry(null)}><Text style={styles.primaryText}>{t('compound.close')}</Text></Pressable></View></View></Modal>
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
 infoButton:{padding:8,marginRight:2},infoBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.55)',justifyContent:'center',padding:24},infoSheet:{backgroundColor:theme.background,borderRadius:18,padding:22},infoHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},routeRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:14},
 disabled:{opacity:0.4},footer:{color:theme.muted,fontSize:12,lineHeight:18,marginTop:22},
});