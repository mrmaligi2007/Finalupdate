import { DarkTheme, DefaultTheme } from '@react-navigation/native';

// Define a comprehensive theme with proper typing

export const colors = {
  primary: '#3498db',
  secondary: '#2ecc71',
  background: '#f8f9fa',
  surface: '#ffffff',
  error: '#e74c3c',
  warning: '#f39c12',
  success: '#27ae60',
  info: '#2980b9',
  border: '#e2e8f0',
  divider: '#e2e8f0',
  textSecondary: '#666666', // Add for backward compatibility
  white: '#ffffff', // Add for references to colors.white
  cardBackground: '#ffffff', // Add for references to colors.cardBackground
  primaryLight: '#60A5FA', // Add for references to colors.primaryLight
  inputBackground: '#ffffff', // Add for references to colors.inputBackground
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    disabled: '#999999',
    inverse: '#ffffff'
  },
  action: {
    active: '#0074cc',
    hover: '#0082e6',
    disabled: '#cccccc',
  }
};

export const darkColors = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  secondary: '#34D399',
  secondaryDark: '#10B981',
  background: '#111827',
  surface: '#1F2937',
  surfaceVariant: '#374151',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    disabled: '#6B7280',
    inverse: '#111827',
  },
  border: '#374151',
};

export const spacing = {
  xxs: 2, // Add missing xxs spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const shadows = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
};

// Navigation theme that matches our design system
export const navigationTheme = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text.primary,
      border: colors.border,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: darkColors.primary,
      background: darkColors.background,
      card: darkColors.surface,
      text: darkColors.text.primary,
      border: darkColors.border,
    },
  },
};

// Export default for expo-router compatibility
export default colors;
