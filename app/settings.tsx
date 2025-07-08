import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Header } from '@/components/Header';
import { themeModeAtom, type ThemeMode } from '@/store/atoms';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);

  const handleGoBack = () => {
    router.back();
  };

  const handleThemeToggle = (value: boolean) => {
    const newThemeMode: ThemeMode = value ? 'dark' : 'light';
    setThemeMode(newThemeMode);
  };

  const handleNotificationSettings = () => {
    Alert.alert(
      'Notification Settings',
      'This will open notification preferences',
      [{ text: 'OK' }]
    );
  };

  const handleLocationSettings = () => {
    Alert.alert(
      'Location Settings',
      'This will open location permissions settings',
      [{ text: 'OK' }]
    );
  };

  const handleAccountSettings = () => {
    Alert.alert(
      'Account Settings',
      'This will open account management options',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About TradeFlow',
      'TradeFlow v1.0.0\nJob & Route Management App\n\nBuilt with React Native & Expo',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container}>
        <Header
          title="Settings"
          leftAction={{
            icon: 'arrow-left',
            onPress: handleGoBack,
          }}
        />

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appearance
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <FontAwesome name="moon-o" size={20} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: colors.placeholder }]}>
                  Toggle between light and dark theme
                </Text>
              </View>
            </View>
                         <Switch
               value={themeMode === 'dark'}
               onValueChange={handleThemeToggle}
               trackColor={{ false: colors.border, true: colors.primary }}
               thumbColor={themeMode === 'dark' ? colors.background : colors.placeholder}
             />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Preferences
          </Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleNotificationSettings}
          >
            <View style={styles.settingLeft}>
              <FontAwesome name="bell" size={20} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: colors.placeholder }]}>
                  Manage notification preferences
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleLocationSettings}
          >
            <View style={styles.settingLeft}>
              <FontAwesome name="map-marker" size={20} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Location Services
                </Text>
                <Text style={[styles.settingDescription, { color: colors.placeholder }]}>
                  Manage location permissions
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account
          </Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleAccountSettings}
          >
            <View style={styles.settingLeft}>
              <FontAwesome name="user" size={20} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Account Settings
                </Text>
                <Text style={[styles.settingDescription, { color: colors.placeholder }]}>
                  Manage your account information
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleAbout}
          >
            <View style={styles.settingLeft}>
              <FontAwesome name="info-circle" size={20} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  About TradeFlow
                </Text>
                <Text style={[styles.settingDescription, { color: colors.placeholder }]}>
                  Version information and credits
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
}); 