/**
 * Offline Status Test Screen - Web Compatible
 * Simplified version for web testing without native dependencies
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useOfflineStatus, useConnectionStatus, useQueuedOperations, useSyncStatus } from '@/hooks/useOfflineStatus';
import { typography, spacing } from '@/constants/Theme';

export default function OfflineTestWebScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Offline status hooks
  const offlineStatus = useOfflineStatus();
  const connectionStatus = useConnectionStatus();
  const queuedOps = useQueuedOperations();
  const syncStatus = useSyncStatus();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Offline Status Testing (Web Version)
        </Text>

        {/* Connection Status Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Connection Status
          </Text>
          <View style={styles.detailsContainer}>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Online: {connectionStatus.isOnline ? '✅ Yes' : '❌ No'}
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Connected: {connectionStatus.isConnected ? '✅ Yes' : '❌ No'}
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Type: {connectionStatus.connectionType}
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Quality: {connectionStatus.connectionQuality}
            </Text>
          </View>
        </View>

        {/* Status Indicator */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Status Indicator
          </Text>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusDot,
              { backgroundColor: offlineStatus.getStatusColor() }
            ]}>
              <Text style={[styles.statusText, { color: colors.background }]}>
                {offlineStatus.isOnline ? '📶' : '📵'}
              </Text>
            </View>
            <Text style={[styles.statusLabel, { color: colors.text }]}>
              {offlineStatus.getStatusText()}
            </Text>
          </View>
        </View>

        {/* Queued Operations Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Queued Operations
          </Text>
          <View style={styles.detailsContainer}>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Total: {queuedOps.count}
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Critical: {queuedOps.critical} 🔴
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Normal: {queuedOps.normal} 🟡
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Low: {queuedOps.low} 🟢
            </Text>
          </View>
          {queuedOps.count > 0 && (
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: colors.primary }]}
              onPress={queuedOps.forceSync}
              disabled={queuedOps.syncInProgress || !connectionStatus.isOnline}
            >
              <Text style={[styles.syncButtonText, { color: colors.background }]}>
                {queuedOps.syncInProgress ? 'Syncing...' : 'Force Sync Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sync Status Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Sync Status
          </Text>
          <View style={styles.detailsContainer}>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              In Progress: {syncStatus.syncInProgress ? '✅ Yes' : '❌ No'}
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Last Sync: {syncStatus.lastSync ? syncStatus.lastSync.toLocaleTimeString() : 'Never'}
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Estimated Time: {syncStatus.estimatedSyncTime || 'N/A'}s
            </Text>
            <Text style={[styles.detail, { color: colors.secondary }]}>
              Retry Attempts: {syncStatus.retryAttempts}
            </Text>
          </View>
        </View>

        {/* Testing Instructions Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Web Testing Instructions
          </Text>
          <View style={styles.instructionsContainer}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              🌐 <Text style={{ fontWeight: 'bold' }}>Browser Network:</Text> Use DevTools → Network tab → "Offline"
            </Text>
            <Text style={[styles.instruction, { color: colors.text }]}>
              📶 <Text style={{ fontWeight: 'bold' }}>Throttling:</Text> DevTools → Network → "Slow 3G" or "Fast 3G"
            </Text>
            <Text style={[styles.instruction, { color: colors.text }]}>
              🔄 <Text style={{ fontWeight: 'bold' }}>Auto Refresh:</Text> Watch this page update in real-time
            </Text>
            <Text style={[styles.instruction, { color: colors.text }]}>
              📱 <Text style={{ fontWeight: 'bold' }}>Full Testing:</Text> Use mobile app for complete functionality
            </Text>
          </View>
        </View>

        {/* Real-time Status */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Real-time Status Updates
          </Text>
          <Text style={[styles.detail, { color: colors.secondary }]}>
            This page updates automatically as network conditions change.
          </Text>
          <Text style={[styles.detail, { color: colors.secondary }]}>
            Last Update: {new Date().toLocaleTimeString()}
          </Text>
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
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  card: {
    marginBottom: spacing.m,
    ...spacing.helpers.padding('m'),
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  statusText: {
    fontSize: 16,
  },
  statusLabel: {
    ...typography.body,
    fontWeight: '500',
  },
  detailsContainer: {
    gap: spacing.xs,
  },
  detail: {
    ...typography.body,
  },
  syncButton: {
    marginTop: spacing.s,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  instructionsContainer: {
    gap: spacing.s,
  },
  instruction: {
    ...typography.body,
    lineHeight: 20,
  },
}); 