import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from './components/Header';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing } from './styles/theme';
import { useTheme } from './contexts/ThemeContext';

export default function SettingsPage() {
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('1234');
  const [relaySettings, setRelaySettings] = useState({
    accessControl: 'AUT',
    latchTime: '000',
  });

  const router = useRouter();
  const { isDarkMode, setDarkMode } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedUnitNumber = await AsyncStorage.getItem('unitNumber');
      const savedPassword = await AsyncStorage.getItem('password');
      const savedRelaySettings = await AsyncStorage.getItem('relaySettings');

      if (savedUnitNumber) setUnitNumber(savedUnitNumber);
      if (savedPassword) setPassword(savedPassword);
      if (savedRelaySettings) setRelaySettings(JSON.parse(savedRelaySettings));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveToLocalStorage = async () => {
    try {
      await AsyncStorage.setItem('unitNumber', unitNumber);
      await AsyncStorage.setItem('password', password);
      await AsyncStorage.setItem('relaySettings', JSON.stringify(relaySettings));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save settings');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" />
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SMS Command Reference</Text>
          { /* Removed unwanted command texts */ }
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device Settings</Text>
         
          <Text style={styles.inputLabel}>Unit Telephone Number</Text>
          <TextInput
            style={styles.input}
            value={unitNumber}
            onChangeText={setUnitNumber}
            placeholder="Enter GSM relay number"
            keyboardType="phone-pad"
          />
         
          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              // Only allow 4 digits
              const filtered = text.replace(/[^0-9]/g, '').slice(0, 4);
              setPassword(filtered);
            }}
            placeholder="4-digit password"
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
        
        {/* App Preferences Card with Dark Mode toggle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Preferences</Text>
          
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextContainer}>
              <Text style={styles.preferenceLabel}>Dark Mode</Text>
              <Text style={styles.preferenceDescription}>
                Use dark theme for the app interface
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={(value) => setDarkMode(value)}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isDarkMode ? colors.primary : '#F9FAFB'}
            />
          </View>
        </View>
        
        {/* Notification Settings Button - Below Dark Mode toggle */}
        <TouchableOpacity
          style={[styles.card, styles.settingsButton]}
          onPress={() => router.push('/notification-settings')}
          activeOpacity={0.7}
        >
          <View style={styles.settingsButtonContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications-outline" size={24} color={colors.white} />
            </View>
            <View style={styles.settingsButtonTextContainer}>
              <Text style={styles.settingsButtonTitle}>Notification Settings</Text>
              <Text style={styles.settingsButtonDescription}>Configure who receives SMS notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveToLocalStorage}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || 'white',
  },
  content: {
    padding: spacing.md || 16,
    paddingBottom: spacing.xxl || 80,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border || '#e0e0e0',
    borderRadius: 8,
    padding: spacing.md || 16,
    marginBottom: spacing.md || 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text || '#000',
    marginBottom: spacing.md || 16,
  },
  commandList: {
    marginBottom: spacing.sm || 8,
  },
  commandItem: {
    fontSize: 16,
    marginBottom: spacing.sm || 8,
  },
  commandLabel: {
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 18,
    color: colors.text || '#000',
    marginBottom: spacing.sm || 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border || '#e0e0e0',
    borderRadius: 8,
    padding: spacing.sm || 12,
    fontSize: 16,
    color: colors.text || '#000',
    marginBottom: spacing.md || 16,
  },
  saveButton: {
    backgroundColor: colors.primary || '#00bfff',
    borderRadius: 8,
    padding: spacing.sm || 12,
    alignItems: 'center',
    marginBottom: spacing.lg || 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  settingsButton: {
    padding: spacing.md || 16,
    marginBottom: spacing.md || 16,
  },
  settingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md || 16,
  },
  settingsButtonIcon: {
    marginRight: spacing.md || 16,
  },
  settingsButtonTextContainer: {
    flex: 1,
  },
  settingsButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text || '#000',
    marginBottom: 4,
  },
  settingsButtonDescription: {
    fontSize: 14,
    color: colors.textSecondary || '#666',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm || 8,
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text || '#000',
  },
  preferenceDescription: {
    fontSize: 14,
    color: colors.textSecondary || '#666',
    marginTop: 2,
  },
});

