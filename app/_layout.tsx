import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { theme } from '../src/theme';

export default function RootLayout() {
  const router = useRouter();
  useEffect(() => {
    const openFromNotification = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      if (data?.screen !== 'dashboard') return;
      const protocolId = typeof data.protocolId === 'string' ? data.protocolId : '';
      router.push({ pathname: '/', params: protocolId ? { highlight: protocolId } : {} });
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(openFromNotification);
    // Handle tapping a notification that launched the app from a closed state.
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) openFromNotification(response);
    }).catch(() => {});
    return () => subscription.remove();
  }, [router]);
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />;
}
