// Define color constants
export const palette = {
  primary: '#0088CC',
  secondary: '#6C757D',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',
  light: '#F8F9FA',
  dark: '#343A40',
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
};

// Export color variables for light theme
export const lightColors = {
  background: palette.white,
  surface: palette.white,
  primary: palette.primary,
  secondary: palette.secondary,
  success: palette.success,
  error: palette.danger,
  warning: palette.warning,
  info: palette.info,
  text: {
    primary: palette.gray900,
    secondary: palette.gray700,
    disabled: palette.gray500,
    inverse: palette.white,
  },
  border: palette.gray300,
  cardBackground: palette.white,
  inputBackground: palette.white,
  primaryLight: palette.primary,
};

// Export color variables for dark theme
export const darkColors = {
  background: palette.gray900,
  surface: palette.gray800,
  primary: '#50A0FF', // Lighter version for dark theme
  secondary: palette.gray500,
  success: '#4CD964',
  error: '#FF453A',
  warning: '#FFD60A',
  info: '#5AC8FA',
  text: {
    primary: palette.white,
    secondary: palette.gray300,
    disabled: palette.gray600,
    inverse: palette.gray900,
  },
  border: palette.gray700,
  cardBackground: palette.gray800,
  inputBackground: palette.gray800,
  primaryLight: '#50A0FF',
};

const colors = {
  light: lightColors,
  dark: darkColors,
};

// Default export for expo-router compatibility
export default colors;
