/**
 * TradeFlow Mobile App - Plan Your Day Layout
 * 
 * This layout manages the new 2-step AI-powered daily planning workflow:
 * 1. Dispatcher Confirmation (Job prioritization and route optimization)
 * 2. Inventory Results (Parts analysis and hardware store job creation)
 * 
 * Features real-time agent status tracking and user confirmation between steps.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { touchTargets, spacing } from '@/constants/Theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PlanYourDayLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ErrorBoundary 
      fallbackTitle="Plan Your Day Error"
      fallbackMessage="Something went wrong with the daily planning workflow. Please try again or contact support if the problem persists."
      onRetry={() => {
        // Reset any relevant state here if needed
        console.log('Retrying Plan Your Day workflow...');
      }}
    >
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
            fontSize: 20,
            fontWeight: '600',
          },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="index"
          options={({ navigation }) => ({
            title: 'Plan Your Day',
            headerBackTitle: '',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{
                  ...touchTargets.styles.minimum,
                  ...spacing.helpers.paddingHorizontal('s'),
                  justifyContent: 'center',
                }}
              >
                <FontAwesome 
                  name="arrow-left" 
                  size={20} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            ),
          })}
        />
        
        <Stack.Screen 
          name="dispatcher-confirmation"
          options={({ navigation }) => ({
            presentation: 'modal',
            title: 'Confirm Schedule',
            headerBackTitle: '',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{
                  ...touchTargets.styles.minimum,
                  ...spacing.helpers.paddingHorizontal('s'),
                  justifyContent: 'center',
                }}
              >
                <FontAwesome 
                  name="arrow-left" 
                  size={20} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            ),
          })}
        />
        
        <Stack.Screen 
          name="inventory-results"
          options={({ navigation }) => ({
            presentation: 'modal',
            title: 'Final Plan',
            headerBackTitle: '',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{
                  ...touchTargets.styles.minimum,
                  ...spacing.helpers.paddingHorizontal('s'),
                  justifyContent: 'center',
                }}
              >
                <FontAwesome 
                  name="arrow-left" 
                  size={20} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            ),
          })}
        />
      </Stack>
    </ErrorBoundary>
  );
} 