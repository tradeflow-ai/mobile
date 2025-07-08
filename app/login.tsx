import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { AuthManager } from '@/services/authManager';
import { authErrorAtom } from '@/store/atoms';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [authError, setAuthError] = useAtom(authErrorAtom);
  const [isLoading, setIsLoading] = useState(false);
  
  const authManager = AuthManager.getInstance();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log('Attempting login with email:', formData.email);
      const { user, error } = await authManager.signIn(formData.email, formData.password);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Login failed';
        setAuthError(errorMessage);
        
        // Special handling for email confirmation error
        if (errorMessage.includes('Email not confirmed')) {
          Alert.alert(
            'Email Verification Required',
            `Please check your email (${formData.email}) and click the verification link before signing in.\n\nIf you can't find the email, check your spam folder.`,
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
          `Please check your email (${formData.email}) and click the verification link before signing in.\n\nIf you can't find the email, check your spam folder.`,
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

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <FontAwesome name="truck" size={32} color={colors.background} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholder }]}>
              Sign in to your TradeFlow account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoComplete="password"
                error={errors.password}
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
              onPress={handleLogin}
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

          {/* Sample Accounts */}
          <View style={styles.sampleAccounts}>
            <Text style={[styles.sampleTitle, { color: colors.text }]}>
              Demo Accounts (Already Verified)
            </Text>
            <Text style={[styles.sampleText, { color: colors.placeholder }]}>
              Try these sample accounts:
            </Text>
            <Text style={[styles.sampleEmail, { color: colors.primary }]}>
              hvac@tradeflow.com
            </Text>
            <Text style={[styles.sampleEmail, { color: colors.primary }]}>
              electrician@tradeflow.com
            </Text>
            <Text style={[styles.sampleEmail, { color: colors.primary }]}>
              plumber@tradeflow.com
            </Text>
            <Text style={[styles.samplePassword, { color: colors.placeholder }]}>
              Password: password123
            </Text>
          </View>

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
    top: 48,
    padding: 8,
    zIndex: 1,
  },
  sampleAccounts: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  sampleText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  sampleEmail: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  samplePassword: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 