import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { AxisColors, FontFamily } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AxisColors.primary,
        tabBarInactiveTintColor: AxisColors.textSecondary,
        tabBarStyle: {
          backgroundColor: AxisColors.background,
          borderTopColor: AxisColors.border,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.sans,
          fontSize: 11,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
