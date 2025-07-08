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

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [user, setUser] = useAtom(userAtom);
  const [isAuthLoading, setIsAuthLoading] = useAtom(isAuthLoadingAtom);
  const [isInitialized, setIsInitialized] = useState(false);
  
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

    if (!user && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // User is authenticated but in auth screens, redirect to main app
      router.replace('/(tabs)');
    }
  }, [user, segments, router, isInitialized, isAuthLoading]);

  // Show loading screen while initializing
  if (!isInitialized || isAuthLoading) {
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
            Loading your workspace...
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