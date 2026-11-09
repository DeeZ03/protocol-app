import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme';
import { useLanguage } from '../../src/i18n';
import { syncReminders, requestProtocolReminderPermission } from '../../src/reminders';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { dateKey, endDate, finalScheduledDate } from '../../src/protocolDates';
import { Ionicons } from '@expo/vector-icons';
import CompoundSelector from '../../src/components/CompoundSelector';

type Protocol = { calculation?: string; id: string; name: string; compound: string; schedule: string; createdAt: string; days?: number[]; time?: string; startDate?: string; durationWeeks?: number | null; customEndDate?: string; reminderEnabled?: boolean; endReminderEnabled?: boolean; alertMode?: 'standard' | 'prominent' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const STORAGE_KEY = 'protocol-app:test-protocols:v1';

export default function Protocols() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ calculation?: string }>();
  const [pendingCalculation,setPendingCalculation] = useState('');
  useEffect(() => { if (typeof routeParams.calculation === 'string' && routeParams.calculation.length > 0) { setEditingId(null); setName(''); setCompound(''); setSchedule(''); setDays([]); setTime(''); setStartDate(''); setDurationWeeks(null); setCustomEndDate(''); setPendingCalculation(routeParams.calculation); setEditing(true); router.setParams({calculation:undefined}); } }, [routeParams.calculation]);
  const { language, t } = useLanguage();
  const localizedDays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, i + 1).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { weekday: 'short' }));
  const durationLabel = (weeks: number) => `${weeks} ${t(weeks === 1 ? 'protocols.week' : 'protocols.weeks')}`;
  const [items, setItems] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProtocol = items.find(item => item.id === selectedId);
  const [name, setName] = useState('');
  const [compound, setCompound] = useState('');
  const [compoundPickerOpen, setCompoundPickerOpen] = useState(false);
  const [schedule, setSchedule] = useState('');
  const formScrollRef = useRef<ScrollView>(null);
  const scrollToNotes = () => {
    setTimeout(() => formScrollRef.current?.scrollToEnd({ animated: true }), 300);
  };
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<number[]>([]);
  const [time, setTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState<number | null>(null);
  const [customEndDate, setCustomEndDate] = useState('');
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [endReminderEnabled, setEndReminderEnabled] = useState(false);
  const [alertMode, setAlertMode] = useState<'standard' | 'prominent'>('prominent');
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);
  const durationMode = customEndDate ? 'custom' : durationWeeks !== null ? 'weeks' : 'indefinite';
  const setMode = (mode: 'indefinite' | 'weeks' | 'custom') => {
    if (mode === 'indefinite') { setDurationWeeks(null); setCustomEndDate(''); setEndReminderEnabled(false); }
    if (mode === 'weeks') { setCustomEndDate(''); setDurationWeeks(current => current ?? 4); }
    if (mode === 'custom') { setDurationWeeks(null); setCustomEndDate(startDate || dateKey(new Date())); }
  };
  const openEndDatePicker = () => {
    const value = validDate(customEndDate) ? new Date(customEndDate + 'T12:00:00') : new Date();
    DateTimePickerAndroid.open({ value, mode: 'date', onChange: (event, selected) => {
      if (event.type === 'set' && selected) setCustomEndDate(dateKey(selected));
    }});
  };
  const openTimePicker = () => {
    const [h, m] = /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time.split(':').map(Number) : [9, 0];
    const value = new Date(); value.setHours(h, m, 0, 0);
    DateTimePickerAndroid.open({ value, mode: 'time', is24Hour: true, onChange: (event, selected) => {
      if (event.type === 'set' && selected) setTime(String(selected.getHours()).padStart(2, '0') + ':' + String(selected.getMinutes()).padStart(2, '0'));
    }});
  };
  const openDatePicker = () => {
    const value = startDate && validDate(startDate) ? new Date(startDate + 'T12:00:00') : new Date();
    DateTimePickerAndroid.open({ value, mode: 'date', onChange: (event, selected) => {
      if (event.type === 'set' && selected) setStartDate(dateKey(selected));
    }});
  };

  useFocusEffect(useCallback(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (active) setItems(value ? JSON.parse(value) as Protocol[] : []);
      })
      .catch(() => Alert.alert(t('protocols.loadTitle'), t('protocols.loadBody')))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const openEdit = (entry: Protocol) => {
    setPendingCalculation(entry.calculation ?? '');
    setEditingId(entry.id);
    setName(entry.name);
    setCompound(entry.compound);
    setSchedule(entry.schedule);
    setDays(entry.days ?? []);
    setTime(entry.time ?? '');
    setStartDate(entry.startDate ?? '');
    setDurationWeeks(entry.durationWeeks ?? null);
    setCustomEndDate(entry.customEndDate ?? '');
    setReminderEnabled(entry.reminderEnabled === true);
    setEndReminderEnabled(entry.endReminderEnabled === true);
    setAlertMode('prominent');
    setReminderSettingsOpen(false);
    setSelectedId(null);
    setEditing(true);
  };

  const close = () => {
    setEditing(false);
    setEditingId(null);
    setPendingCalculation('');
    setName('');
    setCompound('');
    setSchedule('');
    setDays([]);
    setTime('');
    setStartDate('');
    setDurationWeeks(null);
    setCustomEndDate('');
    setReminderEnabled(false);
    setEndReminderEnabled(false);
    setAlertMode('prominent');
    setReminderSettingsOpen(false);
  };

  const save = async () => {
    if (!name.trim() || !compound.trim()) {
      Alert.alert(t('protocols.missingTitle'), t('protocols.missingBody'));
      return;
    }
    if (days.length > 0 && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      Alert.alert(t('protocols.timeTitle'), t('protocols.timeBody'));
      return;
    }
    if (startDate.trim() && !validDate(startDate.trim())) {
      Alert.alert(t('protocols.startTitle'), t('protocols.startBody'));
      return;
    }
    if ((durationWeeks !== null || !!customEndDate) && !startDate) {
      Alert.alert(t('protocols.startRequired'), t('protocols.startRequiredBody'));
      return;
    }
    if (customEndDate && (!validDate(customEndDate) || customEndDate < startDate)) {
      Alert.alert(t('protocols.endTitle'), t('protocols.endBody'));
      return;
    }
    if (reminderEnabled && (days.length === 0 || !time)) {
      Alert.alert(t('protocols.scheduleTitle'), t('protocols.scheduleBody'));
      return;
    }
    if (saving) return;
    setSaving(true);
    const existing = editingId ? items.find(item => item.id === editingId) : undefined;
    if (editingId && !existing) {
      Alert.alert(t('protocols.notFound'), t('protocols.notFoundBody'));
      setSaving(false);
      return;
    }
    if (reminderEnabled) {
      try {
        const granted = await requestProtocolReminderPermission();
        if (!granted) {
          Alert.alert(t('protocols.notificationsTitle'), t('protocols.notificationsBody'));
          setSaving(false);
          return;
        }
      } catch {
        Alert.alert(t('protocols.permissionTitle'), t('protocols.permissionBody'));
        setSaving(false);
        return;
      }
    }
    const entry: Protocol = {
      id: existing?.id ?? (Date.now().toString() + '-' + Math.random().toString(36).slice(2)),
      name: name.trim(),
      compound: compound.trim(),
      schedule: schedule.trim(),
      calculation: pendingCalculation || existing?.calculation,
      days: days.slice().sort((a, b) => a - b),
      time: days.length ? time.trim() : '',
      startDate: startDate.trim(),
      durationWeeks,
      customEndDate,
      reminderEnabled,
      alertMode: 'prominent',
      endReminderEnabled: reminderEnabled && durationMode !== 'indefinite' && endReminderEnabled,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const next = existing ? items.map(item => item.id === existing.id ? entry : item) : [entry, ...items];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
      await syncReminders().catch(() => {});
      close();
    } catch {
      Alert.alert(t('protocols.notSaved'), t('protocols.retry'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (entry: Protocol) => {
    Alert.alert(t('protocols.deleteTitle'), t('protocols.removePrefix') + entry.name + t('protocols.removeSuffix'), [
      { text: t('protocols.cancel'), style: 'cancel' },
      { text: t('protocols.delete'), style: 'destructive', onPress: async () => {
        const next = items.filter(item => item.id !== entry.id);
        setSelectedId(null);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setItems(next);
          await syncReminders().catch(() => {});
        } catch {
          Alert.alert(t('protocols.deleteError'), t('protocols.tryAgain'));
        }
      } },
    ]);
  };

  return (
    <View style={styles.page}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>{t('protocols.eyebrow')}</Text>
          <Text style={styles.heading}>Protocols</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.addButton} onPress={() => { setEditingId(null); setName(''); setCompound(''); setSchedule(''); setDays([]); setTime(''); setStartDate(''); setDurationWeeks(null); setCustomEndDate(''); setReminderEnabled(false); setEndReminderEnabled(false); setAlertMode('prominent'); setReminderSettingsOpen(false); setEditing(true); }}>
          <Text style={styles.addText}>{t('protocols.add')}</Text>
        </Pressable>
      </View>
      <View style={styles.calculatorCard}>
        <View style={styles.calculatorHeading}><Ionicons name="calculator-outline" size={21} color={theme.navy}/><Text style={styles.calculatorTitle}>{language === 'es' ? 'Calculadora de dosis y volumen' : 'Dose & volume calculator'}</Text></View>
        <Text style={styles.calculatorHint}>{language === 'es' ? 'Calcula el volumen a partir de una cantidad prescrita.' : 'Calculate volume from a prescribed amount.'}</Text>
        <View style={styles.calculatorActions}>
          <Pressable accessibilityRole="button" style={styles.calculatorAction} onPress={()=>router.push('/calculator?mode=peptide')}><Ionicons name="flask-outline" size={18} color={theme.navy}/><Text style={styles.calculatorActionText}>{language === 'es' ? 'Péptidos' : 'Peptides'}</Text></Pressable>
          <Pressable accessibilityRole="button" style={styles.calculatorAction} onPress={()=>router.push('/calculator?mode=solution')}><Ionicons name="medical-outline" size={18} color={theme.navy}/><Text style={styles.calculatorActionText}>{language === 'es' ? 'Inyectables' : 'Injectables'}</Text></Pressable>
        </View>
      </View>
      <View style={styles.savedHeading}><Text style={styles.savedTitle}>{language === 'es' ? 'Protocolos guardados' : 'Saved protocols'}</Text><Text style={styles.savedCount}>{items.length} {language === 'es' ? 'guardados' : 'saved'}</Text></View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>{loading ? t('protocols.loading') : t('protocols.empty')}</Text>
            <Text style={styles.detail}>{t('protocols.emptyHelp')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={t('protocols.view') + item.name + t('protocols.details')} style={styles.card} onPress={() => setSelectedId(item.id)}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={22} color={theme.slate}/>
            </View>
            <Text style={styles.detail} numberOfLines={1}>{item.compound}</Text>

          </Pressable>
        )}
        ListFooterComponent={<Text style={styles.disclaimer}>{t('protocols.disclaimer')}</Text>}
      />
      <Modal visible={!!selectedProtocol} transparent animationType="fade" onRequestClose={() => setSelectedId(null)}>
        <View style={styles.detailsBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('protocols.closeDetails')} onPress={() => setSelectedId(null)} style={StyleSheet.absoluteFill} />
          <View style={styles.detailsSheet}>
            <View style={styles.detailsHeader}>
              <Text style={styles.heading}>{selectedProtocol?.name}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('protocols.closeDetails')} onPress={() => setSelectedId(null)}>
                <Ionicons name="close" size={26} color={theme.navy}/>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.detailsScroll}>
              {selectedProtocol && <>
                <Text style={styles.detailsLabel}>{t('protocols.compound')}</Text>
                <Text style={styles.detailsValue}>{selectedProtocol.compound}</Text>
                <Text style={styles.detailsLabel}>{t('protocols.schedule')}</Text>
                <Text style={styles.detailsValue}>{selectedProtocol.days?.length ? selectedProtocol.days.map(day => localizedDays[day]).join(', ') + t('protocols.at') + selectedProtocol.time : t('protocols.noDays')}</Text>
                <Text style={styles.detailsLabel}>{t('protocols.startDate')}</Text>
                <Text style={styles.detailsValue}>{selectedProtocol.startDate || t('protocols.notSet')}</Text>
                <Text style={styles.detailsLabel}>{t('protocols.duration')}</Text>
                <Text style={styles.detailsValue}>{selectedProtocol.customEndDate ? t('protocols.customEnd') : selectedProtocol.durationWeeks ? durationLabel(selectedProtocol.durationWeeks) : t('protocols.indefinite')}</Text>
                {!!endDate(selectedProtocol) && <Text style={styles.detailsValue}>{t('protocols.ends')}{endDate(selectedProtocol)}{'\n'}{t('protocols.lastScheduled')}{finalScheduledDate(selectedProtocol) ?? t('protocols.none')}</Text>}
                <Text style={styles.detailsLabel}>{t('protocols.reminders')}</Text>
                <Text style={styles.detailsValue}>{selectedProtocol.reminderEnabled === true ? t('protocols.notificationOn') : t('protocols.off')}{selectedProtocol.reminderEnabled === true && selectedProtocol.endReminderEnabled === true ? t('protocols.finalAlert') : ''}</Text>
                <Text style={styles.detailsLabel}>{t('protocols.notes')}</Text>
                <Text style={styles.detailsValue}>{selectedProtocol.schedule.trim() || t('protocols.noNotes')}</Text>
              </>}
            </ScrollView>
            {!!selectedProtocol?.calculation && <View style={styles.reminderCard}><Text style={styles.detailsLabel}>{language === 'es' ? 'Cálculo guardado' : 'Saved calculation'}</Text><Text style={styles.detailsValue}>{selectedProtocol.calculation}</Text></View>}
            <View style={styles.detailsActions}>
              <Pressable accessibilityRole="button" style={styles.detailsEdit} onPress={() => { if (selectedProtocol) openEdit(selectedProtocol); }}>
                <Ionicons name="create-outline" size={19} color={theme.white}/><Text style={styles.saveText}>{t('protocols.edit')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.detailsDelete} onPress={() => { if (selectedProtocol) remove(selectedProtocol); }}>
                <Ionicons name="trash-outline" size={19} color="#B42318"/><Text style={styles.delete}>{t('protocols.delete')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <KeyboardAvoidingView style={[styles.modal, { paddingTop: Math.max(insets.top + 16, 28) }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.heading}>{t(editingId ? 'protocols.editProtocol' : 'protocols.addProtocol')}</Text>
            <Pressable accessibilityRole="button" onPress={close}><Text style={styles.cancel}>{t('protocols.cancel')}</Text></Pressable>
          </View>
          <ScrollView ref={formScrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.formContent}>
          <Text style={styles.label}>{t('protocols.name')}</Text>
          <TextInput style={styles.input} placeholder={language === 'es' ? 'p. ej., Mi rutina' : 'e.g. My routine'} value={name} onChangeText={setName} maxLength={80} />
          <Text style={styles.label}>{t('protocols.compoundName')}</Text>
          <Pressable accessibilityRole="button" style={styles.browseButton} onPress={() => setCompoundPickerOpen(true)}>
            <Ionicons name="search-outline" size={23} color={theme.teal}/>
            <View style={{flex:1}}>
              <Text style={styles.browseTitle}>{compound || t('protocols.browse')}</Text>
              <Text style={styles.browseSubtitle}>{t('protocols.browseHint')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.slate}/>
          </Pressable>
          {!!pendingCalculation && <View style={styles.reminderCard}><Text style={styles.label}>{language === 'es' ? 'Cálculo guardado' : 'Saved calculation'}</Text><Text style={styles.detail}>{pendingCalculation}</Text><Pressable onPress={()=>setPendingCalculation('')}><Text style={styles.clearText}>{language === 'es' ? 'Quitar cálculo' : 'Remove calculation'}</Text></Pressable></View>}
          <Text style={styles.label}>{t('protocols.scheduledDays')}</Text>
          <View style={styles.dayRow}>
            {DAYS.map((day, index) => {
              const selected = days.includes(index);
              return (
                <Pressable key={day} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={[styles.dayButton, selected && styles.daySelected]} onPress={() => setDays(current => current.includes(index) ? current.filter(d => d !== index) : [...current, index])}>
                  <Text style={[styles.dayText, selected && styles.daySelectedText]}>{localizedDays[index]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.label}>{t('protocols.time')}</Text>
          <Pressable accessibilityRole="button" style={styles.input} onPress={openTimePicker}><Text style={styles.pickerText}>{time || t('protocols.chooseTime')}</Text></Pressable>
          <Text style={styles.label}>{t('protocols.startOptional')}</Text>
          <Pressable accessibilityRole="button" style={styles.input} onPress={openDatePicker}><Text style={styles.pickerText}>{startDate || t('protocols.chooseStart')}</Text></Pressable>
          {!!startDate && <Pressable onPress={() => setStartDate('')}><Text style={styles.clearText}>{t('protocols.clearStart')}</Text></Pressable>}
          <Text style={styles.label}>{t('protocols.duration')}</Text>
          <View style={styles.modeRow}>
            {([['indefinite', t('protocols.indefinite')], ['weeks', t('protocols.fixedWeeks')], ['custom', t('protocols.endDate')]] as const).map(([mode, label]) => (
              <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: durationMode === mode }} style={[styles.modeButton, durationMode === mode && styles.daySelected]} onPress={() => setMode(mode)}>
                <Text style={[styles.dayText, durationMode === mode && styles.daySelectedText]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {durationMode === 'weeks' && <Pressable accessibilityRole="button" style={styles.input} onPress={() => setWeekPickerOpen(true)}>
            <Text style={styles.pickerText}>{durationLabel(durationWeeks ?? 0)}  ▾</Text>
          </Pressable>}
          {durationMode === 'custom' && <Pressable accessibilityRole="button" style={styles.input} onPress={openEndDatePicker}>
            <Text style={styles.pickerText}>{t('protocols.ends')}{customEndDate}</Text>
          </Pressable>}
          {durationMode !== 'indefinite' && !!startDate && <Text style={styles.help}>{t('protocols.endsForm')}{endDate({startDate, durationWeeks, customEndDate})}{t('protocols.lastActivity')}{finalScheduledDate({startDate, durationWeeks, customEndDate, days, time}) ?? t('protocols.noSelected')}.</Text>}
          {durationMode !== 'indefinite' && !startDate && <Text style={styles.help}>{t('protocols.chooseStartFixed')}</Text>}
          <View style={styles.reminderCard}>
            <Pressable accessibilityRole="button" accessibilityState={{expanded: reminderSettingsOpen}} style={styles.reminderRow} onPress={() => setReminderSettingsOpen(v => !v)}>
              <View style={styles.reminderIcon}><Ionicons name="notifications-outline" size={23} color={theme.navy}/></View>
              <View style={{flex:1}}>
                <Text style={styles.reminderTitle}>{t('protocols.setReminders')}</Text>
                <Text style={styles.reminderHelp}>{reminderEnabled ? t('protocols.notificationOn') + (endReminderEnabled && durationMode !== 'indefinite' ? t('protocols.finalOn') : '') : t('protocols.reminderOff')}</Text>
              </View>
              <Ionicons name={reminderSettingsOpen ? 'chevron-up' : 'chevron-forward'} size={22} color={theme.slate}/>
            </Pressable>
            {reminderSettingsOpen && <>
              <View style={styles.reminderDivider}/>
              <Pressable accessibilityRole="switch" accessibilityState={{checked: reminderEnabled}} style={styles.reminderRow} onPress={() => { setReminderEnabled(v => !v); if (reminderEnabled) setEndReminderEnabled(false); }}>
                <Ionicons name="notifications-outline" size={22} color={theme.slate}/>
                <View style={{flex:1}}>
                  <Text style={styles.reminderTitle}>{t('protocols.notification')}</Text>
                  <Text style={styles.reminderHelp}>{t('protocols.notificationHint')}</Text>
                </View>
                <Ionicons name={reminderEnabled ? 'checkbox' : 'square-outline'} size={27} color={reminderEnabled ? theme.teal : theme.slate}/>
              </Pressable>
              {reminderEnabled && <Text style={styles.reminderHelp}>{t('protocols.androidHint')}</Text>}
              {reminderEnabled && durationMode !== 'indefinite' && <Pressable accessibilityRole="switch" accessibilityState={{checked: endReminderEnabled}} style={styles.reminderRow} onPress={() => setEndReminderEnabled(v => !v)}>
                <Ionicons name="flag-outline" size={22} color={theme.slate}/>
                <View style={{flex:1}}>
                  <Text style={styles.reminderTitle}>{t('protocols.finalActivity')}</Text>
                  <Text style={styles.reminderHelp}>{t('protocols.finalHint')}</Text>
                </View>
                <Ionicons name={endReminderEnabled ? 'checkbox' : 'square-outline'} size={27} color={endReminderEnabled ? theme.teal : theme.slate}/>
              </Pressable>}
              <Text style={styles.reminderHelp}>{t('protocols.alarmHint')}</Text>
            </>}
          </View>
          <Text style={styles.label}>{t('protocols.scheduleNotes')}</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder={language === 'es' ? 'p. ej., Días y horas' : 'e.g. Days and times'} value={schedule} onChangeText={setSchedule} onFocus={scrollToNotes} multiline maxLength={250} />
          <Text style={styles.help}>{t('protocols.noteHelp')}</Text>
          <Pressable accessibilityRole="button" disabled={saving} style={[styles.saveButton, saving && styles.disabled]} onPress={save}>
            <Text style={styles.saveText}>{t(saving ? 'protocols.saving' : editingId ? 'protocols.saveChanges' : 'protocols.save')}</Text>
          </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <CompoundSelector visible={compoundPickerOpen} selected={compound} onSelect={setCompound} onClose={() => setCompoundPickerOpen(false)}/>
      <Modal visible={weekPickerOpen} transparent animationType="fade" onRequestClose={() => setWeekPickerOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}><Text style={styles.cardTitle}>{t('protocols.selectDuration')}</Text><Pressable onPress={() => setWeekPickerOpen(false)}><Text style={styles.cancel}>{t('protocols.close')}</Text></Pressable></View>
            <ScrollView style={styles.weekList}>
              {Array.from({ length: 52 }, (_, i) => i + 1).map(weeks => (
                <Pressable key={weeks} accessibilityRole="button" style={[styles.weekOption, durationWeeks === weeks && styles.weekSelected]} onPress={() => { setDurationWeeks(weeks); setWeekPickerOpen(false); }}>
                  <Text style={styles.pickerText}>{durationLabel(weeks)}{durationWeeks === weeks ? '  ✓' : ''}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20, paddingTop: 22 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headingText: { flex: 1 },
  eyebrow: { fontSize: 12, letterSpacing: 1.4, fontWeight: '800', color: theme.teal, marginBottom: 5 },
  heading: { fontSize: 27, fontWeight: '800', color: theme.navy },
  addButton: { backgroundColor: theme.navy, paddingVertical: 12, paddingHorizontal: 17, borderRadius: 10 },
  addText: { color: theme.white, fontWeight: '700', fontSize: 15 },
  intro: { color: theme.slate, marginTop: 12, marginBottom: 18, fontSize: 15 },
  list: { paddingBottom: 40, flexGrow: 1 },
  calculatorCard:{backgroundColor:theme.white,borderColor:theme.border,borderWidth:1,borderRadius:14,padding:14,marginBottom:15},
  calculatorHeading:{flexDirection:'row',alignItems:'center',gap:8},calculatorTitle:{color:theme.navy,fontSize:16,fontWeight:'800'},
  calculatorHint:{color:theme.slate,fontSize:12,marginTop:6,marginBottom:12},
  calculatorActions:{flexDirection:'row',gap:9},calculatorAction:{flex:1,borderColor:theme.border,borderWidth:1,borderRadius:10,padding:11,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},
  calculatorActionText:{color:theme.navy,fontSize:14,fontWeight:'700'},
  savedHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},savedTitle:{color:theme.navy,fontWeight:'800',fontSize:16},savedCount:{color:theme.slate,fontSize:13},
  emptyCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.white, padding: 22 },
  card: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.white, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 7 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 2 },
  cardTitle: { color: theme.navy, fontWeight: '700', fontSize: 16, flexShrink: 1 },
  detail: { color: theme.slate, fontSize: 13, lineHeight: 19, marginTop: 2 },
  cardMeta: { color: theme.muted, fontSize: 12, marginTop: 5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  edit: { color: theme.teal, fontWeight: '700' },
  delete: { color: '#B42318', fontWeight: '600' },
  disclaimer: { fontSize: 12, color: theme.muted, lineHeight: 19, marginTop: 16 },
  modal: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 22, paddingTop: 28 },
  formContent: { paddingBottom: 180 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 },
  dayButton: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.white, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 9 },
  daySelected: { backgroundColor: theme.navy, borderColor: theme.navy },
  dayText: { color: theme.navy, fontSize: 13, fontWeight: '700' },
  daySelectedText: { color: theme.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  cancel: { color: theme.teal, fontSize: 16, fontWeight: '700' },
  label: { color: theme.navy, fontWeight: '700', fontSize: 15, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, backgroundColor: theme.white, padding: 13, fontSize: 16, color: theme.text, marginBottom: 20 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  pickerText: { fontSize: 16, color: theme.text },
  clearText: { color: theme.teal, fontWeight: '700', marginTop: 10, marginBottom: 0 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  modeButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: theme.white },
  pickerOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 },
  pickerSheet: { backgroundColor: theme.white, borderRadius: 16, padding: 18, maxHeight: '75%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  weekList: { flexGrow: 0 },
  weekOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  weekSelected: { backgroundColor: theme.background },
  help: { fontSize: 13, color: theme.muted, lineHeight: 20, marginBottom: 22 },
  saveButton: { backgroundColor: theme.navy, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveText: { color: theme.white, fontWeight: '700', fontSize: 16 },
  browseButton: { flexDirection:'row',alignItems:'center',gap:12,backgroundColor:theme.white,borderWidth:1,borderColor:theme.border,borderRadius:12,padding:15,marginBottom:20 },
  browseTitle: { color:theme.navy,fontSize:16,fontWeight:'700' },
  browseSubtitle: { color:theme.slate,fontSize:12,marginTop:3 },
  detailsBackdrop: { flex:1,backgroundColor:'#0009',justifyContent:'center',paddingHorizontal:20,paddingVertical:55 },
  detailsSheet: { backgroundColor:theme.background,borderRadius:20,padding:20,maxHeight:'100%' },
  detailsHeader: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:14 },
  detailsScroll: { flexGrow:0 },
  detailsLabel: { color:theme.teal,fontWeight:'800',fontSize:12,letterSpacing:1,marginTop:16,marginBottom:6 },
  detailsValue: { color:theme.navy,fontSize:16,lineHeight:24 },
  detailsActions: { flexDirection:'row',gap:12,paddingTop:20 },
  detailsEdit: { flex:1,backgroundColor:theme.navy,borderRadius:12,padding:14,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:8 },
  detailsDelete: { borderWidth:1,borderColor:theme.border,borderRadius:12,paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:7 },
  reminderCard: { borderWidth:1,borderColor:theme.border,backgroundColor:theme.white,borderRadius:12,padding:14,marginBottom:22 },
  reminderIcon: { width:42,height:42,borderRadius:10,backgroundColor:theme.background,alignItems:'center',justifyContent:'center' },
  reminderDivider: {height:1,backgroundColor:theme.border,marginVertical:9},
  reminderRow: { flexDirection:'row',alignItems:'center',gap:12,paddingVertical:8 },
  reminderTitle: { color:theme.navy,fontSize:15,fontWeight:'700',marginBottom:4 },
  reminderHelp: { color:theme.slate,fontSize:12,lineHeight:18,marginBottom:6 },
  disabled: { opacity: 0.5 },
});
