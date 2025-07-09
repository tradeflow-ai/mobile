import React, { useEffect, useMemo } from 'react';
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
import { useForm } from 'react-hook-form';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ProfileManager } from '@/services/profileManager';
import { userProfileAtom, isProfileLoadingAtom } from '@/store/atoms';
import { FormProvider, FormTextInput, FormActions } from '@/components/forms';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  occupation: string;
  companyName: string;
  phone: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const profileManager = ProfileManager.getInstance();
  
  const [userProfile] = useAtom(userProfileAtom);
  const [isProfileLoading] = useAtom(isProfileLoadingAtom);

  // Memoize the current profile data to avoid unnecessary recalculations
  const currentProfileData = useMemo(() => {
    const currentProfile = profileManager.getCurrentProfile();
    const firstName = userProfile?.first_name || currentProfile?.first_name || '';
    const lastName = userProfile?.last_name || currentProfile?.last_name || '';
    const fullName = profileManager.getDisplayName() || '';
    const role = userProfile?.role || currentProfile?.role || profileManager.getUserRole() || '';
    const companyName = userProfile?.company_name || currentProfile?.company_name || '';
    const phone = userProfile?.phone || currentProfile?.phone || '';

    // If we don't have first/last name from profile but have full name from ProfileManager
    let derivedFirstName = firstName;
    let derivedLastName = lastName;
    
    if (!firstName && !lastName && fullName) {
      const nameParts = fullName.split(' ');
      derivedFirstName = nameParts[0] || '';
      derivedLastName = nameParts.slice(1).join(' ') || '';
    }

    return {
      firstName: derivedFirstName,
      lastName: derivedLastName,
      occupation: role,
      companyName: companyName,
      phone: phone,
    };
  }, [userProfile, profileManager]);

  // Initialize form with react-hook-form using the current profile data
  const methods = useForm<ProfileFormData>({
    defaultValues: currentProfileData,
    mode: 'onChange',
  });

  const { reset, handleSubmit, formState: { isSubmitting } } = methods;

  // Initialize profile data on mount if needed
  useEffect(() => {
    const initializeProfile = async () => {
      if (!userProfile && !isProfileLoading) {
        try {
          await profileManager.refreshProfile();
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
      }
    };

    initializeProfile();
  }, [userProfile, isProfileLoading, profileManager]);

  // Reset form when profile data changes (simplified)
  useEffect(() => {
    reset(currentProfileData);
  }, [currentProfileData, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const result = await profileManager.updateProfile({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        full_name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        role: data.occupation.trim(),
        company_name: data.companyName.trim() || undefined,
        phone: data.phone.trim() || undefined,
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
          <FormProvider methods={methods}>
            <View style={styles.form}>
              <FormTextInput
                name="firstName"
                label="First Name"
                placeholder="Enter your first name"
                autoCapitalize="words"
                autoCorrect={false}
                required
              />

              <FormTextInput
                name="lastName"
                label="Last Name"
                placeholder="Enter your last name"
                autoCapitalize="words"
                autoCorrect={false}
                required
              />

              <FormTextInput
                name="occupation"
                label="Occupation"
                placeholder="e.g., Plumber, Electrician, HVAC Technician"
                autoCapitalize="words"
                autoCorrect={false}
                required
              />

              <FormTextInput
                name="companyName"
                label="Company Name (Optional)"
                placeholder="Enter your company name"
                autoCapitalize="words"
                autoCorrect={false}
              />

              <FormTextInput
                name="phone"
                label="Phone Number (Optional)"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                autoCorrect={false}
                rules={{
                  pattern: {
                    value: /^\+?[\d\s\-\(\)]+$/,
                    message: 'Please enter a valid phone number'
                  }
                }}
              />
            </View>

            <FormActions
              onSubmit={handleSubmit(onSubmit)}
              onCancel={handleCancel}
              submitTitle="Save Changes"
              isSubmitting={isSubmitting}
            />
          </FormProvider>
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
  form: {
    marginBottom: 24,
  },
}); 