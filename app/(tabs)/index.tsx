import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme';

type Protocol = { id: string; name: string; compound: string; schedule: string; createdAt: string };
const STORAGE_KEY = 'protocol-app:test-protocols:v1';

export default function Dashboard() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
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

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>PROTOCOL / OVERVIEW</Text>
      <Text style={styles.heading}>Your day, organised.</Text>
      <Text style={styles.subtitle}>A clear space for tracking your health routines.</Text>
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
        <Text style={styles.body}>Scheduling, reminders and activity tracking will appear here as we develop Protocol.</Text>
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
  count: { fontSize: 38, fontWeight: '800', color: theme.navy },
  protocolRow: { borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 12 },
  protocolName: { fontSize: 16, fontWeight: '700', color: theme.navy },
  muted: { color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  button: { backgroundColor: theme.navy, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 16 },
  buttonText: { color: theme.white, fontWeight: '700', fontSize: 15 },
  disclaimer: { color: theme.muted, fontSize: 12, marginTop: 12, lineHeight: 19 },
});
