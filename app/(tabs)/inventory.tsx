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
import { SearchBar, Avatar, EmptyState, TabSelector, TabOption } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useNavigation';
import { InventoryItem } from '@/hooks/useInventory';
import { createDataUri } from '@/utils/imageUtils';
import { useAtom } from 'jotai';
import { mockInventoryAtom } from '@/store/atoms';

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [inventoryItems] = useAtom(mockInventoryAtom);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInventoryFilter, setSelectedInventoryFilter] = useState('current');

  const { navigate } = useAppNavigation();

  // Separate items into current and needed
  const currentItems = useMemo(() => 
    inventoryItems.filter((item: any) => item.quantity > 0), 
    [inventoryItems]
  );
  
  const neededItems = useMemo(() => 
    inventoryItems.filter((item: any) => item.quantity <= 0), 
    [inventoryItems]
  );

  // Inventory options for TabSelector
  const inventoryOptions: TabOption[] = [
    { key: 'current', label: 'Current', count: currentItems.length },
    { key: 'needed', label: 'Needed', count: neededItems.length },
  ];

  // Determine which items to show based on filter
  const displayItems = selectedInventoryFilter === 'current' ? currentItems : neededItems;

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return displayItems;
    }
    
    const query = searchQuery.toLowerCase();
    return displayItems.filter((item: any) => 
      item.name.toLowerCase().includes(query)
    );
  }, [displayItems, searchQuery]);

  const handleAddItem = () => {
    navigate('/add-item');
  };

  const handleItemPress = (item: any) => {
    navigate(`/edit-item?item=${encodeURIComponent(JSON.stringify(item))}`);
  };

  const handleInventoryFilterChange = (key: string) => {
    setSelectedInventoryFilter(key);
  };

  const renderItem = ({ item }: { item: any }) => (
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

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <EmptyState
          icon="search"
          title="No items found"
          description="Try adjusting your search terms"
        />
      );
    }

    if (selectedInventoryFilter === 'current') {
      return (
        <EmptyState
          icon="archive"
          title="No current inventory"
          description="Add your first inventory item to get started"
          createButtonText="Add Item"
          handleOnCreatePress={handleAddItem}
        />
      );
    }

    return (
      <EmptyState
        icon="exclamation-triangle"
        title="No items needed"
        description="All inventory items are currently stocked"
      />
    );
  };



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

        <View style={styles.content}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
            style={styles.searchBar}
          />

          <TabSelector
            options={inventoryOptions}
            selectedKey={selectedInventoryFilter}
            onSelectionChange={handleInventoryFilterChange}
            containerStyle={styles.tabContainer}
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
  content: {
    flex: 1,
  },
  searchBar: {
    marginBottom: spacing.m,
  },
  tabContainer: {
    marginBottom: spacing.m,
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
