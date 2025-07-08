import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui';

interface QuickActionButtonProps {
  title: string;
  icon: string;
  onPress: () => void;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  icon,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Card style={styles.quickActionCard}>
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.quickActionContent}>
          <FontAwesome 
            name={icon as any} 
            size={28} 
            color={colors.primary} 
            style={styles.quickActionIcon}
          />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  quickActionCard: {
    width: '48%',
    marginBottom: 12,
  },
  quickActionButton: {
    padding: 16,
    alignItems: 'center',
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 