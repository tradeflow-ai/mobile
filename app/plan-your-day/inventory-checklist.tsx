/**
 * TradeFlow Mobile App - Inventory Checklist Screen
 * 
 * This screen displays the AI-generated parts manifest and shopping list from
 * the Inventory Specialist agent. Users can review required parts, check off
 * items they have, and see what needs to be purchased before starting their day.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { typography, spacing, radius } from '@/constants/Theme';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { LoadingStepUI } from '@/components/LoadingStepUI';
import { ErrorStepUI } from '@/components/ErrorStepUI';
import type { InventoryOutput } from '@/services/dailyPlanService';

interface InventoryItem {
  id: string;
  jobId: string;
  name: string;
  quantityNeeded: number;
  quantityAvailable: number;
  unit: string;
  category: string;
  isAvailable: boolean;
  isChecked: boolean;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantityNeeded: number;
  unit: string;
  category: string;
  preferredSupplier: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  isChecked: boolean;
}

export default function InventoryChecklistScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    dailyPlan,
    isLoading,
    error,
    confirmInventory,
    approvePlan,
    saveUserModifications,
    isConnected,
  } = useTodaysPlan();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Convert inventory output to display items
   */
  useEffect(() => {
    if (dailyPlan?.inventory_output) {
      const inventoryOutput = dailyPlan.inventory_output as InventoryOutput;
      
      // Convert parts manifest to inventory items
      const items: InventoryItem[] = [];
      inventoryOutput.parts_manifest.forEach(jobParts => {
        jobParts.required_parts.forEach(part => {
          items.push({
            id: part.inventory_item_id,
            jobId: jobParts.job_id,
            name: part.item_name,
            quantityNeeded: part.quantity_needed,
            quantityAvailable: part.quantity_available,
            unit: part.unit,
            category: part.category,
            isAvailable: part.quantity_available >= part.quantity_needed,
            isChecked: part.quantity_available >= part.quantity_needed,
          });
        });
      });
      setInventoryItems(items);
      
      // Convert shopping list to shopping items
      const shopping: ShoppingItem[] = inventoryOutput.shopping_list.map((item, index) => ({
        id: `shopping-${index}`,
        name: item.item_name,
        quantityNeeded: item.quantity_needed,
        unit: item.unit,
        category: item.category,
        preferredSupplier: item.preferred_supplier,
        estimatedCost: item.estimated_cost,
        priority: item.priority,
        isChecked: false,
      }));
      setShoppingItems(shopping);
    }
  }, [dailyPlan?.inventory_output]);

  /**
   * Handle inventory item check toggle
   */
  const handleInventoryToggle = (itemId: string) => {
    setInventoryItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, isChecked: !item.isChecked }
          : item
      )
    );
    setHasChanges(true);
  };

  /**
   * Handle shopping item check toggle
   */
  const handleShoppingToggle = (itemId: string) => {
    setShoppingItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, isChecked: !item.isChecked }
          : item
      )
    );
    setHasChanges(true);
  };

  /**
   * Handle plan completion
   */
  const handleCompletePlanning = async () => {
    setIsCompleting(true);
    
    try {
      // Save user modifications if any
      if (hasChanges) {
        const modifications = {
          inventory_changes: {
            parts_modifications: inventoryItems
              .filter(item => !item.isChecked && item.isAvailable)
              .map(item => ({
                inventory_item_id: item.id,
                quantity_override: 0,
                timestamp: new Date().toISOString(),
              })),
            shopping_list_modifications: shoppingItems
              .filter(item => item.isChecked)
              .map(item => ({
                item_name: item.name,
                action: 'remove' as const,
                timestamp: new Date().toISOString(),
              })),
          },
        };
        await saveUserModifications(modifications);
      }
      
      // Complete inventory confirmation and approve the plan
      await confirmInventory();
      
      // Show completion message
      Alert.alert(
        'Planning Complete! 🎉',
        'Your daily plan is ready. Time to start your day!',
        [
          { 
            text: 'Start Working', 
            onPress: () => router.push('/(tabs)'),
            style: 'default'
          }
        ]
      );
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to complete planning',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCompleting(false);
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.secondary;
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  /**
   * Get icon for item category
   */
  const getItemIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'electrical': return 'flash';
      case 'plumbing': return 'wrench';
      case 'tools': return 'gears';
      case 'hardware': return 'cog';
      case 'materials': return 'cube';
      case 'safety': return 'shield';
      case 'fasteners': return 'link';
      case 'pipes': return 'circle-o';
      case 'fittings': return 'puzzle-piece';
      default: return 'cube';
    }
  };

  /**
   * Get description for item
   */
  const getItemDescription = (category: string, name: string) => {
    // Generate contextual descriptions based on category and name
    const descriptions: Record<string, string> = {
      'electrical': 'Electrical component for wiring and connections',
      'plumbing': 'Plumbing fixture or pipe component',
      'tools': 'Professional tool for installation and repair',
      'hardware': 'Hardware component for mounting and fastening',
      'materials': 'Construction material for building and repair',
      'safety': 'Safety equipment for protection during work',
      'fasteners': 'Fastening hardware for secure connections',
      'pipes': 'Pipe section for water or gas distribution',
      'fittings': 'Connecting piece for pipe joints and turns',
    };
    
    return descriptions[category.toLowerCase()] || `${category} component needed for job completion`;
  };

  /**
   * Calculate totals
   */
  const availableCount = inventoryItems.filter(item => item.isAvailable).length;
  const missingCount = inventoryItems.filter(item => !item.isAvailable).length;
  const shoppingTotal = shoppingItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  const checkedShoppingTotal = shoppingItems
    .filter(item => item.isChecked)
    .reduce((sum, item) => sum + item.estimatedCost, 0);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <LoadingStepUI 
          step="Loading inventory checklist..." 
          isConnected={isConnected}
        />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ErrorStepUI 
          error={error}
          onRetry={() => router.back()}
          retryText="Go Back"
        />
      </SafeAreaView>
    );
  }

  // No inventory output available
  if (!dailyPlan?.inventory_output) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ErrorStepUI 
          error="No inventory data available to review"
          onRetry={() => router.back()}
          retryText="Go Back"
        />
      </SafeAreaView>
    );
  }

  const inventoryOutput = dailyPlan.inventory_output as InventoryOutput;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <FontAwesome 
                name="clipboard" 
                size={24} 
                color={colors.background}
              />
            </View>
            
            <View style={styles.headerText}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                Final Check: Inventory
              </Text>
              <Text style={[styles.subtitleText, { color: colors.secondary }]}>
                Verify you have everything needed for today's jobs
              </Text>
            </View>
          </View>
        </Card>

        {/* Summary Stats */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {availableCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                Available
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                {missingCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                Missing
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>
                {shoppingItems.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                To Buy
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {formatCurrency(shoppingTotal)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                Est. Cost
              </Text>
            </View>
          </View>
        </Card>

        {/* Inventory Checklist */}
        {inventoryItems.length > 0 && (
          <Card style={styles.inventoryCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome 
                name="wrench" 
                size={18} 
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Parts & Tools Needed
              </Text>
              {hasChanges && (
                <View style={styles.changesIndicator}>
                  <FontAwesome 
                    name="pencil" 
                    size={12} 
                    color={colors.warning}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.itemsList}>
              {inventoryItems.map((item) => (
                <View key={item.id} style={styles.inventoryItem}>
                  <Checkbox
                    checked={item.isChecked}
                    onPress={() => handleInventoryToggle(item.id)}
                    containerStyle={styles.checkbox}
                  />
                  
                  {/* Item Image */}
                  <View style={[styles.itemImageContainer, { backgroundColor: colors.card }]}>
                    <FontAwesome 
                      name={getItemIcon(item.category)} 
                      size={24} 
                      color={colors.primary}
                    />
                  </View>
                  
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemName, { 
                        color: colors.text,
                        textDecorationLine: item.isChecked ? 'line-through' : 'none',
                        opacity: item.isChecked ? 0.6 : 1,
                      }]}>
                        {item.name}
                      </Text>
                      
                      <View style={[styles.statusBadge, { 
                        backgroundColor: item.isAvailable ? colors.success : colors.error 
                      }]}>
                        <Text style={[styles.statusText, { color: colors.background }]}>
                          {item.isAvailable ? 'Available' : 'Missing'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemDescription, { color: colors.secondary }]}>
                        {getItemDescription(item.category, item.name)}
                      </Text>
                      <Text style={[styles.itemQuantity, { color: colors.secondary }]}>
                        Need: {item.quantityNeeded} {item.unit} • 
                        Have: {item.quantityAvailable} {item.unit}
                      </Text>
                      <Text style={[styles.itemCategory, { color: colors.secondary }]}>
                        {item.category} • Job {item.jobId}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Shopping List */}
        {shoppingItems.length > 0 && (
          <Card style={styles.shoppingCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome 
                name="shopping-cart" 
                size={18} 
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Shopping List
              </Text>
              <Text style={[styles.shoppingTotal, { color: colors.primary }]}>
                {formatCurrency(checkedShoppingTotal)} / {formatCurrency(shoppingTotal)}
              </Text>
            </View>
            
            <View style={styles.itemsList}>
              {shoppingItems.map((item) => (
                <View key={item.id} style={styles.shoppingItem}>
                  <Checkbox
                    checked={item.isChecked}
                    onPress={() => handleShoppingToggle(item.id)}
                    containerStyle={styles.checkbox}
                  />
                  
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemName, { 
                        color: colors.text,
                        textDecorationLine: item.isChecked ? 'line-through' : 'none',
                        opacity: item.isChecked ? 0.6 : 1,
                      }]}>
                        {item.name}
                      </Text>
                      
                      <View style={styles.priceContainer}>
                        <View style={[styles.priorityDot, { 
                          backgroundColor: getPriorityColor(item.priority) 
                        }]} />
                        <Text style={[styles.itemPrice, { color: colors.text }]}>
                          {formatCurrency(item.estimatedCost)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemQuantity, { color: colors.secondary }]}>
                        {item.quantityNeeded} {item.unit} • {item.category}
                      </Text>
                      <Text style={[styles.itemSupplier, { color: colors.secondary }]}>
                        {item.preferredSupplier}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Hardware Store Runs */}
        {inventoryOutput.hardware_store_run && (
          <Card style={styles.storeCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome 
                name="home" 
                size={18} 
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Hardware Store Runs
              </Text>
            </View>
            
            <View style={styles.storesList}>
              {inventoryOutput.hardware_store_run.store_locations.map((store, index) => (
                <View key={index} style={styles.storeItem}>
                  <View style={styles.storeHeader}>
                    <Text style={[styles.storeName, { color: colors.text }]}>
                      {store.store_name}
                    </Text>
                    <Text style={[styles.storeTime, { color: colors.secondary }]}>
                      ~{store.estimated_visit_time}min
                    </Text>
                  </View>
                  
                  <Text style={[styles.storeAddress, { color: colors.secondary }]}>
                    {store.address}
                  </Text>
                  
                  <Text style={[styles.storeItems, { color: colors.secondary }]}>
                    Items: {store.items_available.join(', ')}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.storeTotal}>
              <Text style={[styles.storeTotalText, { color: colors.text }]}>
                Total estimated shopping time: {inventoryOutput.hardware_store_run.estimated_shopping_time} minutes
              </Text>
            </View>
          </Card>
        )}

        {/* Inventory Alerts */}
        {inventoryOutput.inventory_alerts.length > 0 && (
          <Card style={styles.alertsCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome 
                name="exclamation-triangle" 
                size={18} 
                color={colors.warning}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Inventory Alerts
              </Text>
            </View>
            
            <View style={styles.alertsList}>
              {inventoryOutput.inventory_alerts.map((alert, index) => (
                <View key={index} style={[styles.alertItem, { 
                  backgroundColor: alert.alert_type === 'out_of_stock' ? 
                    'rgba(220, 53, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)'
                }]}>
                  <FontAwesome 
                    name={alert.alert_type === 'out_of_stock' ? 'times-circle' : 'exclamation-circle'} 
                    size={16} 
                    color={alert.alert_type === 'out_of_stock' ? colors.error : colors.warning}
                  />
                  <View style={styles.alertContent}>
                    <Text style={[styles.alertTitle, { color: colors.text }]}>
                      {alert.item_name}
                    </Text>
                    <Text style={[styles.alertMessage, { color: colors.secondary }]}>
                      {alert.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title={isCompleting ? 'Completing Planning...' : 'Ready to Start My Day!'}
            onPress={handleCompletePlanning}
            variant="primary"
            disabled={isCompleting}
            style={styles.completeButton}
          />
          
          <Button
            title="Modify Route"
            onPress={() => router.back()}
            variant="outline"
            style={styles.backButton}
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
    ...spacing.helpers.padding('m'),
  },
  headerCard: {
    marginBottom: spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  headerText: {
    flex: 1,
  },
  titleText: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    ...typography.body,
    lineHeight: 20,
  },
  summaryCard: {
    marginBottom: spacing.m,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
  },
  inventoryCard: {
    marginBottom: spacing.m,
  },
  shoppingCard: {
    marginBottom: spacing.m,
  },
  storeCard: {
    marginBottom: spacing.m,
  },
  alertsCard: {
    marginBottom: spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  sectionTitle: {
    ...typography.h3,
    flex: 1,
  },
  changesIndicator: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingTotal: {
    ...typography.h4,
    fontWeight: 'bold',
  },
  itemsList: {
    gap: spacing.m,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.s,
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.s,
  },
  checkbox: {
    marginRight: spacing.m,
    marginTop: spacing.xs,
  },
  itemImageContainer: {
    width: 50,
    height: 50,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.s,
  },
  itemDescription: {
    ...typography.caption,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
    fontSize: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemPrice: {
    ...typography.body,
    fontWeight: 'bold',
  },
  itemDetails: {
    gap: spacing.xs,
  },
  itemQuantity: {
    ...typography.caption,
  },
  itemCategory: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  itemSupplier: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  storesList: {
    gap: spacing.m,
  },
  storeItem: {
    backgroundColor: 'rgba(244, 164, 96, 0.05)',
    borderRadius: radius.m,
    padding: spacing.m,
    borderLeftWidth: 3,
    borderLeftColor: '#F4A460',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  storeName: {
    ...typography.body,
    fontWeight: 'bold',
  },
  storeTime: {
    ...typography.caption,
    fontWeight: '600',
  },
  storeAddress: {
    ...typography.caption,
    marginBottom: spacing.s,
  },
  storeItems: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  storeTotal: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 164, 96, 0.3)',
  },
  storeTotalText: {
    ...typography.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  alertsList: {
    gap: spacing.m,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.m,
    borderRadius: radius.m,
    gap: spacing.m,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  alertMessage: {
    ...typography.caption,
    lineHeight: 16,
  },
  actionContainer: {
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  completeButton: {
    // Button styles handled by Button component
  },
  backButton: {
    // Button styles handled by Button component
  },
}); 