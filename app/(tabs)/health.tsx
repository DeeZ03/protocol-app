import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';

const KEY = 'protocol-app:health-measurements:v1';
const MARKERS = [
 {key:'weight',name:'Weight',unit:'kg',hint:'e.g. 78.5'},
 {key:'systolic',name:'Blood pressure (systolic)',unit:'mmHg',hint:'e.g. 120'},
 {key:'diastolic',name:'Blood pressure (diastolic)',unit:'mmHg',hint:'e.g. 80'},
 {key:'heart',name:'Resting heart rate',unit:'bpm',hint:'e.g. 65'},
] as const;
type Marker = typeof MARKERS[number]['key'];
type RecordItem = {id:string;marker:Marker;value:number;date:string;note:string};
const dateKey=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const titleFor=(key:Marker)=>MARKERS.find(m=>m.key===key)!;
export default function Health(){
 const insets=useSafeAreaInsets();
 const [items,setItems]=useState<RecordItem[]>([]);
 const [visible,setVisible]=useState(false);
 const [marker,setMarker]=useState<Marker>('weight');
 const [value,setValue]=useState('');
 const [note,setNote]=useState('');
 const [saving,setSaving]=useState(false);
 const load=useCallback(async()=>{try{const raw=await AsyncStorage.getItem(KEY);const data=raw?JSON.parse(raw):[];setItems(Array.isArray(data)?data:[]);}catch{Alert.alert('Unable to load','Please try opening Health again.');}},[]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 const save=async()=>{
  const num=Number(value.trim().replace(',','.'));
  if(!Number.isFinite(num)||num<=0||num>10000){Alert.alert('Check measurement','Enter a valid positive number.');return;}
  setSaving(true);
  try{const next=[{id:Date.now().toString()+'-'+Math.random().toString(36).slice(2),marker,value:num,date:dateKey(new Date()),note:note.trim()},...items];await AsyncStorage.setItem(KEY,JSON.stringify(next));setItems(next);setVisible(false);setValue('');setNote('');}
  catch{Alert.alert('Could not save','Your entry was not saved.');}finally{setSaving(false);}
 };
 const remove=(entry:RecordItem)=>Alert.alert('Delete measurement?','This entry will be removed from this device.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{const next=items.filter(i=>i.id!==entry.id);await AsyncStorage.setItem(KEY,JSON.stringify(next));setItems(next);}catch{Alert.alert('Could not delete','Please try again.');}}}]);
 return <View style={styles.screen}>
  <FlatList data={[...items].sort((a,b)=>b.date.localeCompare(a.date))} keyExtractor={i=>i.id} contentContainerStyle={styles.content}
   ListHeaderComponent={<>
    <View style={styles.top}><View><Text style={styles.eyebrow}>YOUR HEALTH</Text><Text style={styles.heading}>Health</Text></View><Pressable accessibilityRole="button" onPress={()=>setVisible(true)} style={styles.add}><Text style={styles.addText}>+ Add</Text></Pressable></View>
    <Text style={styles.intro}>Record measurements and follow your changes over time.</Text>
    <View style={styles.grid}>{MARKERS.map(m=>{const latest=items.filter(i=>i.marker===m.key).sort((a,b)=>b.date.localeCompare(a.date))[0];return <View key={m.key} style={styles.tile}><Text style={styles.tileTitle}>{m.name}</Text><Text style={styles.tileValue}>{latest?latest.value:'—'} <Text style={styles.unit}>{latest?m.unit:''}</Text></Text><Text style={styles.small}>{latest?latest.date:'No entries yet'}</Text></View>})}</View>
    <Text style={styles.section}>Measurement history</Text>
   </>}
   ListEmptyComponent={<View style={styles.empty}><Text style={styles.small}>No measurements recorded yet. Tap + Add to begin.</Text></View>}
   renderItem={({item})=>{const m=titleFor(item.marker);return <View style={styles.entry}><View style={{flex:1}}><Text style={styles.entryTitle}>{m.name}: {item.value} {m.unit}</Text><Text style={styles.small}>{item.date}</Text>{!!item.note&&<Text style={styles.note}>{item.note}</Text>}</View><Pressable accessibilityRole="button" accessibilityLabel={'Delete '+m.name+' measurement'} onPress={()=>remove(item)}><Text style={styles.delete}>Delete</Text></Pressable></View>}}
   ListFooterComponent={<Text style={styles.footer}>Personal records only. These measurements are stored locally on this device and are not medical advice. They are not backed up or synced.</Text>}/>
  <Modal visible={visible} animationType="slide" onRequestClose={()=>setVisible(false)}>
   <View style={[styles.modal,{paddingTop:Math.max(insets.top+16,28),paddingBottom:Math.max(insets.bottom,16)}]}>
    <View style={styles.modalHeader}><Text style={styles.heading}>Add measurement</Text><Pressable onPress={()=>setVisible(false)}><Text style={styles.cancel}>Cancel</Text></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:30}}>
     <Text style={styles.label}>Measurement</Text><View style={styles.options}>{MARKERS.map(m=><Pressable key={m.key} onPress={()=>{setMarker(m.key);setValue('');}} style={[styles.option,marker===m.key&&styles.selected]}><Text style={[styles.optionText,marker===m.key&&styles.selectedText]}>{m.name}</Text></Pressable>)}</View>
     <Text style={styles.label}>Value ({titleFor(marker).unit})</Text><TextInput keyboardType="decimal-pad" placeholder={titleFor(marker).hint} value={value} onChangeText={setValue} style={styles.input}/>
     <Text style={styles.label}>Notes (optional)</Text><TextInput multiline placeholder="Add context for this reading" value={note} onChangeText={setNote} style={[styles.input,{minHeight:100,textAlignVertical:'top'}]}/>
     <Pressable disabled={saving} onPress={()=>void save()} style={styles.save}><Text style={styles.saveText}>{saving?'Saving…':'Save measurement'}</Text></Pressable>
    </ScrollView>
   </View>
  </Modal>
 </View>;
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:theme.background},content:{padding:20,paddingBottom:38},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{color:theme.teal,fontSize:12,fontWeight:'800',letterSpacing:1.5},heading:{color:theme.navy,fontSize:27,fontWeight:'800'},add:{backgroundColor:theme.navy,paddingHorizontal:20,paddingVertical:14,borderRadius:12},addText:{color:'white',fontWeight:'800'},intro:{color:theme.slate,marginTop:16,marginBottom:18,fontSize:15},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:12},tile:{backgroundColor:'white',borderColor:theme.border,borderWidth:1,borderRadius:14,padding:16,width:'48%',minHeight:122},tileTitle:{color:theme.slate,fontSize:13,fontWeight:'600'},tileValue:{color:theme.navy,fontSize:24,fontWeight:'800',marginTop:10},unit:{fontSize:12,color:theme.slate},small:{color:theme.muted,fontSize:13,marginTop:5},section:{fontSize:20,fontWeight:'800',color:theme.navy,marginTop:28,marginBottom:12},empty:{padding:24,backgroundColor:'white',borderRadius:14},entry:{flexDirection:'row',alignItems:'center',backgroundColor:'white',borderRadius:12,borderWidth:1,borderColor:theme.border,padding:16,marginBottom:10},entryTitle:{fontSize:15,fontWeight:'700',color:theme.navy},note:{color:theme.slate,marginTop:7},delete:{color:'#B42318',fontWeight:'700',padding:8},footer:{fontSize:12,color:theme.muted,marginTop:22,lineHeight:18},modal:{flex:1,backgroundColor:theme.background,paddingHorizontal:20},modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:30},cancel:{color:theme.teal,fontWeight:'700',fontSize:16},label:{fontSize:16,fontWeight:'700',color:theme.navy,marginBottom:12},options:{gap:8,marginBottom:24},option:{backgroundColor:'white',padding:14,borderRadius:12,borderWidth:1,borderColor:theme.border},selected:{backgroundColor:theme.navy,borderColor:theme.navy},optionText:{color:theme.navy,fontWeight:'600'},selectedText:{color:'white'},input:{backgroundColor:'white',borderWidth:1,borderColor:theme.border,borderRadius:12,padding:15,fontSize:17,marginBottom:24,color:theme.navy},save:{backgroundColor:theme.navy,borderRadius:12,padding:18,alignItems:'center'},saveText:{color:'white',fontWeight:'800',fontSize:16}
});
