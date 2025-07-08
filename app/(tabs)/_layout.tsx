import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { typography, spacing, shadows } from '@/constants/Theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: spacing.xs,
          paddingTop: spacing.xs,
          height: 60 + spacing.xs, // Standard tab bar height + spacing
          ...shadows.subtle(colorScheme),
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: typography.sizes.caption - 1, // Slightly smaller for tab labels
          fontWeight: typography.weights.medium,
          marginTop: 2,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome name="list" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome name="map" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
