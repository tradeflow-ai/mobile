/**
 * TradeFlow Mobile App - Supplier Preferences Onboarding Step
 * 
 * Final step of onboarding flow where users configure their preferred suppliers,
 * set preference weights, and customize supplier selection criteria.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesome } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormProvider } from '@/components/forms';
import { supplierPreferencesSchema } from '@/components/forms/validationSchemas';
import { typography, spacing, touchTargets } from '@/constants/Theme';
import { useOnboarding } from './_layout';

const SUPPLIER_OPTIONS = [
  { id: 'home-depot', label: 'Home Depot', value: 'home-depot' },
  { id: 'lowes', label: 'Lowe\'s', value: 'lowes' },
  { id: 'other', label: 'Other', value: 'other' },
];

const DEFAULT_PRIORITY_ORDER = [
  { id: 'price', label: 'Price', priority: 1 },
  { id: 'location', label: 'Location', priority: 2 },
  { id: 'stock', label: 'Stock Availability', priority: 3 },
];

export default function SuppliersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { saveStepData, navigateToNextStep, existingPreferences } = useOnboarding();

  // Transform preferences to form data
  const getInitialSuppliers = () => {
    console.log('🔍 DEBUG: existingPreferences:', existingPreferences);
    console.log('🔍 DEBUG: preferred_suppliers:', existingPreferences?.preferred_suppliers);
    
    if (existingPreferences) {
      const suppliers = [];
      
      // Check new preferred_suppliers field first
      if (existingPreferences.preferred_suppliers && existingPreferences.preferred_suppliers.length > 0) {
        const transformedSuppliers = existingPreferences.preferred_suppliers.map(s => s.toLowerCase().replace(/\s+/g, '-'));
        console.log('🔍 DEBUG: Transformed suppliers:', transformedSuppliers);
        suppliers.push(...transformedSuppliers);
      } else {
        console.log('🔍 DEBUG: No preferred_suppliers found, checking fallback fields');
        // Fallback to deprecated fields for backward compatibility
        if (existingPreferences.primary_supplier) {
          suppliers.push(existingPreferences.primary_supplier.toLowerCase().replace(/\s+/g, '-'));
        }
        if (existingPreferences.secondary_suppliers) {
          suppliers.push(...existingPreferences.secondary_suppliers.map(s => s.toLowerCase().replace(/\s+/g, '-')));
        }
      }
      
      console.log('🔍 DEBUG: Final suppliers array:', suppliers);
      return suppliers.length > 0 ? suppliers : ['home-depot'];
    }
    console.log('🔍 DEBUG: No existingPreferences, using default');
    return ['home-depot'];
  };

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(getInitialSuppliers());
  const [priorityOrder, setPriorityOrder] = useState(() => {
    if (existingPreferences && existingPreferences.supplier_priority_order && existingPreferences.supplier_priority_order.length > 0) {
      return existingPreferences.supplier_priority_order;
    }
    return DEFAULT_PRIORITY_ORDER;
  });

  const methods = useForm({
    resolver: zodResolver(supplierPreferencesSchema),
    defaultValues: {
      preferredSuppliers: getInitialSuppliers(),
      priorityOrder: DEFAULT_PRIORITY_ORDER,
    },
    mode: 'onChange',
  });

  const { handleSubmit, setValue, getValues, formState: { errors } } = methods;

  const onSubmit = async (data: any) => {
    try {
      // Create final data structure for this step
      const finalData = {
        ...data,
        preferredSuppliers: selectedSuppliers,
        priorityOrder: priorityOrder,
      };
      
      // Save step data and navigate, letting the layout handle completion
      saveStepData('suppliers', finalData);
      navigateToNextStep();
      
    } catch (error) {
      console.error('Error saving supplier preferences:', error);
      Alert.alert('Error', 'Failed to save supplier preferences. Please try again.');
    }
  };

  const onError = (errors: any) => {
    console.error('Supplier form validation errors:', errors);
  };

  const handleSkip = () => {
    // Navigate to completion without saving data
    navigateToNextStep();
  };

  const handleSupplierToggle = (supplierId: string) => {
    let newSelected: string[];
    
    if (supplierId === 'other') {
      // If "Other" is selected, deselect all others and only select "Other"
      newSelected = selectedSuppliers.includes('other') ? [] : ['other'];
    } else {
      // If Home Depot or Lowe's is selected
      if (selectedSuppliers.includes('other')) {
        // If "Other" was previously selected, deselect it and select this one
        newSelected = [supplierId];
      } else {
        // Normal toggle behavior for Home Depot and Lowe's
        newSelected = selectedSuppliers.includes(supplierId)
          ? selectedSuppliers.filter(id => id !== supplierId)
          : [...selectedSuppliers, supplierId];
      }
    }
    
    setSelectedSuppliers(newSelected);
    setValue('preferredSuppliers', newSelected);
  };

  const renderPriorityItem = ({ item, drag, isActive }: RenderItemParams<typeof DEFAULT_PRIORITY_ORDER[0]>) => (
    <TouchableOpacity
      style={[
        styles.priorityItem,
        { 
          backgroundColor: isActive ? colors.primary + '20' : colors.card,
          borderColor: colors.border,
          transform: [{ scale: isActive ? 1.05 : 1 }],
        }
      ]}
      onLongPress={drag}
      activeOpacity={0.8}
    >
      <View style={styles.priorityInfo}>
        <Text style={[styles.priorityNumber, { color: colors.primary }]}>
          {item.priority}
        </Text>
        <Text style={[styles.priorityLabel, { color: colors.text }]}>
          {item.label}
        </Text>
      </View>
      
      <View style={styles.dragHandle}>
        <FontAwesome name="bars" size={16} color={colors.placeholder} />
      </View>
    </TouchableOpacity>
  );

  const handleDragEnd = ({ data }: { data: typeof DEFAULT_PRIORITY_ORDER }) => {
    // Update priority numbers based on new order
    const updatedData = data.map((item, index) => ({
      ...item,
      priority: index + 1,
    }));
    
    setPriorityOrder(updatedData);
    setValue('priorityOrder', updatedData);
  };

  const showOtherWarning = selectedSuppliers.includes('other');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <FormProvider methods={methods}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              Supplier Preferences
            </Text>
            <Button
              title="Skip"
              variant="ghost"
              onPress={handleSkip}
              style={styles.skipButton}
            />
          </View>
          <Text style={[styles.description, { color: colors.placeholder }]}>
            Choose your preferred suppliers and set how the AI should prioritize decisions.
          </Text>

          {/* Supplier Selection */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Preferred Suppliers
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Select your preferred suppliers for parts and materials
            </Text>

            <View style={styles.suppliersList}>
              {SUPPLIER_OPTIONS.map((supplier) => (
                <TouchableOpacity
                  key={supplier.id}
                  style={[styles.supplierItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleSupplierToggle(supplier.id)}
                >
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onPress={() => handleSupplierToggle(supplier.id)}
                  />
                  <Text style={[styles.supplierLabel, { color: colors.text }]}>
                    {supplier.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {showOtherWarning && (
              <View style={[styles.noteContainer, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.noteText, { color: colors.warning }]}>
                  ⚠️ Note: Selecting "Other" means store locations will need to be entered manually when planning your route.
                </Text>
              </View>
            )}
          </Card>

          {/* Priority Order */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Decision Priority
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Press and hold to drag items. Most important at top, least important at bottom.
            </Text>

            <View style={styles.priorityContainer}>
              <DraggableFlatList
                data={priorityOrder}
                keyExtractor={(item) => item.id}
                renderItem={renderPriorityItem}
                onDragEnd={handleDragEnd}
                style={styles.priorityList}
                contentContainerStyle={styles.priorityListContent}
                scrollEnabled={false} // Disable internal scrolling since we're in a ScrollView
                activationDistance={10} // Make drag start quickly
              />
            </View>

            <View style={[styles.priorityHint, { backgroundColor: colors.card }]}>
              <Text style={[styles.priorityHintText, { color: colors.placeholder }]}>
                💡 Press and hold any item to drag it to a new position. The AI will prioritize suppliers based on this order.
              </Text>
            </View>
          </Card>

          <View style={styles.footer}>
            <Button
              title="Complete Setup"
              variant="primary"
              onPress={handleSubmit(onSubmit, onError)}
              style={styles.nextButton}
              disabled={selectedSuppliers.length === 0}
            />
          </View>
        </View>
      </FormProvider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.m,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  title: {
    ...typography.h2,
    flex: 1,
  },
  skipButton: {
    marginLeft: spacing.m,
  },
  description: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.caption,
    marginBottom: spacing.m,
  },
  suppliersList: {
    gap: spacing.s,
  },
  supplierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: 8,
    borderWidth: 1,
    ...touchTargets.styles.minimum,
  },
  supplierLabel: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.m,
  },
  noteContainer: {
    padding: spacing.m,
    borderRadius: 8,
    marginTop: spacing.m,
  },
  noteText: {
    ...typography.caption,
    fontWeight: '600',
  },
  priorityContainer: {
    minHeight: 180, // Ensure enough space for 3 items
  },
  priorityList: {
    flex: 1,
  },
  priorityListContent: {
    gap: spacing.s,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    borderRadius: 8,
    borderWidth: 1,
    ...touchTargets.styles.minimum,
  },
  priorityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityNumber: {
    ...typography.h4,
    fontWeight: 'bold',
    marginRight: spacing.m,
    minWidth: 24,
  },
  priorityLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  dragHandle: {
    padding: spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityHint: {
    marginTop: spacing.m,
    padding: spacing.s,
    borderRadius: 8,
  },
  priorityHintText: {
    ...typography.caption,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.l,
  },
  nextButton: {
    alignSelf: 'stretch',
  },
}); 