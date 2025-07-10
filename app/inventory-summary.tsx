import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, touchTargets } from '@/constants/Theme';
import { Card } from '@/components/ui';
import { MockAgentService } from '@/services/mockAgentService';

export default function InventorySummaryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Get today's plan
  const todaysPlan = useMemo(() => {
    const plan = MockAgentService.getTodaysMockDailyPlan('mock-user-123');
    console.log('Inventory Summary - Retrieved plan:', plan ? { 
      id: plan.id, 
      status: plan.status, 
      hasInventoryOutput: !!plan.inventory_output 
    } : 'No plan found');
    
    // If no plan found, try to create a default one for testing
    if (!plan) {
      console.log('Inventory Summary - Creating default plan');
      return MockAgentService.createDefaultPlanForToday('mock-user-123');
    }
    
    return plan;
  }, []);

  const inventoryData = useMemo(() => {
    if (!todaysPlan?.inventory_output) return null;
    return todaysPlan.inventory_output;
  }, [todaysPlan]);

  const handleStartDay = () => {
    // Dismiss the modal stack and navigate to the map tab
    router.dismissAll();
    router.replace('/(tabs)/map');
  };

  if (!inventoryData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: colors.text }]}>
            No inventory data available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            📦 Inventory & Shopping List
          </Text>
          <Text style={[styles.subtitle, { color: colors.placeholder }]}>
            Everything you need for today's jobs
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Parts Manifest */}
          {inventoryData.parts_manifest && inventoryData.parts_manifest.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🔧 Parts You Have
              </Text>
              {inventoryData.parts_manifest.map((jobParts: any, index: number) => (
                <View key={index} style={styles.jobPartsSection}>
                  <Text style={[styles.jobPartsTitle, { color: colors.text }]}>
                    Job {index + 1} Parts:
                  </Text>
                  {jobParts.required_parts?.map((part: any, partIndex: number) => (
                    <View key={partIndex} style={styles.partItem}>
                      <View style={styles.partInfo}>
                        <Text style={[styles.partName, { color: colors.text }]}>
                          {part.item_name}
                        </Text>
                        <Text style={[styles.partDetails, { color: colors.placeholder }]}>
                          Need: {part.quantity_needed} {part.unit} • Have: {part.quantity_available} {part.unit}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: part.quantity_available >= part.quantity_needed ? colors.success + '20' : colors.error + '20' }
                      ]}>
                        <FontAwesome 
                          name={part.quantity_available >= part.quantity_needed ? 'check' : 'times'} 
                          size={12} 
                          color={part.quantity_available >= part.quantity_needed ? colors.success : colors.error} 
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </Card>
          )}

          {/* Shopping List */}
          {inventoryData.shopping_list && inventoryData.shopping_list.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🛒 Shopping List
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.placeholder }]}>
                Items to pick up before starting jobs
              </Text>
              {inventoryData.shopping_list.map((item: any, index: number) => (
                <View key={index} style={styles.shoppingItem}>
                  <View style={styles.shoppingItemInfo}>
                    <Text style={[styles.shoppingItemName, { color: colors.text }]}>
                      {item.item_name}
                    </Text>
                    <Text style={[styles.shoppingItemDetails, { color: colors.placeholder }]}>
                      {item.quantity_needed} {item.unit} • {item.preferred_supplier}
                    </Text>
                    {item.estimated_cost && (
                      <Text style={[styles.shoppingItemCost, { color: colors.primary }]}>
                        ~${item.estimated_cost.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: item.priority === 'high' ? colors.error + '20' : colors.primary + '20' }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color: item.priority === 'high' ? colors.error : colors.primary }
                    ]}>
                      {item.priority?.toUpperCase() || 'NORMAL'}
                    </Text>
                  </View>
                </View>
              ))}
              
              {inventoryData.hardware_store_run && (
                <View style={styles.storeInfo}>
                  <Text style={[styles.storeTitle, { color: colors.text }]}>
                    📍 Recommended Store Visit
                  </Text>
                  <Text style={[styles.storeDetails, { color: colors.placeholder }]}>
                    Total estimated cost: ${inventoryData.hardware_store_run.total_estimated_cost?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={[styles.storeDetails, { color: colors.placeholder }]}>
                    Estimated shopping time: {inventoryData.hardware_store_run.estimated_shopping_time || 30} minutes
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Inventory Alerts */}
          {inventoryData.inventory_alerts && inventoryData.inventory_alerts.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ⚠️ Inventory Alerts
              </Text>
              {inventoryData.inventory_alerts.map((alert: any, index: number) => (
                <View key={index} style={styles.alertItem}>
                  <FontAwesome 
                    name="exclamation-triangle" 
                    size={16} 
                    color={colors.warning} 
                  />
                  <View style={styles.alertContent}>
                    <Text style={[styles.alertMessage, { color: colors.text }]}>
                      {alert.message}
                    </Text>
                    <Text style={[styles.alertType, { color: colors.warning }]}>
                      {alert.alert_type?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>

        {/* Start Day Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleStartDay}
            activeOpacity={0.8}
          >
            <Text style={[styles.startButtonText, { color: 'white' }]}>
              🚀 Start My Day
            </Text>
            <FontAwesome name="arrow-right" size={16} color="white" />
          </TouchableOpacity>
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
  header: {
    marginBottom: spacing.l,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  sectionCard: {
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
    borderRadius: radius.m,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.s,
  },
  sectionSubtitle: {
    ...typography.body,
    marginBottom: spacing.m,
  },
  jobPartsSection: {
    marginBottom: spacing.m,
  },
  jobPartsTitle: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  partItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  partDetails: {
    ...typography.caption,
  },
  statusBadge: {
    ...spacing.helpers.padding('xs'),
    borderRadius: radius.s,
  },
  shoppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  shoppingItemInfo: {
    flex: 1,
  },
  shoppingItemName: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  shoppingItemDetails: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  shoppingItemCost: {
    ...typography.caption,
    fontWeight: '600',
  },
  priorityBadge: {
    ...spacing.helpers.paddingHorizontal('s'),
    ...spacing.helpers.paddingVertical('xs'),
    borderRadius: radius.s,
  },
  priorityText: {
    ...typography.caption,
    fontWeight: '600',
  },
  storeInfo: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  storeTitle: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  storeDetails: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  alertType: {
    ...typography.caption,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingTop: spacing.m,
  },
  startButton: {
    ...touchTargets.styles.minimum,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: radius.m,
    ...spacing.helpers.paddingVertical('m'),
  },
  startButtonText: {
    ...typography.button,
    fontSize: 18,
  },
}); 