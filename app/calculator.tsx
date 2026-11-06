import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { theme } from '../src/theme';
import { useLanguage } from '../src/i18n';

const positive = (text: string) => { const n = Number(text.replace(',', '.')); return text.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null; };
export default function Calculator() {
  const { language } = useLanguage();
  const es = language === 'es';
  const [mode,setMode] = useState<'peptide'|'solution'>('peptide');
  const [strength,setStrength] = useState('');
  const [diluent,setDiluent] = useState('');
  const [dose,setDose] = useState('');
  const [concentration,setConcentration] = useState('');
  const [monthly,setMonthly] = useState('');
  const [frequency,setFrequency] = useState('');
  const n = positive(strength), d = positive(diluent), target = positive(dose), c = positive(concentration), m = positive(monthly), f = positive(frequency);
  const peptideMl = n !== null && d !== null && target !== null ? (target * d) / (n * 1000) : null;
  const monthlyMl = c && m ? m/c : null;
  const perInjection = monthlyMl && f ? monthlyMl/f : null;
  const invalidPeptide = peptideMl !== null && peptideMl > d;
  const fmt = (value: number) => Number(value.toFixed(4)).toString();
  const field = (label: string,value:string,set:(s:string)=>void,unit:string) => <View style={styles.field}><Text style={styles.label}>{label} ({unit})</Text><TextInput keyboardType="decimal-pad" value={value} onChangeText={set} placeholder="0" style={styles.input} accessibilityLabel={label}/></View>;
  return <><Stack.Screen options={{title:es?'Calculadora':'Calculator',headerStyle:{backgroundColor:theme.navy},headerTintColor:theme.white}}/><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.heading}>{es?'Calculadora de concentraciones':'Concentration calculator'}</Text>
    <Text style={styles.hint}>{es?'Convierte cantidades prescritas a volumen. No recomienda dosis ni frecuencia.':'Convert prescribed amounts into volume. This does not recommend doses or schedules.'}</Text>
    <View style={styles.switchRow}><Pressable style={[styles.switchButton,mode==='peptide'&&styles.active]} onPress={()=>setMode('peptide')}><Text style={[styles.switchText,mode==='peptide'&&styles.activeText]}>{es?'Péptido':'Peptide'}</Text></Pressable><Pressable style={[styles.switchButton,mode==='solution'&&styles.active]} onPress={()=>setMode('solution')}><Text style={[styles.switchText,mode==='solution'&&styles.activeText]}>{es?'Solución preparada':'Ready-mixed solution'}</Text></Pressable></View>
    {mode==='peptide'?<View style={styles.card}><Text style={styles.title}>{es?'Péptido reconstituido':'Reconstituted peptide'}</Text>
      {field(es?'Cantidad total en el vial':'Total amount in vial',strength,setStrength,'mg')}
      {field(es?'Volumen de diluyente':'Diluent volume',diluent,setDiluent,'mL')}
      {field(es?'Cantidad prescrita por administración':'Prescribed amount per administration',dose,setDose,'mcg')}
      {peptideMl!==null && <View style={styles.result}><Text style={styles.resultLabel}>{es?'Volumen calculado':'Calculated volume'}</Text><Text style={styles.resultValue}>{fmt(peptideMl)} mL</Text><Text style={styles.hint}>{es?'En una jeringa U-100, equivale a':'On a U-100 syringe, equivalent to'} {fmt(peptideMl*100)} {es?'unidades':'units'}.</Text>{invalidPeptide&&<Text style={styles.warning}>{es?'La cantidad supera el contenido del vial. Revisa los datos.':'Amount exceeds the vial contents. Check the inputs.'}</Text>}</View>}
      <Text style={styles.hint}>{es?'Introduce la cantidad del vial en mg y la cantidad prescrita en mcg.':'Enter vial strength in mg and prescribed amount in mcg. Do not confuse mg and mcg.'}</Text>
    </View>:<View style={styles.card}><Text style={styles.title}>{es?'Medicamento en solución':'Ready-mixed medication'}</Text>
      {field(es?'Concentración de la etiqueta':'Label concentration',concentration,setConcentration,'mg/mL')}
      {field(es?'Cantidad mensual prescrita':'Prescribed monthly amount',monthly,setMonthly,'mg')}
      {field(es?'Número prescrito de administraciones al mes (opcional)':'Prescribed administrations per month (optional)',frequency,setFrequency,es?'veces':'times')}
      {monthlyMl!==null&&<View style={styles.result}><Text style={styles.resultLabel}>{es?'Volumen mensual':'Monthly volume'}</Text><Text style={styles.resultValue}>{fmt(monthlyMl)} mL</Text>{perInjection!==null&&<Text style={styles.resultSub}>{es?'Volumen por administración':'Volume per administration'}: {fmt(perInjection)} mL</Text>}</View>}
      <Text style={styles.hint}>{es?'Una etiqueta que solo indica mg por vial no basta: se necesita también el volumen total. Introduce mg/mL, no mg por vial.':'A label stating only mg per vial is not enough: total vial volume is also required. Enter mg/mL, not mg per vial.'}</Text>
    </View>}
    <Text style={styles.footer}>{es?'Herramienta matemática, no recomendación médica. Verifica la etiqueta, la prescripción y el tipo de jeringa con un profesional sanitario.':'Mathematical tool, not medical advice. Confirm the label, prescription and syringe type with a qualified healthcare professional.'}</Text>
  </ScrollView></>;
}
const styles=StyleSheet.create({
 page:{padding:20,paddingBottom:50,backgroundColor:theme.background,gap:16},heading:{fontSize:26,fontWeight:'800',color:theme.navy},hint:{fontSize:13,color:theme.muted,lineHeight:20},switchRow:{flexDirection:'row',gap:8},switchButton:{flex:1,borderWidth:1,borderColor:theme.border,borderRadius:12,padding:12,alignItems:'center'},active:{backgroundColor:theme.navy,borderColor:theme.navy},switchText:{color:theme.navy,fontWeight:'700',textAlign:'center'},activeText:{color:theme.white},card:{backgroundColor:theme.white,borderRadius:16,borderWidth:1,borderColor:theme.border,padding:18,gap:14},title:{fontSize:19,fontWeight:'800',color:theme.navy},field:{gap:6},label:{color:theme.navy,fontWeight:'600',fontSize:14},input:{borderWidth:1,borderColor:theme.border,borderRadius:10,padding:13,fontSize:17,color:theme.navy},result:{padding:16,backgroundColor:'#E6F7F7',borderRadius:12,gap:6},resultLabel:{color:theme.navy,fontWeight:'600'},resultValue:{color:theme.navy,fontWeight:'800',fontSize:28},resultSub:{color:theme.navy,fontWeight:'700'},warning:{color:'#B42318',fontWeight:'700'},footer:{fontSize:12,color:theme.muted,lineHeight:19}
});
