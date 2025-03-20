import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from './components/Header';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing } from './styles/theme';
import { useTheme } from './contexts/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsPage() {
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('1234');
  const [relaySettings, setRelaySettings] = useState({
    accessControl: 'AUT',
    latchTime: '000',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddDeviceInfo, setShowAddDeviceInfo] = useState(false);

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

  // Get all data from AsyncStorage
  const getAllStorageData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);
      
      // Convert to an object
      const data = {};
      result.forEach(([key, value]) => {
        try {
          // Try to parse as JSON first
          data[key] = JSON.parse(value);
        } catch (e) {
          // If not valid JSON, store as string
          data[key] = value;
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error collecting data:', error);
      throw error;
    }
  };

  // Backup function - collects all app data and saves to file
  const backupData = async () => {
    try {
      setIsProcessing(true);

      // Get all data
      const data = await getAllStorageData();
      
      // Add metadata
      const backupData = {
        appName: 'Connect4v',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: data
      };
      
      // Convert to JSON
      const jsonData = JSON.stringify(backupData, null, 2);
      
      // Create filename with date
      const date = new Date();
      const dateString = date.toISOString().split('T')[0];
      const fileName = `connect4v_backup_${dateString}.json`;
      
      // Full path to save file
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Write to file
      await FileSystem.writeAsStringAsync(filePath, jsonData);
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Share the file
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Save your backup file',
          UTI: 'public.json'
        });
        
        Alert.alert(
          'Backup Successful', 
          'Your data has been backed up successfully and is ready to be saved.'
        );
      } else {
        Alert.alert(
          'Backup Saved',
          `Backup has been saved to ${filePath}`
        );
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Backup Failed', 'There was an error creating your backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore function - reads data from file and restores settings
  const restoreData = async () => {
    try {
      setIsProcessing(true);

      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        return;
      }

      // Get the file URI
      const fileUri = result.assets[0].uri;
      
      // Read the file
      const jsonData = await FileSystem.readAsStringAsync(fileUri);
      
      // Parse the data
      const backupData = JSON.parse(jsonData);
      
      // Validate backup format
      if (!backupData.data || !backupData.appName || backupData.appName !== 'Connect4v') {
        Alert.alert('Invalid Backup', 'The selected file is not a valid Connect4v backup.');
        return;
      }
      
      // Confirm with user
      Alert.alert(
        'Confirm Restore',
        'This will replace all your current settings. Are you sure you want to continue?',
        [
          { 
            text: 'Cancel', 
            style: 'cancel' 
          },
          { 
            text: 'Restore', 
            onPress: async () => {
              try {
                // Clear all existing data
                const keys = await AsyncStorage.getAllKeys();
                await AsyncStorage.multiRemove(keys);
                
                // Restore all data
                const data = backupData.data;
                const entries = Object.entries(data);
                
                // Convert entries to the format expected by multiSet
                const restoreEntries = entries.map(([key, value]) => {
                  // If value is an object, stringify it
                  const stringValue = typeof value === 'object' ? 
                    JSON.stringify(value) : 
                    String(value);
                  return [key, stringValue];
                });
                
                await AsyncStorage.multiSet(restoreEntries);
                
                // Reload the UI
                await loadData();
                
                Alert.alert(
                  'Restore Successful',
                  'Your data has been restored successfully. The app will now reflect the restored settings.'
                );
              } catch (error) {
                console.error('Error in restore operation:', error);
                Alert.alert('Restore Failed', 'There was an error restoring your data.');
              } finally {
                setIsProcessing(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error restoring backup:', error);
      Alert.alert('Restore Failed', 'There was an error reading the backup file.');
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" />
      <ScrollView style={styles.content}>
        {/* Add Device Button */}
        <TouchableOpacity
          style={[styles.card, styles.settingsButton]}
          onPress={() => setShowAddDeviceInfo(!showAddDeviceInfo)}
          activeOpacity={0.7}
        >
          <View style={styles.settingsButtonContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
              <Ionicons name="add-circle-outline" size={24} color={colors.white} />
            </View>
            <View style={styles.settingsButtonTextContainer}>
              <Text style={styles.settingsButtonTitle}>Add Device</Text>
              <Text style={styles.settingsButtonDescription}>Add a new Connect4v or Phonic4v device</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        
        {/* Conditional message when Add Device is clicked */}
        {showAddDeviceInfo && (
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonHeader}>
              <Text style={styles.comingSoonTitle}>Available Devices</Text>
              <TouchableOpacity onPress={() => setShowAddDeviceInfo(false)}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.deviceOption}>
              <Ionicons name="hardware-chip-outline" size={22} color={colors.primary} style={styles.deviceIcon} />
              <Text style={styles.deviceName}>Connect4v</Text>
            </View>
            <View style={styles.deviceOption}>
              <Ionicons name="radio-outline" size={22} color={colors.primary} style={styles.deviceIcon} />
              <Text style={styles.deviceName}>Phonic4v</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        )}

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
            placeholder="Enter Connect4v number"
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

        {/* Data Management Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Management</Text>
          
          <Text style={styles.cardDescription}>
            Backup and restore your device configuration and user settings
          </Text>
          
          <View style={styles.dataManagementButtons}>
            <TouchableOpacity
              style={[styles.dataButton, styles.backupButton, isProcessing && styles.disabledButton]}
              onPress={backupData}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color="white" />
              )}
              <Text style={styles.dataButtonText}>
                {isProcessing ? 'Processing...' : 'Backup Data'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dataButton, styles.restoreButton, isProcessing && styles.disabledButton]}
              onPress={restoreData}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="cloud-download-outline" size={24} color="white" />
              )}
              <Text style={styles.dataButtonText}>
                {isProcessing ? 'Processing...' : 'Restore Data'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.dataManagementNote}>
            Backing up will save all your device settings, user lists, and preferences to a file.
            Make sure to keep your backup files in a safe location.
          </Text>
        </View>

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
  cardDescription: {
    fontSize: 14,
    color: colors.text.secondary || '#666',
    marginBottom: spacing.md || 16,
  },
  dataManagementButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md || 16,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm || 8,
    paddingHorizontal: spacing.md || 16,
    borderRadius: 8,
    flex: 0.48,
    gap: spacing.xs || 4,
  },
  backupButton: {
    backgroundColor: colors.primary || '#007BFF',
  },
  restoreButton: {
    backgroundColor: colors.secondary || '#6C757D',
  },
  dataButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  dataManagementNote: {
    fontSize: 12,
    color: colors.text.secondary || '#666',
    fontStyle: 'italic',
    marginBottom: spacing.sm || 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  comingSoonCard: {
    backgroundColor: colors.cardBackground || 'white',
    borderRadius: 8,
    padding: spacing.md || 16,
    marginBottom: spacing.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#e0e0e0',
  },
  comingSoonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md || 16,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text || '#000',
  },
  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm || 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#e0e0e0',
  },
  deviceIcon: {
    marginRight: spacing.sm || 8,
  },
  deviceName: {
    fontSize: 16,
    color: colors.text || '#000',
  },
  comingSoonBadge: {
    backgroundColor: colors.warning + '20',
    borderRadius: 16,
    paddingVertical: spacing.xs || 4,
    paddingHorizontal: spacing.sm || 8,
    alignSelf: 'flex-start',
    marginTop: spacing.md || 16,
  },
  comingSoonText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: 14,
  },
});

