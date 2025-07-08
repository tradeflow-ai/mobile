import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useNavigation';
import { inventoryItemsAtom, InventoryItem } from '@/store/atoms';

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [inventoryItems] = useAtom(inventoryItemsAtom);
  const [searchQuery, setSearchQuery] = useState('');

  const { navigate } = useAppNavigation();

  const handleProfilePress = () => {
    // Navigate to profile using Expo Router
    navigate('/profile');
  };

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return inventoryItems;
    }
    
    const query = searchQuery.toLowerCase();
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [inventoryItems, searchQuery]);

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
        return '#3B82F6'; // Blue
      case 'hvac':
        return '#F59E0B'; // Orange
      case 'electrical':
        return '#EF4444'; // Red
      default:
        return colors.primary;
    }
  };

  const handleItemPress = (item: InventoryItem) => {
    navigate(`/edit-item?item=${encodeURIComponent(JSON.stringify(item))}`);
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <FontAwesome 
              name={getCategoryIcon(item.category)} 
              size={14} 
              color={getCategoryColor(item.category)} 
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.category, { color: colors.placeholder }]}>
              {item.category.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.quantityContainer}>
            <Text style={[styles.quantity, { color: colors.text }]}>
              {item.quantity}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome name="search" size={48} color={colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No items found' : 'No inventory items'}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
        {searchQuery ? 'Try adjusting your search terms' : 'Add your first inventory item to get started'}
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

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search inventory..."
        />

        <FlatList
          data={filteredItems}
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
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  quantity: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 60,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
