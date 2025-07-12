/**
 * Critical Operations Test Panel
 * Testing interface for offline-first critical operations
 * Used for development and testing purposes only
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing } from '@/constants/Theme';
import { 
  useCriticalOperations,
  useCriticalOperationsStats,
  useUpdateInventoryQuantity,
  useUpdateJobStatus,
  useUpdateRouteProgress,
  useStartJob,
  useCompleteJob,
  useVisitLocation
} from '@/hooks/useCriticalOperations';

interface CriticalOperationsTestPanelProps {
  detailed?: boolean;
  showStats?: boolean;
}

export const CriticalOperationsTestPanel: React.FC<CriticalOperationsTestPanelProps> = ({
  detailed = true,
  showStats = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  // Critical operations hooks
  const { 
    pendingOperationsCount, 
    isOnline, 
    forceSyncPendingOperations,
    clearPendingOperations 
  } = useCriticalOperations();
  
  const stats = useCriticalOperationsStats();
  const { updateQuantity } = useUpdateInventoryQuantity();
  const { updateStatus } = useUpdateJobStatus();
  const { updateProgress } = useUpdateRouteProgress();
  const { startJob } = useStartJob();
  const { completeJob } = useCompleteJob();
  const { visitLocation } = useVisitLocation();

  // Test functions
  const testInventoryUpdate = async () => {
    try {
      setIsLoading(true);
      const testItemId = `test-item-${Date.now()}`;
      const newQuantity = Math.floor(Math.random() * 100) + 1;
      
      await updateQuantity(testItemId, newQuantity, 'set');
      
      const result = `✅ Inventory Update: Set item ${testItemId} to ${newQuantity}`;
      setTestResults(prev => [...prev, result]);
      
      if (!isOnline) {
        Alert.alert('Offline Test', 'Inventory update queued for sync when online');
      }
    } catch (error) {
      const result = `❌ Inventory Update Failed: ${error}`;
      setTestResults(prev => [...prev, result]);
    } finally {
      setIsLoading(false);
    }
  };

  const testJobStatusChange = async () => {
    try {
      setIsLoading(true);
      const testJobId = `test-job-${Date.now()}`;
      
      // Start the job
      await startJob(testJobId, {
        latitude: 40.7128,
        longitude: -74.0060,
      });
      
      const result = `✅ Job Status: Started job ${testJobId}`;
      setTestResults(prev => [...prev, result]);
      
      if (!isOnline) {
        Alert.alert('Offline Test', 'Job status change queued for sync when online');
      }
    } catch (error) {
      const result = `❌ Job Status Change Failed: ${error}`;
      setTestResults(prev => [...prev, result]);
    } finally {
      setIsLoading(false);
    }
  };

  const testRouteProgress = async () => {
    try {
      setIsLoading(true);
      const testRouteId = `test-route-${Date.now()}`;
      const testLocationId = `test-location-${Date.now()}`;
      
      await updateProgress(testRouteId, testLocationId, 'visited', {
        latitude: 40.7589,
        longitude: -73.9851,
      });
      
      const result = `✅ Route Progress: Marked location ${testLocationId} as visited`;
      setTestResults(prev => [...prev, result]);
      
      if (!isOnline) {
        Alert.alert('Offline Test', 'Route progress queued for sync when online');
      }
    } catch (error) {
      const result = `❌ Route Progress Failed: ${error}`;
      setTestResults(prev => [...prev, result]);
    } finally {
      setIsLoading(false);
    }
  };

  const testAllCriticalOperations = async () => {
    setTestResults([]);
    setIsLoading(true);
    
    try {
      // Test all critical operations in sequence
      await testInventoryUpdate();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testJobStatusChange();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testRouteProgress();
      
      Alert.alert(
        'Test Complete', 
        `All critical operations tested. ${isOnline ? 'Online' : 'Offline'} mode.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', `Some tests failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const handleForcSync = async () => {
    try {
      setIsLoading(true);
      await forceSyncPendingOperations();
      Alert.alert('Sync Complete', 'All pending operations have been processed');
    } catch (error) {
      Alert.alert('Sync Error', `Failed to sync: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPending = async () => {
    try {
      setIsLoading(true);
      await clearPendingOperations();
      setTestResults([]);
      Alert.alert('Cleared', 'All pending operations have been cleared');
    } catch (error) {
      Alert.alert('Clear Error', `Failed to clear: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Critical Operations Testing
      </Text>
      
      {showStats && (
        <View style={styles.statsContainer}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            Current Status
          </Text>
          <View style={styles.statsRow}>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Connection:
            </Text>
            <Text style={[
              styles.statValue, 
              { color: isOnline ? colors.success : colors.error }
            ]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Pending Operations:
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {pendingOperationsCount}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Inventory Updates:
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.inventoryUpdates}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Job Status Changes:
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.jobStatusChanges}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>
              Route Progress:
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.routeProgress}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.buttonsContainer}>
        <Button
          title="Test Inventory Update"
          variant="outline"
          onPress={testInventoryUpdate}
          disabled={isLoading}
          style={styles.testButton}
        />
        
        <Button
          title="Test Job Status Change"
          variant="outline"
          onPress={testJobStatusChange}
          disabled={isLoading}
          style={styles.testButton}
        />
        
        <Button
          title="Test Route Progress"
          variant="outline"
          onPress={testRouteProgress}
          disabled={isLoading}
          style={styles.testButton}
        />
        
        <Button
          title="Test All Operations"
          variant="primary"
          onPress={testAllCriticalOperations}
          disabled={isLoading}
          style={styles.testButton}
        />
      </View>

      {pendingOperationsCount > 0 && (
        <View style={styles.controlsContainer}>
          <Button
            title="Force Sync"
            variant="secondary"
            onPress={handleForcSync}
            disabled={isLoading || !isOnline}
            style={styles.controlButton}
          />
          
          <Button
            title="Clear Pending"
            variant="outline"
            onPress={handleClearPending}
            disabled={isLoading}
            style={styles.controlButton}
          />
        </View>
      )}

      {detailed && testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              Test Results
            </Text>
            <Button
              title="Clear"
              variant="ghost"
              onPress={clearTestResults}
              style={styles.clearButton}
            />
          </View>
          
          {testResults.map((result, index) => (
            <Text 
              key={index} 
              style={[styles.resultText, { color: colors.placeholder }]}
            >
              {result}
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    marginVertical: spacing.s,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: spacing.m,
    paddingVertical: spacing.s,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  statsTitle: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body,
  },
  statValue: {
    ...typography.bodyBold,
  },
  buttonsContainer: {
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  testButton: {
    marginBottom: spacing.xs,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  controlButton: {
    flex: 1,
  },
  resultsContainer: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  resultsTitle: {
    ...typography.h4,
  },
  clearButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  resultText: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontFamily: 'monospace',
  },
}); 