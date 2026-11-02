import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../src/theme';

export default function Dashboard() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>PROTOCOL / OVERVIEW</Text>
      <Text style={styles.heading}>Your day, organised.</Text>
      <Text style={styles.subtitle}>A clear space for tracking your health routines.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's overview</Text>
        <Text style={styles.body}>No protocols added yet.</Text>
        <Text style={styles.muted}>Future versions will show your scheduled entries and reminders here.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Getting started</Text>
        <Text style={styles.body}>Explore the five tabs below. This first release is a navigation prototype.</Text>
      </View>
      <Text style={styles.disclaimer}>Prototype only. Not medical advice or a dosing recommendation.</Text>
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
  muted: { color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  disclaimer: { color: theme.muted, fontSize: 12, marginTop: 12 },
});
