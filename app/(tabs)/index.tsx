import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme';

type Protocol = { id: string; name: string; compound: string; schedule: string; createdAt: string; days?: number[]; time?: string; startDate?: string };
const STORAGE_KEY = 'protocol-app:test-protocols:v1';
const localDate = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const scheduledToday = (item: Protocol, date: Date) =>
  Array.isArray(item.days) &&
  item.days.includes((date.getDay() + 6) % 7) &&
  typeof item.time === 'string' &&
  /^([01]\\d|2[0-3]):[0-5]\\d$/.test(item.time) &&
  (!item.startDate || item.startDate <= localDate(date));

export default function Dashboard() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [today, setToday] = useState(() => new Date());
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setToday(new Date());
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (!active) return;
        const parsed: unknown = value ? JSON.parse(value) : [];
        if (!Array.isArray(parsed)) throw new Error('Invalid saved records');
        setProtocols(parsed as Protocol[]);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const dueToday = protocols.filter(item => scheduledToday(item, today)).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const withoutDays = protocols.filter(item => !Array.isArray(item.days) || item.days.length === 0).length;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>PROTOCOL / OVERVIEW</Text>
      <Text style={styles.heading}>Your day, organised.</Text>
      <Text style={styles.subtitle}>A clear space for tracking your health routines.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scheduled today</Text>
        <Text style={styles.muted}>{today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {loading ? <Text style={styles.body}>Loading today's schedule...</Text> :
          error ? <Text style={styles.body}>Unable to load your saved schedule.</Text> :
          dueToday.length === 0 ? <Text style={[styles.body, styles.topGap]}>Nothing scheduled for today.</Text> :
          dueToday.map(item => (
            <View style={styles.protocolRow} key={item.id}>
              <Text style={styles.scheduleTime}>{item.time}</Text>
              <View style={styles.scheduleDetails}>
                <Text style={styles.protocolName}>{item.name}</Text>
                <Text style={styles.muted}>{item.compound}</Text>
              </View>
            </View>
          ))
        }
        {!loading && !error && withoutDays > 0 &&
          <Text style={styles.muted}>{withoutDays} {withoutDays === 1 ? 'protocol has' : 'protocols have'} no selected days and {withoutDays === 1 ? 'is' : 'are'} not included in today's schedule.</Text>}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your protocols</Text>
        {loading ? (
          <Text style={styles.body}>Loading your records...</Text>
        ) : error ? (
          <Text style={styles.body}>Unable to load your saved protocols. Please try reopening this tab.</Text>
        ) : protocols.length === 0 ? (
          <Text style={styles.body}>No protocols added yet.</Text>
        ) : (
          <>
            <Text style={styles.count}>{protocols.length}</Text>
            <Text style={styles.muted}>{protocols.length === 1 ? 'Saved protocol' : 'Saved protocols'}</Text>
            {protocols.slice(0, 5).map(item => (
              <View style={styles.protocolRow} key={item.id}>
                <Text style={styles.protocolName}>{item.name}</Text>
                <Text style={styles.muted}>{item.compound}</Text>
              </View>
            ))}
            {protocols.length > 5 && <Text style={styles.muted}>And {protocols.length - 5} more...</Text>}
          </>
        )}
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.push('/protocols')}>
          <Text style={styles.buttonText}>{protocols.length ? 'View protocols' : 'Add your first protocol'}</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming next</Text>
        <Text style={styles.body}>Completion tracking and reminders are planned for future versions. This screen shows scheduled records only, not whether an activity was completed.</Text>
      </View>
      <Text style={styles.disclaimer}>Prototype only. Saved test records are stored on this device, not backed up or synced. Do not enter sensitive health information. Not medical advice or a dosing recommendation.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 36, backgroundColor: theme.background },
  eyebrow: { color: theme.teal, fontWeight: '800', letterSpacing: 1.4, fontSize: 12, marginBottom: 12 },
  heading: { fontSize: 30, fontWeight: '800', color: theme.navy },
  subtitle: { color: theme.slate, fontSize: 16, marginTop: 8, marginBottom: 24, lineHeight: 23 },
  card: { padding: 20, borderRadius: 16, backgroundColor: theme.white, borderColor: theme.border, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.navy, marginBottom: 12 },
  body: { color: theme.text, fontSize: 15, lineHeight: 22 },
  topGap: { marginTop: 12 },
  scheduleTime: { color: theme.teal, fontWeight: '800', fontSize: 17, width: 65 },
  scheduleDetails: { flex: 1 },
  count: { fontSize: 38, fontWeight: '800', color: theme.navy },
  protocolRow: { borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 12 },
  protocolName: { fontSize: 16, fontWeight: '700', color: theme.navy },
  muted: { color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  button: { backgroundColor: theme.navy, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 16 },
  buttonText: { color: theme.white, fontWeight: '700', fontSize: 15 },
  disclaimer: { color: theme.muted, fontSize: 12, marginTop: 12, lineHeight: 19 },
});
