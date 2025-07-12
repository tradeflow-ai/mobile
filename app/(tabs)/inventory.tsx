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
import { typography, spacing, shadows, radius } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { SearchBar, Avatar, EmptyState, TabSelector, TabOption, OfflineExperienceBar } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useNavigation';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { createDataUri } from '@/utils/imageUtils';

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { data: inventoryItems = [] } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('current');

  const { navigate } = useAppNavigation();

  // Tab options
  const tabOptions: TabOption[] = [
    { key: 'current', label: 'Current' },
    { key: 'required', label: 'Required' },
  ];

  // Filter items based on search query and selected tab
  const filteredItems = useMemo(() => {
    // For required tab, always return empty array until user starts their day
    if (selectedTab === 'required') {
      return [];
    }

    // For current tab, filter by search query
    if (!searchQuery.trim()) {
      return inventoryItems;
    }
    
    const query = searchQuery.toLowerCase();
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }, [inventoryItems, searchQuery, selectedTab]);

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

  const renderEmptyState = () => {
    if (selectedTab === 'required') {
      return (
        <EmptyState
          icon="list"
          title="No required items"
          description="Start your day to see items you need for today's jobs"
        />
      );
    }

    return (
      <EmptyState
        icon="search"
        title={searchQuery ? 'No items found' : 'No inventory items'}
        description={searchQuery ? 'Try adjusting your search terms' : 'Add your first inventory item to get started'}
        createButtonText={searchQuery ? undefined : 'Add Item'}
        handleOnCreatePress={handleAddItem}
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

        {/* Offline Experience Bar */}
        <OfflineExperienceBar variant="compact" />

        <View style={styles.content}>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
            style={styles.searchBar}
          />

          {/* Current/Required Toggle */}
          <TabSelector
            options={tabOptions}
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
            containerStyle={styles.tabSelector}
          />

          {/* Inventory List */}
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  tabSelector: {
    marginBottom: spacing.m,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl + spacing.l, // Extra padding for tab bar + buffer
  },
  separator: {
    height: spacing.s,
  },
  card: {
    borderRadius: radius.m,
    borderWidth: 1,
    ...spacing.helpers.padding('s'),
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
    ...typography.h4,
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
    ...typography.caption,
    fontWeight: '600',
  },
});
