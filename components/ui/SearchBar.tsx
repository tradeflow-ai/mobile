import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
  onClear,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <FontAwesome name="search" size={16} color={colors.placeholder} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 && (
        <FontAwesome 
          name="times" 
          size={16} 
          color={colors.placeholder} 
          style={styles.clearIcon}
          onPress={handleClear}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearIcon: {
    marginLeft: 8,
    padding: 4,
  },
}); 