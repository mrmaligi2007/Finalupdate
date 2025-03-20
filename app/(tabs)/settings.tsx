import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Card } from '../components/Card';
import { spacing } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { LogoHeader } from '../components/LogoHeader';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsPage() {
  // Use theme context
  const { isDarkMode, colors } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddDeviceInfo, setShowAddDeviceInfo] = useState(false);

  // Use dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
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
                
                Alert.alert(
                  'Restore Successful',
                  'Your data has been restored successfully. The app will now reflect the restored settings. You may need to restart the app for all changes to take effect.'
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

  // Function to open manual URL
  const openManual = async () => {
    const manualUrl = "https://www.automotionplus.com.au/Installation-Manuals/09-%20GSM%20&%20WiFi%20Control%20Systems/01%20-%20GSM%20Audio%20Intercom/APC%20Connect4V%20User%20Manual%20v03.pdf";
    
    // Check if the URL can be opened
    const canOpen = await Linking.canOpenURL(manualUrl);
    
    if (canOpen) {
      await Linking.openURL(manualUrl);
    } else {
      Alert.alert(
        "Cannot Open Link", 
        "Unable to open the manual link. Please check your internet connection."
      );
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <LogoHeader title="Utilities" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Add Device Button */}
        <Card title="Add Device">
          <TouchableOpacity
            style={styles.settingOption}
            onPress={() => setShowAddDeviceInfo(!showAddDeviceInfo)}
          >
            <View style={styles.settingContent}>
              <View style={[styles.iconBadge, { backgroundColor: colors.success }]}>
                <Ionicons name="add-circle-outline" size={22} color="white" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Add a new device</Text>
                <Text style={styles.settingDescription}>Connect another Connect4v or Phonic4v device</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>
        </Card>
        
        {/* Conditional Device Options */}
        {showAddDeviceInfo && (
          <Card>
            <View style={styles.deviceOptionsHeader}>
              <Text style={styles.deviceOptionsTitle}>Available Devices</Text>
              <TouchableOpacity onPress={() => setShowAddDeviceInfo(false)}>
                <Ionicons name="close-circle" size={24} color={colors.text.secondary} />
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
          </Card>
        )}

        {/* Data Management Card */}
        <Card title="Data Management">
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
        </Card>

        {/* User Manual Card */}
        <Card title="Documentation">
          <TouchableOpacity
            style={styles.manualLink}
            onPress={openManual}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={[styles.iconBadge, { backgroundColor: colors.info }]}>
                <Ionicons name="document-text-outline" size={22} color="white" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Connect4v Instruction Manual</Text>
                <Text style={styles.settingDescription}>Open the official user manual PDF</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>
        </Card>

        {/* App Preferences */}
        <Card title="App Settings">
          {/* Additional settings can be added here */}
          <Text style={styles.settingInfo}>
            Additional app settings are available in the Setup tab
          </Text>
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
    paddingBottom: spacing.xxl,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.md,
  },
  dataManagementButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    flex: 0.48,
    gap: spacing.xs,
  },
  backupButton: {
    backgroundColor: '#007BFF',
  },
  restoreButton: {
    backgroundColor: '#6C757D',
  },
  dataButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  dataManagementNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
  settingInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  settingOption: {
    paddingVertical: spacing.sm,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deviceOptionsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  deviceIcon: {
    marginRight: spacing.sm,
  },
  deviceName: {
    fontSize: 16,
  },
  comingSoonBadge: {
    backgroundColor: '#FFC10720',
    borderRadius: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  comingSoonText: {
    color: '#FFC107',
    fontWeight: '600',
    fontSize: 14,
  },
  manualLink: {
    paddingVertical: spacing.sm,
  },
});
