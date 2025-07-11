/**
 * TradeFlow Mobile App - Global Theme System
 * 
 * This file contains the complete design system tokens including typography,
 * spacing, shadows, border radius, and mobile-specific utilities.
 * All values are based on the theme-rules.md specifications.
 */

import { TextStyle, ViewStyle, Dimensions } from 'react-native';
import Colors from './Colors';

// Get screen dimensions for responsive scaling
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base screen width for scaling calculations (iPhone 14 Pro width)
const BASE_SCREEN_WIDTH = 393;

/**
 * Responsive scaling utility
 * Scales values based on screen width for consistent appearance across devices
 */
export const scale = {
  /**
   * Scale a value proportionally to screen width
   * @param size - The base size to scale
   * @returns Scaled size based on screen width
   */
  size: (size: number): number => {
    const ratio = screenWidth / BASE_SCREEN_WIDTH;
    return Math.round(size * ratio);
  },
  
  /**
   * Scale font size with minimum and maximum bounds
   * @param size - The base font size
   * @param min - Minimum font size (default: size * 0.8)
   * @param max - Maximum font size (default: size * 1.2)
   * @returns Scaled font size within bounds
   */
  font: (size: number, min?: number, max?: number): number => {
    const scaled = scale.size(size);
    const minSize = Math.round(min || size * 0.8);
    const maxSize = Math.round(max || size * 1.2);
    return Math.round(Math.max(minSize, Math.min(maxSize, scaled)));
  },
  
  /**
   * Check if device is considered large (tablet-like)
   */
  isLargeDevice: screenWidth >= 768,
  
  /**
   * Screen dimension helpers
   */
  screen: {
    width: screenWidth,
    height: screenHeight,
    isSmall: screenWidth < 375,
    isMedium: screenWidth >= 375 && screenWidth < 414,
    isLarge: screenWidth >= 414,
  },
};

/**
 * Typography Scale
 * Based on theme-rules.md specifications with responsive scaling
 */
export const typography = {
  // Complete TextStyle objects for direct use
  h1: {
    fontSize: scale.font(36),
    fontWeight: 'bold' as const,
    lineHeight: scale.font(44),
  } as TextStyle,
  
  h2: {
    fontSize: scale.font(24),
    fontWeight: 'bold' as const,
    lineHeight: scale.font(32),
  } as TextStyle,
  
  h3: {
    fontSize: scale.font(20),
    fontWeight: '600' as const,
    lineHeight: scale.font(28),
  } as TextStyle,
  
  h4: {
    fontSize: scale.font(16),
    fontWeight: '600' as const,
    lineHeight: scale.font(24),
  } as TextStyle,
  
  body: {
    fontSize: scale.font(16),
    fontWeight: 'normal' as const,
    lineHeight: scale.font(24),
  } as TextStyle,
  
  body1: {
    fontSize: scale.font(16),
    fontWeight: 'normal' as const,
    lineHeight: scale.font(24),
  } as TextStyle,
  
  body2: {
    fontSize: scale.font(14),
    fontWeight: 'normal' as const,
    lineHeight: scale.font(20),
  } as TextStyle,
  
  bodyBold: {
    fontSize: scale.font(16),
    fontWeight: 'bold' as const,
    lineHeight: scale.font(24),
  } as TextStyle,
  
  caption: {
    fontSize: scale.font(14),
    fontWeight: 'normal' as const,
    lineHeight: scale.font(20),
  } as TextStyle,
  
  button: {
    fontSize: scale.font(16),
    fontWeight: '600' as const,
    lineHeight: scale.font(24),
  } as TextStyle,
  
  // Raw values for custom combinations
  sizes: {
    h1: scale.font(36),
    h2: scale.font(24),
    h3: scale.font(20),
    h4: scale.font(16),
    body: scale.font(16),
    body1: scale.font(16),
    body2: scale.font(14),
    caption: scale.font(14),
    button: scale.font(16),
  },
  
  weights: {
    normal: 'normal' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: 'bold' as const,
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
};

/**
 * Spacing Scale
 * 8px-based scale with helper functions for common patterns
 */
const spacingValues = {
  xs: scale.size(4),
  s: scale.size(8),
  m: scale.size(16),
  l: scale.size(24),
  xl: scale.size(32),
  '2xl': scale.size(48),
} as const;

type SpacingKey = keyof typeof spacingValues;

export const spacing = {
  ...spacingValues,
  
  // Helper functions for common spacing patterns
  helpers: {
    paddingHorizontal: (size: SpacingKey) => ({
      paddingHorizontal: spacingValues[size],
    }),
    paddingVertical: (size: SpacingKey) => ({
      paddingVertical: spacingValues[size],
    }),
    paddingTop: (size: SpacingKey) => ({
      paddingTop: spacingValues[size],
    }),
    paddingBottom: (size: SpacingKey) => ({
      paddingBottom: spacingValues[size],
    }),
    marginHorizontal: (size: SpacingKey) => ({
      marginHorizontal: spacingValues[size],
    }),
    marginVertical: (size: SpacingKey) => ({
      marginVertical: spacingValues[size],
    }),
    marginTop: (size: SpacingKey) => ({
      marginTop: spacingValues[size],
    }),
    marginBottom: (size: SpacingKey) => ({
      marginBottom: spacingValues[size],
    }),
    padding: (size: SpacingKey) => ({
      padding: spacingValues[size],
    }),
    margin: (size: SpacingKey) => ({
      margin: spacingValues[size],
    }),
  },
};

/**
 * Border Radius Scale
 * Based on theme-rules.md specifications
 */
export const radius = {
  s: scale.size(8),
  m: scale.size(12),
  l: scale.size(16),
  full: 9999,
};

/**
 * Touch Target Utilities
 * Ensures accessibility compliance with minimum 44x44dp touch targets
 */
const touchTargetValues = {
  minimum: scale.size(44),
  comfortable: scale.size(48),
  large: scale.size(56),
} as const;

export const touchTargets = {
  ...touchTargetValues,
  
  // Helper to ensure minimum touch target
  ensureMinimum: (size: number) => Math.max(size, touchTargetValues.minimum),
  
  // Common touch target styles
  styles: {
    minimum: {
      minWidth: touchTargetValues.minimum,
      minHeight: touchTargetValues.minimum,
    },
    comfortable: {
      minWidth: touchTargetValues.comfortable,
      minHeight: touchTargetValues.comfortable,
    },
    large: {
      minWidth: touchTargetValues.large,
      minHeight: touchTargetValues.large,
    },
  },
};

/**
 * Shadow System
 * Platform-aware shadows with theme support
 */
export const shadows = {
  /**
   * Subtle shadow for default cards and inputs
   */
  subtle: (colorScheme: 'light' | 'dark' = 'light'): ViewStyle => ({
    shadowColor: colorScheme === 'light' ? '#000' : '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colorScheme === 'light' ? 0.05 : 0.2,
    shadowRadius: 2,
    elevation: 1,
  }),
  
  /**
   * Medium shadow for interactive/hovered cards and primary buttons
   */
  medium: (colorScheme: 'light' | 'dark' = 'light'): ViewStyle => ({
    shadowColor: colorScheme === 'light' ? '#000' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colorScheme === 'light' ? 0.1 : 0.3,
    shadowRadius: 4,
    elevation: 5,
  }),
  
  /**
   * Large shadow for modals and elevated content
   */
  large: (colorScheme: 'light' | 'dark' = 'light'): ViewStyle => ({
    shadowColor: colorScheme === 'light' ? '#000' : '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: colorScheme === 'light' ? 0.15 : 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
  
  // Static versions for when theme context isn't available
  static: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

/**
 * Theme Integration
 * Combines all design tokens with color system
 */
export const createTheme = (colorScheme: 'light' | 'dark' = 'light') => {
  const colors = Colors[colorScheme];
  
  return {
    colors,
    typography,
    spacing,
    radius,
    touchTargets,
    shadows: {
      subtle: shadows.subtle(colorScheme),
      medium: shadows.medium(colorScheme),
      large: shadows.large(colorScheme),
    },
    scale,
  };
};

/**
 * Default theme export
 */
export const theme = createTheme();

/**
 * Component-specific theme utilities
 */
export const componentThemes = {
  card: (colorScheme: 'light' | 'dark' = 'light') => ({
    backgroundColor: Colors[colorScheme].card,
    borderRadius: radius.m,
    ...shadows.subtle(colorScheme),
  }),
  
  button: {
    primary: (colorScheme: 'light' | 'dark' = 'light') => ({
      backgroundColor: Colors[colorScheme].primary,
      borderRadius: radius.m,
      ...shadows.medium(colorScheme),
      ...touchTargets.styles.minimum,
    }),
    secondary: (colorScheme: 'light' | 'dark' = 'light') => ({
      backgroundColor: Colors[colorScheme].secondary,
      borderRadius: radius.m,
      ...shadows.subtle(colorScheme),
      ...touchTargets.styles.minimum,
    }),
  },
  
  input: (colorScheme: 'light' | 'dark' = 'light') => ({
    backgroundColor: Colors[colorScheme].card,
    borderColor: Colors[colorScheme].border,
    borderWidth: 1,
    borderRadius: radius.m,
    ...touchTargets.styles.minimum,
  }),
};

// Export everything as named exports for Option A import strategy
export { Colors };
export default theme; 