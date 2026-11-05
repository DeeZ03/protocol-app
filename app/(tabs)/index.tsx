import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme';
import { useLanguage } from '../../src/i18n';
import { AppSettings } from '../../src/components/AppSettings';
import { ProtocolCalendar } from '../../src/components/ProtocolCalendar';
import { syncReminders } from '../../src/reminders';
import { isScheduled } from '../../src/protocolDates';

type Protocol = { id: string; name: string; compound: string; schedule: string; createdAt: string; days?: number[]; time?: string; startDate?: string };
type HealthReading = { id: string; marker: string; value: number; date: string };
type HealthUnits = { weight?: 'kg' | 'lb' | 'st' };
type Completion = { protocolId: string; date: string; completedAt: string; name: string; time: string };
const STORAGE_KEY = 'protocol-app:test-protocols:v1';
const COMPLETIONS_KEY = 'protocol-app:completions:v1';
const HEALTH_KEY = 'protocol-app:health-measurements:v1';
const HEALTH_UNITS_KEY = 'protocol-app:health-units:v1';
const localDate = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const scheduledToday = (item: Protocol, date: Date) => isScheduled(item, date);

export default function Dashboard() {
  const {language,t}=useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [healthReadings, setHealthReadings] = useState<HealthReading[]>([]);
  const [healthUnits, setHealthUnits] = useState<HealthUnits>({});
  const [healthError, setHealthError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [today, setToday] = useState(() => new Date());
  const router = useRouter();
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const highlightedId = typeof highlight === 'string' ? highlight : '';

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setToday(new Date());
    syncReminders().catch(() => {});
    setHealthError(false);
    Promise.all([AsyncStorage.getItem(HEALTH_KEY), AsyncStorage.getItem(HEALTH_UNITS_KEY)])
      .then(([records, prefs]) => {
        if (!active) return;
        const parsed: unknown = records ? JSON.parse(records) : [];
        if (!Array.isArray(parsed)) throw new Error('Invalid health records');
        setHealthReadings(parsed as HealthReading[]);
        setHealthUnits(prefs ? JSON.parse(prefs) as HealthUnits : {});
      })
      .catch(() => { if (active) setHealthError(true); });
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(COMPLETIONS_KEY)])
      .then(([records, history]) => {
        if (!active) return;
        const savedProtocols: unknown = records ? JSON.parse(records) : [];
        const savedCompletions: unknown = history ? JSON.parse(history) : [];
        if (!Array.isArray(savedProtocols) || !Array.isArray(savedCompletions)) throw new Error('Invalid records');
        setProtocols(savedProtocols as Protocol[]);
        setCompletions(savedCompletions as Completion[]);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const dateKey = localDate(today);
  const dueToday = protocols.filter(item => scheduledToday(item, today)).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const completedToday = dueToday.filter(item => completions.some(entry => entry.protocolId === item.id && entry.date === dateKey)).length;
  const withoutDays = protocols.filter(item => !Array.isArray(item.days) || item.days.length === 0).length;
  const history = completions.slice().sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 10);

  const latestReading = (marker: string) => healthReadings.filter(item => item.marker === marker && Number.isFinite(item.value)).sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
  const latestWeight = latestReading('weight');
  const weightValue = latestWeight ? (healthUnits.weight === 'lb' ? (latestWeight.value * 2.20462262).toFixed(1) + ' lb' : healthUnits.weight === 'st' ? Math.floor(latestWeight.value * 2.20462262 / 14) + ' st ' + (latestWeight.value * 2.20462262 % 14).toFixed(1) + ' lb' : latestWeight.value.toFixed(1) + ' kg') : '—';
  const latestHeart = latestReading('heart');
  const latestBP = latestReading('systolic');
  const pairedBP = latestBP ? healthReadings.find(item => item.marker === 'diastolic' && item.id.replace(/-[ab]$/, '') === latestBP.id.replace(/-[ab]$/, '')) : undefined;

  const toggleCompletion = async (item: Protocol) => {
    if (savingId || loading || error) return;
    const now = new Date();
    if (localDate(now) !== dateKey) {
      Alert.alert(t('dashboard.dayChanged'), t('dashboard.dayChangedBody'));
      return;
    }
    setSavingId(item.id);
    try {
      // Read the latest saved history to avoid overwriting records from another screen.
      const raw = await AsyncStorage.getItem(COMPLETIONS_KEY);
      const latest: Completion[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(latest)) throw new Error('Invalid history');
      const exists = latest.some(entry => entry.protocolId === item.id && entry.date === dateKey);
      const next = exists
        ? latest.filter(entry => !(entry.protocolId === item.id && entry.date === dateKey))
        : [{ protocolId: item.id, date: dateKey, completedAt: now.toISOString(), name: item.name, time: item.time ?? '' }, ...latest];
      await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(next));
      setCompletions(next);
    } catch {
      Alert.alert(t('dashboard.saveError'), t('dashboard.saveErrorBody'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
    <ScrollView contentContainerStyle={styles.page}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={styles.eyebrow}>{t('dashboard.eyebrow')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('health.settings')} onPress={()=>setSettingsOpen(true)} style={{padding:10}}><Text style={{fontSize:27,fontWeight:'700',color:theme.navy}}>☰</Text></Pressable></View>
      <Text style={styles.heading}>{t('dashboard.heading')}</Text>
      <Text style={styles.subtitle}>{t('dashboard.subtitle')}</Text>
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>{t('dashboard.todayOverview')}</Text>
        <Text style={styles.muted}>{today.toLocaleDateString(language==='es'?'es-ES':'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {loading || error ? <Text style={styles.body}>{loading?t('dashboard.loading'):t('dashboard.loadError')}</Text> : <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryMetric}><Text style={styles.summaryNumber}>{dueToday.length}</Text><Text style={styles.summaryLabel}>{t('dashboard.scheduledShort')}</Text></View>
            <View style={styles.summaryMetric}><Text style={styles.summaryNumber}>{completedToday}</Text><Text style={styles.summaryLabel}>{t('dashboard.completedShort')}</Text></View>
            <View style={styles.summaryMetric}><Text style={styles.summaryNumber}>{dueToday.length-completedToday}</Text><Text style={styles.summaryLabel}>{t('dashboard.remainingShort')}</Text></View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill,{width: `${dueToday.length ? Math.min(100, completedToday / dueToday.length * 100) : 0}%` as const}]} /></View>
          <Text style={styles.progressCaption}>{dueToday.length ? Math.round(completedToday/dueToday.length*100)+'% '+t('dashboard.completed') : t('dashboard.noneToday')}</Text>
        </>}
      </View>
      <View style={[styles.card, highlightedId && dueToday.some(item => item.id === highlightedId) && styles.highlightedCard]}>
        <Text style={styles.cardTitle}>{t('dashboard.scheduled')}</Text>
        <Text style={styles.muted}>{today.toLocaleDateString(language==='es'?'es-ES':'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {!loading && !error && dueToday.length > 0 && (
          <Text style={styles.progress}>{completedToday} {t('dashboard.of')} {dueToday.length} {t('dashboard.completed')}</Text>
        )}
        {loading ? <Text style={styles.body}>{t('dashboard.loading')}</Text> :
          error ? <Text style={styles.body}>{t('dashboard.loadError')}</Text> :
          dueToday.length === 0 ? <Text style={[styles.body, styles.topGap]}>{t('dashboard.noneToday')}</Text> :
          dueToday.map(item => {
            const completed = completions.some(entry => entry.protocolId === item.id && entry.date === dateKey);
            return (
              <View style={[styles.protocolRow, styles.scheduledRow, item.id === highlightedId && styles.highlightedRow]} key={item.id}>
                <Text style={styles.scheduleTime}>{item.time}</Text>
                <View style={styles.scheduleDetails}>
                  <Text style={styles.protocolName}>{item.name}</Text>
                  <Text style={styles.muted}>{item.compound}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={completed ? t('dashboard.undoAccessibility') + item.name : t('dashboard.markAccessibility') + item.name} disabled={savingId !== null} style={[styles.completionButton, completed && styles.completedButton]} onPress={() => toggleCompletion(item)}>
                  <Text style={[styles.completionText, completed && styles.completedText]}>{savingId === item.id ? t('dashboard.saving') : completed ? t('dashboard.undo') : t('dashboard.done')}</Text>
                </Pressable>
              </View>
            );
          })
        }
        {!loading && !error && withoutDays > 0 &&
          <Text style={styles.muted}>{withoutDays} {withoutDays===1?t('dashboard.noDaysOne'):t('dashboard.noDaysMany')}</Text>}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('dashboard.healthSnapshot')}</Text>
        {healthError ? <Text style={styles.body}>{t('dashboard.healthUnavailable')}</Text> : <View style={styles.healthRow}>
          <View style={styles.healthMetric}><Text style={styles.healthLabel}>{t('health.weight')}</Text><Text style={styles.healthValue}>{weightValue}</Text></View>
          <View style={styles.healthMetric}><Text style={styles.healthLabel}>{t('health.heart')}</Text><Text style={styles.healthValue}>{latestHeart ? latestHeart.value + ' bpm' : '—'}</Text></View>
          <View style={styles.healthMetric}><Text style={styles.healthLabel}>{t('health.bloodPressure')}</Text><Text style={styles.healthValue}>{latestBP && pairedBP ? latestBP.value + '/' + pairedBP.value : '—'}</Text></View>
        </View>}
        <Pressable accessibilityRole="button" onPress={() => router.push('/health')} style={styles.inlineLink}><Text style={styles.inlineLinkText}>{t('dashboard.viewHealth')} ›</Text></Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.quickRow}>
          <Pressable accessibilityRole="button" style={styles.quickButton} onPress={() => router.push('/protocols')}><Text style={styles.quickText}>{t('dashboard.openProtocols')}</Text></Pressable>
          <Pressable accessibilityRole="button" style={styles.quickButton} onPress={() => router.push('/health')}><Text style={styles.quickText}>{t('dashboard.openHealth')}</Text></Pressable>
        </View>
      </View>
      <View style={styles.card}>
        <ProtocolCalendar protocols={protocols} completions={completions} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('dashboard.recent')}</Text>
        {loading ? <Text style={styles.body}>{t('dashboard.loadingHistory')}</Text> :
          error ? <Text style={styles.body}>{t('dashboard.historyError')}</Text> :
          history.length === 0 ? <Text style={styles.body}>{t('dashboard.noHistory')}</Text> :
          history.map(entry => (
            <View style={styles.protocolRow} key={entry.protocolId + ':' + entry.date}>
              <Text style={styles.protocolName}>{entry.name}</Text>
              <Text style={styles.muted}>{entry.date} · {t('dashboard.scheduledAt')} {entry.time}</Text>
            </View>
          ))}
        <Text style={styles.muted}>{t('dashboard.historyNote')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('dashboard.yourProtocols')}</Text>
        {loading ? <Text style={styles.body}>{t('dashboard.loadingRecords')}</Text> :
          error ? <Text style={styles.body}>{t('dashboard.recordsError')}</Text> :
          protocols.length === 0 ? <Text style={styles.body}>{t('dashboard.noProtocols')}</Text> : (
            <>
              <Text style={styles.count}>{protocols.length}</Text>
              <Text style={styles.muted}>{protocols.length === 1 ? t('dashboard.savedOne') : t('dashboard.savedMany')}</Text>
              {protocols.slice(0, 5).map(item => (
                <View style={styles.protocolRow} key={item.id}>
                  <Text style={styles.protocolName}>{item.name}</Text>
                  <Text style={styles.muted}>{item.compound}</Text>
                </View>
              ))}
              {protocols.length > 5 && <Text style={styles.muted}>{language==='es'?'Y':'And'} {protocols.length - 5} {t('dashboard.more')}</Text>}
            </>
          )}
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.push('/protocols')}>
          <Text style={styles.buttonText}>{protocols.length ? t('dashboard.view') : t('dashboard.addFirst')}</Text>
        </Pressable>
      </View>
      <Text style={styles.disclaimer}>{t('dashboard.disclaimer')}</Text>
    </ScrollView>
    <AppSettings visible={settingsOpen} onClose={()=>setSettingsOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 36, backgroundColor: theme.background },
  eyebrow: { color: theme.teal, fontWeight: '800', letterSpacing: 1.4, fontSize: 12, marginBottom: 12 },
  heading: { fontSize: 30, fontWeight: '800', color: theme.navy },
  subtitle: { color: theme.slate, fontSize: 16, marginTop: 8, marginBottom: 24, lineHeight: 23 },
  overviewCard: { padding: 20, borderRadius: 16, backgroundColor: theme.white, borderColor: theme.border, borderWidth: 1, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 18 },
  summaryMetric: { flex: 1, alignItems: 'center' },
  summaryNumber: { fontSize: 30, fontWeight: '800', color: theme.navy },
  summaryLabel: { color: theme.slate, fontSize: 12, marginTop: 4, textAlign: 'center' },
  progressTrack: { height: 11, backgroundColor: theme.border, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.teal, borderRadius: 8 },
  progressCaption: { color: theme.slate, fontSize: 13, marginTop: 9 },
  healthRow: { flexDirection: 'row', gap: 8 },
  healthMetric: { flex: 1, minWidth: 0, paddingVertical: 12 },
  healthLabel: { color: theme.slate, fontSize: 12, marginBottom: 8 },
  healthValue: { color: theme.navy, fontSize: 16, fontWeight: '800' },
  inlineLink: { alignSelf: 'flex-start', paddingVertical: 10 },
  inlineLinkText: { color: theme.teal, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickButton: { flex: 1, backgroundColor: theme.navy, padding: 14, borderRadius: 10, alignItems: 'center' },
  quickText: { color: theme.white, fontWeight: '700', textAlign: 'center' },
  card: { padding: 20, borderRadius: 16, backgroundColor: theme.white, borderColor: theme.border, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.navy, marginBottom: 12 },
  body: { color: theme.text, fontSize: 15, lineHeight: 22 },
  topGap: { marginTop: 12 },
  scheduleTime: { color: theme.teal, fontWeight: '800', fontSize: 16, width: 55 },
  scheduleDetails: { flex: 1 },
  scheduledRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completionButton: { borderRadius: 9, borderWidth: 1, borderColor: theme.navy, paddingHorizontal: 12, paddingVertical: 10, minWidth: 60, alignItems: 'center' },
  completedButton: { backgroundColor: theme.navy },
  completionText: { color: theme.navy, fontWeight: '700' },
  completedText: { color: theme.white },
  progress: { color: theme.teal, fontWeight: '800', fontSize: 17, marginTop: 14 },
  count: { fontSize: 38, fontWeight: '800', color: theme.navy },
  protocolRow: { borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 12 },
  highlightedCard: { borderColor: theme.teal, borderWidth: 2 },
  highlightedRow: { backgroundColor: '#E8F7F7', borderRadius: 10, paddingHorizontal: 8 },
  protocolName: { fontSize: 16, fontWeight: '700', color: theme.navy },
  muted: { color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  button: { backgroundColor: theme.navy, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 16 },
  buttonText: { color: theme.white, fontWeight: '700', fontSize: 15 },
  disclaimer: { color: theme.muted, fontSize: 12, marginTop: 12, lineHeight: 19 },
});
