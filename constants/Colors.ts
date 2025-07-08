// Green color scheme for Inventory Management App
const primaryGreen = '#2E8B57'; // Sea Green
const lightGreen = '#98FB98'; // Pale Green
const darkGreen = '#006400'; // Dark Green
const accentGreen = '#32CD32'; // Lime Green

const tintColorLight = primaryGreen;
const tintColorDark = lightGreen;

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    // Additional colors for inventory app
    primary: primaryGreen,
    secondary: lightGreen,
    accent: accentGreen,
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    card: '#f8f9fa',
    border: '#e9ecef',
    placeholder: '#6c757d',
    disabled: '#adb5bd',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    // Additional colors for inventory app
    primary: lightGreen,
    secondary: darkGreen,
    accent: accentGreen,
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    card: '#212529',
    border: '#495057',
    placeholder: '#6c757d',
    disabled: '#495057',
  },
};

// Export individual colors for easy access
export const Colors = {
  primary: primaryGreen,
  light: lightGreen,
  dark: darkGreen,
  accent: accentGreen,
};
