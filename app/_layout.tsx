import { Stack } from 'expo-router';
import { theme } from '../src/theme';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />;
}
