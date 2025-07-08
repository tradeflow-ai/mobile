import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { ProfileManager } from '@/services/profileManager';
import { userProfileAtom, isProfileLoadingAtom } from '@/store/atoms';

export default function EditProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const profileManager = ProfileManager.getInstance();
  
  const [userProfile] = useAtom(userProfileAtom);
  const [isProfileLoading] = useAtom(isProfileLoadingAtom);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    occupation: '',
    companyName: '',
    phone: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load current profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        occupation: userProfile.role || '',
        companyName: userProfile.company_name || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile]);

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
    
    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await profileManager.updateProfile({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        role: formData.occupation.trim(),
        company_name: formData.companyName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });
      
      if (result.success) {
        Alert.alert(
          'Profile Updated',
          'Your profile has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Update Failed', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Update Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[styles.subtitle, { color: colors.placeholder }]}>
              Update your personal information
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
              error={errors.firstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
              error={errors.lastName}
              placeholder="Enter your last name"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              label="Occupation"
              value={formData.occupation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, occupation: text }))}
              error={errors.occupation}
              placeholder="e.g., Plumber, Electrician, HVAC Technician"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              label="Company Name (Optional)"
              value={formData.companyName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, companyName: text }))}
              error={errors.companyName}
              placeholder="Enter your company name"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              label="Phone Number (Optional)"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              error={errors.phone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isLoading}
              style={styles.saveButton}
            />
            
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
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
  buttonContainer: {
    gap: 12,
    marginBottom: 32,
  },
  saveButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 8,
  },
}); 