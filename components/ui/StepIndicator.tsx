/**
 * TradeFlow Mobile App - StepIndicator Component
 * 
 * A themeable step indicator component that shows progress through a multi-step flow
 * with three horizontal lines that fill in as the user progresses through each step.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  showLabels?: boolean;
  containerStyle?: ViewStyle;
  completedColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  size?: 'small' | 'medium' | 'large';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps = 3, // Default to 3 steps for the new line format
  stepLabels = [],
  showLabels = false,
  containerStyle,
  completedColor,
  activeColor,
  inactiveColor,
  size = 'medium',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get theme colors with fallbacks
  const getCompletedColor = () => completedColor || colors.primary;
  const getActiveColor = () => activeColor || colors.primary;
  const getInactiveColor = () => inactiveColor || colors.border;

  const getLineHeight = (): number => {
    switch (size) {
      case 'small':
        return 4;
      case 'large':
        return 8;
      default:
        return 6;
    }
  };

  const renderLine = (stepIndex: number) => {
    const isCompleted = stepIndex < currentStep;
    const isActive = stepIndex === currentStep;
    const shouldFill = isCompleted || isActive;
    
    let lineColor = getInactiveColor();
    if (shouldFill) {
      lineColor = isCompleted ? getCompletedColor() : getActiveColor();
    }

    const lineHeight = getLineHeight();

    return (
      <View key={stepIndex} style={styles.lineContainer}>
        {/* Step line */}
        <View
          style={[
            styles.stepLine,
            {
              height: lineHeight,
              backgroundColor: shouldFill ? lineColor : 'transparent',
              borderWidth: shouldFill ? 0 : 1,
              borderColor: lineColor,
              borderRadius: lineHeight / 2,
            },
          ]}
        />
        
        {/* Step label */}
        {showLabels && stepLabels[stepIndex] && (
          <Text style={[styles.stepLabel, { color: colors.text }]}>
            {stepLabels[stepIndex]}
          </Text>
        )}
      </View>
    );
  };

  // Ensure we always show exactly 3 lines
  const linesToShow = Math.max(totalSteps, 3);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.linesRow}>
        {Array.from({ length: linesToShow }, (_, index) => renderLine(index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  linesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  lineContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  stepLine: {
    width: '100%',
    // Dynamic height set in component
  },
  stepLabel: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs / 2,
  },
}); 