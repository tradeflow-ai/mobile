import React, { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { AuthManager } from '@/services/authManager';

export const DeepLinkHandler: React.FC = () => {
  const router = useRouter();
  const authManager = AuthManager.getInstance();

  useEffect(() => {
    // Handle deep links when app is opened from a link
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      processDeepLink(event.url);
    };

    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep links when app is opened from a closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        processDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const processDeepLink = async (url: string) => {
    try {
      const parsedUrl = new URL(url);
      
      // Check if this is an email confirmation link
      if (parsedUrl.hostname === 'confirm' || parsedUrl.pathname.includes('/confirm')) {
        await handleEmailConfirmation(parsedUrl);
      } else if (parsedUrl.hostname === 'reset' || parsedUrl.pathname.includes('/reset')) {
        await handlePasswordReset(parsedUrl);
      } else {
        console.log('Unknown deep link:', url);
      }
    } catch (error) {
      console.error('Error processing deep link:', error);
    }
  };

  const handleEmailConfirmation = async (url: URL) => {
    try {
      // Extract token and type from URL parameters
      const token = url.searchParams.get('token');
      const type = url.searchParams.get('type');
      
      if (!token || type !== 'signup') {
        Alert.alert('Invalid Link', 'This email confirmation link is invalid or expired.');
        return;
      }

      // Verify the token with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });

      if (error) {
        console.error('Email verification error:', error);
        Alert.alert(
          'Verification Failed',
          'Unable to verify your email. Please try requesting a new verification email.',
          [
            { text: 'OK', onPress: () => router.push('/login') }
          ]
        );
        return;
      }

      if (data.user) {
        Alert.alert(
          'Email Verified!',
          'Your email has been successfully verified. You can now sign in to your account.',
          [
            { text: 'Sign In', onPress: () => router.push('/login') }
          ]
        );
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      Alert.alert(
        'Verification Error',
        'An error occurred while verifying your email. Please try again.',
        [
          { text: 'OK', onPress: () => router.push('/login') }
        ]
      );
    }
  };

  const handlePasswordReset = async (url: URL) => {
    try {
      // Extract token and redirect to password reset screen
      const token = url.searchParams.get('token');
      
      if (!token) {
        Alert.alert('Invalid Link', 'This password reset link is invalid or expired.');
        return;
      }

      // For now, just show a message and redirect to login
      // You can implement a password reset screen later
      Alert.alert(
        'Password Reset',
        'Password reset functionality will be available soon. Please use the web interface for now.',
        [
          { text: 'OK', onPress: () => router.push('/login') }
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Reset Error',
        'An error occurred while processing the password reset. Please try again.',
        [
          { text: 'OK', onPress: () => router.push('/login') }
        ]
      );
    }
  };

  return null; // This component doesn't render anything
}; 