import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Header } from '@/components/Header';

export default function ItemModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    category: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity must be a valid number';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    Alert.alert(
      'Item Saved',
      'Your inventory item has been saved successfully!',
      [{ text: 'OK' }]
    );
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          <Header
            title="Add New Item"
            rightAction={{
              text: 'Save',
              onPress: handleSave,
            }}
          />

          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: errors.name ? colors.error : colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter item name"
                placeholderTextColor={colors.placeholder}
              />
              {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: errors.description ? colors.error : colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Enter item description"
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={3}
              />
              {errors.description && <Text style={[styles.errorText, { color: colors.error }]}>{errors.description}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Quantity *</Text>
              <TextInput
                style={[styles.input, { borderColor: errors.quantity ? colors.error : colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={formData.quantity}
                onChangeText={(value) => updateFormData('quantity', value)}
                placeholder="Enter quantity"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
              />
              {errors.quantity && <Text style={[styles.errorText, { color: colors.error }]}>{errors.quantity}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
              <TextInput
                style={[styles.input, { borderColor: errors.category ? colors.error : colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={formData.category}
                onChangeText={(value) => updateFormData('category', value)}
                placeholder="Enter category (e.g., Electronics, Furniture)"
                placeholderTextColor={colors.placeholder}
              />
              {errors.category && <Text style={[styles.errorText, { color: colors.error }]}>{errors.category}</Text>}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => Alert.alert('Cancel', 'Changes will be lost')}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  form: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 40,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
