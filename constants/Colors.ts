// Light wooden color scheme for TradeFlow Mobile App
const primaryWood = '#F4A460'; // Sandy Brown - lighter, more readable brown
const lightWood = '#F5DEB3'; // Wheat - light creamy wood
const darkWood = '#8B4513'; // Saddle Brown - darker wood tone
const accentWood = '#CD853F'; // Peru - medium wood accent

const tintColorLight = primaryWood;
const tintColorDark = lightWood;

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    // Additional colors for inventory app
    primary: primaryWood,
    secondary: lightWood,
    accent: accentWood,
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
    primary: lightWood,
    secondary: darkWood,
    accent: accentWood,
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
  primary: primaryWood,
  light: lightWood,
  dark: darkWood,
  accent: accentWood,
};
