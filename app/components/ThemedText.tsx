import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ThemedTextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: 'body' | 'heading1' | 'heading2' | 'caption' | 'subtitle';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  children, 
  style, 
  variant = 'body' 
}) => {
  const { colors } = useTheme();
  
  const variantStyles = {
    body: {
      fontSize: 16,
      color: colors.text.primary,
    },
    heading1: {
      fontSize: 24,
      fontWeight: '700' as 'bold',
      color: colors.text.primary,
    },
    heading2: {
      fontSize: 20,
      fontWeight: '600' as 'bold',
      color: colors.text.primary,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '500' as 'normal',
      color: colors.text.secondary,
    },
    caption: {
      fontSize: 14,
      color: colors.text.secondary,
    },
  };
  
  return (
    <Text style={[variantStyles[variant], style]}>
      {children}
    </Text>
  );
};

// Export default component to satisfy expo-router requirement
export default function ThemedTextComponent() {
  return null;
}
