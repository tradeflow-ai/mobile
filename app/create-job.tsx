import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, touchTargets } from '@/constants/Theme';
import { FormProvider, FormTextInput, FormSelect, FormQuantitySelector, FormActions, FormTimeInput, FormCheckbox, FormLocationPicker, SelectOption, FormValidationRules } from '@/components/forms';
import { Label, LocationData } from '@/components/ui';
import { SearchBar, NativeDatePicker } from '@/components/ui';
import { useCreateJob, CreateJobData } from '@/hooks/useJobs';
import { useInventory, useCreateInventoryItem, CreateInventoryData } from '@/hooks/useInventory';

// Job form interface - expanded to match Job Details
interface JobFormData {
  // Required fields
  title: string;
  description?: string;
  job_type: 'service' | 'inspection' | 'emergency' | 'maintenance' | 'delivery' | 'pickup' | 'hardware_store';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: LocationData;
  scheduled_date: Date; // Timestamp including date and time
  scheduled_date_time?: string; // Timestamp including date and time
  use_ai_scheduling: boolean;
  required_items: string[];
  estimated_duration?: number;
  // Optional fields
  notes?: string;
}

// Create inventory item form interface
interface CreateInventoryFormData {
  name: string;
  quantity: number;
}

// Default form values
const defaultFormValues: JobFormData = {
  title: '',
  description: '',
  job_type: 'service',
  priority: 'medium',
  location: {
    latitude: 0,
    longitude: 0,
    address: '',
  },
  scheduled_date: new Date(),
  use_ai_scheduling: false,
  required_items: [],
  estimated_duration: 60,
  notes: '',
};

// Job type options - expanded to match Job Details
const jobTypeOptions: SelectOption[] = [
  { label: 'Service Call', value: 'service' },
  { label: 'Inspection Visit', value: 'inspection' },
  { label: 'Emergency Service', value: 'emergency' },
  { label: 'Maintenance Service', value: 'maintenance' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Pickup', value: 'pickup' },
  { label: 'Hardware Store Run', value: 'hardware_store' },
];

// Priority options
const priorityOptions: SelectOption[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

export default function CreateJobScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Inventory modal state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCreateItemForm, setShowCreateItemForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form setup
  const methods = useForm<JobFormData>({
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const { handleSubmit, watch, setValue, formState: { isSubmitting } } = methods;

  // Form for creating new inventory items
  const createItemMethods = useForm<CreateInventoryFormData>({
    defaultValues: {
      name: '',
      quantity: 1,
    },
    mode: 'onChange',
  });

  const { handleSubmit: handleCreateSubmit, reset: resetCreateForm, formState: { isSubmitting: isCreatingItem } } = createItemMethods;

  // Data fetching
  const { data: inventoryItems = [] } = useInventory();
  const createJobMutation = useCreateJob();
  const createInventoryMutation = useCreateInventoryItem();

  // Watch form values for dependent logic
  const useAIScheduling = watch('use_ai_scheduling');
  const requiredItems = watch('required_items');

  // Form validation rules
  const titleRules: FormValidationRules = {
    minLength: { value: 3, message: 'Title must be at least 3 characters' },
    maxLength: { value: 100, message: 'Title must be less than 100 characters' },
  };

  const locationRules: FormValidationRules = {
    required: 'Location is required',
    validate: (value: LocationData) => {
      if (!value?.address || value.address.length < 5) {
        return 'Please select a valid location';
      }
      return true;
    },
  };



  // Inventory management functions
  const getInventoryItem = (itemId: string) => {
    return inventoryItems.find(item => item.id === itemId);
  };

  const handleAddExistingItem = (itemId: string) => {
    if (!requiredItems.includes(itemId)) {
      setValue('required_items', [...requiredItems, itemId]);
    }
    setShowAddItemModal(false);
    setSearchQuery('');
  };

  const handleRemoveItem = (itemId: string) => {
    setValue('required_items', requiredItems.filter(id => id !== itemId));
  };

  const handleShowCreateForm = () => {
    setShowCreateItemForm(true);
  };

  const handleCancelCreateItem = () => {
    setShowCreateItemForm(false);
    resetCreateForm();
  };

  const onCreateItemSubmit = async (data: CreateInventoryFormData) => {
    try {
      const createData: CreateInventoryData = {
        name: data.name.trim(),
        quantity: data.quantity,
        category: 'General',
        unit: 'each',
      };

      const newItem = await createInventoryMutation.mutateAsync(createData);
      setValue('required_items', [...requiredItems, newItem.id]);

      resetCreateForm();
      setShowCreateItemForm(false);
      setShowAddItemModal(false);
      setSearchQuery('');

      Alert.alert('Success', `"${newItem.name}" has been created and added to this job!`, [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      Alert.alert('Error', 'Failed to create inventory item. Please try again.', [{ text: 'OK' }]);
    }
  };

  const closeAddItemModal = () => {
    setShowAddItemModal(false);
    setShowCreateItemForm(false);
    setSearchQuery('');
    resetCreateForm();
  };

  const filteredInventoryItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !requiredItems.includes(item.id)
  );

  const onSubmit = async (data: JobFormData) => {
    try {
      // Create scheduled_date timestamp
      let scheduledDate = new Date(data.scheduled_date);
      
      // If using AI scheduling, set time to 00:00 (midnight) to let AI determine optimal time
      if (data.use_ai_scheduling) {
        scheduledDate.setHours(0, 0, 0, 0);
      }
      else if (data.scheduled_date_time) {
        console.log('Scheduled date time:', data.scheduled_date_time);
        const startTimeMatch = data.scheduled_date_time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
        if (!startTimeMatch) {
          Alert.alert('Error', 'Invalid start time format. Please select a valid time.');
          return;
        }

        let startHours = parseInt(startTimeMatch[1], 10);
        const startMinutes = parseInt(startTimeMatch[2], 10);
        const startPeriod = startTimeMatch[3].toUpperCase();

        if (startPeriod === 'PM' && startHours !== 12) startHours += 12;
        if (startPeriod === 'AM' && startHours === 12) startHours = 0;

        scheduledDate = new Date(data.scheduled_date);
        scheduledDate.setHours(startHours, startMinutes, 0, 0);
      }
      // If not using AI scheduling, use the user-selected date and time from the picker

      // Convert form data to CreateJobData format
      const createData: CreateJobData = {
        title: data.title.trim(),
        description: data.description?.trim(),
        address: data.location.address,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        job_type: data.job_type,
        priority: data.priority,
        scheduled_date: scheduledDate.toISOString(), // Store user-selected date/time
        estimated_duration: data.estimated_duration || 60,
        required_items: data.required_items.length > 0 ? data.required_items : undefined,
        notes: data.notes?.trim() || undefined,
        use_ai_scheduling: data.use_ai_scheduling,
      };

      const newJob = await createJobMutation.mutateAsync({ jobData: createData });
      
      Alert.alert('Success', 'Job created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Error', 'Failed to create job. Please try again.', [
        { text: 'OK' }
      ]);
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
          <FormProvider methods={methods}>
            <View style={styles.form}>
              {/* REQUIRED FIELDS SECTION */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Job Details</Text>
              
              {/* Job Title */}
              <FormTextInput
                name="title"
                label="Job Title"
                placeholder="Enter job title"
                required
                rules={titleRules}
              />

              {/* Job Description */}
              <FormTextInput
                name="description"
                label="Description"
                placeholder="Enter job description"
                multiline
                numberOfLines={3}
              />

              {/* Job Type */}
              <FormSelect
                name="job_type"
                label="Job Type"
                options={jobTypeOptions}
                required
              />

              {/* Priority */}
              <FormSelect
                name="priority"
                label="Priority"
                options={priorityOptions}
                required
              />

              {/* Location */}
              <FormLocationPicker
                name="location"
                label="Location"
                placeholder="Search for a location..."
                required
                rules={locationRules}
              />
              {/* Date Selection */}
              <View style={styles.dateContainer}>
                <Label text="Scheduled Date" required />
                <View style={styles.miniCalendarContainer}>
                  <NativeDatePicker
                    selectedDate={watch('scheduled_date')}
                    onDateChange={(date) => setValue('scheduled_date', date)}
                    containerStyle={styles.nativeDatePicker}
                  />
                </View>
              </View>

              {/* AI Scheduling Option */}
              <FormCheckbox
                name="use_ai_scheduling"
                label="Let AI Agent select optimal times"
                containerStyle={styles.aiCheckbox}
              />

              {useAIScheduling ? (
                <Text style={[styles.helpText, { color: colors.placeholder }]}>
                  Time will be set to 12:00 AM - AI will determine optimal scheduling
                </Text>
              ) : (
                <FormTimeInput
                    name="scheduled_date_time"
                    label="Start Time"
                    placeholder="Select start time"
                    format24Hour={false}
                    required
                  />
              )}

              {/* Estimated Duration */}
              <FormQuantitySelector
                name="estimated_duration"
                label="Estimated Duration (minutes)"
                min={15}
                max={480}
                step={15}
                required
              />

              {/* Required Inventory Section */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.l }]}>Required Inventory</Text>

              <View style={styles.inventoryContainer}>
                {requiredItems.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                    No items required. Tap "Add Item" to add inventory items.
                  </Text>
                ) : (
                  <View style={styles.inventoryList}>
                    {requiredItems.map((itemId, index) => {
                      const item = getInventoryItem(itemId);
                      return (
                        <View key={index} style={[styles.inventoryItem, { backgroundColor: colors.card }]}>
                          <View style={styles.inventoryItemHeader}>
                            <Text style={[styles.inventoryItemName, { color: colors.text }]}>
                              {item?.name || 'Unknown item'}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleRemoveItem(itemId)}
                              style={styles.removeButton}
                            >
                              <FontAwesome name="times" size={16} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                          <Text style={[styles.inventoryItemQuantity, { color: colors.placeholder }]}>
                            Available: {item?.quantity || 0} {item?.unit || 'each'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setShowAddItemModal(true)}
                  style={[styles.addItemButton, { borderColor: colors.primary }]}
                >
                  <FontAwesome name="plus" size={16} color={colors.primary} />
                  <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {/* OPTIONAL FIELDS SECTION */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.xl }]}>Optional Information</Text>

              {/* Notes */}
              <FormTextInput
                name="notes"
                label="Notes"
                placeholder="Add notes about this job..."
                multiline
                numberOfLines={3}
              />


            </View>

            <FormActions
              onSubmit={handleSubmit(onSubmit)}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitTitle="Create Job"
              cancelTitle="Cancel"
            />
          </FormProvider>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {showCreateItemForm ? 'Create New Item' : 'Add Inventory Item'}
            </Text>
            <TouchableOpacity
              onPress={closeAddItemModal}
              style={styles.modalCloseButton}
            >
              <FontAwesome name="times" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {showCreateItemForm ? (
              <FormProvider methods={createItemMethods}>
                <View style={styles.createItemForm}>
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
                    placeholder="1"
                    required
                  />

                  <Text style={[styles.createItemNote, { color: colors.placeholder }]}>
                    This item will be added to your inventory and automatically included in this job.
                  </Text>
                </View>

                <FormActions
                  onSubmit={handleCreateSubmit(onCreateItemSubmit)}
                  onCancel={handleCancelCreateItem}
                  isSubmitting={isCreatingItem}
                  submitTitle="Create & Add"
                  cancelTitle="Back"
                />
              </FormProvider>
            ) : (
              <>
                <View style={styles.searchContainer}>
                  <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search inventory items..."
                  />
                </View>

                <TouchableOpacity
                  onPress={handleShowCreateForm}
                  style={[styles.createNewItemButton, { backgroundColor: colors.primary }]}
                >
                  <FontAwesome name="plus" size={16} color={colors.background} />
                  <Text style={[styles.createNewItemText, { color: colors.background }]}>
                    Create New Item
                  </Text>
                </TouchableOpacity>

                <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
                  {filteredInventoryItems.length === 0 ? (
                    <View style={styles.noItemsContainer}>
                      <Text style={[styles.noItemsText, { color: colors.placeholder }]}>
                        {searchQuery ? 'No items found matching your search.' : 'No inventory items available.'}
                      </Text>
                      {!searchQuery && (
                        <TouchableOpacity
                          onPress={handleShowCreateForm}
                          style={styles.createFirstItemButton}
                        >
                          <Text style={[styles.createFirstItemText, { color: colors.primary }]}>
                            Create your first inventory item
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    filteredInventoryItems.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleAddExistingItem(item.id)}
                        style={[styles.modalInventoryItem, { backgroundColor: colors.card }]}
                      >
                        <View style={styles.modalItemHeader}>
                          <Text style={[styles.modalItemName, { color: colors.text }]}>
                            {item.name}
                          </Text>
                          <Text style={[styles.modalItemQuantity, { color: colors.placeholder }]}>
                            {item.quantity} {item.unit}
                          </Text>
                        </View>
                        {item.description && (
                          <Text style={[styles.modalItemDescription, { color: colors.placeholder }]}>
                            {item.description}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
    ...spacing.helpers.padding('m'),
  },
  form: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.m,
    marginTop: spacing.s,
  },
  subsectionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.m,
  },
  fieldLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  dateContainer: {
    marginBottom: spacing.m,
  },
  miniCalendarContainer: {
    height: 300,
    marginVertical: spacing.s,
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  nativeDatePicker: {
    flex: 1,
  },
  aiCheckbox: {
    marginBottom: spacing.m,
  },
  inventoryContainer: {
    marginBottom: spacing.m,
  },
  inventoryList: {
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  inventoryItem: {
    ...spacing.helpers.padding('s'),
    borderRadius: radius.s,
  },
  inventoryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inventoryItemName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  inventoryItemQuantity: {
    ...typography.caption,
  },
  removeButton: {
    ...touchTargets.styles.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.m,
    gap: spacing.s,
  },
  addItemText: {
    ...typography.body,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    ...typography.h3,
  },
  modalCloseButton: {
    ...touchTargets.styles.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    ...spacing.helpers.padding('m'),
  },
  searchContainer: {
    marginBottom: spacing.m,
  },
  createNewItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    borderRadius: radius.m,
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  createNewItemText: {
    ...typography.body,
    fontWeight: '600',
  },
  itemsList: {
    flex: 1,
  },
  noItemsContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  noItemsText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  createFirstItemButton: {
    marginTop: spacing.s,
  },
  createFirstItemText: {
    ...typography.body,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalInventoryItem: {
    ...spacing.helpers.padding('m'),
    borderRadius: radius.m,
    marginBottom: spacing.s,
  },
  modalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  modalItemName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  modalItemQuantity: {
    ...typography.body,
    fontWeight: '500',
  },
  modalItemDescription: {
    ...typography.caption,
    marginBottom: spacing.s,
  },
  createItemForm: {
    flex: 1,
    gap: spacing.m,
  },
  createItemNote: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.m,
    fontStyle: 'italic',
  },
  helpText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
}); 