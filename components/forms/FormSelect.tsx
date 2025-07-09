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
import { Label, ErrorMessage } from '@/components/ui';
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

  const validationRules = {
    required: required ? (rules?.required || `${label || name} is required`) : undefined,
    ...rules,
  };

  const getSelectedLabel = (value: string) => {
    const option = options.find(opt => opt.value === value);
    return option?.label || placeholder;
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
              onRequestClose={() => setModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setModalVisible(false)}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                  <FlatList
                    data={options}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.option, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          onChange(item.value);
                          setModalVisible(false);
                        }}
                      >
                        <Text style={[styles.optionText, { color: colors.text }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.value}
                  />
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
    ...typography.body,
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
  option: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
  },
  optionText: {
    ...typography.body,
  },
}); 