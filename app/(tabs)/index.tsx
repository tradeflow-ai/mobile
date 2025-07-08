import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Header } from '@/components/Header';
import { useAppNavigation } from '@/hooks/useNavigation';

// Simple inventory item interface
interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  category: string;
  status: 'available' | 'low_stock' | 'out_of_stock';
  lastUpdated: Date;
}

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { navigate } = useAppNavigation();

  const handleProfilePress = () => {
    // Navigate to profile using Expo Router
    navigate('/profile');
  };

  // Sample data for demonstration
  useEffect(() => {
    const sampleData: InventoryItem[] = [
      {
        id: '1',
        name: 'Laptop Dell XPS 13',
        description: 'High-performance laptop for development work',
        quantity: 5,
        category: 'Electronics',
        lastUpdated: new Date(),
        status: 'available',
      },
      {
        id: '2',
        name: 'Office Chair',
        description: 'Ergonomic office chair with lumbar support',
        quantity: 2,
        category: 'Furniture',
        lastUpdated: new Date(),
        status: 'low_stock',
      },
      {
        id: '3',
        name: 'Monitor 27"',
        description: '4K monitor for graphic design work',
        quantity: 0,
        category: 'Electronics',
        lastUpdated: new Date(),
        status: 'out_of_stock',
      },
    ];
    
    setInventoryItems(sampleData);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return colors.success;
      case 'low_stock':
        return colors.warning;
      case 'out_of_stock':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setInventoryItems(prev => prev.filter(i => i.id !== item.id));
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.category, { color: colors.placeholder }]}>{item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={[styles.description, { color: colors.placeholder }]} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.quantityContainer}>
          <FontAwesome name="cubes" size={16} color={colors.placeholder} />
          <Text style={[styles.quantity, { color: colors.text }]}>
            Quantity: {item.quantity}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.deleteButton}>
          <FontAwesome name="trash" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome name="cube" size={64} color={colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No items found
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
        Add your first inventory item to get started
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Header
          title="Inventory"
          profile={{
            imageUrl: 'https://avatars.githubusercontent.com/u/124599?v=4',
            onPress: handleProfilePress,
          }}
          rightAction={{
            icon: 'plus',
            onPress: () => Alert.alert('Add Item', 'This will open the add item modal'),
          }}
        />

        <FlatList
          data={inventoryItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  listContainer: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
