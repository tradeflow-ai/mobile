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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TextInput, Button } from '@/components/ui';
import { QuantitySelector } from '@/components/QuantitySelector';
import { updateInventoryItemAtom, deleteInventoryItemAtom, InventoryItem } from '@/store/atoms';

export default function EditItemScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();

  // Global state actions
  const [, updateItem] = useAtom(updateInventoryItemAtom);
  const [, deleteItem] = useAtom(deleteInventoryItemAtom);

  // Parse the item data from params
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    imageUri: undefined as string | undefined,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.item) {
      try {
        const parsedItem = JSON.parse(params.item as string) as InventoryItem;
        setItem(parsedItem);
        setFormData({
          name: parsedItem.name,
          quantity: parsedItem.quantity.toString(),
          imageUri: parsedItem.imageUri,
        });
      } catch (error) {
        console.error('Error parsing item data:', error);
        Alert.alert('Error', 'Invalid item data');
        router.back();
      }
    }
  }, [params.item, router]);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, imageUri: result.assets[0].uri });
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, imageUri: undefined });
  };

  const handleQuantityIncrease = () => {
    const currentQuantity = parseInt(formData.quantity) || 0;
    setFormData({ ...formData, quantity: (currentQuantity + 1).toString() });
  };

  const handleQuantityDecrease = () => {
    const currentQuantity = parseInt(formData.quantity) || 0;
    if (currentQuantity > 0) {
      setFormData({ ...formData, quantity: (currentQuantity - 1).toString() });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!formData.quantity.trim() || isNaN(Number(formData.quantity))) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (!item) {
      Alert.alert('Error', 'Item not found');
      return;
    }

    setLoading(true);
    
    try {
      // Update the item in global state
      updateItem({
        id: item.id,
        updates: {
          name: formData.name,
          quantity: Number(formData.quantity),
          imageUri: formData.imageUri,
        },
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Alert.alert('Success', 'Item updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!item) {
      Alert.alert('Error', 'Item not found');
      return;
    }

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${formData.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Delete the item from global state
              deleteItem(item.id);
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 500));
              
              Alert.alert('Success', 'Item deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.form}>
          {/* Photo Section */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Photo</Text>
            <View style={styles.photoSection}>
              {formData.imageUri ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: formData.imageUri }} style={styles.photo} />
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
                >
                  <FontAwesome name="camera" size={24} color={colors.placeholder} />
                  <Text style={[styles.addPhotoText, { color: colors.placeholder }]}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TextInput
            label="Item Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter item name"
            required
          />

          {/* Quantity with Plus/Minus Buttons */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Quantity
              <Text style={[styles.required, { color: colors.error }]}> *</Text>
            </Text>
            <QuantitySelector
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              onIncrease={handleQuantityIncrease}
              onDecrease={handleQuantityDecrease}
              placeholder="0"
              disabled={loading}
            />
          </View>

        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
          
          <Button
            title="Delete Item"
            onPress={handleDelete}
            variant="outline"
            disabled={loading}
            style={{ ...styles.deleteButton, borderColor: colors.error }}
            textStyle={{ color: colors.error }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  form: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 8,
  },
  deleteButton: {
    marginBottom: 8,
  },
  photoSection: {
    alignItems: 'center',
  },
  photoContainer: {
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
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },

}); 