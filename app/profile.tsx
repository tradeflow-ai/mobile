import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthManager } from '@/services/authManager';
import { ProfileManager } from '@/services/profileManager';
import { userProfileAtom, isProfileLoadingAtom } from '@/store/atoms';
import { Header } from '@/components/Header';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const authManager = AuthManager.getInstance();
  const profileManager = ProfileManager.getInstance();
  
  // Profile state from atoms
  const [userProfile] = useAtom(userProfileAtom);
  const [isProfileLoading] = useAtom(isProfileLoadingAtom);

  // Get display information
  const displayName = profileManager.getDisplayName();
  const userEmail = profileManager.getUserEmail();
  const userRole = profileManager.getUserRole();
  const userInitials = profileManager.getInitials();

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleSettings = () => {
    router.push('/settings');
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
      <ScrollView style={styles.container}>
        <Header
          title="Profile"
          rightAction={{
            icon: 'edit',
            onPress: handleEditProfile,
          }}
        />

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {userProfile?.avatar_url ? (
              <Image
                source={{ uri: userProfile.avatar_url }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={[styles.profileImageText, { color: '#fff' }]}>
                  {userInitials}
                </Text>
              </View>
            )}
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
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Items Managed</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.text }]}>24</Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Routes Completed</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.text }]}>8</Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Locations</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSettings}
          >
            <FontAwesome name="cog" size={20} color={colors.placeholder} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
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
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: 'bold',
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
    padding: 20,
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
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
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