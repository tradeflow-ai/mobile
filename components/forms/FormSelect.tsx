import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ViewStyle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, touchTargets, radius } from '@/constants/Theme';
import { Label, ErrorMessage, SearchBar } from '@/components/ui';
import { BaseFormFieldProps, SelectOption } from './index';

interface FormSelectProps extends BaseFormFieldProps {
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  style?: ViewStyle;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  required = false,
  placeholder = 'Select an option',
  options,
  disabled = false,
  style,
  rules,
}) => {
  const { control } = useFormContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const validationRules = {
    required: required ? (rules?.required || `${label || name} is required`) : undefined,
    ...rules,
  };

  const getSelectedLabel = (value: string) => {
    const option = options.find(opt => opt.value === value);
    return option?.label || placeholder;
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModalClose = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Label text={label} required={required} />}
      <Controller
        control={control}
        name={name}
        rules={validationRules}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  backgroundColor: colors.background,
                  borderColor: error ? colors.error : colors.border,
                },
              ]}
              onPress={() => setModalVisible(true)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.selectorText,
                  {
                    color: value ? colors.text : colors.placeholder,
                  },
                ]}
              >
                {getSelectedLabel(value)}
              </Text>
              <FontAwesome
                name="chevron-down"
                size={16}
                color={colors.placeholder}
              />
            </TouchableOpacity>

            <ErrorMessage message={error?.message} />

            <Modal
              visible={modalVisible}
              transparent
              animationType="fade"
              onRequestClose={handleModalClose}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={handleModalClose}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                  <SearchBar
                    placeholder="Search options..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchContainer}
                  />
                  
                  {filteredOptions.length === 0 ? (
                    <View style={styles.noResultsContainer}>
                      <Text style={[styles.noResultsText, { color: colors.placeholder }]}>
                        No results found
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={filteredOptions}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[styles.option, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            onChange(item.value);
                            handleModalClose();
                          }}
                        >
                          <Text style={[styles.optionText, { color: colors.text }]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={(item) => item.value}
                      showsVerticalScrollIndicator={false}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  selector: {
    borderWidth: 1,
    borderRadius: radius.m,
    ...spacing.helpers.paddingHorizontal('s'),
    paddingVertical: spacing.s + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargets.minimum,
  },
  selectorText: {
    fontSize: typography.sizes.caption, // Match TextInput formatting
    fontWeight: typography.weights.normal,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: radius.l,
    padding: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchContainer: {
    marginBottom: spacing.xs,
  },
  option: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: typography.sizes.caption, // Match TextInput formatting
    fontWeight: typography.weights.normal,
  },
  noResultsContainer: {
    paddingVertical: spacing.l,
    alignItems: 'center',
  },
  noResultsText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
}); 