import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing } from '@/constants/Theme';

function OfflineDebugScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [netInfoState, setNetInfoState] = useState<NetInfoState | null>(null);
  const offlineStatus = useOfflineStatus();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetInfoState(state);
      console.log('NetInfo Raw State:', JSON.stringify(state, null, 2));
    });

    // Get initial state
    NetInfo.fetch().then(setNetInfoState);

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: colors.text }]}>
          Offline Debug Screen
        </Text>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Hook Status
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Is Online: {String(offlineStatus.isOnline)}
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Is Connected: {String(offlineStatus.isConnected)}
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Quality: {offlineStatus.connectionQuality}
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Status Color: {offlineStatus.getStatusColor()}
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Manual Offline Mode: {String(offlineStatus.isManualOfflineMode)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Raw NetInfo State
          </Text>
          {netInfoState ? (
            <View>
              <Text style={[styles.text, { color: colors.text }]}>
                Type: {netInfoState.type}
              </Text>
              <Text style={[styles.text, { color: colors.text }]}>
                IsConnected: {String(netInfoState.isConnected)}
              </Text>
              <Text style={[styles.text, { color: colors.text }]}>
                IsInternetReachable: {String(netInfoState.isInternetReachable)}
              </Text>
              <Text style={[styles.text, { color: colors.text }]}>
                Platform: {Platform.OS}
              </Text>
              {netInfoState.details && (
                <Text style={[styles.text, { color: colors.text }]}>
                  Details: {JSON.stringify(netInfoState.details, null, 2)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.text, { color: colors.text }]}>
              Loading NetInfo state...
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Instructions
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            1. Note the initial state
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            2. Put your device in airplane mode
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            3. Watch how the values change
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            4. Turn airplane mode off
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            5. Observe the transition
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: spacing.l,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.l,
  },
  section: {
    marginBottom: spacing.l,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
  },
  text: {
    ...typography.body,
    marginBottom: spacing.s,
  },
});

export default OfflineDebugScreen; 