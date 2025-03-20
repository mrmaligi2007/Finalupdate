import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { colors, spacing } from './styles/theme';

// User interface for authorized users
interface AuthorizedUser {
  serial: string;
  phone: string;
  name?: string;
}

export default function Step4Page() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('');
  const [relaySettings, setRelaySettings] = useState({
    accessControl: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [newUser, setNewUser] = useState({
    serial: '',
    phone: '',
    name: '',
  });

  const initialLoadDone = useRef(false);

  // Only load data when component first mounts, not on every focus
  useEffect(() => {
    loadData();
  }, []);

  // Focus effect only for contact handling
  useFocusEffect(
    React.useCallback(() => {
      if (params.contactPhone && params.contactName && params.timestamp) {
        setNewUser({
          ...newUser,
          phone: params.contactPhone as string,
          name: params.contactName as string
        });
        
        // Schedule clearing params to avoid infinite loops
        const timer = setTimeout(() => {
          router.setParams({});
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }, [params.contactPhone, params.contactName, params.timestamp])
  );

  const loadData = async () => {
    try {
      const savedUnitNumber = await AsyncStorage.getItem('unitNumber');
      const savedPassword = await AsyncStorage.getItem('password');
      const savedRelaySettings = await AsyncStorage.getItem('relaySettings');
      const savedUsers = await AsyncStorage.getItem('authorizedUsers');

      if (savedUnitNumber) setUnitNumber(savedUnitNumber);
      if (savedPassword) setPassword(savedPassword);
      
      // Default to 'AUT' mode only if no setting exists
      let accessControlMode = '';
      
      if (savedRelaySettings) {
        const settings = JSON.parse(savedRelaySettings);
        accessControlMode = settings.accessControl || '';
      }
      
      console.log('Loading access control mode from storage:', accessControlMode);
      setRelaySettings(prev => ({
        ...prev,
        accessControl: accessControlMode
      }));
      
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      
      console.log('Access control mode set to:', accessControlMode);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    initialLoadDone.current = true;
  };

  const saveRelaySettings = async () => {
    try {
      // Get existing relay settings first to avoid overwriting latchTime
      const savedRelaySettings = await AsyncStorage.getItem('relaySettings');
      let settings = { accessControl: relaySettings.accessControl, latchTime: '000' };
      
      if (savedRelaySettings) {
        const existingSettings = JSON.parse(savedRelaySettings);
        settings = { 
          ...existingSettings, 
          accessControl: relaySettings.accessControl 
        };
      }
      
      console.log('Saving access control mode to storage:', settings.accessControl);
      await AsyncStorage.setItem('relaySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const saveUsers = async (updatedUsers?: AuthorizedUser[]) => {
    try {
      const usersToSave = updatedUsers || users;
      await AsyncStorage.setItem('authorizedUsers', JSON.stringify(usersToSave));
    } catch (error) {
      console.error('Error saving users:', error);
      Alert.alert('Error', 'Failed to save users');
    }
  };

  const sendSMS = async (command: string) => {
    if (!unitNumber) {
      Alert.alert('Error', 'Connect4v number not set. Please configure in Device Settings first.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formattedUnitNumber = Platform.OS === 'ios' ? unitNumber.replace('+', '') : unitNumber;

      const smsUrl = Platform.select({
        ios: `sms:${formattedUnitNumber}&body=${encodeURIComponent(command)}`,
        android: `sms:${formattedUnitNumber}?body=${encodeURIComponent(command)}`,
        default: `sms:${formattedUnitNumber}?body=${encodeURIComponent(command)}`,
      });

      const supported = await Linking.canOpenURL(smsUrl);
      
      if (!supported) {
        Alert.alert('Error', 'SMS is not available on this device');
        setIsLoading(false);
        return;
      }
      
      await Linking.openURL(smsUrl);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      Alert.alert('Error', 'Failed to open SMS. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Relay Settings Functions
  const setAccessControl = async (type: 'AUT' | 'ALL') => {
    console.log('Setting access control mode to:', type);
    
    // Update the state
    setRelaySettings(prev => ({ ...prev, accessControl: type }));
    
    // Send command to device
    const command = type === 'ALL' ? `${password}ALL#` : `${password}AUT#`;
    await sendSMS(command);
    
    // Save to AsyncStorage immediately
    await saveRelaySettings();
  };

  // User Management Functions
  const addUser = () => {
    if (!newUser.serial || !newUser.phone) {
      Alert.alert('Error', 'Serial number and phone number are required');
      return;
    }
    
    // Validate serial number format
    const serialNum = parseInt(newUser.serial);
    if (isNaN(serialNum) || serialNum < 1 || serialNum > 200) {
      Alert.alert('Error', 'Serial number must be between 001 and 200');
      return;
    }
    
    // Format serial to 3 digits
    const formattedSerial = newUser.serial.padStart(3, '0');
    
    // Check if serial already exists
    if (users.some(user => user.serial === formattedSerial)) {
      Alert.alert('Error', 'This serial number is already in use');
      return;
    }
    
    // Add user
    const updatedUsers = [...users, {
      serial: formattedSerial,
      phone: newUser.phone,
      name: newUser.name || `User ${users.length + 1}`
    }];
    
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    
    // Send command to device
    sendSMS(`${password}A${formattedSerial}#${newUser.phone}#`);
    
    // Reset form
    setNewUser({
      serial: '',
      phone: '',
      name: '',
    });
  };

  const deleteUser = (serial: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Send delete command
            sendSMS(`${password}A${serial}##`);
            
            // Update local state
            const updatedUsers = users.filter(user => user.serial !== serial);
            setUsers(updatedUsers);
            saveUsers(updatedUsers);
          }
        }
      ]
    );
  };

  // Add function to handle contact picking
  const pickContact = () => {
    router.push('/contact-picker?returnTo=/step4');
  };

  return (
    <View style={styles.container}>
      <Header title="Access Control" showBack backTo="/setup" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card elevated>
          <View style={styles.accessControlContainer}>
            <Text style={styles.accessControlTitle}>Access Control Mode</Text>
            <Text style={styles.accessControlDescription}>
              Select who can control your Connect4v device
            </Text>
            
            {/* Mode selection buttons replace toggle switch */}
            <View style={styles.modeContainer}>
              <TouchableOpacity 
                style={[
                  styles.modeOption,
                  relaySettings.accessControl === 'AUT' && styles.modeOptionSelected
                ]}
                onPress={() => setAccessControl('AUT')}
              >
                <View style={[
                  styles.modeIconContainer,
                  relaySettings.accessControl === 'AUT' && styles.modeIconContainerSelected
                ]}>
                  <Ionicons name="shield-checkmark" size={24} color={relaySettings.accessControl === 'AUT' ? "white" : colors.primary} />
                </View>
                <Text style={styles.modeTitle}>Authorized Only</Text>
                <Text style={styles.modeDescription}>Only allowed numbers can access</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.modeOption,
                  relaySettings.accessControl === 'ALL' && styles.modeOptionSelected
                ]}
                onPress={() => setAccessControl('ALL')}
              >
                <View style={[
                  styles.modeIconContainer,
                  relaySettings.accessControl === 'ALL' && styles.modeIconContainerSelected
                ]}>
                  <Ionicons name="globe" size={24} color={relaySettings.accessControl === 'ALL' ? "white" : colors.primary} />
                </View>
                <Text style={styles.modeTitle}>Allow All</Text>
                <Text style={styles.modeDescription}>Any caller can access</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.commandContainer}>
              <Text style={styles.commandLabel}>Command:</Text>
              <Text style={styles.commandText}>
                {password}{relaySettings.accessControl}#
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Replace conditional rendering with button to user management */}
        <Button 
          title="Manage Authorized Users"
          onPress={() => router.push('/user-management')}
          icon={<Ionicons name="people" size={20} color="white" />}
          fullWidth
          style={styles.userManagementButton}
        />
        
        {/* Info card for Allow All mode */}
        {relaySettings.accessControl === 'ALL' && (
          <Card style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={36} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoMessage}>
                The Authorized Number means the one who can dial the device to control the relay.
              </Text>
            </View>
            <Text style={styles.infoSubtext}>
              Switch to "Authorized Only" mode to manage authorized users.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  accessControlContainer: {
    padding: spacing.xs,
  },
  accessControlTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  accessControlDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modeOption: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '15',
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modeIconContainerSelected: {
    backgroundColor: colors.primary,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  commandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userManagementButton: {
    marginTop: spacing.md,
  },
  userManagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  userManagementHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  userManagementHeaderContent: {
    flex: 1,
  },
  userManagementHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  userManagementHeaderSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  commandLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  commandText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 15,
    color: colors.primary,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactPickerButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  commandPreviewContainer: {
    backgroundColor: colors.cardBackground,
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  userItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  userSerialContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  userSerial: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  commandGuideItem: {
    marginBottom: spacing.sm,
  },
  commandGuideLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  commandGuideText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: colors.primary,
  },
  infoCard: {
    marginTop: spacing.lg,
    backgroundColor: `${colors.primary}10`,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoIcon: {
    marginRight: spacing.sm,
  },
  infoMessage: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  infoSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  toggleOption: {
    alignItems: 'center',
    width: 100,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: `${colors.primary}40`,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleHandle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  toggleHandleActive: {
    transform: [{ translateX: 28 }],
  },
  advancedButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
