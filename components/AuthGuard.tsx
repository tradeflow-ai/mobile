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
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { userAtom, isAuthLoadingAtom } from '@/store/atoms';
import { AuthManager } from '@/services/authManager';
import { OnboardingService } from '@/services/onboardingService';
import { useOnboardingStatus } from '@/hooks/useOnboarding';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [user, setUser] = useAtom(userAtom);
  const [isAuthLoading, setIsAuthLoading] = useAtom(isAuthLoadingAtom);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get onboarding status for authenticated users
  const { 
    data: onboardingStatus, 
    isLoading: isOnboardingLoading, 
    error: onboardingError 
  } = useOnboardingStatus(user?.id);
  
  // Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.log('AuthGuard: Forcing initialization after timeout');
        setIsInitialized(true);
        setIsAuthLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isInitialized, setIsAuthLoading]);
  
  const router = useRouter();
  const segments = useSegments();
  const authManager = AuthManager.getInstance();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authManager.onAuthStateChange((authState) => {
      console.log('AuthGuard: Auth state update:', {
        user: authState.user?.email || 'none',
        isLoading: authState.isLoading,
        isAuthenticated: authState.isAuthenticated,
        isInitialized
      });
      
      setUser(authState.user);
      setIsAuthLoading(authState.isLoading);
      
      if (!isInitialized && !authState.isLoading) {
        setIsInitialized(true);
      }
    });

    return unsubscribe;
  }, [setUser, setIsAuthLoading, isInitialized]);

  useEffect(() => {
    if (!isInitialized || isAuthLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const inOnboardingGroup = segments[0] === 'onboarding';

    console.log('AuthGuard: Navigation logic check:', {
      user: user?.email || 'none',
      segments: segments.join('/'),
      inAuthGroup,
      inOnboardingGroup,
      onboardingStatus: onboardingStatus?.isCompleted,
      isOnboardingLoading
    });

    if (!user && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to login
      console.log('AuthGuard: Redirecting to login - no user');
      router.replace('/login');
    } else if (user) {
      // User is authenticated, check onboarding status
      if (inAuthGroup) {
        // User is authenticated but in auth screens
        if (isOnboardingLoading) {
          // Wait for onboarding status to load
          console.log('AuthGuard: Waiting for onboarding status to load');
          return;
        }
        
        if (onboardingStatus?.isCompleted) {
          // User completed onboarding, redirect to main app
          console.log('AuthGuard: Redirecting to main app - onboarding completed');
          router.replace('/(tabs)');
        } else {
          // User needs to complete onboarding
          console.log('AuthGuard: Redirecting to onboarding - not completed');
          
          // Initialize onboarding preferences for the user
          console.log('AuthGuard: Initializing onboarding for user:', user.id);
          OnboardingService.initializeOnboarding(user.id).then(result => {
            if (result.error) {
              console.error('AuthGuard: Failed to initialize onboarding:', result.error);
            } else {
              console.log('AuthGuard: Successfully initialized onboarding');
            }
          });
          
          router.replace('/onboarding/work-schedule');
        }
      } else if (!inOnboardingGroup) {
        // User is authenticated but not in onboarding screens
        if (isOnboardingLoading) {
          // Wait for onboarding status to load
          console.log('AuthGuard: Waiting for onboarding status to load');
          return;
        }
        
        if (!onboardingStatus?.isCompleted) {
          // User needs to complete onboarding
          console.log('AuthGuard: Redirecting to onboarding - not in onboarding group but not completed');
          
          // Initialize onboarding preferences for the user
          console.log('AuthGuard: Initializing onboarding for user:', user.id);
          OnboardingService.initializeOnboarding(user.id).then(result => {
            if (result.error) {
              console.error('AuthGuard: Failed to initialize onboarding:', result.error);
            } else {
              console.log('AuthGuard: Successfully initialized onboarding');
            }
          });
          
          router.replace('/onboarding/work-schedule');
        }
        // If in main app and onboarding is completed, let them stay
      }
      // If in onboarding group, let them stay (they can navigate within onboarding)
    }
  }, [user, segments, router, isInitialized, isAuthLoading, onboardingStatus, isOnboardingLoading]);

  // Show loading screen while initializing or checking onboarding status
  if (!isInitialized || isAuthLoading || (user && isOnboardingLoading)) {
    const loadingMessage = user && isOnboardingLoading 
      ? 'Checking your setup...' 
      : 'Loading your workspace...';
    
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContent}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <FontAwesome name="truck" size={40} color={colors.background} />
          </View>
          <Text style={[styles.loadingTitle, { color: colors.text }]}>
            TradeFlow
          </Text>
          <Text style={[styles.loadingSubtitle, { color: colors.placeholder }]}>
            {loadingMessage}
          </Text>
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            style={styles.loader}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Handle onboarding error - allow user to continue but log error
  if (onboardingError) {
    console.error('AuthGuard: Onboarding status error:', onboardingError);
    // Continue to app - we'll handle this gracefully
  }

  // Render the protected content - routing will handle auth redirects
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
}); 