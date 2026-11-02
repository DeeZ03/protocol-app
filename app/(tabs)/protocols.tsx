import { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme';

type Protocol = { id: string; name: string; compound: string; schedule: string; createdAt: string };
const STORAGE_KEY = 'protocol-app:test-protocols:v1';

export default function Protocols() {
  const [items, setItems] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [compound, setCompound] = useState('');
  const [schedule, setSchedule] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (active) setItems(value ? JSON.parse(value) as Protocol[] : []);
      })
      .catch(() => Alert.alert('Unable to load', 'Your saved test protocols could not be loaded.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const openEdit = (entry: Protocol) => {
    setEditingId(entry.id);
    setName(entry.name);
    setCompound(entry.compound);
    setSchedule(entry.schedule);
    setEditing(true);
  };

  const close = () => {
    setEditing(false);
    setEditingId(null);
    setName('');
    setCompound('');
    setSchedule('');
  };

  const save = async () => {
    if (!name.trim() || !compound.trim() || !schedule.trim()) {
      Alert.alert('Missing information', 'Enter a name, compound and schedule to continue.');
      return;
    }
    if (saving) return;
    setSaving(true);
    const existing = editingId ? items.find(item => item.id === editingId) : undefined;
    if (editingId && !existing) {
      Alert.alert('Not found', 'This protocol is no longer available.');
      setSaving(false);
      return;
    }
    const entry: Protocol = {
      id: existing?.id ?? (Date.now().toString() + '-' + Math.random().toString(36).slice(2)),
      name: name.trim(),
      compound: compound.trim(),
      schedule: schedule.trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const next = existing ? items.map(item => item.id === existing.id ? entry : item) : [entry, ...items];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
      close();
    } catch {
      Alert.alert('Not saved', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (entry: Protocol) => {
    Alert.alert('Delete protocol?', `Remove "${entry.name}" from this device?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const next = items.filter(item => item.id !== entry.id);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setItems(next);
        } catch {
          Alert.alert('Unable to delete', 'Please try again.');
        }
      } },
    ]);
  };

  return (
    <View style={styles.page}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>YOUR ROUTINES</Text>
          <Text style={styles.heading}>Protocols</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.addButton} onPress={() => { setEditingId(null); setName(''); setCompound(''); setSchedule(''); setEditing(true); }}>
          <Text style={styles.addText}>+ Add</Text>
        </Pressable>
      </View>
      <Text style={styles.intro}>Create and keep track of your own protocol records.</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>{loading ? 'Loading...' : 'No protocols yet'}</Text>
            <Text style={styles.detail}>Tap Add to create your first protocol record.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} onPress={() => openEdit(item)} hitSlop={10}>
                  <Text style={styles.edit}>Edit</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`} onPress={() => remove(item)} hitSlop={10}>
                  <Text style={styles.delete}>Delete</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.detail}>Compound: {item.compound}</Text>
            <Text style={styles.detail}>Schedule: {item.schedule}</Text>
          </View>
        )}
        ListFooterComponent={<Text style={styles.disclaimer}>Prototype for testing only. Do not enter sensitive personal health information. No medical advice or dosing recommendations are provided. Records are stored on this device and are not synced or backed up.</Text>}
      />
      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.heading}>{editingId ? 'Edit protocol' : 'Add protocol'}</Text>
            <Pressable accessibilityRole="button" onPress={close}><Text style={styles.cancel}>Cancel</Text></Pressable>
          </View>
          <Text style={styles.label}>Protocol name</Text>
          <TextInput style={styles.input} placeholder="e.g. My routine" value={name} onChangeText={setName} maxLength={80} />
          <Text style={styles.label}>Compound name</Text>
          <TextInput style={styles.input} placeholder="Enter a name" value={compound} onChangeText={setCompound} maxLength={100} />
          <Text style={styles.label}>Schedule (your own notes)</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="e.g. Days and times" value={schedule} onChangeText={setSchedule} multiline maxLength={250} />
          <Text style={styles.help}>This records information you enter. It does not calculate or recommend a dose.</Text>
          <Pressable accessibilityRole="button" disabled={saving} style={[styles.saveButton, saving && styles.disabled]} onPress={save}>
            <Text style={styles.saveText}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Save protocol'}</Text>
          </Pressable>
        </KeyboardAvoidingView>
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
  emptyCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.white, padding: 22 },
  card: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.white, padding: 18, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 9 },
  cardTitle: { color: theme.navy, fontWeight: '700', fontSize: 18, flexShrink: 1 },
  detail: { color: theme.slate, fontSize: 14, lineHeight: 22, marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  edit: { color: theme.teal, fontWeight: '700' },
  delete: { color: '#B42318', fontWeight: '600' },
  disclaimer: { fontSize: 12, color: theme.muted, lineHeight: 19, marginTop: 16 },
  modal: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 22, paddingTop: 28 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  cancel: { color: theme.teal, fontSize: 16, fontWeight: '700' },
  label: { color: theme.navy, fontWeight: '700', fontSize: 15, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, backgroundColor: theme.white, padding: 13, fontSize: 16, color: theme.text, marginBottom: 20 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  help: { fontSize: 13, color: theme.muted, lineHeight: 20, marginBottom: 22 },
  saveButton: { backgroundColor: theme.navy, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveText: { color: theme.white, fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
