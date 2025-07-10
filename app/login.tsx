import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FormProvider, FormTextInput } from '@/components/forms';
import { Button } from '@/components/ui';
import { AuthManager } from '@/services/authManager';
import { authErrorAtom } from '@/store/atoms';
import { loginSchema, type LoginFormData } from '@/components/forms/validationSchemas';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [authError, setAuthError] = useAtom(authErrorAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const authManager = AuthManager.getInstance();
  
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log('Attempting login with email:', data.email);
      const { user, error } = await authManager.signIn(data.email, data.password);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Login failed';
        setAuthError(errorMessage);
        
        // Special handling for email confirmation error
        if (errorMessage.includes('Email not confirmed')) {
          Alert.alert(
            'Email Verification Required',
            `Please check your email (${data.email}) and click the verification link before signing in.\n\nIf you can't find the email, check your spam folder.`,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'Resend Email', 
                style: 'default',
                onPress: () => {
                  // TODO: Implement resend confirmation email
                  Alert.alert('Feature Coming Soon', 'Email resend functionality will be available soon.');
                }
              }
            ]
          );
        } else {
          Alert.alert('Login Failed', errorMessage);
        }
        return;
      }
      
      if (user) {
        // Navigation will be handled by the auth guard
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthError(errorMessage);
      
      // Special handling for email confirmation error
      if (errorMessage.includes('Email not confirmed')) {
        Alert.alert(
          'Email Verification Required',
          `Please check your email (${data.email}) and click the verification link before signing in.\n\nIf you can't find the email, check your spam folder.`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Resend Email', 
              style: 'default',
              onPress: () => {
                // TODO: Implement resend confirmation email
                Alert.alert('Feature Coming Soon', 'Email resend functionality will be available soon.');
              }
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // For now, show an alert - we'll implement forgot password later
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented soon.');
  };

  const handleSignUp = () => {
    console.log('Sign up button pressed, navigating to signup');
    router.push('/signup');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/TradeFlowSampleIconCircle.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholder }]}>
              Sign in to your TradeFlow account
            </Text>
          </View>

          {/* Form */}
          <FormProvider methods={methods}>
            <View style={styles.form}>
              <FormTextInput
                name="email"
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <View style={styles.passwordContainer}>
                <FormTextInput
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <FontAwesome 
                    name={showPassword ? 'eye-slash' : 'eye'} 
                    size={20} 
                    color={colors.placeholder} 
                  />
                </TouchableOpacity>
              </View>

              {authError && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                  <FontAwesome name="exclamation-circle" size={16} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {authError}
                  </Text>
                </View>
              )}

              <Button
                title="Sign In"
                onPress={methods.handleSubmit(handleLogin)}
                disabled={isLoading}
                loading={isLoading}
                style={styles.loginButton}
              />

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
          </FormProvider>



          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.placeholder }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={[styles.signUpText, { color: colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  loginButton: {
    marginTop: 24,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  signUpText: {
    fontSize: 16,
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 32, // Original position - was already perfect
    padding: 8,
    zIndex: 1,
  },

}); 