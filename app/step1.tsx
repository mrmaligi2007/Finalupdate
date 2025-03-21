import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { TextInputField } from './components/TextInputField';
import { colors, spacing, borderRadius } from './styles/theme';

export default function Step1Page() {
  const router = useRouter();
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('1234'); // Default password
  const [adminNumber, setAdminNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Initial load on mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Reload when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log("Step1 page focused - reloading data");
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const savedUnitNumber = await AsyncStorage.getItem('unitNumber');
      const savedPassword = await AsyncStorage.getItem('password');
      const savedAdminNumber = await AsyncStorage.getItem('adminNumber');

      if (savedUnitNumber) setUnitNumber(savedUnitNumber);
      if (savedPassword) setPassword(savedPassword);
      if (savedAdminNumber) setAdminNumber(savedAdminNumber);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveToLocalStorage = async () => {
    try {
      await AsyncStorage.setItem('unitNumber', unitNumber);
      await AsyncStorage.setItem('password', password);
      if (adminNumber) {
        await AsyncStorage.setItem('adminNumber', adminNumber);
      }
      
      // Mark step as completed
      const savedCompletedSteps = await AsyncStorage.getItem('completedSteps');
      let completedSteps = savedCompletedSteps ? JSON.parse(savedCompletedSteps) : [];
      
      if (!completedSteps.includes('step1')) {
        completedSteps.push('step1');
        await AsyncStorage.setItem('completedSteps', JSON.stringify(completedSteps));
      }
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const sendSMS = async (command: string) => {
    if (!unitNumber) {
      Alert.alert('Error', 'Please enter the Connect4v number first');
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
        return;
      }

      await Linking.openURL(smsUrl);
      await saveToLocalStorage();
      
      // Add a delay to allow SMS to be sent
      setTimeout(() => {
        Alert.alert(
          'Success', 
          'Command sent and settings saved. The app will now refresh your data.',
          [{ 
            text: 'OK', 
            onPress: () => {
              // First reload data locally
              loadData();
              // Then navigate back to setup page which will refresh data
              router.push('/setup');
            } 
          }]
        );
      }, 500);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      Alert.alert('Error', 'Failed to open SMS app');
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
      cleaned = cleaned.substring(1); // Remove the leading 0
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
  
  const setAdminNumberHandler = () => {
    if (!adminNumber) {
      Alert.alert('Error', 'Please enter the admin phone number');
      return;
    }
    
    if (!unitNumber) {
      Alert.alert('Error', 'Please enter the Connect4v phone number');
      return;
    }
    
    // Format unit number according to required format (not admin number)
    const formattedUnitNumber = formatAdminNumber(unitNumber);
    
    // Update state with formatted number
    setAdminNumber(adminNumber); // Keep admin number as is in state
    
    // Format command for setting admin number - use unit's formatted number as the target
    const command = `${password}TEL${formattedUnitNumber}#`;
    
    // Add feedback before sending
    Alert.alert(
      'Sending Command',
      'The app will now open your SMS app to send the command. After sending, please return to the app to complete setup.',
      [{ text: 'Continue', onPress: () => sendSMS(command) }]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Initial Setup" showBack backTo="/setup" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card title="Device Configuration">
          <TextInputField
            label="Connect4v Phone Number"
            value={unitNumber}
            onChangeText={setUnitNumber}
            placeholder="Enter device phone number"
            keyboardType="phone-pad"
            autoComplete="tel"
            containerStyle={styles.inputContainer}
          />
          
          <TextInputField
            label="Device Password"
            value={password}
            onChangeText={(text) => {
              const filtered = text.replace(/[^0-9]/g, '').slice(0, 4);
              setPassword(filtered);
            }}
            placeholder="Default: 1234"
            keyboardType="number-pad"
            maxLength={4}
            containerStyle={styles.inputContainer}
          />
          
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Admin Number</Text>
            
            <TextInputField
              label="Admin Phone Number"
              value={adminNumber}
              onChangeText={setAdminNumber}
              placeholder="Enter mobile number (e.g., 0461234567)"
              keyboardType="phone-pad"
              containerStyle={styles.inputContainer}
            />
            
            <Text style={styles.helpText}>
              Will be formatted as 0061XXXXXXXX
            </Text>
            
            <View style={styles.commandPreviewContainer}>
              <Text style={styles.commandLabel}>Command:</Text>
              <Text style={styles.commandText}>
                {password}TEL{formatAdminNumber(unitNumber) || 'xxxxxxxx'}#
              </Text>
            </View>
            
            <Button
              title="Set Admin Number"
              onPress={setAdminNumberHandler}
              loading={isLoading}
              disabled={!adminNumber || !unitNumber || password.length !== 4}
              fullWidth
              icon={<Ionicons name="person-circle-outline" size={20} color="white" />}
            />
          </View>
        </Card>
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
  inputContainer: {
    marginBottom: spacing.md,
  },
  adminSection: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  commandPreviewContainer: {
    backgroundColor: colors.cardBackground,
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commandLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  commandText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});
