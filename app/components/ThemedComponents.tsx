import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Themed View Component
interface ThemedViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ThemedView: React.FC<ThemedViewProps> = ({ children, style }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[{ backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
};

// Themed Text Component
interface ThemedTextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ children, style }) => {
  const { colors } = useTheme();
  
  return (
    <Text style={[{ color: colors.text.primary }, style]}>
      {children}
    </Text>
  );
};

// Themed Button Component
interface ThemedButtonProps extends TouchableOpacityProps {
  title: string;
  textStyle?: StyleProp<TextStyle>;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({ 
  title, 
  style,
  textStyle,
  ...props 
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[{ 
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
      }, style]}
      {...props}
    >
      <Text style={[{ 
        color: colors.text.inverse,
        fontWeight: '600' 
      }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Export default component to satisfy expo-router requirement
export default function ThemedComponents() {
  return null;
}
