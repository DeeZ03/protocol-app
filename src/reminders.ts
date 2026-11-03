import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dateKey, endDate, finalScheduledDate, isScheduled, ScheduledProtocol } from './protocolDates';

const PROTOCOL_KEY = 'protocol-app:test-protocols:v1';
const CHANNEL = 'protocol-reminders';
type Routine = ScheduledProtocol & { id: string; reminderEnabled?: boolean; endReminderEnabled?: boolean };

export async function requestProtocolReminderPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function syncReminders(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Only notifications from this app are scheduled by this prototype.
  await Notifications.cancelAllScheduledNotificationsAsync();
  const raw = await AsyncStorage.getItem(PROTOCOL_KEY);
  const routines: Routine[] = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(routines) || !routines.some(r => r.reminderEnabled === true)) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Protocol reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  const now = new Date();
  const finalDates = new Map<string, string | null>();
  for (const routine of routines) {
    if (routine.reminderEnabled === true && routine.endReminderEnabled === true) {
      finalDates.set(routine.id, finalScheduledDate(routine));
    }
  }
  // Rolling 14-day window refreshed when Dashboard opens or protocols change.
  for (let offset = 0; offset < 14; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    for (const routine of routines) {
      if (routine.reminderEnabled !== true || !isScheduled(routine, day) || !routine.time) continue;
      const [hour, minute] = routine.time.split(':').map(Number);
      const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
      if (when.getTime() <= now.getTime() + 30000) continue;
      const isFinal = routine.endReminderEnabled === true &&
        !!endDate(routine) && finalDates.get(routine.id) === dateKey(day);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Protocol',
          body: isFinal ? 'Your final scheduled activity is due.' : 'You have a scheduled activity.',
          sound: 'default',
          data: { screen: 'dashboard', protocolId: routine.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL },
      });
    }
  }
}
