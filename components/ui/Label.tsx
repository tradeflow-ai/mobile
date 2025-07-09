import React from 'react';
import { Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing } from '@/constants/Theme';

interface LabelProps {
  text: string;
  required?: boolean;
  style?: any;
}

export const Label: React.FC<LabelProps> = ({
  text,
  required = false,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Text style={[{ ...typography.h4, color: colors.text, marginBottom: spacing.xs }, style]}>
      {text}
      {required && <Text style={{ ...typography.h4, color: colors.error }}> *</Text>}
    </Text>
  );
}; 