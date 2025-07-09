import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';
import { FormProvider, FormTextInput, FormQuantitySelector, FormActions } from '@/components/forms';
import { useCreateInventoryItem, CreateInventoryData } from '@/hooks/useInventory';
import { compressAndEncodeImage, createDataUri, formatFileSize, getBase64ImageSize } from '@/utils/imageUtils';

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

  // State for image handling
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

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
  };

  const onSubmit = async (data: CreateInventoryFormData) => {
    try {
      // Transform form data to match CreateInventoryData interface
      const createData: Partial<CreateInventoryData> = {
        name: data.name.trim(),
        quantity: data.quantity,
        // Add the base64 image if one was selected
        ...(imageBase64 && { image_url: imageBase64 }),
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
          <FormProvider methods={methods}>
            <View style={styles.form}>
              {/* Photo Section */}
              <View style={styles.photoSection}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Photo</Text>
                <View style={styles.photoContainer}>
                  {imageBase64 ? (
                    <View style={styles.photoWrapper}>
                      <Image 
                        source={{ uri: createDataUri(imageBase64) }} 
                        style={styles.photo} 
                      />
                      <TouchableOpacity
                        style={[styles.removePhotoButton, { backgroundColor: colors.error }]}
                        onPress={removePhoto}
                        disabled={isProcessingImage}
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
    ...spacing.helpers.padding('m'),
  },
  form: {
    marginBottom: spacing.l,
  },
  photoSection: {
    marginBottom: spacing.l,
  },
  sectionLabel: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radius.m,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: radius.m,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addPhotoText: {
    ...typography.caption,
    fontWeight: '500',
  },
  imageSizeText: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 