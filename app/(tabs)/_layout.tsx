import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { typography, spacing, shadows } from '@/constants/Theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : spacing.xs,
          paddingTop: spacing.xs,
          height: Platform.OS === 'ios' 
            ? 'auto' 
            : 60 + spacing.xs, // Standard tab bar height + spacing + safe area
          ...shadows.subtle(colorScheme),
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'ios' ? undefined : typography.sizes.caption - 1, // Slightly smaller for tab labels
          marginTop: Platform.OS === 'ios' ? undefined : 2,
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
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome name="briefcase" size={28} color={color} />,
        }}
      />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }: { color: string }) => <FontAwesome name="map" size={28} color={color} />,
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
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }: { color: string }) => <FontAwesome name="calendar" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
