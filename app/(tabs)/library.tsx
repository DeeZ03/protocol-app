import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../src/theme';
import { useScreenStyles } from '../../src/darkStyles';
import { useLanguage } from '../../src/i18n';

export default function Library() {
  const styles = useScreenStyles(baseStyles);
  const router = useRouter();
  const { language } = useLanguage();
  const es = language === 'es';
  return <View style={styles.page}>
    <Text style={styles.title}>{es?'Biblioteca y herramientas':'Library & tools'}</Text>
    <Pressable accessibilityRole="button" onPress={()=>router.push('/calculator')} style={styles.card}>
      <Text style={styles.cardTitle}>{es?'Calculadora de dosis y volumen':'Dose & volume calculator'} ›</Text>
      <Text style={styles.desc}>{es?'Péptidos reconstituidos y medicamentos en solución preparada.':'Reconstituted peptides and ready-mixed medication volume calculations.'}</Text>
    </Pressable>
    <Text style={styles.desc}>{es?'Biblioteca de compuestos en desarrollo.':'Compound reference library coming later.'}</Text>
  </View>;
}
const baseStyles=StyleSheet.create({page:{flex:1,backgroundColor:theme.background,padding:20,gap:16},title:{fontSize:24,fontWeight:'800',color:theme.navy},card:{backgroundColor:theme.white,borderColor:theme.border,borderWidth:1,borderRadius:16,padding:18,gap:8},cardTitle:{fontSize:18,fontWeight:'700',color:theme.navy},desc:{fontSize:14,color:theme.muted,lineHeight:21}});
