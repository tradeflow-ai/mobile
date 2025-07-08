import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import 'react-native-reanimated';
import { Provider as JotaiProvider } from 'jotai';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthGuard } from '@/components/AuthGuard';
import { DeepLinkHandler } from '@/components/DeepLinkHandler';
import { ProfileManager } from '@/services/profileManager';

// ErrorBoundary will be handled by the default expo-router behavior

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Initialize ProfileManager to start syncing profile data with auth state
      ProfileManager.getInstance();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <JotaiProvider>
      <AuthGuard>
        <DeepLinkHandler />
        <RootLayoutNav />
      </AuthGuard>
    </JotaiProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="edit-item"
        options={({ navigation }) => ({
          title: 'Edit Item',
          headerBackTitle: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
            >
              <FontAwesome 
                name="arrow-left" 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="edit-profile"
        options={({ navigation }) => ({
          title: 'Edit Profile',
          headerBackTitle: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
            >
              <FontAwesome 
                name="arrow-left" 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: 'modal',
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.primary,
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={({ navigation }) => ({
          title: 'Profile',
          presentation: 'modal',
          headerBackTitle: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
            >
              <FontAwesome 
                name="arrow-left" 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('edit-profile')}
            >
              <FontAwesome 
                name="edit" 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
