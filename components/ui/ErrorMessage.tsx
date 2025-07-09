import React from 'react';
import { Text } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography } from '@/constants/Theme';

interface ErrorMessageProps {
  message?: string;
  style?: any;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!message) return null;

  return (
    <Text style={[{ ...typography.caption, color: colors.error, marginTop: 4 }, style]}>
      {message}
    </Text>
  );
}; 