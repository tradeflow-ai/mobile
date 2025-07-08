import { Platform } from 'react-native';

export const AUTH_CONFIG = {
  // Redirect URLs for email verification
  EMAIL_REDIRECT_URL: Platform.OS === 'web' 
    ? `${window.location.origin}/confirm` 
    : 'tradeflowapp://confirm',
  
  // Redirect URLs for password reset
  PASSWORD_RESET_REDIRECT_URL: Platform.OS === 'web' 
    ? `${window.location.origin}/reset` 
    : 'tradeflowapp://reset',
  
  // Development URLs (for testing)
  DEV_EMAIL_REDIRECT_URL: 'tradeflowapp://confirm',
  DEV_PASSWORD_RESET_REDIRECT_URL: 'tradeflowapp://reset',
};

export const getEmailConfirmationURL = (): string => {
  return AUTH_CONFIG.EMAIL_REDIRECT_URL;
};

export const getPasswordResetURL = (): string => {
  return AUTH_CONFIG.PASSWORD_RESET_REDIRECT_URL;
}; 