import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Modal } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../src/theme';
import { useLanguage } from '../src/i18n';

const positive = (text: string) => { const n = Number(text.replace(',', '.')); return text.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null; };
export default function Calculator() {
  const router = useRouter();
  const [pickerOpen,setPickerOpen] = useState(false);
  const [savedProtocols,setSavedProtocols] = useState<{id:string;name:string;calculation?:string}[]>([]);
  const [savingTo,setSavingTo] = useState<string|null>(null);
  const { language } = useLanguage();
  const es = language === 'es';
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode,setMode] = useState<'peptide'|'solution'>(params.mode === 'solution' ? 'solution' : 'peptide');
  const [strength,setStrength] = useState('');
  const [diluent,setDiluent] = useState('');
  const [dose,setDose] = useState('');
  const [concentration,setConcentration] = useState('');
  const [monthly,setMonthly] = useState('');
  const [frequency,setFrequency] = useState('');
  const [syringe,setSyringe] = useState<'0.3'|'0.5'|'1'>('1');
  const n = positive(strength), d = positive(diluent), target = positive(dose), c = positive(concentration), m = positive(monthly), f = positive(frequency);
  const peptideMl = n !== null && d !== null && target !== null ? (target * d) / (n * 1000) : null;
  const peptideConcentration = n !== null && d !== null ? n / d : null;
  const peptideDoses = n !== null && target !== null ? (n * 1000) / target : null;
  const monthlyMl = c && m ? m/c : null;
  const perInjection = monthlyMl && f ? monthlyMl/f : null;
  const displayMl = mode === 'peptide' ? peptideMl : perInjection;
  const syringeCapacity = Number(syringe);
  const syringeFraction = displayMl !== null ? Math.min(1, Math.max(0, displayMl / syringeCapacity)) : 0;
  const invalidPeptide = peptideMl !== null && d !== null && peptideMl > d;
  const validResult = mode === 'peptide' ? peptideMl !== null && !invalidPeptide : perInjection !== null;
  const summary = mode === 'peptide'
    ? `Peptide · vial ${strength} mg · diluent ${diluent} mL · prescribed ${dose} mcg · calculated ${peptideMl !== null ? peptideMl.toPrecision(8) : ''} mL`
    : `Ready-mixed · ${concentration} mg/mL · ${monthly} mg/month · ${frequency} administrations/month · calculated ${perInjection !== null ? perInjection.toPrecision(8) : ''} mL/administration`;
  const chooseExisting = async () => {
    try {
      const raw = await AsyncStorage.getItem('protocol-app:test-protocols:v1');
      const records = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(records)) throw new Error('Invalid protocol data');
      setSavedProtocols(records.filter((v): v is {id:string;name:string;calculation?:string} => typeof v?.id === 'string' && typeof v?.name === 'string'));
      setPickerOpen(true);
    } catch { Alert.alert(es?'Error':'Error',es?'No se pudieron cargar los protocolos.':'Could not load saved protocols.'); }
  };
  const saveExisting = async (id:string) => {
    if (savingTo) return;
    setSavingTo(id);
    try {
      const raw = await AsyncStorage.getItem('protocol-app:test-protocols:v1');
      const records = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(records) || !records.some(v=>v?.id===id)) throw new Error('Missing protocol');
      const next = records.map(v=>v.id===id?{...v,calculation:summary}:v);
      await AsyncStorage.setItem('protocol-app:test-protocols:v1',JSON.stringify(next));
      setPickerOpen(false);
      Alert.alert(es?'Guardado':'Saved',es?'Cálculo añadido al protocolo.':'Calculation added to protocol.');
    } catch { Alert.alert(es?'Error':'Error',es?'No se pudo guardar el cálculo.':'Could not save the calculation.'); }
    finally { setSavingTo(null); }
  };
  const fmt = (value: number) => Number(value.toFixed(4)).toString();
  const preciseVolume = (value: number) => value > 0 && value < 0.0001 ? '<0.0001' : fmt(value);
  const tinyVolume = displayMl !== null && displayMl > 0 && displayMl < 0.001;
  const field = (label: string,value:string,set:(s:string)=>void,unit:string) => <View style={styles.field}><Text style={styles.label}>{label} ({unit})</Text><TextInput keyboardType="decimal-pad" value={value} onChangeText={set} placeholder="0" style={styles.input} accessibilityLabel={label}/></View>;
  return <><Stack.Screen options={{title:es?'Calculadora':'Calculator',headerStyle:{backgroundColor:theme.navy},headerTintColor:theme.white}}/><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.heading}>{es?'Calculadora de concentraciones':'Concentration calculator'}</Text>
    <Text style={styles.hint}>{es?'Convierte cantidades prescritas a volumen. No recomienda dosis ni frecuencia.':'Convert prescribed amounts into volume. This does not recommend doses or schedules.'}</Text>
    <View style={styles.switchRow}><Pressable style={[styles.switchButton,mode==='peptide'&&styles.active]} onPress={()=>setMode('peptide')}><Text style={[styles.switchText,mode==='peptide'&&styles.activeText]}>{es?'Péptido':'Peptide'}</Text></Pressable><Pressable style={[styles.switchButton,mode==='solution'&&styles.active]} onPress={()=>setMode('solution')}><Text style={[styles.switchText,mode==='solution'&&styles.activeText]}>{es?'Solución preparada':'Ready-mixed solution'}</Text></Pressable></View>
    {mode==='peptide'?<View style={styles.card}><Text style={styles.title}>{es?'Péptido reconstituido':'Reconstituted peptide'}</Text>
      <Text style={styles.label}>{es?'Cantidad del vial':'Vial amount'} · {es?'selección rápida':'quick select'}</Text>
      <View style={styles.presetRow}>{['5','10','15'].map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:strength===value}} style={[styles.preset, strength===value&&styles.active]} onPress={()=>setStrength(value)}><Text style={[styles.presetText,strength===value&&styles.activeText]}>{value} mg</Text></Pressable>)}</View>
      {field(es?'Cantidad total en el vial':'Total amount in vial',strength,setStrength,'mg')}
      <Text style={styles.label}>{es?'Diluyente':'Diluent'} · {es?'selección rápida':'quick select'}</Text>
      <View style={styles.presetRow}>{['1','2','3','5'].map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:diluent===value}} style={[styles.preset,diluent===value&&styles.active]} onPress={()=>setDiluent(value)}><Text style={[styles.presetText,diluent===value&&styles.activeText]}>{value} mL</Text></Pressable>)}</View>
      {field(es?'Volumen de diluyente':'Diluent volume',diluent,setDiluent,'mL')}
      {field(es?'Cantidad prescrita por administración':'Prescribed amount per administration',dose,setDose,'mcg')}
      {peptideConcentration !== null && <View style={styles.volumeSummary}>
        <View style={styles.volumeMetric}><Text style={styles.metricLabel}>{es?'CONCENTRACIÓN':'CONCENTRATION'}</Text><Text style={styles.metricValue}>{fmt(peptideConcentration)} <Text style={styles.metricUnit}>mg/mL</Text></Text></View>
        {peptideDoses !== null && <View style={styles.volumeMetric}><Text style={styles.metricLabel}>{es?'DOSIS TEÓRICAS':'THEORETICAL DOSES'}</Text><Text style={styles.metricValue}>{fmt(peptideDoses)}</Text></View>}
      </View>}
      {peptideMl!==null && <View style={styles.result}><Text style={styles.resultLabel}>{es?'Volumen calculado':'Calculated volume'}</Text><Text style={styles.resultValue}>{preciseVolume(peptideMl)} mL</Text><Text style={styles.hint}>{es?'En una jeringa U-100, equivale a':'On a U-100 syringe, equivalent to'} {fmt(peptideMl*100)} {es?'unidades':'units'}.</Text>{invalidPeptide&&<Text style={styles.warning}>{es?'La cantidad supera el contenido del vial. Revisa los datos.':'Amount exceeds the vial contents. Check the inputs.'}</Text>}</View>}
      {peptideDoses !== null && <Text style={styles.hint}>{es?'El número teórico de dosis no tiene en cuenta pérdidas de preparación ni volumen residual.':'Theoretical dose count does not account for preparation losses or residual volume.'}</Text>}
      <Text style={styles.hint}>{es?'Introduce la cantidad del vial en mg y la cantidad prescrita en mcg.':'Enter vial strength in mg and prescribed amount in mcg. Do not confuse mg and mcg.'}</Text>
    </View>:<View style={styles.card}><Text style={styles.title}>{es?'Medicamento en solución':'Ready-mixed medication'}</Text>
      {field(es?'Concentración de la etiqueta':'Label concentration',concentration,setConcentration,'mg/mL')}
      {field(es?'Cantidad mensual prescrita':'Prescribed monthly amount',monthly,setMonthly,'mg')}
      {field(es?'Número prescrito de administraciones al mes (opcional)':'Prescribed administrations per month (optional)',frequency,setFrequency,es?'veces':'times')}
      {monthlyMl!==null&&<View style={styles.result}><Text style={styles.resultLabel}>{es?'Volumen mensual':'Monthly volume'}</Text><Text style={styles.resultValue}>{fmt(monthlyMl)} mL</Text>{perInjection!==null&&<Text style={styles.resultSub}>{es?'Volumen por administración':'Volume per administration'}: {preciseVolume(perInjection)} mL</Text>}</View>}
      <Text style={styles.hint}>{es?'Una etiqueta que solo indica mg por vial no basta: se necesita también el volumen total. Introduce mg/mL, no mg por vial.':'A label stating only mg per vial is not enough: total vial volume is also required. Enter mg/mL, not mg per vial.'}</Text>
    </View>}
    {displayMl !== null && displayMl > 0 && <View style={styles.card}>
      <Text style={styles.title}>{es?'Guía visual de volumen':'Volume visual guide'}</Text>
      <Text style={styles.hint}>{es?'Selecciona la capacidad de la jeringa para comparar el volumen calculado.':'Select syringe capacity to compare the calculated volume.'}</Text>
      <View style={styles.switchRow}>{(['0.3','0.5','1'] as const).map(v=><Pressable key={v} accessibilityRole="button" accessibilityState={{selected:syringe===v}} style={[styles.switchButton,syringe===v&&styles.active]} onPress={()=>setSyringe(v)}><Text style={[styles.switchText,syringe===v&&styles.activeText]}>{v} mL</Text></Pressable>)}</View>
      <View style={styles.volumeSummary}>
        <View style={styles.volumeMetric}><Text style={styles.metricLabel}>{es?'VOLUMEN':'VOLUME'}</Text><Text style={styles.metricValue}>{preciseVolume(displayMl)} <Text style={styles.metricUnit}>mL</Text></Text></View>
        <View style={styles.volumeMetric}><Text style={styles.metricLabel}>{es?'EQUIVALENTE U-100':'U-100 EQUIVALENT'}</Text><Text style={styles.metricValue}>{preciseVolume(displayMl*100)} <Text style={styles.metricUnit}>{es?'unidades':'units'}</Text></Text></View>
      </View>
      <View style={styles.syringeTrack}><View style={[styles.syringeFill,{width:`${syringeFraction*100}%` as const}]}/></View>
      <View style={styles.tickRow}>{Array.from({length:11},(_,i)=><View key={i} style={styles.tick}/>)}</View>
      <View style={styles.scaleRow}><Text style={styles.scaleText}>0 mL</Text><Text style={styles.scaleText}>{fmt(syringeCapacity/2)} mL</Text><Text style={styles.scaleText}>{syringe} mL</Text></View>
      <Text style={styles.hint}>{es?'El equivalente en unidades solo corresponde a jeringas U-100.':'The units equivalent applies only to U-100 syringes.'}</Text>
      {tinyVolume&&<Text style={styles.warning}>{es?'El volumen calculado es muy pequeño. No redondees a cero; confirma que puede medirse con precisión antes de usarlo.':'Calculated volume is very small. Do not round to zero; confirm it can be measured accurately before use.'}</Text>}
      {displayMl>syringeCapacity&&<Text style={styles.warning}>{es?'El volumen supera la capacidad seleccionada.':'Volume exceeds selected syringe capacity.'}</Text>}
      <Text style={styles.hint}>{es?'Esquema orientativo, no una imagen de graduaciones reales. Comprueba la escala de tu jeringa.':'Illustrative bar, not actual syringe graduations. Verify the scale on your syringe.'}</Text>
    </View>}
    {validResult && <View style={styles.card}>
      <Text style={styles.title}>{es?'Guardar en protocolos':'Save to protocols'}</Text>
      <Text style={styles.hint}>{es?'Revisa los datos antes de guardarlos. Guardar no cambia la pauta ni los recordatorios.':'Review the inputs before saving. Saving does not change schedules or reminders.'}</Text>
      <Pressable style={styles.saveAction} onPress={()=>router.push({pathname:'/(tabs)/protocols',params:{calculation:summary}})}><Text style={styles.saveActionText}>{es?'Añadir a protocolo nuevo':'Add to new protocol'}</Text></Pressable>
      <Pressable style={styles.outlineAction} onPress={chooseExisting}><Text style={styles.outlineActionText}>{es?'Añadir a protocolo existente':'Add to existing protocol'}</Text></Pressable>
    </View>}
    <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={()=>setPickerOpen(false)}><View style={styles.overlay}><Pressable style={StyleSheet.absoluteFill} onPress={()=>setPickerOpen(false)}/><View style={styles.picker}>
      <Text style={styles.title}>{es?'Seleccionar protocolo':'Select a protocol'}</Text>
      <Text style={styles.hint}>{es?'Se reemplazará cualquier cálculo anterior del protocolo seleccionado.':'Any previous calculation on the selected protocol will be replaced.'}</Text>
      <ScrollView style={{maxHeight:320}}>{savedProtocols.map(p=><Pressable key={p.id} style={styles.protocolChoice} disabled={!!savingTo} onPress={()=>Alert.alert(es?'Confirmar':'Confirm',es?`¿Guardar el cálculo en "${p.name}"?`:`Save calculation to "${p.name}"?`,[{text:es?'Cancelar':'Cancel',style:'cancel'},{text:es?'Guardar':'Save',onPress:()=>saveExisting(p.id)}])}><Text style={styles.outlineActionText}>{p.name}</Text></Pressable>)}</ScrollView>
      {savedProtocols.length===0&&<Text style={styles.hint}>{es?'No hay protocolos guardados.':'No saved protocols yet.'}</Text>}
      <Pressable onPress={()=>setPickerOpen(false)}><Text style={styles.outlineActionText}>{es?'Cancelar':'Cancel'}</Text></Pressable>
    </View></View></Modal>
    <Text style={styles.footer}>{es?'Herramienta matemática, no recomendación médica. Verifica la etiqueta, la prescripción y el tipo de jeringa con un profesional sanitario.':'Mathematical tool, not medical advice. Confirm the label, prescription and syringe type with a qualified healthcare professional.'}</Text>
  </ScrollView></>;
}
const styles=StyleSheet.create({
 volumeSummary:{flexDirection:'row',gap:10,marginVertical:12},volumeMetric:{flex:1,padding:12,borderWidth:1,borderColor:theme.border,borderRadius:12,backgroundColor:'#F5F9FB'},metricLabel:{fontSize:10,fontWeight:'700',color:theme.slate,letterSpacing:0.5},metricValue:{fontSize:22,fontWeight:'800',color:theme.navy,marginTop:6},metricUnit:{fontSize:12,fontWeight:'600'},tickRow:{flexDirection:'row',justifyContent:'space-between',marginTop:5},tick:{width:1,height:9,backgroundColor:theme.slate},
 syringeTrack:{height:24,borderRadius:12,backgroundColor:'#E4EBF0',overflow:'hidden',borderWidth:1,borderColor:theme.border},syringeFill:{height:'100%',backgroundColor:theme.teal},scaleRow:{flexDirection:'row',justifyContent:'space-between'},scaleText:{color:theme.slate,fontSize:12},
 saveAction:{backgroundColor:theme.navy,padding:15,borderRadius:11,alignItems:'center'},saveActionText:{color:theme.white,fontWeight:'700'},outlineAction:{borderWidth:1,borderColor:theme.border,borderRadius:11,padding:15,alignItems:'center'},outlineActionText:{color:theme.navy,fontWeight:'700'},overlay:{flex:1,backgroundColor:'#0009',justifyContent:'center',padding:20},picker:{backgroundColor:theme.white,borderRadius:18,padding:20,gap:15},protocolChoice:{borderBottomWidth:1,borderBottomColor:theme.border,paddingVertical:14},
 presetRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:10},preset:{paddingVertical:9,paddingHorizontal:13,borderWidth:1,borderColor:theme.border,borderRadius:10},presetText:{fontWeight:'700',color:theme.navy},
 page:{padding:20,paddingBottom:50,backgroundColor:theme.background,gap:16},heading:{fontSize:26,fontWeight:'800',color:theme.navy},hint:{fontSize:13,color:theme.muted,lineHeight:20},switchRow:{flexDirection:'row',gap:8},switchButton:{flex:1,borderWidth:1,borderColor:theme.border,borderRadius:12,padding:12,alignItems:'center'},active:{backgroundColor:theme.navy,borderColor:theme.navy},switchText:{color:theme.navy,fontWeight:'700',textAlign:'center'},activeText:{color:theme.white},card:{backgroundColor:theme.white,borderRadius:16,borderWidth:1,borderColor:theme.border,padding:18,gap:14},title:{fontSize:19,fontWeight:'800',color:theme.navy},field:{gap:6},label:{color:theme.navy,fontWeight:'600',fontSize:14},input:{borderWidth:1,borderColor:theme.border,borderRadius:10,padding:13,fontSize:17,color:theme.navy},result:{padding:16,backgroundColor:'#E6F7F7',borderRadius:12,gap:6},resultLabel:{color:theme.navy,fontWeight:'600'},resultValue:{color:theme.navy,fontWeight:'800',fontSize:28},resultSub:{color:theme.navy,fontWeight:'700'},warning:{color:'#B42318',fontWeight:'700'},footer:{fontSize:12,color:theme.muted,lineHeight:19}
});
