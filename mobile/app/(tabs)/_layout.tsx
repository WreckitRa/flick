import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.flickTeal,
        tabBarInactiveTintColor: colors.gray[600],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}

