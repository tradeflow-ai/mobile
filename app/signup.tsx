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
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { AuthManager } from '@/services/authManager';
import { ProfileManager } from '@/services/profileManager';
import { supabase } from '@/services/supabase';
import { authErrorAtom } from '@/store/atoms';

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [authError, setAuthError] = useAtom(authErrorAtom);
  const [isLoading, setIsLoading] = useState(false);
  
  const authManager = AuthManager.getInstance();
  const profileManager = ProfileManager.getInstance();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    occupation: '',
    companyName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Occupation validation
    if (!formData.occupation.trim()) {
      newErrors.occupation = 'Occupation is required';
    }
    
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
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { user, error } = await authManager.signUp(formData.email, formData.password);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Signup failed';
        setAuthError(errorMessage);
        Alert.alert('Signup Failed', errorMessage);
        return;
      }
      
      if (user) {
        // Create profile with the provided information
        const profileResult = await profileManager.createProfileDuringSignup(user.id, {
          email: formData.email,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          occupation: formData.occupation.trim(),
          companyName: formData.companyName.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        });
        
        if (!profileResult.success) {
          console.warn('Profile creation failed during signup:', profileResult.error);
          // Store profile data in user metadata as fallback
          try {
            await supabase.auth.updateUser({
              data: {
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                occupation: formData.occupation.trim(),
                company_name: formData.companyName.trim() || undefined,
                phone: formData.phone.trim() || undefined,
              }
            });
          } catch (metadataError) {
            console.warn('Failed to store user metadata:', metadataError);
          }
        }
        
        // Show success message
        Alert.alert(
          'Account Created!',
          `Welcome ${formData.firstName}! Your account has been created successfully. Please check your email to verify your account.`,
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
          <View style={styles.form}>
            <TextInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(value) => updateFormData('firstName', value)}
              placeholder="Enter your first name"
              autoCapitalize="words"
              autoComplete="given-name"
              error={errors.firstName}
            />

            <TextInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(value) => updateFormData('lastName', value)}
              placeholder="Enter your last name"
              autoCapitalize="words"
              autoComplete="family-name"
              error={errors.lastName}
            />

            <TextInput
              label="Occupation"
              value={formData.occupation}
              onChangeText={(value) => updateFormData('occupation', value)}
              placeholder="e.g., Plumber, Electrician, HVAC Technician"
              autoCapitalize="words"
              error={errors.occupation}
            />

            <TextInput
              label="Company Name (Optional)"
              value={formData.companyName}
              onChangeText={(value) => updateFormData('companyName', value)}
              placeholder="Enter your company name"
              autoCapitalize="words"
              autoComplete="organization"
              error={errors.companyName}
            />

            <TextInput
              label="Phone Number (Optional)"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone}
            />

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

            <View style={styles.passwordContainer}>
              <TextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoComplete="password"
                error={errors.confirmPassword}
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

            <Button
              title="Create Account"
              onPress={handleSignup}
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
    top: 48,
    padding: 8,
    zIndex: 1,
  },
}); 