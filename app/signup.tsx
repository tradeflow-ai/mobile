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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FormProvider, FormTextInput, FormButton } from '@/components/forms';
import { AuthManager } from '@/services/authManager';
import { ProfileManager } from '@/services/profileManager';
import { supabase } from '@/services/supabase';
import { authErrorAtom } from '@/store/atoms';
import { signupSchema, type SignupFormData } from '@/components/forms/validationSchemas';

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [authError, setAuthError] = useAtom(authErrorAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const authManager = AuthManager.getInstance();
  const profileManager = ProfileManager.getInstance();
  
  const methods = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      occupation: '',
      companyName: '',
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { user, error } = await authManager.signUp(data.email, data.password);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Signup failed';
        setAuthError(errorMessage);
        Alert.alert('Signup Failed', errorMessage);
        return;
      }
      
      if (user) {
        // Create profile with the provided information
        const profileResult = await profileManager.createProfileDuringSignup(user.id, {
          email: data.email,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          occupation: data.occupation.trim(),
          companyName: data.companyName?.trim() || undefined,
          phone: data.phoneNumber?.trim() || undefined,
        });
        
        if (!profileResult.success) {
          console.warn('Profile creation failed during signup:', profileResult.error);
          // Store profile data in user metadata as fallback
          try {
            await supabase.auth.updateUser({
              data: {
                first_name: data.firstName.trim(),
                last_name: data.lastName.trim(),
                full_name: `${data.firstName.trim()} ${data.lastName.trim()}`,
                occupation: data.occupation.trim(),
                company_name: data.companyName?.trim() || undefined,
                phone: data.phoneNumber?.trim() || undefined,
              }
            });
          } catch (metadataError) {
            console.warn('Failed to store user metadata:', metadataError);
          }
        }
        
        // Show success message
        Alert.alert(
          'Account Created!',
          `Welcome ${data.firstName}! Your account has been created successfully. Please check your email to verify your account.`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setAuthError(errorMessage);
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <FontAwesome name="arrow-left" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <FontAwesome name="truck" size={32} color={colors.background} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholder }]}>
              Join TradeFlow to streamline your trade business
            </Text>
          </View>

          {/* Form */}
          <FormProvider methods={methods}>
            <View style={styles.form}>
              <FormTextInput
                name="firstName"
                label="First Name"
                placeholder="Enter your first name"
                autoCapitalize="words"
                autoComplete="given-name"
              />

              <FormTextInput
                name="lastName"
                label="Last Name"
                placeholder="Enter your last name"
                autoCapitalize="words"
                autoComplete="family-name"
              />

              <FormTextInput
                name="occupation"
                label="Occupation"
                placeholder="e.g., Plumber, Electrician, HVAC Technician"
                autoCapitalize="words"
              />

              <FormTextInput
                name="companyName"
                label="Company Name (Optional)"
                placeholder="Enter your company name"
                autoCapitalize="words"
                autoComplete="organization"
              />

              <FormTextInput
                name="phoneNumber"
                label="Phone Number (Optional)"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                autoComplete="tel"
              />

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
                  autoComplete="new-password"
                  textContentType="newPassword"
                  passwordRules="minlength: 8; required: lower; required: upper; required: digit;"
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

              <View style={styles.passwordContainer}>
                <FormTextInput
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <FontAwesome 
                    name={showConfirmPassword ? 'eye-slash' : 'eye'} 
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

              <FormButton
                title="Create Account"
                type="submit"
                onPress={methods.handleSubmit(handleSignup)}
                disabled={isLoading}
                loading={isLoading}
                style={styles.signupButton}
              />

              <View style={styles.termsContainer}>
                <Text style={[styles.termsText, { color: colors.placeholder }]}>
                  By creating an account, you agree to our{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>
          </FormProvider>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.placeholder }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={[styles.loginText, { color: colors.primary }]}>
                Sign In
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
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
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
  signupButton: {
    marginTop: 24,
  },
  termsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
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
  loginText: {
    fontSize: 16,
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 32, // Match the login screen positioning that was working perfectly
    padding: 8,
    zIndex: 1,
  },
}); 