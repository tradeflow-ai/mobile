import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TextInput, Button } from '@/components/ui';
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
    category: 'plumbing' as 'plumbing' | 'hvac' | 'electrical',
    status: 'available' as 'available' | 'low_stock' | 'out_of_stock',
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
          category: parsedItem.category,
          status: parsedItem.status,
        });
      } catch (error) {
        console.error('Error parsing item data:', error);
        Alert.alert('Error', 'Invalid item data');
        router.back();
      }
    }
  }, [params.item, router]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plumbing':
        return 'tint';
      case 'hvac':
        return 'thermometer-half';
      case 'electrical':
        return 'bolt';
      default:
        return 'cube';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'plumbing':
        return '#3B82F6';
      case 'hvac':
        return '#F59E0B';
      case 'electrical':
        return '#EF4444';
      default:
        return colors.primary;
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
          category: formData.category,
          status: formData.status,
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

  const renderCategoryOption = (category: 'plumbing' | 'hvac' | 'electrical', label: string) => {
    const isSelected = formData.category === category;
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryOption,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setFormData({ ...formData, category })}
      >
        <FontAwesome
          name={getCategoryIcon(category)}
          size={16}
          color={isSelected ? colors.background : getCategoryColor(category)}
        />
        <Text
          style={[
            styles.categoryLabel,
            {
              color: isSelected ? colors.background : colors.text,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStatusOption = (status: 'available' | 'low_stock' | 'out_of_stock', label: string) => {
    const isSelected = formData.status === status;
    return (
      <TouchableOpacity
        key={status}
        style={[
          styles.statusOption,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setFormData({ ...formData, status })}
      >
        <Text
          style={[
            styles.statusLabel,
            {
              color: isSelected ? colors.background : colors.text,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Item</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            label="Item Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter item name"
            required
          />

          <TextInput
            label="Quantity"
            value={formData.quantity}
            onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            placeholder="Enter quantity"
            keyboardType="numeric"
            required
          />

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Category</Text>
            <View style={styles.categoryContainer}>
              {renderCategoryOption('plumbing', 'Plumbing')}
              {renderCategoryOption('hvac', 'HVAC')}
              {renderCategoryOption('electrical', 'Electrical')}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Status</Text>
            <View style={styles.statusContainer}>
              {renderStatusOption('available', 'Available')}
              {renderStatusOption('low_stock', 'Low Stock')}
              {renderStatusOption('out_of_stock', 'Out of Stock')}
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
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
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    gap: 8,
  },
  statusOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
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
}); 