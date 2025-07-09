import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { spacing, shadows, radius } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { SearchBar, Avatar, EmptyState } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useNavigation';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { createDataUri } from '@/utils/imageUtils';

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { data: inventoryItems = [] } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');

  const { navigate } = useAppNavigation();

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return inventoryItems;
    }
    
    const query = searchQuery.toLowerCase();
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }, [inventoryItems, searchQuery]);

  const handleAddItem = () => {
    navigate('/add-item');
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
          <Avatar
            name={item.name}
            imageUri={item.image_url && item.image_url !== null ? createDataUri(item.image_url) : undefined}
            size="m"
            style={styles.avatarSpacing}
          />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.quantityContainer}>
            <Text style={[styles.quantity, { color: colors.text }]}>
              {item.quantity}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="search"
      title={searchQuery ? 'No items found' : 'No inventory items'}
      description={searchQuery ? 'Try adjusting your search terms' : 'Add your first inventory item to get started'}
      createButtonText={searchQuery ? undefined : 'Add Item'}
      handleOnCreatePress={handleAddItem}
    />
  );



  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Header
          title="Inventory"
          rightAction={{
            icon: 'plus',
            onPress: handleAddItem,
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
    ...spacing.helpers.padding('m'),
  },
  listContainer: {
    flexGrow: 1,
  },
  card: {
    borderRadius: radius.m,
    borderWidth: 1,
    ...spacing.helpers.padding('s'),
    marginBottom: spacing.xs,
    ...shadows.subtle,
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
  avatarSpacing: {
    marginRight: spacing.m,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: radius.s,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginRight: spacing.s,
  },
  quantity: {
    fontSize: 12,
    fontWeight: '600',
  },
});
