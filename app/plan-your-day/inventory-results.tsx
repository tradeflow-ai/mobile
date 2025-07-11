/**
 * Inventory Results Screen
 * 
 * Shows the results of the inventory analysis including shopping list,
 * hardware store job (if created), and final plan ready for execution.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows } from '@/constants/Theme';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { Button } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';

export default function InventoryResultsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isApproving, setIsApproving] = useState(false);
  
  const {
    dailyPlan,
    isLoading,
    error,
    confirmInventory,
    hasHardwareStoreJob,
  } = useTodaysPlan();

  const handleApprovePlan = async () => {
    if (!dailyPlan) return;

    try {
      setIsApproving(true);
      
      // Confirm final inventory and approve plan
      await confirmInventory();
      
      // Navigation will be handled by the main screen
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to approve plan',
        [{ text: 'OK' }]
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading || !dailyPlan) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading inventory results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Button
            title="Go Back"
            onPress={handleGoBack}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const inventoryOutput = dailyPlan.inventory_output;
  const inventoryAnalysis = inventoryOutput?.inventory_analysis;
  const hardwareStoreJob = inventoryOutput?.hardware_store_job;
  const shoppingList = inventoryAnalysis?.shopping_list || [];
  const criticalItems = shoppingList.filter(item => item.priority === 'critical');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              📦 Inventory Analysis Complete
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Your daily plan is ready{hasHardwareStoreJob ? ' with hardware store stop' : ''}
            </Text>
          </View>

          {/* Hardware Store Job (if created) */}
          {hardwareStoreJob && (
            <View style={[styles.hardwareStoreCard, { backgroundColor: colors.card }, shadows.subtle(colorScheme)]}>
              <View style={styles.hardwareStoreHeader}>
                <FontAwesome name="shopping-cart" size={24} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Hardware Store Stop Added
                </Text>
              </View>
              <Text style={[styles.hardwareStoreTitle, { color: colors.text }]}>
                {hardwareStoreJob.title}
              </Text>
              <Text style={[styles.hardwareStoreAddress, { color: colors.text }]}>
                📍 {hardwareStoreJob.address}
              </Text>
              <Text style={[styles.hardwareStoreTime, { color: colors.text }]}>
                ⏱️ Estimated time: {hardwareStoreJob.estimated_duration} minutes
              </Text>
              <Text style={[styles.hardwareStoreCost, { color: colors.success }]}>
                💰 Estimated cost: ${hardwareStoreJob.estimated_cost.toFixed(2)}
              </Text>
              <Text style={[styles.hardwareStoreNote, { color: colors.text }]}>
                {hardwareStoreJob.scheduling_notes}
              </Text>
            </View>
          )}

          {/* Shopping List */}
          {shoppingList.length > 0 && (
            <View style={[styles.shoppingListCard, { backgroundColor: colors.card }, shadows.subtle(colorScheme)]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                🛒 Shopping List
              </Text>
              
              {criticalItems.length > 0 && (
                <View style={styles.criticalItemsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.error }]}>
                    Critical Items (Required)
                  </Text>
                  {criticalItems.map((item, index) => (
                    <View key={index} style={styles.shoppingItem}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, { color: colors.text }]}>
                          {item.item_name}
                        </Text>
                        <Text style={[styles.itemCost, { color: colors.success }]}>
                          ${item.estimated_cost.toFixed(2)}
                        </Text>
                      </View>
                      <Text style={[styles.itemQuantity, { color: colors.text }]}>
                        Quantity: {item.quantity_to_buy}
                      </Text>
                      <Text style={[styles.itemSupplier, { color: colors.text }]}>
                        Store: {item.preferred_supplier}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {shoppingList.filter(item => item.priority !== 'critical').length > 0 && (
                <View style={styles.otherItemsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Additional Items (Optional)
                  </Text>
                  {shoppingList.filter(item => item.priority !== 'critical').map((item, index) => (
                    <View key={index} style={styles.shoppingItem}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, { color: colors.text }]}>
                          {item.item_name}
                        </Text>
                        <Text style={[styles.itemCost, { color: colors.success }]}>
                          ${item.estimated_cost.toFixed(2)}
                        </Text>
                      </View>
                      <Text style={[styles.itemQuantity, { color: colors.text }]}>
                        Quantity: {item.quantity_to_buy}
                      </Text>
                      <Text style={[styles.itemSupplier, { color: colors.text }]}>
                        Store: {item.preferred_supplier}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {inventoryAnalysis?.total_shopping_cost && (
                <View style={styles.totalCostSection}>
                  <Text style={[styles.totalCostLabel, { color: colors.text }]}>
                    Total Estimated Cost:
                  </Text>
                  <Text style={[styles.totalCostValue, { color: colors.success }]}>
                    ${inventoryAnalysis.total_shopping_cost.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Current Stock */}
          {inventoryAnalysis?.current_stock && inventoryAnalysis.current_stock.length > 0 && (
            <View style={[styles.currentStockCard, { backgroundColor: colors.card }, shadows.subtle(colorScheme)]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                📋 Current Stock Status
              </Text>
              {inventoryAnalysis.current_stock.map((item, index) => (
                <View key={index} style={styles.stockItem}>
                  <View style={styles.stockHeader}>
                    <Text style={[styles.stockName, { color: colors.text }]}>
                      {item.item_name}
                    </Text>
                    <View style={[styles.stockStatus, { 
                      backgroundColor: item.sufficient ? colors.success : colors.error 
                    }]}>
                      <Text style={[styles.stockStatusText, { color: colors.background }]}>
                        {item.sufficient ? 'Sufficient' : 'Low Stock'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.stockQuantity, { color: colors.text }]}>
                    Available: {item.quantity_available} | Needed: {item.quantity_needed}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {inventoryOutput?.recommendations && inventoryOutput.recommendations.length > 0 && (
            <View style={[styles.recommendationsCard, { backgroundColor: colors.card }, shadows.subtle(colorScheme)]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                💡 Recommendations
              </Text>
              {inventoryOutput.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <FontAwesome name="lightbulb-o" size={16} color={colors.primary} />
                  <Text style={[styles.recommendationText, { color: colors.text }]}>
                    {recommendation}
                  </Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Modify Plan"
            onPress={() => Alert.alert('Feature Coming Soon', 'Plan modification will be available in a future update.')}
            variant="outline"
            style={styles.modifyButton}
          />
          <Button
            title="Approve & Start Day"
            onPress={handleApprovePlan}
            loading={isApproving}
            style={styles.approveButton}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
  },
  loadingText: {
    ...typography.body1,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
  },
  errorText: {
    ...typography.body1,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  backButton: {
    width: '100%',
  },
  header: {
    marginBottom: spacing.l,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    opacity: 0.8,
  },
  hardwareStoreCard: {
    borderRadius: 12,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  hardwareStoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  shoppingListCard: {
    borderRadius: 12,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  currentStockCard: {
    borderRadius: 12,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  recommendationsCard: {
    borderRadius: 12,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
    marginLeft: spacing.s,
  },
  hardwareStoreTitle: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  hardwareStoreAddress: {
    ...typography.body2,
    marginBottom: spacing.xs,
  },
  hardwareStoreTime: {
    ...typography.body2,
    marginBottom: spacing.xs,
  },
  hardwareStoreCost: {
    ...typography.body2,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  hardwareStoreNote: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  criticalItemsSection: {
    marginBottom: spacing.m,
  },
  otherItemsSection: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  shoppingItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: spacing.s,
    marginBottom: spacing.s,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.body1,
    fontWeight: '600',
    flex: 1,
  },
  itemCost: {
    ...typography.body2,
    fontWeight: '600',
  },
  itemQuantity: {
    ...typography.body2,
    marginBottom: spacing.xs,
  },
  itemSupplier: {
    ...typography.caption,
  },
  totalCostSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalCostLabel: {
    ...typography.body1,
    fontWeight: '600',
  },
  totalCostValue: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  stockItem: {
    marginBottom: spacing.m,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stockName: {
    ...typography.body1,
    fontWeight: '600',
    flex: 1,
  },
  stockStatus: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  stockStatusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  stockQuantity: {
    ...typography.body2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  recommendationText: {
    ...typography.body2,
    flex: 1,
    marginLeft: spacing.s,
  },
  actions: {
    flexDirection: 'row',
    ...spacing.helpers.paddingTop('m'),
    gap: spacing.m,
  },
  modifyButton: {
    flex: 1,
  },
  approveButton: {
    flex: 1,
  },
}); 