import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing } from '@/constants/Theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof FontAwesome.glyphMap;
  title: string;
  description: string;
  createButtonText?: string;
  handleOnCreatePress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  createButtonText,
  handleOnCreatePress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.emptyState}>
      <FontAwesome name={icon} size={48} color={colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
        {description}
      </Text>
      {createButtonText && handleOnCreatePress && (
        <Button
          variant="primary"
          onPress={handleOnCreatePress}
          title={createButtonText!}
          style={styles.createButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.m,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.l,
    lineHeight: 20,
  },
  createButton: {
    marginTop: spacing.m,
  },
}); 