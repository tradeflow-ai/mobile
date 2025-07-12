import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAtom } from 'jotai';
import { useRouter, useSegments } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { userAtom, isAuthLoadingAtom } from '@/store/atoms';
import { AuthManager } from '@/services/authManager';
import { supabase } from '@/services/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [user, setUser] = useAtom(userAtom);
  const [isAuthLoading, setIsAuthLoading] = useAtom(isAuthLoadingAtom);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [forceStopLoading, setForceStopLoading] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Initialize auth state and load preferences
  useEffect(() => {
    const authManager = AuthManager.getInstance();
    
    // Subscribe to auth state changes
    const unsubscribe = authManager.onAuthStateChange(async (authState) => {
      console.log('AuthGuard: Auth state update:', {
        user: authState.user?.email || 'none',
        isLoading: authState.isLoading,
        isAuthenticated: authState.isAuthenticated
      });
      
      // Update atoms to keep them in sync
      setUser(authState.user);
      setIsAuthLoading(authState.isLoading);
      setIsInitialized(true);
      
      // Load user profile data (including onboarding completion status) when user changes
      if (authState.user?.id) {
        setIsLoadingPreferences(true);
        try {
          // Get both preferences and onboarding completion status from profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('preferences, onboarding_completed_at')
            .eq('id', authState.user.id)
            .single();

          if (error) {
            console.error('AuthGuard: Failed to load user profile:', error);
            setUserPreferences(null);
          } else {
            setUserPreferences({
              preferences: profile?.preferences || null,
              onboarding_completed_at: profile?.onboarding_completed_at || null,
              has_ever_completed_onboarding: Boolean(profile?.onboarding_completed_at)
            });
          }
        } catch (error) {
          console.error('AuthGuard: Error loading profile:', error);
          setUserPreferences(null);
        } finally {
          setIsLoadingPreferences(false);
        }
      } else {
        setUserPreferences(null);
        setIsLoadingPreferences(false);
      }
    });

    return unsubscribe;
  }, [setUser, setIsAuthLoading]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isAuthLoading || isLoadingPreferences) {
        console.log('AuthGuard: Force stopping loading after timeout');
        setForceStopLoading(true);
        setIsAuthLoading(false);
        setIsLoadingPreferences(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isAuthLoading, isLoadingPreferences, setIsAuthLoading]);

  // Check if user needs onboarding (only if they've never completed it)
  const needsOnboarding = (profileData: any): boolean => {
    if (!profileData) return false;
    
    // Only redirect to onboarding if user has NEVER completed it before
    // This ensures existing users with incomplete preferences aren't forced back
    return !profileData.has_ever_completed_onboarding;
  };

  // Navigation logic
  useEffect(() => {
    if (!forceStopLoading && (!isInitialized || isAuthLoading || isLoadingPreferences || isRefreshingProfile)) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const inOnboardingGroup = segments[0] === 'onboarding';
    const inMainApp = segments[0] === '(tabs)';
    const wasInOnboarding = segments.length > 0 && segments[0] === 'onboarding';

    // If loading was force stopped, treat as logged out
    if (forceStopLoading) {
      if (!inAuthGroup) {
        console.log('AuthGuard: Loading was force stopped, redirecting to login');
        router.replace('/login');
        return;
      }
    }

    // If user is navigating to main app and we suspect they might have just completed onboarding,
    // refresh their profile data to get the latest onboarding_completed_at status
    if (user && inMainApp && userPreferences && !userPreferences.has_ever_completed_onboarding && !isRefreshingProfile) {
      console.log('AuthGuard: Refreshing profile data - user may have just completed onboarding');
      
      setIsRefreshingProfile(true);
      
      // Re-fetch profile data to check for onboarding completion
      const refreshProfile = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('preferences, onboarding_completed_at')
            .eq('id', user.id)
            .single();

          if (!error && profile) {
            setUserPreferences({
              preferences: profile?.preferences || null,
              onboarding_completed_at: profile?.onboarding_completed_at || null,
              has_ever_completed_onboarding: Boolean(profile?.onboarding_completed_at)
            });
            console.log('AuthGuard: Profile data refreshed, onboarding status:', Boolean(profile?.onboarding_completed_at));
          }
        } catch (error) {
          console.error('AuthGuard: Error refreshing profile:', error);
        } finally {
          setIsRefreshingProfile(false);
        }
      };
      
      refreshProfile();
      
      // Don't proceed with navigation logic yet, let the refresh complete
      return;
    }

    if (!user && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to login
      console.log('AuthGuard: Redirecting to login - no user');
      router.replace('/login');
      return;
    }

    if (user) {
      // User is authenticated
      if (inAuthGroup) {
        // User is authenticated but in auth screens, redirect to main app
        console.log('AuthGuard: Redirecting to main app - authenticated user in auth screens');
        router.replace('/(tabs)');
        return;
      }

      // Check if user needs onboarding
      if (needsOnboarding(userPreferences)) {
        if (!inOnboardingGroup) {
          // User needs onboarding and is not in onboarding screens
          console.log('AuthGuard: Redirecting to onboarding - incomplete preferences');
          router.replace('/onboarding/work-schedule');
          return;
        }
      } else {
        // User has completed onboarding
        if (inOnboardingGroup && !inMainApp) {
          // Allow manual access to onboarding from profile, but don't redirect away
          console.log('AuthGuard: Allowing manual onboarding access');
          return;
        }
      }
    }
  }, [isInitialized, isAuthLoading, isLoadingPreferences, user, userPreferences, segments, router, forceStopLoading, isRefreshingProfile]);

  // Show loading screen while initializing (unless force stopped)
  if (!forceStopLoading && (!isInitialized || isAuthLoading || (user && isLoadingPreferences))) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
}); 