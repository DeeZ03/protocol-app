import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';

const icons = {
  index: 'home-outline',
  protocols: 'calendar-outline',
  health: 'heart-outline',
  library: 'book-outline',
  community: 'people-outline',
} as const;

export default function TabLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: theme.navy },
      headerTintColor: theme.white,
      headerTitleStyle: { fontWeight: '700' },
      tabBarActiveTintColor: theme.teal,
      tabBarInactiveTintColor: theme.muted,
      tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 5 },
      tabBarIcon: ({ color, size }) => (
        <Ionicons name={icons[route.name as keyof typeof icons]} size={size} color={color} />
      ),
    })}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="protocols" options={{ title: 'Protocols' }} />
      <Tabs.Screen name="health" options={{ title: 'Health' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
    </Tabs>
  );
}
