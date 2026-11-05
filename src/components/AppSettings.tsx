import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useLanguage } from '../i18n';
import { getHealthCopy } from '../healthCopy';
import { theme } from '../theme';

const UNIT_KEY = 'protocol-app:health-units:v1';

export function AppSettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const hc = getHealthCopy(language);
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
  const saveUnits = async (nextWeight: 'kg'|'lb'|'st', nextWaist: 'cm'|'in') => {
    setWeight(nextWeight);
    setWaist(nextWaist);
    try { await AsyncStorage.setItem(UNIT_KEY, JSON.stringify({ weight: nextWeight, waist: nextWaist })); }
    catch { /* Preserve on-screen selection; no measurement data is changed. */ }
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('health.done')} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.panel}>
        <View style={styles.header}><Text style={styles.heading}>{t('health.settings')}</Text><Pressable onPress={onClose}><Text style={styles.done}>{t('health.done')}</Text></Pressable></View>
        <Text style={styles.label}>{t('health.weight')}</Text>
        <View style={styles.row}>{(['kg','lb','st'] as const).map(unit=><Pressable key={unit} onPress={()=>void saveUnits(unit,waist)} style={[styles.choice,weight===unit&&styles.selected]}><Text style={[styles.optionText,weight===unit&&styles.selectedText]}>{unit==='st'?'st & lb':unit}</Text></Pressable>)}</View>
        <Text style={styles.label}>{t('health.waist')}</Text>
        <View style={styles.row}>{(['cm','in'] as const).map(unit=><Pressable key={unit} onPress={()=>void saveUnits(weight,unit)} style={[styles.choice,waist===unit&&styles.selected]}><Text style={[styles.optionText,waist===unit&&styles.selectedText]}>{unit==='in'?t('health.inches'):'cm'}</Text></Pressable>)}</View>
        <Text style={styles.hint}>{hc.unitExplanation}</Text>
        <Text style={styles.label}>{t('settings.language')}</Text>
        <View style={styles.row}>{([{code:'en-GB',label:'English (UK)'},{code:'es',label:'Español'}] as const).map(option=><Pressable key={option.code} onPress={()=>void setLanguage(option.code)} style={[styles.choice,language===option.code&&styles.selected]}><Text style={[styles.optionText,language===option.code&&styles.selectedText]}>{option.label}</Text></Pressable>)}</View>
        <Text style={styles.hint}>{t('settings.languageHint')}</Text>
      </View>
    </View>
  </Modal>;
}
const styles=StyleSheet.create({
  overlay:{flex:1,justifyContent:'center',paddingHorizontal:20,backgroundColor:'rgba(0,0,0,0.55)'},
  panel:{backgroundColor:theme.background,borderRadius:22,padding:20},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:28},
  heading:{fontSize:27,fontWeight:'800',color:theme.navy},done:{color:theme.teal,fontSize:16,fontWeight:'700'},
  label:{fontSize:16,fontWeight:'700',color:theme.navy,marginBottom:12},
  row:{flexDirection:'row',gap:8,marginBottom:24},
  choice:{flex:1,borderRadius:12,borderWidth:1,borderColor:theme.border,paddingVertical:16,alignItems:'center'},
  selected:{backgroundColor:theme.navy,borderColor:theme.navy},
  optionText:{color:theme.navy,fontWeight:'700'},selectedText:{color:'white'},
  hint:{color:theme.muted,fontSize:13,marginBottom:18,lineHeight:19}
});
