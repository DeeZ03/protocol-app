import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';
import { useLanguage } from '../../src/i18n';

const icons = {
  index: 'home-outline',
  protocols: 'calendar-outline',
  health: 'heart-outline',
  library: 'book-outline',
  community: 'people-outline',
} as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: theme.navy },
      headerTintColor: theme.white,
      headerTitleStyle: { fontWeight: '700' },
      tabBarActiveTintColor: theme.teal,
      tabBarInactiveTintColor: theme.muted,
      tabBarStyle: {
        height: 60 + Math.max(insets.bottom, 8),
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 5,
      },
      tabBarIcon: ({ color, size }) => (
        <Ionicons name={icons[route.name as keyof typeof icons]} size={size} color={color} />
      ),
    })}>
      <Tabs.Screen name="index" options={{ title: t('tab.dashboard') }} />
      <Tabs.Screen name="protocols" options={{ title: t('tab.protocols') }} />
      <Tabs.Screen name="health" options={{ title: t('tab.health') }} />
      <Tabs.Screen name="library" options={{ title: t('tab.library') }} />
      <Tabs.Screen name="community" options={{ title: t('tab.community') }} />
    </Tabs>
  );
}
