import { useCallback, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useLanguage } from '../i18n';
import { getHealthCopy } from '../healthCopy';
import { theme } from '../theme';
import { useAppearance } from '../appearance';
import * as ImagePicker from 'expo-image-picker';
export const PROFILE_KEY = 'protocol-app:profile:v1';
export type LocalProfile = { username: string; avatarUri?: string };

const UNIT_KEY = 'protocol-app:health-units:v1';

export function AppSettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const hc = getHealthCopy(language);
  const {dark,setDark} = useAppearance();
  const [profile, setProfile] = useState<LocalProfile>({ username: '' });
  const [weight, setWeight] = useState<'kg'|'lb'|'st'>('kg');
  const [waist, setWaist] = useState<'cm'|'in'>('cm');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(UNIT_KEY);
      if (!raw) return;
      const value = JSON.parse(raw);
      if (['kg', 'lb', 'st'].includes(value.weight)) setWeight(value.weight);
      if (['cm', 'in'].includes(value.waist)) setWaist(value.waist);
    } catch { /* Keep safe default units when preferences cannot be read. */ }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useFocusEffect(useCallback(() => { let active=true; AsyncStorage.getItem(PROFILE_KEY).then(raw=>{if(active && raw){const value=JSON.parse(raw) as LocalProfile;setProfile(value);}}).catch(()=>{});return ()=>{active=false;}; }, []));
  const saveProfile = async (next: LocalProfile) => { try { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next)); setProfile(next); } catch { Alert.alert(t('settings.profileSaveError')); } };
  const choosePhoto = async () => { try { const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.3,base64:true});if(!result.canceled && result.assets[0]?.base64) await saveProfile({...profile,avatarUri:'data:image/jpeg;base64,'+result.assets[0].base64}); } catch { Alert.alert(t('settings.profilePhotoError')); } };
  const saveUnits = async (nextWeight: 'kg'|'lb'|'st', nextWaist: 'cm'|'in') => {
    setWeight(nextWeight);
    setWaist(nextWaist);
    try { await AsyncStorage.setItem(UNIT_KEY, JSON.stringify({ weight: nextWeight, waist: nextWaist })); }
    catch { /* Preserve on-screen selection; no measurement data is changed. */ }
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('health.done')} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.panel,dark&&{backgroundColor:'#111827'}]}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.panelContent}>
        <View style={styles.header}><Text style={[styles.heading,dark&&{color:'#F7FAFF'}]}>{t('health.settings')}</Text><Pressable onPress={onClose}><Text style={styles.done}>{t('health.done')}</Text></Pressable></View>
        <Text style={[styles.label,dark&&{color:'#F7FAFF'}]}>{t('settings.profile')}</Text>
        <View style={styles.profileRow}><Pressable accessibilityRole="button" accessibilityLabel={t('settings.changePhoto')} onPress={()=>void choosePhoto()} style={styles.avatar}>{profile.avatarUri?<Image source={{uri:profile.avatarUri}} style={styles.avatarImage}/>:<Text style={styles.avatarLetters}>{(profile.username.trim().slice(0,2)||'P').toUpperCase()}</Text>}</Pressable><View style={{flex:1}}><Text style={[styles.hint,dark&&{color:'#A5B4C9'}]}>{t('settings.changePhoto')}</Text><TextInput accessibilityLabel={t('settings.username')} placeholder={t('settings.usernamePlaceholder')} value={profile.username} onChangeText={username=>setProfile({...profile,username})} maxLength={30} autoCapitalize="none" style={[styles.usernameInput,dark&&{backgroundColor:'#1A2438',color:'#F7FAFF',borderColor:'#35435C'}]}/></View></View>
        <Pressable accessibilityRole="button" style={styles.profileSave} onPress={()=>void saveProfile({...profile,username:profile.username.trim()})}><Text style={styles.profileSaveText}>{t('settings.saveProfile')}</Text></Pressable>
        <Text style={styles.label}>{t('health.weight')}</Text>
        <View style={styles.row}>{(['kg','lb','st'] as const).map(unit=><Pressable key={unit} onPress={()=>void saveUnits(unit,waist)} style={[styles.choice,weight===unit&&styles.selected]}><Text style={[styles.optionText,weight===unit&&styles.selectedText]}>{unit==='st'?'st & lb':unit}</Text></Pressable>)}</View>
        <Text style={styles.label}>{t('health.waist')}</Text>
        <View style={styles.row}>{(['cm','in'] as const).map(unit=><Pressable key={unit} onPress={()=>void saveUnits(weight,unit)} style={[styles.choice,waist===unit&&styles.selected]}><Text style={[styles.optionText,waist===unit&&styles.selectedText]}>{unit==='in'?t('health.inches'):'cm'}</Text></Pressable>)}</View>
        <Text style={styles.hint}>{hc.unitExplanation}</Text>
        <Text style={[styles.label,dark&&{color:'#F7FAFF'}]}>{language==='es'?'Apariencia':'Appearance'}</Text>
        <View style={styles.row}>{([{value:false,en:'Light',es:'Claro'},{value:true,en:'Dark',es:'Oscuro'}] as const).map(option=><Pressable key={String(option.value)} accessibilityRole="button" accessibilityState={{selected:dark===option.value}} onPress={()=>void setDark(option.value)} style={[styles.choice,dark===option.value&&styles.selected]}><Text style={[styles.optionText,dark&&{color:'#F7FAFF'},dark===option.value&&styles.selectedText]}>{language==='es'?option.es:option.en}</Text></Pressable>)}</View>
        <Text style={styles.label}>{t('settings.language')}</Text>
        <View style={styles.row}>{([{code:'en-GB',label:'English (UK)'},{code:'es',label:'Español'}] as const).map(option=><Pressable key={option.code} onPress={()=>void setLanguage(option.code)} style={[styles.choice,language===option.code&&styles.selected]}><Text style={[styles.optionText,language===option.code&&styles.selectedText]}>{option.label}</Text></Pressable>)}</View>
        <Text style={styles.hint}>{t('settings.languageHint')}</Text>
      </ScrollView></View>
    </View>
  </Modal>;
}
const styles=StyleSheet.create({
  overlay:{flex:1,justifyContent:'center',paddingHorizontal:20,backgroundColor:'rgba(0,0,0,0.55)'},
  panel:{backgroundColor:theme.background,borderRadius:22,maxHeight:'85%'},
  panelContent:{padding:20},
  profileRow:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:12},
  avatar:{width:64,height:64,borderRadius:32,borderWidth:2,borderColor:theme.teal,alignItems:'center',justifyContent:'center',overflow:'hidden',backgroundColor:theme.navy},
  avatarImage:{width:64,height:64},avatarLetters:{color:theme.white,fontSize:22,fontWeight:'800'},
  usernameInput:{borderWidth:1,borderColor:theme.border,borderRadius:10,padding:10,color:theme.navy,backgroundColor:theme.white},
  profileSave:{backgroundColor:theme.navy,padding:12,borderRadius:10,alignItems:'center',marginBottom:24},profileSaveText:{color:theme.white,fontWeight:'700'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:28},
  heading:{fontSize:27,fontWeight:'800',color:theme.navy},done:{color:theme.teal,fontSize:16,fontWeight:'700'},
  label:{fontSize:16,fontWeight:'700',color:theme.navy,marginBottom:12},
  row:{flexDirection:'row',gap:8,marginBottom:24},
  choice:{flex:1,borderRadius:12,borderWidth:1,borderColor:theme.border,paddingVertical:16,alignItems:'center'},
  selected:{backgroundColor:theme.navy,borderColor:theme.navy},
  optionText:{color:theme.navy,fontWeight:'700'},selectedText:{color:'white'},
  hint:{color:theme.muted,fontSize:13,marginBottom:18,lineHeight:19}
});
