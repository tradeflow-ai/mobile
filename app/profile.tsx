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
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthManager } from '@/services/authManager';
import { ProfileManager } from '@/services/profileManager';
import { userProfileAtom, themeModeAtom, type ThemeMode } from '@/store/atoms';
import { Avatar } from '@/components/Avatar';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const authManager = AuthManager.getInstance();
  const profileManager = ProfileManager.getInstance();
  
  // Profile state from atoms
  const [userProfile] = useAtom(userProfileAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);

  // Get display information
  const displayName = profileManager.getDisplayName();
  const userEmail = profileManager.getUserEmail();
  const userRole = profileManager.getUserRole();

  const handleThemeToggle = (value: boolean) => {
    const newThemeMode: ThemeMode = value ? 'dark' : 'light';
    setThemeMode(newThemeMode);
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

        <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.text }]}>156</Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]} numberOfLines={2}>Items Managed</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.text }]}>24</Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]} numberOfLines={2}>Routes Completed</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.text }]}>8</Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]} numberOfLines={2}>Locations</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {/* Dark Mode Toggle */}
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FontAwesome name="moon-o" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={themeMode === 'dark' ? colors.background : colors.placeholder}
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

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Alert.alert('Notifications', 'Manage your notification preferences')}
          >
            <FontAwesome name="bell" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Alert.alert('Privacy', 'Review your privacy settings')}
          >
            <FontAwesome name="shield" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy</Text>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Alert.alert('Help', 'Get help and support')}
          >
            <FontAwesome name="question-circle" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Help & Support</Text>
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
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  statDivider: {
    width: 1,
    height: 50,
    marginHorizontal: 12,
    alignSelf: 'center',
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