import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = { title: string; description: string };

export function SectionScreen({ title, description }: Props) {
  return (
    <View style={styles.page}>
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.card}>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.note}>Coming in a future version. This screen uses demo content only.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20, backgroundColor: theme.background },
  heading: { fontSize: 26, fontWeight: '800', color: theme.navy, marginBottom: 16 },
  card: { backgroundColor: theme.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border },
  description: { fontSize: 16, lineHeight: 24, color: theme.text },
  note: { marginTop: 16, fontSize: 13, color: theme.muted },
});
