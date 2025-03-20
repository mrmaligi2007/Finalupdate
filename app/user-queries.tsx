import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Alert, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { colors, spacing } from './styles/theme';
import { useRouter } from 'expo-router';

export default function UserQueriesPage() {
  const router = useRouter();
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Query state
  const [serialNumber, setSerialNumber] = useState('');
  const [startSerial, setStartSerial] = useState('');
  const [endSerial, setEndSerial] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedUnitNumber = await AsyncStorage.getItem('unitNumber');
      const savedPassword = await AsyncStorage.getItem('password');

      if (savedUnitNumber) setUnitNumber(savedUnitNumber);
      if (savedPassword) setPassword(savedPassword);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const sendSMS = async (command: string) => {
    if (!unitNumber) {
      Alert.alert('Error', 'GSM relay number not set. Please configure in Device Settings first.');
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

  const queryUser = () => {
    if (!serialNumber) {
      Alert.alert('Error', 'Please enter a serial number to query');
      return;
    }
    
    // Format serial to 3 digits
    const formattedSerial = serialNumber.padStart(3, '0');
    sendSMS(`${password}A${formattedSerial}#`);
  };

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
    
    sendSMS(`${password}A${formattedStart}#${formattedEnd}#`);
  };

  return (
    <View style={styles.container}>
      <Header title="User Queries" showBack backTo="/setup" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card elevated>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Query user information directly from your GSM device. The response will come as an SMS to your phone.
            </Text>
          </View>
        </Card>
        
        <Card title="Query Single User">
          <View style={styles.formGroup}>
            <Text style={styles.label}>Serial Number (001-200)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                value={serialNumber}
                onChangeText={setSerialNumber}
                placeholder="Enter position (001-200)"
                keyboardType="number-pad"
                maxLength={3}
              />
              <Button
                title="Query"
                onPress={queryUser}
                loading={isLoading && serialNumber}
                style={{width: 100}}
                disabled={!serialNumber}
              />
            </View>
          </View>
          
          <View style={styles.commandPreviewContainer}>
            <Text style={styles.commandLabel}>Command Preview:</Text>
            <Text style={styles.commandText}>
              {password}A{serialNumber.padStart(3, '0') || '001'}#
            </Text>
          </View>
        </Card>
        
        <Card title="Query Batch Users">
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Serial</Text>
            <TextInput
              style={styles.input}
              value={startSerial}
              onChangeText={setStartSerial}
              placeholder="Start position (001-200)"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Serial</Text>
            <TextInput
              style={styles.input}
              value={endSerial}
              onChangeText={setEndSerial}
              placeholder="End position (001-200)"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          
          <View style={styles.commandPreviewContainer}>
            <Text style={styles.commandLabel}>Command Preview:</Text>
            <Text style={styles.commandText}>
              {password}A{startSerial.padStart(3, '0') || '001'}#{endSerial.padStart(3, '0') || '010'}#
            </Text>
          </View>
          
          <Button
            title="Query Batch"
            onPress={queryBatchUsers}
            loading={isLoading && startSerial && endSerial}
            icon={<Ionicons name="search-outline" size={20} color="white" />}
            fullWidth
            disabled={!startSerial || !endSerial}
          />
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  infoIcon: {
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    marginBottom: spacing.xs,
    fontWeight: '500',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commandPreviewContainer: {
    backgroundColor: colors.primaryLight + '15',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  commandLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  commandText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.primary,
  },
});
