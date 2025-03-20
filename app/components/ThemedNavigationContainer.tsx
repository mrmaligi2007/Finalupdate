import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { navigationTheme } from '../styles/theme';

interface ThemedNavigationContainerProps {
  children: React.ReactNode;
}

const ThemedNavigationContainer: React.FC<ThemedNavigationContainerProps> = ({ children }) => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <NavigationContainer 
      theme={isDarkMode ? { ...DarkTheme, ...navigationTheme.dark } : { ...DefaultTheme, ...navigationTheme.light }}
    >
      {children}
    </NavigationContainer>
  );
};

export default ThemedNavigationContainer;
