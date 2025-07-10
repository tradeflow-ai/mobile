/**
 * TradeFlow Mobile App - TabSelector Component
 * 
 * A themeable tab selector component that displays multiple options in a row format
 * with active/inactive states. Supports both simple string options and options with counts.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, touchTargets, radius } from '@/constants/Theme';

export interface TabOption {
  key: string;
  label: string;
  count?: number;
}

export interface TabSelectorProps {
  options: TabOption[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  options,
  selectedKey,
  onSelectionChange,
  containerStyle,
  tabStyle,
  textStyle,
  size = 'medium',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getContainerStyle = (): ViewStyle => {
    return {
      ...styles.container,
      ...containerStyle,
    };
  };

  const getTabStyle = (isActive: boolean): ViewStyle => {
    const baseStyle = styles.tab;
    
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = styles.tabSmall;
        break;
      case 'large':
        sizeStyle = styles.tabLarge;
        break;
      default:
        sizeStyle = styles.tabMedium;
        break;
    }
    
    const variantStyle: ViewStyle = {
      backgroundColor: isActive ? colors.primary : colors.card,
      borderColor: colors.border,
    };

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...tabStyle,
    };
  };

  const getTextStyle = (isActive: boolean): TextStyle => {
    const baseStyle = styles.tabText;
    
    let sizeStyle: TextStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = styles.tabTextSmall;
        break;
      case 'large':
        sizeStyle = styles.tabTextLarge;
        break;
      default:
        sizeStyle = styles.tabTextMedium;
        break;
    }
    
    const colorStyle: TextStyle = {
      color: isActive ? colors.background : colors.text,
    };

    return {
      ...baseStyle,
      ...sizeStyle,
      ...colorStyle,
      ...textStyle,
    };
  };

  const formatLabel = (option: TabOption): string => {
    if (option.count !== undefined) {
      return `${option.label} (${option.count})`;
    }
    return option.label;
  };

  const handlePress = (key: string) => {
    onSelectionChange(key);
  };

  return (
    <View style={getContainerStyle()}>
      {options.map((option, index) => {
        const isActive = option.key === selectedKey;
        
        return (
          <TouchableOpacity
            key={option.key}
            style={getTabStyle(isActive)}
            onPress={() => handlePress(option.key)}
            activeOpacity={0.7}
          >
            <Text style={getTextStyle(isActive)}>
              {formatLabel(option)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: radius.s,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    borderRadius: radius.s,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...touchTargets.styles.minimum,
  },
  // Size variants for tabs
  tabSmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
  },
  tabMedium: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  tabLarge: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  // Text styling
  tabText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Size variants for text
  tabTextSmall: {
    ...typography.caption,
    fontWeight: '600',
  },
  tabTextMedium: {
    ...typography.body,
    fontWeight: '600',
  },
  tabTextLarge: {
    ...typography.h4,
    fontWeight: '600',
  },
}); 