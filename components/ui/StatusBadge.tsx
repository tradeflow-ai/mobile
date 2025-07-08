import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface StatusBadgeProps {
  status: 'available' | 'low_stock' | 'out_of_stock';
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getBadgeStyle = () => {
    let backgroundColor = colors.success;
    let textColor = colors.background; // white/black based on theme

    switch (status) {
      case 'available':
        backgroundColor = colors.success;
        textColor = colors.background;
        break;
      case 'low_stock':
        backgroundColor = colors.warning;
        textColor = colors.text;
        break;
      case 'out_of_stock':
        backgroundColor = colors.error;
        textColor = colors.background;
        break;
    }

    return {
      backgroundColor,
      color: textColor,
    };
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <View style={[styles.badge, styles[size], { backgroundColor: badgeStyle.backgroundColor }]}>
      <Text style={[styles.text, styles[`${size}Text`], { color: badgeStyle.color }]}>
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
}); 