import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { spacing, shadows, radius } from '@/constants/Theme';

type SpacingKey = 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: SpacingKey | number;
  shadow?: 'none' | 'subtle' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'm',
  shadow = 'subtle',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Handle padding - can be theme key or custom number
  const paddingValue = typeof padding === 'string' ? spacing[padding as SpacingKey] : padding;
  
  // Handle shadow - use theme shadows or none
  const shadowStyle = shadow === 'none' ? {} : shadows[shadow](colorScheme);

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      padding: paddingValue,
    },
    shadowStyle,
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.m,
    borderWidth: 1,
    marginBottom: spacing.s + 4, // 12px to maintain existing spacing
  },
}); 