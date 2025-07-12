import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform, Modal, KeyboardAvoidingView, Keyboard, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, touchTargets, shadows } from '@/constants/Theme';
import { Card, Button, TextInput, SearchBar, TimeInput, NativeDatePicker, Checkbox, LocationMapView } from '@/components/ui';
import { FormProvider, FormTextInput, FormQuantitySelector, FormActions } from '@/components/forms';
import { useJob, useStartJob, useCompleteJob, useUpdateJob, JobLocation } from '@/hooks/useJobs';
import { useInventory, useCreateInventoryItem, InventoryItem, CreateInventoryData } from '@/hooks/useInventory';
import { formatDate, formatDateLong, formatTimeRange } from '@/utils/dateUtils';

// Form interface for creating new inventory items
interface CreateInventoryFormData {
  name: string;
  quantity: number;
}

export default function JobDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Job mutations
  const startJobMutation = useStartJob();
  const completeJobMutation = useCompleteJob();
  const updateJobMutation = useUpdateJob();
  const createInventoryMutation = useCreateInventoryItem();

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');

  // Location editing state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [originalLocation, setOriginalLocation] = useState('');



  // Completion notes editing state
  const [isEditingCompletionNotes, setIsEditingCompletionNotes] = useState(false);
  const [completionNotesText, setCompletionNotesText] = useState('');
  const [originalCompletionNotes, setOriginalCompletionNotes] = useState('');

  // Schedule editing state
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledStartTime, setScheduledStartTime] = useState('8:00 AM');
  const [useAITimes, setUseAITimes] = useState(false);
  const [originalScheduledDate, setOriginalScheduledDate] = useState(new Date());
  const [originalScheduledStartTime, setOriginalScheduledStartTime] = useState('8:00 AM');
  const [originalUseAITimes, setOriginalUseAITimes] = useState(false);
  const [hasInitializedAITimes, setHasInitializedAITimes] = useState(false);

  // Inventory editing state
  const [isEditingInventory, setIsEditingInventory] = useState(false);
  const [requiredItems, setRequiredItems] = useState<string[]>([]);
  const [originalRequiredItems, setOriginalRequiredItems] = useState<string[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create new item state
  const [showCreateItemForm, setShowCreateItemForm] = useState(false);

  // Keyboard and scroll handling state
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

  // Refs for scroll handling
  const scrollViewRef = useRef<ScrollView>(null);
  const notesContainerRef = useRef<View>(null);
  const locationContainerRef = useRef<View>(null);

  const completionNotesContainerRef = useRef<View>(null);
  const scheduleContainerRef = useRef<View>(null);
  const inventoryContainerRef = useRef<View>(null);

  // Fetch job data
  const { data: job, isLoading, error } = useJob(id!);
  const { data: inventoryItems = [] } = useInventory();

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    const dimensionListener = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      dimensionListener?.remove();
    };
  }, []);

  // Scroll to focused input section
  const scrollToSection = (sectionRef: React.RefObject<View | null>) => {
    if (scrollViewRef.current && sectionRef.current) {
      // Add a small delay to ensure the keyboard animation has started and layout is complete
      setTimeout(() => {
        // Double-check that the ref still exists after the delay
        if (!sectionRef.current || !scrollViewRef.current) return;
        
        sectionRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y, width, height) => {
            // Only proceed if we have valid measurements
            if (height === 0) {
              // If height is 0, the layout might not be complete, try again
              setTimeout(() => scrollToSection(sectionRef), 100);
              return;
            }
            
            // Calculate available space above keyboard
            const availableHeight = screenHeight - keyboardHeight;
            
            // Position the section so its bottom is visible with some breathing room
            const desiredBottomPosition = availableHeight * 0.85; // Use 85% of available space
            const sectionBottom = y + height;
            
            // Calculate how much we need to scroll
            const scrollY = sectionBottom - desiredBottomPosition;
            
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, scrollY),
              animated: true,
            });
          },
          () => {
            // Fallback if measureLayout fails - try again once
            console.log('Failed to measure section layout, retrying...');
            setTimeout(() => scrollToSection(sectionRef), 100);
          }
        );
      }, 150); // Slightly longer delay to ensure keyboard is fully shown
    }
  };

  // Form for creating new inventory items
  const createItemMethods = useForm<CreateInventoryFormData>({
    defaultValues: {
      name: '',
      quantity: 1,
    },
    mode: 'onChange',
  });

  const { handleSubmit: handleCreateSubmit, reset: resetCreateForm, formState: { isSubmitting: isCreatingItem } } = createItemMethods;

        // Update states when job data changes
      useEffect(() => {
        if (job) {
          const currentNotes = job.notes || '';
          setNotesText(currentNotes);
          setOriginalNotes(currentNotes);

          const currentLocation = job.address || '';
          setLocationText(currentLocation);
          setOriginalLocation(currentLocation);



          const currentCompletionNotes = job.completion_notes || '';
          setCompletionNotesText(currentCompletionNotes);
          setOriginalCompletionNotes(currentCompletionNotes);

          const currentScheduledStart = job.scheduled_start || '';
          // Read AI scheduling preference from job data, defaulting to false for new jobs
          const currentUseAITimes = job.use_ai_scheduling || false;
          
          if (currentScheduledStart) {
            const startDate = new Date(currentScheduledStart);
            setScheduledDate(startDate);
            setOriginalScheduledDate(new Date(startDate));
            
            // Format start time for display (12-hour format)
            const hours = startDate.getHours();
            const minutes = startDate.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            const formattedStartTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
            setScheduledStartTime(formattedStartTime);
            setOriginalScheduledStartTime(formattedStartTime);
            
            // Set AI times flag from job data - always reload when job data changes
            setUseAITimes(currentUseAITimes);
            setOriginalUseAITimes(currentUseAITimes);
            setHasInitializedAITimes(true);
          } else {
            // Default to current date and default times
            const today = new Date();
            setScheduledDate(today);
            setOriginalScheduledDate(new Date(today));
            setScheduledStartTime('8:00 AM');
            setOriginalScheduledStartTime('8:00 AM');
            
            // Set AI times flag from job data - always reload when job data changes
            setUseAITimes(currentUseAITimes);
            setOriginalUseAITimes(currentUseAITimes);
            setHasInitializedAITimes(true);
          }

      const currentRequiredItems = job.required_items || [];
      setRequiredItems(currentRequiredItems);
      setOriginalRequiredItems(currentRequiredItems);
    }
  }, [job]);

  // Set up edit button in header
  useEffect(() => {
    if (job) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleEdit}
            style={{
              ...touchTargets.styles.minimum,
              ...spacing.helpers.paddingHorizontal('s'),
              justifyContent: 'center',
            }}
          >
            <FontAwesome name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    }
  }, [job, navigation, colors.primary]);

  const handleEdit = () => {
    if (job) {
      router.push(`/edit-job?id=${job.id}`);
    }
  };

  const handleStartJob = async () => {
    if (!job) return;

    try {
      await startJobMutation.mutateAsync({ jobId: job.id });
      Alert.alert('Success', 'Job started successfully!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error starting job:', error);
      Alert.alert('Error', 'Failed to start job. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleCompleteJob = () => {
    if (!job) return;

    Alert.alert(
      'Complete Job',
      'Are you sure you want to mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeJobMutation.mutateAsync({ jobId: job.id });
              Alert.alert('Success', 'Job completed successfully!', [{ text: 'OK' }]);
            } catch (error) {
              console.error('Error completing job:', error);
              Alert.alert('Error', 'Failed to complete job. Please try again.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const handleReopenJob = () => {
    if (!job) return;

    Alert.alert(
      'Reopen Job',
      'Are you sure you want to reopen this completed job? This will change the status back to pending.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            try {
              await updateJobMutation.mutateAsync({
                jobId: job.id,
                updates: { 
                  status: 'pending',
                  actual_end: undefined, // Clear the actual end time
                },
              });
              Alert.alert('Success', 'Job reopened successfully!', [{ text: 'OK' }]);
            } catch (error) {
              console.error('Error reopening job:', error);
              Alert.alert('Error', 'Failed to reopen job. Please try again.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  // Notes editing functions
  const handleEditNotes = () => {
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    if (!job) return;

    try {
      await updateJobMutation.mutateAsync({
        jobId: job.id,
        updates: { notes: notesText.trim() },
      });
      setOriginalNotes(notesText);
      setIsEditingNotes(false);
      Alert.alert('Success', 'Notes updated successfully!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error updating notes:', error);
      Alert.alert('Error', 'Failed to update notes. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleCancelNotes = () => {
    setNotesText(originalNotes);
    setIsEditingNotes(false);
  };

  // Location editing functions
  const handleEditLocation = () => {
    setIsEditingLocation(true);
    // Scroll to location section after a brief delay to allow state update and layout
    setTimeout(() => scrollToSection(locationContainerRef), 200);
  };

  const handleSaveLocation = async () => {
    if (!job) return;

    try {
      await updateJobMutation.mutateAsync({
        jobId: job.id,
        updates: { address: locationText.trim() },
      });
      setOriginalLocation(locationText);
      setIsEditingLocation(false);
      Alert.alert('Success', 'Location updated successfully!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleCancelLocation = () => {
    setLocationText(originalLocation);
    setIsEditingLocation(false);
  };



  // Completion notes editing functions
  const handleEditCompletionNotes = () => {
    setIsEditingCompletionNotes(true);
  };

  const handleSaveCompletionNotes = async () => {
    if (!job) return;

    try {
      await updateJobMutation.mutateAsync({
        jobId: job.id,
        updates: { completion_notes: completionNotesText.trim() },
      });
      setOriginalCompletionNotes(completionNotesText);
      setIsEditingCompletionNotes(false);
      Alert.alert('Success', 'Completion notes updated successfully!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error updating completion notes:', error);
      Alert.alert('Error', 'Failed to update completion notes. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleCancelCompletionNotes = () => {
    setCompletionNotesText(originalCompletionNotes);
    setIsEditingCompletionNotes(false);
  };

  // Schedule editing functions
  const handleEditSchedule = () => {
    setIsEditingSchedule(true);
    // Scroll to schedule section after a brief delay to allow state update
    setTimeout(() => scrollToSection(scheduleContainerRef), 100);
  };

  const handleSaveSchedule = async () => {
    if (!job) return;

    try {
      let scheduledStartDate: Date;

      if (useAITimes) {
        // AI will select optimal times - just use the date with default business hours
        scheduledStartDate = new Date(scheduledDate);
        scheduledStartDate.setHours(9, 0, 0, 0); // 9:00 AM default for AI
      } else {
        // Manual time selection - convert user input to 24-hour format
        const startTimeMatch = scheduledStartTime.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
        if (!startTimeMatch) {
          Alert.alert('Error', 'Invalid start time format. Please select a valid time.');
          return;
        }

        let startHours = parseInt(startTimeMatch[1], 10);
        const startMinutes = parseInt(startTimeMatch[2], 10);
        const startPeriod = startTimeMatch[3].toUpperCase();

        // Convert start time to 24-hour format
        if (startPeriod === 'PM' && startHours !== 12) startHours += 12;
        if (startPeriod === 'AM' && startHours === 12) startHours = 0;

        scheduledStartDate = new Date(scheduledDate);
        scheduledStartDate.setHours(startHours, startMinutes, 0, 0);
      }

      await updateJobMutation.mutateAsync({
        jobId: job.id,
        updates: { 
          scheduled_start: scheduledStartDate.toISOString(),
          use_ai_scheduling: useAITimes,
        },
      });
      
      setOriginalScheduledDate(new Date(scheduledDate));
      setOriginalScheduledStartTime(scheduledStartTime);
      setOriginalUseAITimes(useAITimes);
      setIsEditingSchedule(false);
      Alert.alert('Success', 'Schedule updated successfully!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', 'Failed to update schedule. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleCancelSchedule = () => {
    setScheduledDate(new Date(originalScheduledDate));
    setScheduledStartTime(originalScheduledStartTime);
    setUseAITimes(originalUseAITimes);
    setIsEditingSchedule(false);
  };

  // Inventory management functions
  const handleEditInventory = () => {
    setIsEditingInventory(true);
    // Scroll to inventory section after a brief delay to allow state update
    setTimeout(() => scrollToSection(inventoryContainerRef), 100);
  };

  const handleSaveInventory = async () => {
    if (!job) return;

    try {
      await updateJobMutation.mutateAsync({
        jobId: job.id,
        updates: { required_items: requiredItems },
      });
      setOriginalRequiredItems(requiredItems);
      setIsEditingInventory(false);
      Alert.alert('Success', 'Required inventory updated successfully!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error updating inventory:', error);
      Alert.alert('Error', 'Failed to update inventory. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleCancelInventory = () => {
    setRequiredItems(originalRequiredItems);
    setIsEditingInventory(false);
  };

  const handleAddExistingItem = (itemId: string) => {
    if (!requiredItems.includes(itemId)) {
      setRequiredItems(prev => [...prev, itemId]);
    }
    setShowAddItemModal(false);
    setSearchQuery('');
  };

  const handleRemoveItem = (itemId: string) => {
    setRequiredItems(prev => prev.filter(id => id !== itemId));
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
      // Create the inventory item with default values for required fields
      const createData: CreateInventoryData = {
        name: data.name.trim(),
        quantity: data.quantity,
        category: 'General', // Default category
        unit: 'each', // Default unit
      };

      const newItem = await createInventoryMutation.mutateAsync(createData);

      // Add the newly created item to the job's required items
      setRequiredItems(prev => [...prev, newItem.id]);

      // Reset form and close modal
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

  const getStatusColor = (status: JobLocation['status']) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'in_progress': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.placeholder;
    }
  };

  const getPriorityColor = (priority: JobLocation['priority']) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return '#FF6B35';
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.placeholder;
    }
  };

  const getJobTypeLabel = (jobType: JobLocation['job_type']) => {
    switch (jobType) {
      case 'emergency': return 'Emergency service call';
      case 'maintenance': return 'Maintenance service';
      case 'inspection': return 'Inspection visit';
      case 'service': return 'Service call';
      case 'delivery': return 'Delivery';
      case 'pickup': return 'Pickup';
      case 'hardware_store': return 'Hardware store run';
      default: return 'Service call';
    }
  };

  const getInventoryItemName = (itemId: string) => {
    const item = inventoryItems.find(item => item.id === itemId);
    return item ? item.name : 'Unknown item';
  };

  const getInventoryItem = (itemId: string) => {
    return inventoryItems.find(item => item.id === itemId);
  };

  const checkInventoryAvailability = (itemId: string, quantityNeeded: number = 1) => {
    const item = inventoryItems.find(item => item.id === itemId);
    if (!item) return { available: false, inStock: 0, needFromStore: quantityNeeded };
    
    const available = item.quantity >= quantityNeeded;
    const inStock = Math.min(item.quantity, quantityNeeded);
    const needFromStore = Math.max(0, quantityNeeded - item.quantity);
    
    return { available, inStock, needFromStore };
  };

  const filteredInventoryItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !requiredItems.includes(item.id)
  );

  const canStartJob = job && job.status === 'pending';
  const canCompleteJob = job && job.status === 'in_progress';
  const canReopenJob = job && job.status === 'completed';
  const isJobInProgress = job && job.status === 'in_progress';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Job Not Found</Text>
          <Text style={[styles.errorDescription, { color: colors.placeholder }]}>
            The job you're looking for could not be found.
          </Text>
          <Button
            variant="primary"
            onPress={() => router.back()}
            title="Go Back"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustContentInsets={false}
          scrollEventThrottle={16}
        >
        {/* Job Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
              <Text style={[styles.jobSubtitle, { color: colors.placeholder }]}>
                {getJobTypeLabel(job.job_type)}
              </Text>
            </View>
            <View style={styles.headerBadges}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(job.status) }]}>
                  {job.status.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
                <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Location Information - Always visible and editable */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            {!isEditingLocation && !(job?.latitude && job?.longitude) && (
              <TouchableOpacity
                onPress={handleEditLocation}
                style={styles.editButton}
                disabled={updateJobMutation.isPending}
              >
                <FontAwesome name="edit" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {isEditingLocation ? (
            <View ref={locationContainerRef} style={styles.editContainer}>
              <TextInput
                value={locationText}
                onChangeText={setLocationText}
                placeholder="Enter job location address..."
                multiline
                numberOfLines={2}
                style={styles.textInput}
                autoFocus
              />
              <View style={styles.editActions}>
                <Button
                  variant="outline"
                  onPress={handleCancelLocation}
                  title="Cancel"
                  style={styles.actionButton}
                  disabled={updateJobMutation.isPending}
                />
                <Button
                  variant="primary"
                  onPress={handleSaveLocation}
                  title="Save"
                  style={styles.actionButton}
                  disabled={updateJobMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              {/* Map View if coordinates are available */}
              {job?.latitude && job?.longitude ? (
                <View style={styles.locationMapContainer}>
                  <LocationMapView
                    latitude={job.latitude}
                    longitude={job.longitude}
                    title={job.title}
                    address={locationText}
                    height={220}
                    style={styles.locationMap}
                  />
                  {locationText && (
                    <View style={styles.locationAddressContainer}>
                      <FontAwesome name="map-marker" size={14} color={colors.primary} />
                      <Text style={[styles.locationAddressText, { color: colors.text }]}>
                        {locationText}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                /* Fallback to text display if no coordinates */
                <TouchableOpacity onPress={handleEditLocation} style={styles.locationFallback}>
                  <View style={styles.locationRow}>
                    <FontAwesome name="map-marker" size={16} color={colors.primary} />
                    <Text style={[styles.displayText, { color: locationText ? colors.text : colors.placeholder }]}>
                      {locationText || 'Tap to add location address...'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {/* Required Inventory - Always visible and editable */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Inventory</Text>
            {!isEditingInventory && (
              <TouchableOpacity
                onPress={handleEditInventory}
                style={styles.editButton}
                disabled={updateJobMutation.isPending}
              >
                <FontAwesome name="edit" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {isEditingInventory ? (
            <View ref={inventoryContainerRef} style={styles.editContainer}>
              {/* Inventory Items List */}
              <View style={styles.inventoryList}>
                {requiredItems.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                    No items required. Tap "Add Item" to add inventory items.
                  </Text>
                ) : (
                  requiredItems.map((itemId, index) => {
                    const item = getInventoryItem(itemId);
                    const availability = checkInventoryAvailability(itemId, 1);
                    
                    return (
                      <View key={index} style={styles.inventoryItemEditable}>
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
                        <View style={styles.inventoryItemMeta}>
                          <Text style={[styles.inventoryItemQuantity, { color: colors.placeholder }]}>
                            Qty: 1 • {item?.unit || 'each'}
                          </Text>
                          <View style={styles.inventoryItemStatus}>
                            <View style={[styles.stockStatus, { 
                              backgroundColor: availability.inStock > 0 ? colors.success : colors.error 
                            }]}>
                              <Text style={[styles.stockStatusText, { color: colors.background }]}>
                                {availability.inStock > 0 ? 'In Stock' : 'Low Stock'}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.inventoryItemAvailability, { color: colors.text }]}>
                          Available: {availability.inStock} | Need from store: {availability.needFromStore}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Add Item Button */}
              <TouchableOpacity
                onPress={() => setShowAddItemModal(true)}
                style={[styles.addItemButton, { borderColor: colors.primary }]}
              >
                <FontAwesome name="plus" size={16} color={colors.primary} />
                <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
              </TouchableOpacity>

              {/* Save/Cancel Actions */}
              <View style={styles.editActions}>
                <Button
                  variant="outline"
                  onPress={handleCancelInventory}
                  title="Cancel"
                  style={styles.actionButton}
                  disabled={updateJobMutation.isPending}
                />
                <Button
                  variant="primary"
                  onPress={handleSaveInventory}
                  title="Save"
                  style={styles.actionButton}
                  disabled={updateJobMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              {requiredItems.length === 0 ? (
                <TouchableOpacity onPress={handleEditInventory} style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                    No items required. Tap to add inventory items.
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.inventoryList}>
                  {requiredItems.map((itemId, index) => {
                    const item = getInventoryItem(itemId);
                    const availability = checkInventoryAvailability(itemId, 1);
                    
                    return (
                      <View key={index} style={styles.inventoryItem}>
                        <View style={styles.inventoryItemHeader}>
                          <Text style={[styles.inventoryItemName, { color: colors.text }]}>
                            {item?.name || 'Unknown item'}
                          </Text>
                          <Text style={[styles.inventoryItemQuantity, { color: colors.placeholder }]}>
                            Qty: 1
                          </Text>
                        </View>
                        <View style={styles.inventoryItemStatus}>
                          {availability.inStock > 0 && (
                            <View style={[styles.statusChip, { backgroundColor: colors.success + '20' }]}>
                              <FontAwesome name="check" size={12} color={colors.success} />
                              <Text style={[styles.statusChipText, { color: colors.success }]}>
                                In Stock
                              </Text>
                            </View>
                          )}
                          {availability.needFromStore > 0 && (
                            <View style={[styles.statusChip, { backgroundColor: colors.warning + '20' }]}>
                              <FontAwesome name="shopping-cart" size={12} color={colors.warning} />
                              <Text style={[styles.statusChipText, { color: colors.warning }]}>
                                From Store
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Notes - Always visible and editable */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            {!isEditingNotes && (
              <TouchableOpacity
                onPress={handleEditNotes}
                style={styles.editButton}
                disabled={updateJobMutation.isPending}
              >
                <FontAwesome name="edit" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditingNotes ? (
            <View ref={notesContainerRef} style={styles.editContainer}>
              <TextInput
                value={notesText}
                onChangeText={setNotesText}
                placeholder="Add notes about this job..."
                multiline
                numberOfLines={4}
                style={styles.textInput}
                autoFocus
                onFocus={() => scrollToSection(notesContainerRef)}
              />
              <View style={styles.editActions}>
                <Button
                  variant="outline"
                  onPress={handleCancelNotes}
                  title="Cancel"
                  style={styles.actionButton}
                  disabled={updateJobMutation.isPending}
                />
                <Button
                  variant="primary"
                  onPress={handleSaveNotes}
                  title="Save"
                  style={styles.actionButton}
                  disabled={updateJobMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditNotes} style={styles.displayContainer}>
              <Text style={[styles.displayText, { color: notesText ? colors.text : colors.placeholder }]}>
                {notesText || 'Tap to add notes about this job...'}
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Scheduled Information - Always visible and editable */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Scheduled</Text>
            {!isEditingSchedule && (
              <TouchableOpacity
                onPress={handleEditSchedule}
                style={styles.editButton}
                disabled={updateJobMutation.isPending}
              >
                <FontAwesome name="edit" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {isEditingSchedule ? (
            <View ref={scheduleContainerRef} style={styles.editContainer}>
              <View style={styles.scheduleInputContainer}>
                <Text style={[styles.scheduleLabel, { color: colors.text }]}>Select Date</Text>
                <View style={styles.miniCalendarContainer}>
                  <NativeDatePicker
                    selectedDate={scheduledDate}
                    onDateChange={setScheduledDate}
                    containerStyle={styles.nativeDatePicker}
                  />
                </View>
              </View>
              
              <View style={styles.scheduleInputContainer}>
                <Checkbox
                  label="Let AI Agent select optimal times"
                  checked={useAITimes}
                  onPress={() => setUseAITimes(!useAITimes)}
                  containerStyle={styles.aiTimesCheckbox}
                />
                {useAITimes && (
                  <Text style={[styles.aiTimesDescription, { color: colors.placeholder }]}>
                    The AI will automatically select the best start and end times based on your schedule and job requirements.
                  </Text>
                )}
              </View>
              
              {!useAITimes && (
                <>
                  <View style={styles.scheduleInputContainer}>
                    <TimeInput
                      value={scheduledStartTime}
                      onTimeChange={setScheduledStartTime}
                      label="Start Time"
                      placeholder="Select start time"
                      format24Hour={false}
                    />
                  </View>
                </>
              )}
              
              <View style={styles.editActions}>
                <Button
                  variant="outline"
                  onPress={handleCancelSchedule}
                  title="Cancel"
                  style={styles.actionButton}
                  disabled={updateJobMutation.isPending}
                />
                <Button
                  variant="primary"
                  onPress={handleSaveSchedule}
                  title="Save"
                  style={styles.actionButton}
                  disabled={updateJobMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditSchedule} style={styles.displayContainer}>
              <View style={styles.scheduleContainer}>
                <View style={styles.scheduleRow}>
                  <FontAwesome name="calendar" size={16} color={colors.primary} />
                  <Text style={[styles.scheduleDate, { color: colors.text }]}>
                    {formatDateLong(scheduledDate.toISOString())}
                  </Text>
                </View>
                <View style={styles.scheduleRow}>
                  <FontAwesome 
                    name={useAITimes ? "magic" : "clock-o"} 
                    size={16} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.scheduleTime, { color: colors.text }]}>
                    {useAITimes 
                      ? "AI will select optimal times" 
                      : scheduledStartTime
                    }
                  </Text>
                </View>
                {useAITimes && (
                  <View style={styles.aiIndicatorContainer}>
                    <Text style={[styles.aiIndicatorText, { color: colors.placeholder }]}>
                      ✨ Smart scheduling enabled
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        </Card>

        {/* Completion Notes - Only visible after job is completed */}
        {job.status === 'completed' && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderCompact}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Completion Notes</Text>
              <View style={styles.sectionActions}>
                {!isEditingCompletionNotes && (
                  <TouchableOpacity
                    onPress={handleEditCompletionNotes}
                    style={styles.editButton}
                    disabled={updateJobMutation.isPending}
                  >
                    <FontAwesome name="edit" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleReopenJob}
                  style={[styles.editButton, { marginLeft: spacing.s }]}
                  disabled={updateJobMutation.isPending}
                >
                  <FontAwesome name="refresh" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {isEditingCompletionNotes ? (
              <View ref={completionNotesContainerRef} style={styles.editContainer}>
                <TextInput
                  value={completionNotesText}
                  onChangeText={setCompletionNotesText}
                  placeholder="Add completion notes..."
                  multiline
                  numberOfLines={4}
                  style={styles.textInput}
                  autoFocus
                  onFocus={() => scrollToSection(completionNotesContainerRef)}
                />
                <View style={styles.editActions}>
                  <Button
                    variant="outline"
                    onPress={handleCancelCompletionNotes}
                    title="Cancel"
                    style={styles.actionButton}
                    disabled={updateJobMutation.isPending}
                  />
                  <Button
                    variant="primary"
                    onPress={handleSaveCompletionNotes}
                    title="Save"
                    style={styles.actionButton}
                    disabled={updateJobMutation.isPending}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={handleEditCompletionNotes} style={styles.displayContainer}>
                <Text style={[styles.displayText, { color: completionNotesText ? colors.text : colors.placeholder }]}>
                  {completionNotesText || 'Tap to add completion notes...'}
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

          {/* Bottom spacing for buttons */}
          <View style={styles.bottomSpacing} />
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
              /* Create New Item Form */
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
              /* Search and Select Existing Items */
              <>
                <View style={styles.searchContainer}>
                  <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search inventory items..."
                  />
                </View>

                {/* Create New Item Button */}
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
                        <View style={styles.modalItemStatus}>
                          <View style={[styles.stockStatus, { 
                            backgroundColor: item.quantity > 0 ? colors.success : colors.error 
                          }]}>
                            <Text style={[styles.stockStatusText, { color: colors.background }]}>
                              {item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Fixed Bottom Buttons - Always show start job button */}
      <View style={[styles.bottomButtonContainer, { backgroundColor: colors.background }]}>
        <Button
          variant="primary"
          onPress={handleStartJob}
          title="▶ Start Job"
          style={styles.bottomActionButton}
          disabled={!canStartJob || startJobMutation.isPending}
        />
        {canCompleteJob && (
          <Button
            variant="outline"
            onPress={handleCompleteJob}
            title="⏹ End Job"
            style={styles.bottomActionButton}
            disabled={completeJobMutation.isPending}
          />
        )}
        {canReopenJob && (
          <Button
            variant="outline"
            onPress={handleReopenJob}
            title="🔄 Reopen Job"
            style={styles.bottomActionButton}
            disabled={updateJobMutation.isPending}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.m,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...spacing.helpers.padding('l'),
  },
  errorTitle: {
    ...typography.h3,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  errorDescription: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  backButton: {
    marginTop: spacing.m,
  },
  headerCard: {
    ...spacing.helpers.margin('m'),
    marginBottom: spacing.s,
  },
  sectionCard: {
    ...spacing.helpers.marginHorizontal('m'),
    marginBottom: spacing.s,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.m,
  },
  jobTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  jobSubtitle: {
    ...typography.body,
    fontStyle: 'italic',
  },
  headerBadges: {
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  priorityText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline', // Align to text baseline instead of center
    marginBottom: spacing.m,
  },
  sectionHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline', // Align to text baseline instead of center
    marginBottom: spacing.xs,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    ...touchTargets.styles.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    // No hardcoded positioning needed - baseline alignment handles it
  },
  editContainer: {
    gap: spacing.m,
  },
  textInput: {
    minHeight: 44,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.s,
  },
  actionButton: {
    paddingHorizontal: spacing.l,
  },
  displayContainer: {
    minHeight: 44,
    justifyContent: 'center',
  },
  displayText: {
    ...typography.body,
    lineHeight: 22,
  },
  emptyContainer: {
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  scheduleContainer: {
    gap: spacing.m,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  scheduleDate: {
    ...typography.body,
    fontWeight: '600',
  },
  scheduleTime: {
    ...typography.body,
    fontWeight: '600',
  },
  scheduleInputContainer: {
    marginBottom: spacing.m,
  },
  scheduleLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.s,
  },

  // Inventory styles
  inventoryList: {
    gap: spacing.m,
  },
  inventoryItem: {
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  inventoryItemEditable: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.s,
    borderRadius: radius.m,
    backgroundColor: 'rgba(244, 164, 96, 0.1)',
    marginBottom: spacing.s,
  },
  inventoryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  inventoryItemName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  inventoryItemQuantity: {
    ...typography.body,
    fontWeight: '500',
  },
  inventoryItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  inventoryItemAvailability: {
    ...typography.caption,
  },
  inventoryItemStatus: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    gap: spacing.xs,
  },
  statusChipText: {
    ...typography.caption,
    fontWeight: '500',
  },
  stockStatus: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
  },
  stockStatusText: {
    ...typography.caption,
    fontWeight: '600',
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
  modalItemStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  // Create item form styles
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
  bottomSpacing: {
    height: 120, // Space for fixed buttons and keyboard buffer
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    ...spacing.helpers.padding('m'),
    paddingBottom: Platform.OS === 'ios' ? spacing.l : spacing.m,
    gap: spacing.s,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  bottomActionButton: {
    flex: 1,
  },
  // New schedule editing styles
  miniCalendarContainer: {
    height: 300,
    marginVertical: spacing.s,
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  nativeDatePicker: {
    // Styling handled by component
  },
  timeInputWrapper: {
    marginTop: spacing.s,
  },
  timeDisplayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.m,
    ...spacing.helpers.paddingHorizontal('s'),
    minHeight: touchTargets.minimum,
    paddingVertical: spacing.s + 2,
  },
  timeDisplayText: {
    ...typography.body,
    flex: 1,
  },
  aiTimesCheckbox: {
    marginBottom: spacing.s,
  },
  aiTimesDescription: {
    ...typography.caption,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  aiIndicatorContainer: {
    marginTop: spacing.s,
    alignItems: 'center',
  },
  aiIndicatorText: {
    ...typography.caption,
    fontStyle: 'italic',
    fontSize: 12,
  },
  // Location map styles
  locationMapContainer: {
    width: '100%',
  },
  locationMap: {
    marginBottom: spacing.s,
  },
  locationAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  locationAddressText: {
    ...typography.body,
    flex: 1,
  },
  locationFallback: {
    // Same as original displayContainer styling
  },
}); 