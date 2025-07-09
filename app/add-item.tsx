import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography } from '@/constants/Theme';
import { FormProvider, FormTextInput, FormQuantitySelector, FormSelect, FormActions } from '@/components/forms';
import { useCreateInventoryItem, CreateInventoryData } from '@/hooks/useInventory';

// Form data interface matching CreateInventoryData
interface CreateInventoryFormData {
  name: string;
  quantity: number;
}

export default function AddItemScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const createInventoryMutation = useCreateInventoryItem();

  // Default form values
  const defaultFormValues: CreateInventoryFormData = {
    name: '',
    quantity: 0,
  };

  // Initialize form with react-hook-form
  const methods = useForm<CreateInventoryFormData>({
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  // Category options (you can expand this or make it dynamic)
  const categoryOptions = [
    { label: 'Tools', value: 'tools' },
    { label: 'Materials', value: 'materials' },
    { label: 'Equipment', value: 'equipment' },
    { label: 'Parts', value: 'parts' },
    { label: 'Consumables', value: 'consumables' },
    { label: 'Safety', value: 'safety' },
  ];

  // Unit options
  const unitOptions = [
    { label: 'Units', value: 'units' },
    { label: 'Pieces', value: 'pieces' },
    { label: 'Boxes', value: 'boxes' },
    { label: 'Meters', value: 'meters' },
    { label: 'Feet', value: 'feet' },
    { label: 'Liters', value: 'liters' },
    { label: 'Gallons', value: 'gallons' },
    { label: 'Kilograms', value: 'kilograms' },
    { label: 'Pounds', value: 'pounds' },
  ];

  const onSubmit = async (data: CreateInventoryFormData) => {
    try {
      // Transform form data to match CreateInventoryData interface
      const createData: Partial<CreateInventoryData> = {
        name: data.name.trim(),
        quantity: data.quantity,
      };

      await createInventoryMutation.mutateAsync(createData as CreateInventoryData);
      
      Alert.alert(
        'Success',
        'Inventory item created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating inventory item:', error);
      Alert.alert(
        'Error',
        'Failed to create inventory item. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Add New Item</Text>
            <Text style={[styles.subtitle, { color: colors.placeholder }]}>
              Create a new inventory item
            </Text>
          </View>
          <FormProvider methods={methods}>
            <View style={styles.form}>
              <FormTextInput
                name="name"
                label="Item Name"
                placeholder="Enter item name"
                autoCapitalize="words"
                autoCorrect={false}
                required
              />
              <FormQuantitySelector
                name="quantity"
                label="Quantity"
                placeholder="0"
                required
              />
            </View>
            <FormActions
              onSubmit={handleSubmit(onSubmit)}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitTitle="Create Item"
              cancelTitle="Cancel"
            />
          </FormProvider>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  title: {
    ...typography.h1,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
}); 