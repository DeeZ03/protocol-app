import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const REMINDER_KEY = 'protocol-app:reminders-enabled:v1';
const PROTOCOL_KEY = 'protocol-app:test-protocols:v1';
type Routine = { id: string; days?: number[]; time?: string; startDate?: string };
const localKey = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

export async function syncReminders(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const enabled = (await AsyncStorage.getItem(REMINDER_KEY)) === 'true';
  // All scheduled notifications are owned by Protocol in this prototype.
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await Notifications.setNotificationChannelAsync('protocol-reminders', {
    name: 'Protocol reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  const raw = await AsyncStorage.getItem(PROTOCOL_KEY);
  const routines: Routine[] = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(routines)) return;
  const now = new Date();
  // Local, rolling 14-day window; refreshed when app is opened or protocols change.
  for (let offset = 0; offset < 14; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    const weekday = (day.getDay() + 6) % 7;
    for (const routine of routines) {
      if (!Array.isArray(routine.days) || !routine.days.includes(weekday) ||
          !routine.time || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(routine.time) ||
          (routine.startDate && routine.startDate > localKey(day))) continue;
      const [hour, minute] = routine.time.split(':').map(Number);
      const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
      if (when.getTime() <= now.getTime() + 30000) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Protocol', body: 'You have a scheduled activity.', sound: 'default', data: { screen: 'dashboard' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: 'protocol-reminders' },
      });
    }
  }
}

export async function enableReminders(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await Notifications.requestPermissionsAsync();
  if (!result.granted) return false;
  await AsyncStorage.setItem(REMINDER_KEY, 'true');
  await syncReminders();
  return true;
}

export async function disableReminders(): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, 'false');
  await Notifications.cancelAllScheduledNotificationsAsync();
}
