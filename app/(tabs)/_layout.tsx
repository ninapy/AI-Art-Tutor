import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../../constants/theme';

function TabIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    home: '🏠',
    brush: '🎨',
    history: '📋',
  };
  return <Text>{icons[name] || '●'}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.background },
        headerTitleStyle: { fontWeight: '700', color: COLORS.white },
        headerShadowVisible: false,
        tabBarStyle: { 
          backgroundColor: COLORS.cardBackground, 
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textGray,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <TabIcon name="home" />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: () => <TabIcon name="brush" />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: () => <TabIcon name="history" />,
        }}
      />
    </Tabs>
  );
}
