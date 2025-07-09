import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';
import { FormProvider, FormTextInput, FormQuantitySelector, FormActions } from '@/components/forms';
import { useUpdateInventoryItem, useDeleteInventoryItem, InventoryItem, UpdateInventoryData } from '@/hooks/useInventory';
import { compressAndEncodeImage, createDataUri, formatFileSize, getBase64ImageSize } from '@/utils/imageUtils';

// Form data interface matching add-item.tsx
interface EditInventoryFormData {
  name: string;
  quantity: number;
}

export default function EditItemScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();

  const updateInventoryMutation = useUpdateInventoryItem();
  const deleteInventoryMutation = useDeleteInventoryItem();

  // State for the current item and photo
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageWasRemoved, setImageWasRemoved] = useState(false);



  // Initialize form with default values
  const methods = useForm<EditInventoryFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      quantity: 0,
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  // Parse item data from params and populate form
  useEffect(() => {
    if (params.item) {
      try {
        const parsedItem = JSON.parse(params.item as string) as InventoryItem;
        setItem(parsedItem);
        
        // Populate form with item data
        const formData: EditInventoryFormData = {
          name: parsedItem.name || '',
          quantity: parsedItem.quantity || 0,
        };
        
        reset(formData);
        
        // Set image if exists
        if (parsedItem.image_url && parsedItem.image_url !== null) {
          setImageBase64(parsedItem.image_url);
        }
        
      } catch (error) {
        console.error('Error parsing item data:', error);
        Alert.alert('Error', 'Invalid item data');
        router.back();
      }
    }
  }, [params.item, router, reset]);

  // Photo handling functions
  const handlePhotoPress = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Gallery permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const processImage = async (imageUri: string) => {
    setIsProcessingImage(true);
    try {
      const compressedImage = await compressAndEncodeImage(imageUri);
      setImageBase64(compressedImage.base64);
      setImageWasRemoved(false); // Reset removal flag when new image is added
      
      const sizeInBytes = getBase64ImageSize(compressedImage.base64);
      console.log(`Image processed: ${compressedImage.width}x${compressedImage.height}, ${formatFileSize(sizeInBytes)}`);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const removePhoto = () => {
    setImageBase64(undefined);
    setImageWasRemoved(true); // Track that image was explicitly removed
  };

  // Form submission
  const onSubmit = async (data: EditInventoryFormData) => {
    if (!item) {
      Alert.alert('Error', 'Item not found');
      return;
    }

    try {
      // Transform form data to match UpdateInventoryData interface
      const updateData: UpdateInventoryData = {
        name: data.name.trim(),
        quantity: data.quantity,
      };

      // Handle image updates
      if (imageWasRemoved) {
        // Explicitly set to null to remove from database
        updateData.image_url = null;
      } else if (imageBase64) {
        // Add the new base64 image
        updateData.image_url = imageBase64;
      }
      // If neither removed nor new image, don't update the image field

      await updateInventoryMutation.mutateAsync({
        itemId: item.id,
        updates: updateData,
      });

      Alert.alert(
        'Success',
        'Item updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert(
        'Error',
        'Failed to update item. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Delete item
  const handleDelete = () => {
    if (!item) {
      Alert.alert('Error', 'Item not found');
      return;
    }

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInventoryMutation.mutateAsync(item.id);
              
              Alert.alert(
                'Success',
                'Item deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert(
                'Error',
                'Failed to delete item. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  // Loading state
  if (!item) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <FormProvider methods={methods}>
            <View style={styles.form}>
              {/* Photo Section */}
              <View style={styles.photoSection}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Photo</Text>
                <View style={styles.photoContainer}>
                  {imageBase64 ? (
                    <View style={styles.photoWrapper}>
                      <Image source={{ uri: createDataUri(imageBase64) }} style={styles.photo} />
                      <TouchableOpacity
                        style={[styles.removePhotoButton, { backgroundColor: colors.error }]}
                        onPress={removePhoto}
                      >
                        <FontAwesome name="times" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addPhotoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={handlePhotoPress}
                      disabled={isProcessingImage}
                    >
                      {isProcessingImage ? (
                        <>
                          <FontAwesome name="spinner" size={24} color={colors.placeholder} />
                          <Text style={[styles.addPhotoText, { color: colors.placeholder }]}>
                            Processing...
                          </Text>
                        </>
                      ) : (
                        <>
                          <FontAwesome name="camera" size={24} color={colors.placeholder} />
                          <Text style={[styles.addPhotoText, { color: colors.placeholder }]}>
                            Add Photo
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                                      )}
                  </View>
                  {imageBase64 && (
                    <Text style={[styles.imageSizeText, { color: colors.placeholder }]}>
                      Size: {formatFileSize(getBase64ImageSize(imageBase64))}
                    </Text>
                  )}
                </View>

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
              isSubmitting={isSubmitting || isProcessingImage}
              submitTitle="Save Changes"
              cancelTitle="Cancel"
            />
          </FormProvider>

          {/* Delete Button - Separate from FormActions for better UX */}
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: colors.error }]}
              onPress={handleDelete}
              disabled={isSubmitting}
            >
              <FontAwesome name="trash" size={16} color={colors.error} />
              <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                Delete Item
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
  },
  form: {
    marginBottom: 32,
  },
  photoSection: {
    marginBottom: spacing.m,
  },
  sectionLabel: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    ...typography.caption,
    marginTop: 8,
    fontWeight: '500',
  },
  imageSizeText: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  deleteSection: {
    marginTop: spacing.l,
    marginBottom: spacing.xl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.s,
  },
}); 