import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { TextInputField } from '../components/TextInputField';
import { Button } from '../components/Button';
import { colors, spacing, shadows, borderRadius } from '../styles/theme';
import { LogoHeader } from '../components/LogoHeader';

type SetupOption = {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
};

export default function SetupPage() {
  const router = useRouter();
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('');
  const [relaySettings, setRelaySettings] = useState({
    accessControl: 'AUT',  // AUT (only authorized) or ALL (anyone can control)
    latchTime: '000',      // Relay latch time in seconds (000-999)
  });
  const [isLoading, setIsLoading] = useState(false);

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

  const setupOptions: SetupOption[] = [
    {
      id: 'device',
      title: 'Device Configuration',
      description: 'Set up your GSM opener device',
      icon: 'settings-outline',
      route: '/step1'
    },
    {
      id: 'password',
      title: 'Security Settings',
      description: 'Update default device password',
      icon: 'key-outline',
      route: '/step2'
    },
    {
      id: 'timing',
      title: 'Relay Timing Settings',
      description: 'Configure how long relay stays active',
      icon: 'timer-outline',
      route: '/relay-timing'
    },
    {
      id: 'users',
      title: 'Access Control',
      description: 'Manage authorized phone numbers',
      icon: 'people-outline',
      route: '/step4'
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Configure SMS notifications',
      icon: 'notifications-outline',
      route: '/notification-settings'
    }
  ];

  const navigateToOption = (option: SetupOption) => {
    if (option.id !== 'device' && !unitNumber) {
      Alert.alert(
        'Setup Required',
        'Please configure your device number first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    router.push(option.route);
  };
  
  const sendSMS = async (command: string) => {
    if (!unitNumber) {
      Alert.alert('Error', 'GSM relay number not set. Please configure device first.');
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
  
  const handleLatchTimeChange = (text: string) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 3);
    setRelaySettings(prev => ({ ...prev, latchTime: filtered }));
  };
  
  const setLatchTime = async () => {
    const latchTime = relaySettings.latchTime.padStart(3, '0');
    sendSMS(`${password}GOT${latchTime}#`);
    
    try {
      await AsyncStorage.setItem('relaySettings', JSON.stringify(relaySettings));
      Alert.alert('Success', 'Relay timing settings saved');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <View style={styles.container}>
      {/* Replace Header with LogoHeader */}
      <LogoHeader />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.deviceCard}>
          <View style={styles.deviceInfoContainer}>
            <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
            <Text style={styles.deviceInfoLabel}>Device Number:</Text>
            <Text style={styles.deviceInfoValue}>{unitNumber || 'Not configured'}</Text>
          </View>
        </Card>
        
        <Text style={styles.sectionTitle}>Setup Options</Text>
        
        <View style={styles.optionsContainer}>
          {setupOptions.map((option) => (
            <TouchableOpacity 
              key={option.id}
              onPress={() => navigateToOption(option)}
              style={styles.optionContainer}
            >
              <Card style={styles.optionCard}>
                <View style={styles.optionContent}>
                  <View style={styles.optionIconContainer}>
                    <Ionicons 
                      name={option.icon as any}
                      size={24} 
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <StatusBar style="auto" />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  deviceCard: {
    marginBottom: spacing.md,
  },
  deviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  deviceInfoLabel: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
  },
  deviceInfoValue: {
    marginLeft: spacing.xs,
    fontWeight: '500',
    color: colors.text,
    fontSize: 14,
  },
  optionsContainer: {
    marginTop: spacing.xs,
  },
  optionContainer: {
    marginBottom: spacing.sm,
  },
  optionCard: {
    padding: spacing.sm,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  latchTimeContainer: {
    marginTop: spacing.sm,
  },
  latchTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  latchTimeHelp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  latchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commandPreviewContainer: {
    backgroundColor: colors.cardBackground,
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commandLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  commandText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: colors.primary,
  },
});