import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Header } from '@/components/Header';
import { QuickActionButton } from '@/components/QuickActionButton';
import { Button, Card } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useNavigation';
import { inventoryItemsAtom } from '@/store/atoms';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [inventoryItems] = useAtom(inventoryItemsAtom);
  const [isDayStarted, setIsDayStarted] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);

  const { navigate } = useAppNavigation();

  const handleBeginDay = () => {
    setIsDayStarted(true);
    setIsOnBreak(false);
  };

  const handleEndDay = () => {
    setIsDayStarted(false);
    setIsOnBreak(false);
  };

  const handleTakeBreak = () => {
    setIsOnBreak(true);
  };

  const handleEndBreak = () => {
    setIsOnBreak(false);
  };

  const quickActions = [
    {
      id: 'inventory',
      title: 'Inventory',
      icon: 'list',
      onPress: () => navigate('/inventory'),
    },
    {
      id: 'map',
      title: 'Map',
      icon: 'map',
      onPress: () => navigate('/map'),
    },
    {
      id: 'add-item',
      title: 'Add Item',
      icon: 'plus',
      onPress: () => Alert.alert('Add Item', 'This will open the add item modal'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'cog',
      onPress: () => navigate('/settings'),
    },
  ];

  const renderQuickAction = (action: typeof quickActions[0]) => (
    <QuickActionButton
      key={action.id}
      title={action.title}
      icon={action.icon}
      onPress={action.onPress}
    />
  );

  const renderStats = () => (
    <Card style={styles.statsCard}>
      <Text style={[styles.statsTitle, { color: colors.text }]}>
        Today's Overview
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {inventoryItems.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>
            Inventory Items
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: !isDayStarted ? colors.error : isOnBreak ? colors.warning : colors.success }]}>
            {!isDayStarted ? 'Inactive' : isOnBreak ? 'On Break' : 'Active'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>
            Status
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            0
          </Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>
            Routes Today
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Header
          title="Home"
          rightAction={{
            icon: 'bell',
            onPress: () => Alert.alert('Notifications', 'No new notifications'),
          }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Day Start/End Button */}
          <Card style={styles.dayCard}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>
              Work Day
            </Text>
            <Text style={[styles.daySubtitle, { color: colors.placeholder }]}>
              {!isDayStarted ? 'Ready to start your day?' : isOnBreak ? 'You are currently on break' : 'Your work day is active'}
            </Text>
            {!isDayStarted ? (
              <Button
                variant="primary"
                onPress={handleBeginDay}
                title="Begin Day"
                style={styles.dayButton}
              />
            ) : (
              <View style={styles.dayButtonsContainer}>
                <Button
                  variant="primary"
                  onPress={handleEndDay}
                  title="End Day"
                  style={styles.dayButtonLeft}
                />
                <Button
                  variant="primary"
                  onPress={isOnBreak ? handleEndBreak : handleTakeBreak}
                  title={isOnBreak ? 'End Break' : 'Take Break'}
                  style={styles.dayButtonRight}
                />
              </View>
            )}
          </Card>

          {/* Stats Overview */}
          {renderStats()}

          {/* Quick Actions */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>

          {/* Recent Activity */}
          <Card style={styles.recentCard}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>
              Recent Activity
            </Text>
            <View style={styles.recentItem}>
              <FontAwesome name="circle" size={8} color={colors.placeholder} />
              <Text style={[styles.recentText, { color: colors.placeholder }]}>
                No recent activity
              </Text>
            </View>
          </Card>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  dayCard: {
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  daySubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  dayButton: {
    minWidth: 120,
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dayButtonLeft: {
    flex: 1,
  },
  dayButtonRight: {
    flex: 1,
  },
  statsCard: {
    padding: 16,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  recentCard: {
    padding: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
