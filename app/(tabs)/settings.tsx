import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Card } from '../components/Card';
import { spacing } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { LogoHeader } from '../components/LogoHeader';

export default function SettingsPage() {
  // Use theme context
  const { isDarkMode, colors } = useTheme();

  // Use dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Replace header with LogoHeader */}
      <LogoHeader />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* App Preferences */}
        <Card title="Settings">
          {/* The notification settings button has been moved to the setup page */}
          {/* Additional settings can be added here in the future */}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  }
});
