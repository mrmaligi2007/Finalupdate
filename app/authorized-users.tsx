import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { colors, spacing } from './styles/theme';
import * as Contacts from 'expo-contacts';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';

// Define user interface
interface AuthorizedUser {
  serial: string;  // Position from 001-200
  phone: string;   // Phone number with country code
  name?: string;   // Optional name for display purposes
  startTime?: string; // Optional time restriction (YYYYMMDDHHMM)
  endTime?: string;   // Optional time restriction (YYYYMMDDHHMM)
}

export default function AuthorizedUsersPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('');
  const [adminNumber, setAdminNumber] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newUser, setNewUser] = useState<AuthorizedUser>({
    serial: '',
    phone: '',
    name: '',
    startTime: '',
    endTime: ''
  });
  
  // For batch query
  const [startSerial, setStartSerial] = useState('');
  const [endSerial, setEndSerial] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedUnitNumber = await AsyncStorage.getItem('unitNumber');
      const savedPassword = await AsyncStorage.getItem('password');
      const savedAuthorizedUsers = await AsyncStorage.getItem('authorizedUsers');

      if (savedUnitNumber) setUnitNumber(savedUnitNumber);
      if (savedPassword) setPassword(savedPassword);
      if (savedAuthorizedUsers) setAuthorizedUsers(JSON.parse(savedAuthorizedUsers));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveToLocalStorage = async () => {
    try {
      await AsyncStorage.setItem('authorizedUsers', JSON.stringify(authorizedUsers));
      Alert.alert('Success', 'User settings saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save user settings');
    }
  };

  const sendSMS = async (command: string) => {
    if (!unitNumber) {
      Alert.alert('Error', 'GSM relay number not set. Please configure device first.');
      return false;
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
        return false;
      }
      
      await Linking.openURL(smsUrl);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', 'Failed to open SMS app');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Format admin number to ensure it has 0061 prefix
  const formatAdminNumber = (number: string): string => {
    // Remove all non-digit characters
    let cleaned = number.replace(/\D/g, '');
    
    // Handle Australian mobile numbers (start with 04)
    if (cleaned.startsWith('04')) {
      // Remove the leading 0
      cleaned = cleaned.substring(1);
      // Add 0061 prefix
      cleaned = '0061' + cleaned;
    } 
    // If already has 61 but not 0061
    else if (cleaned.startsWith('61') && !cleaned.startsWith('0061')) {
      cleaned = '00' + cleaned;
    } 
    // If no country code detected and doesn't start with 0061
    else if (!cleaned.startsWith('0061')) {
      // If starts with 4 (missing 0 from 04), assume Australian mobile
      if (cleaned.startsWith('4')) {
        cleaned = '0061' + cleaned;
      }
      // Otherwise, if no identifiable country code, add 0061
      else if (!cleaned.startsWith('00')) {
        cleaned = '0061' + cleaned;
      }
    }
    
    return cleaned;
  };

  // Set admin number
  const setAdminNumberHandler = () => {
    if (!adminNumber) {
      Alert.alert('Error', 'Please enter the admin phone number');
      return;
    }
    
    // Format admin number according to required format
    const formattedNumber = formatAdminNumber(adminNumber);
    
    // Update state with formatted number
    setAdminNumber(formattedNumber);
    
    // Format command for setting admin number
    const command = `${password}TEL${formattedNumber}#`;
    
    sendSMS(command);
  };

  // Add or update user
  const addUser = () => {
    if (!newUser.serial || !newUser.phone) {
      Alert.alert('Error', 'Serial number and phone number are required');
      return;
    }
    
    // Validate serial number
    const serialNum = parseInt(newUser.serial);
    if (isNaN(serialNum) || serialNum < 1 || serialNum > 200) {
      Alert.alert('Error', 'Serial number must be between 001 and 200');
      return;
    }
    
    // Format serial to 3 digits
    const formattedSerial = newUser.serial.padStart(3, '0');
    
    // Build command
    let command = `${password}A${formattedSerial}#${newUser.phone}#`;
    
    // Add time restrictions if provided
    if (newUser.startTime && newUser.endTime) {
      command += `${newUser.startTime}#${newUser.endTime}#`;
    }
    
    // Update local storage
    const existingIndex = authorizedUsers.findIndex(user => user.serial === formattedSerial);
    
    if (existingIndex >= 0) {
      // Update existing user
      const updatedUsers = [...authorizedUsers];
      updatedUsers[existingIndex] = {
        ...newUser,
        serial: formattedSerial
      };
      setAuthorizedUsers(updatedUsers);
    } else {
      // Add new user
      setAuthorizedUsers([
        ...authorizedUsers,
        {
          ...newUser,
          serial: formattedSerial
        }
      ]);
    }
    
    // Send command to device
    sendSMS(command);
    
    // Reset form
    setNewUser({
      serial: '',
      phone: '',
      name: '',
      startTime: '',
      endTime: ''
    });
  };

  // Delete user
  const deleteUser = (serial: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete user at position ${serial}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Send delete command
            sendSMS(`${password}A${serial}##`);
            
            // Update local storage
            setAuthorizedUsers(authorizedUsers.filter(user => user.serial !== serial));
          }
        }
      ]
    );
  };

  // Query user at specific position
  const queryUser = (serial: string) => {
    if (!serial) {
      Alert.alert('Error', 'Please enter a serial number to query');
      return;
    }
    
    sendSMS(`${password}A${serial}#`);
  };

  // Query batch of users
  const queryBatchUsers = () => {
    if (!startSerial || !endSerial) {
      Alert.alert('Error', 'Please enter start and end serial numbers');
      return;
    }
    
    // Validate range
    const start = parseInt(startSerial);
    const end = parseInt(endSerial);
    
    if (isNaN(start) || isNaN(end) || start < 1 || end > 200 || start > end) {
      Alert.alert('Error', 'Invalid serial number range');
      return;
    }
    
    // Format serial numbers to 3 digits
    const formattedStart = startSerial.padStart(3, '0');
    const formattedEnd = endSerial.padStart(3, '0');
    
    sendSMS(`${password}AL${formattedStart}#${formattedEnd}#`);
  };

  // Set access control mode
  const setAccessControlMode = (mode: 'AUT' | 'ALL') => {
    const command = `${password}${mode}#`;
    sendSMS(command);
  };

  // Update the pick contact function to navigate to the contact picker
  const pickContact = async () => {
    router.push('/contact-picker?returnTo=/authorized-users');
  };

  // Add this function to handle contact selection when returning from contact picker
  useFocusEffect(
    React.useCallback(() => {
      console.log("AuthorizedUsers received params:", params);
      
      if (params.contactPhone && params.contactName) {
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

  // Format date time string for display
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr || dateTimeStr.length !== 12) return dateTimeStr;
    
    try {
      const year = dateTimeStr.substring(0, 4);
      const month = dateTimeStr.substring(4, 6);
      const day = dateTimeStr.substring(6, 8);
      const hour = dateTimeStr.substring(8, 10);
      const minute = dateTimeStr.substring(10, 12);
      
      return `${day}/${month}/${year} ${hour}:${minute}`;
    } catch (error) {
      return dateTimeStr;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="User Management" showBack backTo="/(tabs)/setup" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card title="Admin Settings" style={styles.card}>
          <Text style={styles.infoText}>
            Set the primary admin number that has full control over the GSM relay.
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Admin Phone Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                value={adminNumber}
                onChangeText={setAdminNumber}
                placeholder="Enter mobile number (e.g., 0461234567)"
                keyboardType="phone-pad"
              />
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={pickContact}
              >
                <Ionicons name="people" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Format as 006146XXXXXXX (country code + number)</Text>
            <Text style={styles.helperText}>Command: {password}TEL{formatAdminNumber(adminNumber) || 'xxxxxxxx'}#</Text>
            
            <TouchableOpacity 
              style={[styles.actionButton, {alignSelf: 'flex-start', marginTop: spacing.sm}]}
              onPress={setAdminNumberHandler}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>Set Admin</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.label}>Access Control Mode</Text>
          <Text style={styles.helperText}>Choose who can call to control the relay</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.primaryButton]}
              onPress={() => setAccessControlMode('AUT')}
            >
              <Ionicons name="people" size={16} color="white" />
              <Text style={styles.controlButtonText}>Authorized Only</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.secondaryButton]}
              onPress={() => setAccessControlMode('ALL')}
            >
              <Ionicons name="globe" size={16} color="white" />
              <Text style={styles.controlButtonText}>Allow All</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        <Card title="Query Users" style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Check Single User</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                value={newUser.serial}
                onChangeText={(text) => setNewUser({...newUser, serial: text})}
                placeholder="Enter position (001-200)"
                keyboardType="number-pad"
                maxLength={3}
              />
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => queryUser(newUser.serial.padStart(3, '0'))}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>Query</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Command: {password}A{newUser.serial.padStart(3, '0') || '001'}#</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Query Batch Users</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                value={startSerial}
                onChangeText={setStartSerial}
                placeholder="Start"
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.rangeText}>to</Text>
              <TextInput
                style={[styles.input, {flex: 1}]}
                value={endSerial}
                onChangeText={setEndSerial}
                placeholder="End"
                keyboardType="number-pad"
                maxLength={3}
              />
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={queryBatchUsers}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>Query</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Command: {password}AL{startSerial.padStart(3, '0') || '001'}#{endSerial.padStart(3, '0') || '200'}#</Text>
          </View>
        </Card>
        
        <Card title="Add/Update Authorized User" style={styles.card}>
          <Text style={styles.infoText}>
            Authorized users can call the device to control the relay. Each user is assigned a position (001-200).
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Serial Number (001-200)</Text>
            <TextInput
              style={styles.input}
              value={newUser.serial}
              onChangeText={(text) => setNewUser({...newUser, serial: text})}
              placeholder="Enter position (001-200)"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                value={newUser.phone}
                onChangeText={(text) => setNewUser({...newUser, phone: text})}
                placeholder="Enter phone number with country code"
                keyboardType="phone-pad"
              />
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={pickContact}
              >
                <Ionicons name="people" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newUser.name}
              onChangeText={(text) => setNewUser({...newUser, name: text})}
              placeholder="Enter user name for reference"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Time Restrictions (Optional)</Text>
            <Text style={styles.helperText}>Specify when this user can access the device</Text>
            
            <View style={styles.timeContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.startTime}
                  onChangeText={(text) => setNewUser({...newUser, startTime: text})}
                  placeholder="YYYYMMDDHHMM"
                  keyboardType="number-pad"
                  maxLength={12}
                />
                <Text style={styles.helperText}>Format: YYYYMMDDHHMM</Text>
                <Text style={styles.helperText}>Example: 202409051000</Text>
              </View>
              
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.endTime}
                  onChangeText={(text) => setNewUser({...newUser, endTime: text})}
                  placeholder="YYYYMMDDHHMM"
                  keyboardType="number-pad"
                  maxLength={12}
                />
                <Text style={styles.helperText}>Format: YYYYMMDDHHMM</Text>
                <Text style={styles.helperText}>Example: 202409051000</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.commandPreviewContainer}>
            <Text style={styles.commandLabel}>Command Preview:</Text>
            <Text style={styles.commandText}>
              {password}A{newUser.serial.padStart(3, '0')}#{newUser.phone}#
              {newUser.startTime && newUser.endTime ? `${newUser.startTime}#${newUser.endTime}#` : ''}
            </Text>
          </View>
          
          <Button
            title="Add/Update User"
            onPress={addUser}
            loading={isLoading}
            icon={<Ionicons name="person-add-outline" size={20} color="white" />}
            disabled={!newUser.serial || !newUser.phone}
            fullWidth
          />
        </Card>
        
        <Card title="Authorized Users List" style={styles.card}>
          {authorizedUsers.length === 0 ? (
            <Text style={styles.emptyText}>No authorized users added yet.</Text>
          ) : (
            authorizedUsers.map(user => (
              <View key={user.serial} style={styles.userItem}>
                <View style={styles.userInfo}>
                  <Text style={styles.serialText}>{user.serial}</Text>
                  <View style={styles.userDetails}>
                    <Text style={styles.phoneText}>{user.phone}</Text>
                    {user.name && <Text style={styles.nameText}>{user.name}</Text>}
                    {user.startTime && user.endTime && (
                      <Text style={styles.timeText}>
                        Access: {formatDateTime(user.startTime)} to {formatDateTime(user.endTime)}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteUser(user.serial)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
          
          {authorizedUsers.length > 0 && (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveToLocalStorage}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </Card>
        
        <View style={styles.commandGuideContainer}>
          <Text style={styles.commandGuideTitle}>Command Reference</Text>
          
          <View style={styles.commandGuideItem}>
            <Text style={styles.commandGuideLabel}>Set Admin Number:</Text>
            <Text style={styles.commandGuideText}>PwdTEL00614xxxxxxxx#</Text>
          </View>
          
          <View style={styles.commandGuideItem}>
            <Text style={styles.commandGuideLabel}>Add Authorized User:</Text>
            <Text style={styles.commandGuideText}>PwdAserial#phone#</Text>
          </View>
          
          <View style={styles.commandGuideItem}>
            <Text style={styles.commandGuideLabel}>Add with Time Limit:</Text>
            <Text style={styles.commandGuideText}>PwdAserial#phone#YYYYMMDDHHMM#YYYYMMDDHHMM#</Text>
          </View>
          
          <View style={styles.commandGuideItem}>
            <Text style={styles.commandGuideLabel}>Delete Authorized User:</Text>
            <Text style={styles.commandGuideText}>PwdAserial##</Text>
          </View>
          
          <View style={styles.commandGuideItem}>
            <Text style={styles.commandGuideLabel}>Check User:</Text>
            <Text style={styles.commandGuideText}>PwdAserial#</Text>
          </View>
          
          <View style={styles.commandGuideItem}>
            <Text style={styles.commandGuideLabel}>List Multiple Users:</Text>
            <Text style={styles.commandGuideText}>PwdALstart#end#</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper function to format datetime strings
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr || dateTimeStr.length !== 12) return dateTimeStr;
  
  const year = dateTimeStr.substring(0, 4);
  const month = dateTimeStr.substring(4, 6);
  const day = dateTimeStr.substring(6, 8);
  const hour = dateTimeStr.substring(8, 10);
  const minute = dateTimeStr.substring(10, 12);
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

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
  card: {
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeColumn: {
    width: '48%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginHorizontal: spacing.xs,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    marginLeft: spacing.xs,
  },
  controlButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  commandPreviewContainer: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commandLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  commandText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: colors.primary,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serialText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    width: 50,
  },
  userDetails: {
    flex: 1,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  nameText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  timeText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  commandGuideContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.xxl,
  },
  commandGuideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  commandGuideItem: {
    marginBottom: spacing.sm,
  },
  commandGuideLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  commandGuideText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: colors.primary,
  },
});