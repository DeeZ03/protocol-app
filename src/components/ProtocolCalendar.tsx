import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Animated, PanResponder } from 'react-native';
import { theme } from '../theme';
import { isScheduled } from '../protocolDates';

type Protocol = { id: string; name: string; compound: string; days?: number[]; time?: string; startDate?: string };
type Completion = { protocolId: string; date: string };
type Props = { protocols: Protocol[]; completions: Completion[] };
const key = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
const move = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 12);
const weekStart = (d: Date) => move(d, -((d.getDay() + 6) % 7));
const monthMove = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
const scheduled = (p: Protocol, d: Date) => isScheduled(p, d);

export function ProtocolCalendar({ protocols, completions }: Props) {
  const [week, setWeek] = useState(() => weekStart(new Date()));
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [selected, setSelected] = useState(() => new Date());
  const [view, setView] = useState<'month' | 'day' | null>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const timelineRef = useRef<ScrollView>(null);
  const monthSlide = useRef(new Animated.Value(0)).current;
  const monthGesture = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
    onPanResponderMove: (_, g) => monthSlide.setValue(g.dx * 0.65),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 45) setMonth(m => monthMove(m, g.dx < 0 ? 1 : -1));
      Animated.spring(monthSlide, { toValue: 0, useNativeDriver: true, tension: 95, friction: 12 }).start();
    },
    onPanResponderTerminate: () => Animated.spring(monthSlide, { toValue: 0, useNativeDriver: true }).start(),
  })).current;
  const gesture = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
    onPanResponderMove: (_, g) => slide.setValue(g.dx * 0.65),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 45) {
        setWeek(w => move(w, g.dx < 0 ? 7 : -7));
      }
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, tension: 95, friction: 12 }).start();
    },
    onPanResponderTerminate: () => Animated.spring(slide, { toValue: 0, useNativeDriver: true }).start(),
  })).current;
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swipe = (direction: 'week' | 'month') => ({
    onTouchStart: (event: any) => { touch.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }; },
    onTouchEnd: (event: any) => {
      if (!touch.current) return;
      const dx = event.nativeEvent.pageX - touch.current.x;
      const dy = event.nativeEvent.pageY - touch.current.y;
      touch.current = null;
      if (Math.abs(dx) < 24 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      const delta = dx < 0 ? 1 : -1;
      if (direction === 'week') setWeek(w => move(w, delta * 7));
      else setMonth(m => monthMove(m, delta));
    },
  });
  const openDay = (date: Date) => { setSelected(date); setView('day'); };
  const statusColor = (p: Protocol, date: Date) => {
    if (hasCompletion(p, date)) return '#00C853';
    const now = new Date();
    if (key(date) < key(now) || (key(date) === key(now) && (p.time ?? '') < [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0')].join(':'))) return '#FF3040';
    return '#087CFF';
  };
  const dayEntries = protocols.filter(p => scheduled(p, selected)).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const firstOffset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weeks = Array.from({ length: 7 }, (_, i) => move(week, i));
  const hasCompletion = (p: Protocol, date: Date) => completions.some(c => c.protocolId === p.id && c.date === key(date));

  return (
    <View>
      <View style={styles.top}>
        <Text style={styles.title}>Your calendar</Text>
        <Pressable accessibilityRole="button" onPress={() => { setMonth(new Date(week.getFullYear(), week.getMonth(), 1, 12)); setView('month'); }}>
          <Text style={styles.link}>Expand month ↗</Text>
        </Pressable>
      </View>
      <Text style={styles.caption}>{week.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} · Swipe to change week</Text>
      <View {...gesture.panHandlers} style={styles.swipeArea}>
      <Animated.View style={[styles.week, { transform: [{ translateX: slide }] }]}>
        {weeks.map(date => {
          const count = protocols.filter(p => scheduled(p, date)).length;
          const done = protocols.filter(p => scheduled(p, date) && hasCompletion(p, date)).length;
          const isToday = key(date) === key(new Date());
          return (
            <Pressable key={key(date)} accessibilityRole="button" accessibilityLabel={'View ' + date.toDateString()} onPress={() => openDay(date)} style={[styles.day, isToday && styles.today]}>
              <Text style={[styles.weekLabel, isToday && styles.todayText]}>{date.toLocaleDateString('en-GB', { weekday: 'short' })}</Text>
              <Text style={[styles.dayNumber, isToday && styles.todayText]}>{date.getDate()}</Text>
              <View style={[styles.dot, count ? { backgroundColor: done === count ? '#00C853' : key(date) < key(new Date()) ? '#FF3040' : '#087CFF' } : styles.noDot]} />
            </Pressable>
          );
        })}
      </Animated.View>
      </View>
      <Text style={styles.caption}>Tap any day for its 24-hour schedule. Blue: scheduled · Green: completed · Red: past not recorded · Hollow: empty.</Text>
      <Modal visible={view !== null} animationType="slide" onRequestClose={() => setView(null)}>
        <View style={styles.modal}>
          <View style={styles.modalTop}>
            <Pressable onPress={() => setView(view === 'day' ? 'month' : null)} accessibilityRole="button"><Text style={styles.link}>{view === 'day' ? '‹ Month' : 'Close'}</Text></Pressable>
            <Text style={styles.title}>{view === 'month' ? 'Calendar' : 'Daily timeline'}</Text>
            <Pressable onPress={() => setView(null)} accessibilityRole="button"><Text style={styles.link}>Done</Text></Pressable>
          </View>
          {view === 'month' ? (
            <View {...monthGesture.panHandlers} style={styles.monthWrap}>
              <Animated.View style={{ transform: [{ translateX: monthSlide }] }}>
              <Text style={styles.monthHeading}>{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Text>
              <Text style={styles.caption}>Swipe left or right to change month</Text>
              <View style={styles.monthGrid}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => <Text key={label} style={styles.gridHeading}>{label}</Text>)}
                {Array.from({ length: firstOffset }, (_, i) => <View key={'blank' + i} style={styles.monthCell} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const date = new Date(month.getFullYear(), month.getMonth(), i + 1, 12);
                  const count = protocols.filter(p => scheduled(p, date)).length;
                  const done = protocols.filter(p => scheduled(p, date) && hasCompletion(p, date)).length;
                  return <Pressable key={i} style={[styles.monthCell, key(date) === key(new Date()) && styles.today]} onPress={() => openDay(date)} accessibilityRole="button" accessibilityLabel={'View ' + date.toDateString()}>
                    <Text style={styles.monthNumber}>{i + 1}</Text>
                    <View style={[styles.dot, count ? { backgroundColor: done === count ? '#00C853' : key(date) < key(new Date()) ? '#FF3040' : '#087CFF' } : styles.noDot]} />
                  </Pressable>;
                })}
              </View>
              </Animated.View>
            </View>
          ) : (
            <ScrollView ref={timelineRef} contentContainerStyle={styles.timeline} onLayout={() => { const first = dayEntries[0]; if (first?.time) timelineRef.current?.scrollTo({ y: Math.max(0, Number(first.time.slice(0, 2)) * 68 - 120), animated: false }); }}>
              <Text style={styles.monthHeading}>{selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              <Text style={styles.caption}>{dayEntries.filter(p => hasCompletion(p, selected)).length} of {dayEntries.length} completed · Scroll through 24 hours</Text>
              {Array.from({ length: 24 }, (_, hour) => {
                const entries = dayEntries.filter(p => Number(p.time?.slice(0, 2)) === hour);
                return <View key={hour} style={styles.hourRow}>
                  <Text style={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</Text>
                  <View style={styles.hourContent}>
                    {entries.map(p => <View key={p.id} style={[styles.entry, { borderColor: statusColor(p, selected) }]}>
                      <Text style={styles.entryTitle}>{p.time} · {p.name}</Text>
                      <Text style={styles.caption}>{p.compound} · {hasCompletion(p, selected) ? 'Marked completed' : statusColor(p, selected) === '#FF3040' ? 'Not recorded' : 'Scheduled'}</Text>
                    </View>)}
                  </View>
                </View>;
              })}
              <Text style={styles.caption}>Completion is self-reported. This calendar does not provide medical advice or reminders.</Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: theme.navy },
  link: { color: theme.teal, fontWeight: '700', fontSize: 14 },
  caption: { color: theme.muted, fontSize: 12, lineHeight: 19, marginTop: 9 },
  swipeArea: { paddingVertical: 16, minHeight: 130 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  day: { alignItems: 'center', borderRadius: 12, paddingVertical: 11, flex: 1, marginHorizontal: 2 },
  today: { backgroundColor: '#E2F4F4' },
  todayText: { color: theme.navy, fontWeight: '800' },
  weekLabel: { fontSize: 11, color: theme.slate },
  dayNumber: { fontSize: 17, color: theme.navy, fontWeight: '700', marginTop: 7 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 8, borderWidth: 1, borderColor: '#FFFFFF', elevation: 2 },
  noDot: { backgroundColor: 'transparent', borderColor: '#9AAABD', borderWidth: 1.5, elevation: 0 },
  modal: { flex: 1, backgroundColor: theme.background, paddingTop: 42, paddingHorizontal: 18 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  monthWrap: { flex: 1 },
  monthHeading: { fontSize: 22, fontWeight: '800', color: theme.navy, marginBottom: 6 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 24 },
  gridHeading: { width: '14.2857%', textAlign: 'center', color: theme.slate, fontSize: 12, fontWeight: '700', marginBottom: 16 },
  monthCell: { width: '14.2857%', minHeight: 59, alignItems: 'center', paddingTop: 9, borderRadius: 10 },
  monthNumber: { color: theme.navy, fontSize: 16, fontWeight: '600' },
  timeline: { paddingBottom: 60 },
  hourRow: { flexDirection: 'row', minHeight: 55, borderTopWidth: 1, borderColor: theme.border, paddingVertical: 8 },
  hourLabel: { width: 55, color: theme.slate, fontSize: 13 },
  hourContent: { flex: 1, gap: 6 },
  entry: { backgroundColor: '#E2F4F4', borderLeftWidth: 3, borderColor: theme.teal, borderRadius: 8, padding: 11 },
  entryTitle: { color: theme.navy, fontWeight: '700', fontSize: 14 },
});
