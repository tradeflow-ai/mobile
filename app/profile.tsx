import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Switch,
  Linking,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAtom, useSetAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthManager } from '@/services/authManager';
import { ProfileManager } from '@/services/profileManager';
import { userProfileAtom, themeModeAtom, activeJobAtom, type ThemeMode } from '@/store/atoms';
import { Avatar } from '@/components/Avatar';
import { useAppNavigation } from '@/hooks/useNavigation';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { DailyPlanService } from '@/services/dailyPlanService';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateQueries } from '@/services/queryClient';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const authManager = AuthManager.getInstance();
  const profileManager = ProfileManager.getInstance();
  const { navigate } = useAppNavigation();
  const queryClient = useQueryClient();
  
  // Profile state from atoms
  const [userProfile] = useAtom(userProfileAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const setActiveJob = useSetAtom(activeJobAtom);
  
  // Daily plan hook for reset functionality
  const { resetPlan, refreshPlan, dailyPlan } = useTodaysPlan();

  // Offline status for manual offline mode
  const { isManualOfflineMode, enableManualOfflineMode, disableManualOfflineMode } = useOfflineStatus();

  // Local state for immediate UI updates
  const [localDarkMode, setLocalDarkMode] = useState(themeMode === 'dark');
  const [localOfflineMode, setLocalOfflineMode] = useState(isManualOfflineMode);

  // Sync local state with global state
  React.useEffect(() => {
    setLocalDarkMode(themeMode === 'dark');
  }, [themeMode]);

  React.useEffect(() => {
    setLocalOfflineMode(isManualOfflineMode);
  }, [isManualOfflineMode]);

  // Get display information
  const displayName = profileManager.getDisplayName();
  const userEmail = profileManager.getUserEmail();
  const userRole = profileManager.getUserRole();

  const handleThemeToggle = (value: boolean) => {
    setLocalDarkMode(value); // Immediate UI update
    const newThemeMode: ThemeMode = value ? 'dark' : 'light';
    setThemeMode(newThemeMode);
  };

  const handleOfflineModeToggle = (value: boolean) => {
    setLocalOfflineMode(value); // Immediate UI update
    if (value) {
      enableManualOfflineMode();
    } else {
      disableManualOfflineMode();
    }
  };

  const handleLocationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      Alert.alert(
        'Unable to Open Settings',
        'Please manually open Settings > Privacy & Security > Location Services to manage location permissions for TradeFlow.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleOnboardingSettings = () => {
    navigate('/onboarding/work-schedule');
  };

  const handleResetDailyPlan = () => {
    Alert.alert(
      'Reset Daily Plan',
      'Are you sure you want to reset today\'s daily plan? This will clear all planning data and you\'ll need to start over.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel the daily plan in the database if it exists
              if (dailyPlan?.id) {
                await DailyPlanService.cancelDailyPlan(dailyPlan.id);
                console.log('Daily plan cancelled in database');
              }
              
              // Clear the active job immediately
              setActiveJob(null);
              
              // Don't call resetPlan() here - let the real-time subscription handle it
              // The real-time subscription will detect the cancelled status and set dailyPlan to null
              
              // Invalidate query cache to force refresh of any cached data
              invalidateQueries.allDailyPlans();
              invalidateQueries.allJobs();
              
              // Give the real-time subscription a moment to process the change
              setTimeout(async () => {
                // Force a re-initialization of the daily plan as a fallback
                // This ensures the UI updates even if the real-time subscription fails
                resetPlan();
                
                // Also force refresh from database
                await refreshPlan();
                
                // Force refresh of all components using daily plan data
                queryClient.invalidateQueries({ 
                  predicate: (query) => {
                    return query.queryKey.includes('daily') || query.queryKey.includes('plan');
                  }
                });
                
                Alert.alert('Daily Plan Reset', 'Your daily plan has been reset successfully.');
              }, 500);
              
            } catch (error) {
              console.error('Error resetting daily plan:', error);
              Alert.alert('Reset Failed', 'Failed to reset daily plan. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              console.log('Logging out user...');
              const { error } = await authManager.signOut();
              
              if (error) {
                console.error('Logout error:', error);
                Alert.alert('Logout Failed', 'An error occurred while logging out. Please try again.');
              } else {
                console.log('User logged out successfully');
                // AuthGuard will handle navigation back to login
              }
            } catch (error) {
              console.error('Unexpected logout error:', error);
              Alert.alert('Logout Failed', 'An unexpected error occurred. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Avatar
              name={displayName}
              imageUri={userProfile?.avatar_url}
              size="xl"
              style={styles.profileImage}
            />
          </View>
          
          <Text style={[styles.name, { color: colors.text }]}>
            {displayName}
          </Text>
          
          <Text style={[styles.email, { color: colors.placeholder }]}>
            {userEmail}
          </Text>
          
          <Text style={[styles.role, { color: colors.primary }]}>
            {userRole.toUpperCase()}
          </Text>
        </View>



        <View style={styles.menuSection}>
          {/* Dark Mode Toggle */}
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FontAwesome name="moon-o" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={localDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor={colors.border}
            />
          </View>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleLocationSettings}
          >
            <FontAwesome name="map-marker" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Location Services</Text>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
          </TouchableOpacity>

          {/* Offline Mode Toggle */}
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FontAwesome name="signal" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Offline Mode</Text>
            <Switch
              value={localOfflineMode}
              onValueChange={handleOfflineModeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor={colors.border}
            />
          </View>


          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleOnboardingSettings}
          >
            <FontAwesome name="cog" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Onboarding Settings</Text>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleResetDailyPlan}
          >
            <FontAwesome name="refresh" size={20} color={dailyPlan ? colors.warning : colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Reset Daily Plan</Text>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
          </TouchableOpacity>

        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[
              styles.logoutButton, 
              { 
                backgroundColor: isLoggingOut ? colors.placeholder : colors.error,
                opacity: isLoggingOut ? 0.6 : 1
              }
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <FontAwesome 
              name={isLoggingOut ? "spinner" : "sign-out"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.logoutButtonText}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 8,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  menuSection: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  logoutSection: {
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 