/**
 * Retry Management Panel Component
 * Shows failed operations with manual retry controls
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRetryManagement, useRetryStats } from '@/hooks/useRetryManagement';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { FailedOperation, RetryResult } from '@/services/retryManagementService';

// ==================== COMPONENT PROPS ====================

export interface RetryManagementPanelProps {
  /** Whether to show the panel */
  visible?: boolean;
  /** Whether to show detailed operation information */
  detailed?: boolean;
  /** Maximum number of operations to show */
  maxOperations?: number;
  /** Whether to show stats summary */
  showStats?: boolean;
  /** Whether to show only retryable operations */
  retryableOnly?: boolean;
  /** Custom styles */
  style?: any;
  /** Callback when operation is retried */
  onRetry?: (operationId: string, result: RetryResult) => void;
  /** Callback when all operations are retried */
  onRetryAll?: (results: RetryResult[]) => void;
}

// ==================== MAIN COMPONENT ====================

export const RetryManagementPanel: React.FC<RetryManagementPanelProps> = ({
  visible = true,
  detailed = false,
  maxOperations = 10,
  showStats = true,
  retryableOnly = false,
  style,
  onRetry,
  onRetryAll,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    failedOperations,
    retryableOperations,
    retryStats,
    retryOperation,
    retryAllOperations,
    clearAllFailed,
    clearResolved,
    isRetrying,
  } = useRetryManagement();

  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());

  // Filter operations based on props
  const operationsToShow = retryableOnly ? retryableOperations : failedOperations;
  const limitedOperations = operationsToShow.slice(0, maxOperations);

  // Don't render if not visible or no operations
  if (!visible || operationsToShow.length === 0) {
    return null;
  }

  const handleRetryOperation = async (operationId: string) => {
    try {
      const result = await retryOperation(operationId);
      
      if (result.success) {
        Alert.alert(
          'Retry Successful',
          'The operation was retried successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Retry Failed',
          'The operation failed to retry. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
      if (onRetry) {
        onRetry(operationId, result);
      }
    } catch (error) {
      Alert.alert(
        'Retry Error',
        'An error occurred while retrying the operation.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRetryAll = async () => {
    if (retryableOperations.length === 0) {
      Alert.alert(
        'No Retryable Operations',
        'There are no operations available for retry.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Retry All Operations',
      `Are you sure you want to retry all ${retryableOperations.length} operations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Retry All', 
          onPress: async () => {
            try {
              const results = await retryAllOperations();
              const successCount = results.filter(r => r.success).length;
              const failureCount = results.filter(r => !r.success).length;
              
              Alert.alert(
                'Retry All Complete',
                `${successCount} operations succeeded, ${failureCount} failed.`,
                [{ text: 'OK' }]
              );
              
              if (onRetryAll) {
                onRetryAll(results);
              }
            } catch (error) {
              Alert.alert(
                'Retry All Error',
                'An error occurred while retrying operations.',
                [{ text: 'OK' }]
              );
            }
          }
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Failed Operations',
      'Are you sure you want to clear all failed operations? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearAllFailed 
        },
      ]
    );
  };

  const toggleOperationExpansion = (operationId: string) => {
    setExpandedOperations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(operationId)) {
        newSet.delete(operationId);
      } else {
        newSet.add(operationId);
      }
      return newSet;
    });
  };

  const getOperationIcon = (operation: FailedOperation) => {
    switch (operation.type) {
      case 'query':
        return 'download';
      case 'mutation':
        return 'upload';
      case 'batch_operation':
        return 'tasks';
      case 'daily_plan':
        return 'calendar';
      default:
        return 'exclamation-triangle';
    }
  };

  const getOperationColor = (operation: FailedOperation) => {
    if (!operation.isRetryable) return colors.placeholder;
    
    switch (operation.metadata?.priority) {
      case 'critical':
        return colors.error;
      case 'normal':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.text;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.card, borderColor: colors.border },
      style,
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <FontAwesome name="exclamation-triangle" size={18} color={colors.warning} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Failed Operations
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {retryableOperations.length > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleRetryAll}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={[styles.actionButtonText, { color: colors.background }]}>
                  Retry All
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.border }]}
            onPress={clearResolved}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Clear Resolved
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={handleClearAll}
          >
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Summary */}
      {showStats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.background }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {retryStats.totalFailed}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Total Failed
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {retryStats.totalRetryable}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Retryable
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {retryStats.byPriority.critical}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Critical
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {retryStats.byPriority.normal}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Normal
            </Text>
          </View>
        </View>
      )}

      {/* Operations List */}
      <ScrollView style={styles.operationsContainer} showsVerticalScrollIndicator={false}>
        {limitedOperations.map((operation) => (
          <OperationItem
            key={operation.id}
            operation={operation}
            colors={colors}
            detailed={detailed}
            isExpanded={expandedOperations.has(operation.id)}
            onToggleExpansion={() => toggleOperationExpansion(operation.id)}
            onRetry={() => handleRetryOperation(operation.id)}
            isRetrying={isRetrying}
            getOperationIcon={getOperationIcon}
            getOperationColor={getOperationColor}
            formatTimestamp={formatTimestamp}
          />
        ))}
        
        {operationsToShow.length > maxOperations && (
          <View style={styles.moreIndicator}>
            <Text style={[styles.moreText, { color: colors.placeholder }]}>
              +{operationsToShow.length - maxOperations} more operations
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ==================== OPERATION ITEM COMPONENT ====================

interface OperationItemProps {
  operation: FailedOperation;
  colors: any;
  detailed: boolean;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onRetry: () => void;
  isRetrying: boolean;
  getOperationIcon: (operation: FailedOperation) => string;
  getOperationColor: (operation: FailedOperation) => string;
  formatTimestamp: (timestamp: Date) => string;
}

const OperationItem: React.FC<OperationItemProps> = ({
  operation,
  colors,
  detailed,
  isExpanded,
  onToggleExpansion,
  onRetry,
  isRetrying,
  getOperationIcon,
  getOperationColor,
  formatTimestamp,
}) => {
  const operationColor = getOperationColor(operation);
  
  return (
    <View style={[
      styles.operationItem,
      { borderColor: operationColor, backgroundColor: colors.background },
    ]}>
      {/* Operation Header */}
      <TouchableOpacity
        style={styles.operationHeader}
        onPress={onToggleExpansion}
        activeOpacity={0.7}
      >
        <View style={styles.operationInfo}>
          <FontAwesome
            name={getOperationIcon(operation) as any}
            size={16}
            color={operationColor}
            style={styles.operationIcon}
          />
          
          <View style={styles.operationDetails}>
            <Text style={[styles.operationTitle, { color: colors.text }]}>
              {operation.entity} {operation.operation}
            </Text>
            <Text style={[styles.operationSubtitle, { color: colors.placeholder }]}>
              {operation.type} • {operation.retryCount}/{operation.maxRetries} attempts
            </Text>
          </View>
        </View>
        
        <View style={styles.operationActions}>
          {operation.isRetryable && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <FontAwesome name="refresh" size={12} color={colors.background} />
              )}
            </TouchableOpacity>
          )}
          
          <FontAwesome
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={12}
            color={colors.placeholder}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={styles.operationExpanded}>
          <View style={styles.operationMeta}>
            <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
              Timestamp:
            </Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {formatTimestamp(operation.timestamp)}
            </Text>
          </View>
          
          <View style={styles.operationMeta}>
            <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
              Priority:
            </Text>
            <Text style={[styles.metaValue, { color: operationColor }]}>
              {operation.metadata?.priority || 'normal'}
            </Text>
          </View>
          
          {detailed && operation.error && (
            <View style={styles.operationMeta}>
              <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
                Error:
              </Text>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {operation.error.message || String(operation.error)}
              </Text>
            </View>
          )}
          
          {detailed && operation.data && (
            <View style={styles.operationMeta}>
              <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
                Data:
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={3}>
                {JSON.stringify(operation.data, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.m,
    borderWidth: 1,
    marginHorizontal: spacing.m,
    marginVertical: spacing.s,
    ...shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  headerTitle: {
    ...typography.h4,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.s,
    marginHorizontal: spacing.m,
    borderRadius: radius.s,
    marginBottom: spacing.s,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
  },
  operationsContainer: {
    maxHeight: 400,
    paddingHorizontal: spacing.m,
  },
  operationItem: {
    borderLeftWidth: 3,
    borderRadius: radius.s,
    marginBottom: spacing.s,
    overflow: 'hidden',
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  operationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  operationIcon: {
    marginRight: spacing.s,
  },
  operationDetails: {
    flex: 1,
  },
  operationTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  operationSubtitle: {
    ...typography.caption,
    fontSize: 11,
  },
  operationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  retryButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operationExpanded: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  operationMeta: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 70,
  },
  metaValue: {
    ...typography.caption,
    fontSize: 11,
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
  },
  moreIndicator: {
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  moreText: {
    ...typography.caption,
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default RetryManagementPanel; 