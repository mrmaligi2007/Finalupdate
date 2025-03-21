import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, Linking, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors, spacing, shadows } from '../styles/theme';
import { LogoHeader } from '../components/LogoHeader';
import { useFocusEffect } from 'expo-router';

export default function HomePage() {
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<{ action: string; timestamp: Date } | null>(null);

  // Initial load on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Reload settings when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("Home page focused - reloading settings");
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const storedUnitNumber = await AsyncStorage.getItem('unitNumber');
      const storedPassword = await AsyncStorage.getItem('password');

      if (storedUnitNumber) setUnitNumber(storedUnitNumber);
      if (storedPassword) setPassword(storedPassword);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const sendSMS = async (command: string) => {
    if (!unitNumber || !password) {
      Alert.alert(
        'Missing Information',
        'Please set up your device number and password in settings first.',
        [{ text: 'OK' }]
      );
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
        Alert.alert(
          'Error',
          'SMS is not available on this device. Please ensure an SMS app is installed.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Linking.openURL(smsUrl);
      
      // Record last action
      setLastAction({
        action: getActionName(command),
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
      Alert.alert(
        'Error',
        'Failed to open SMS. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getActionName = (command: string) => {
    if (command.includes('CC')) return 'Turn On Relay';
    if (command.includes('P')) return 'Change Password';
    if (command.includes('DD')) return 'Turn Off Relay';
    if (command.includes('EE')) return 'Check Status';
    return 'Command';
  };

  const turnRelayOn = () => sendSMS(`${password}CC`);
  const turnRelayOff = () => sendSMS(`${password}DD`);
  const checkStatus = () => sendSMS(`${password}EE`);

  // Keep only the email function, remove handlePhonePress
  const handleEmailPress = async () => {
    const email = 'support@automotionplus.com.au';
    const url = `mailto:${email}`;
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot open email app', 'Your device doesn\'t support opening the email app automatically.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Logo Header */}
      <LogoHeader />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Quick Actions Card */}
        <Card title="Quick Actions" elevated>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={turnRelayOn}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="power" size={28} color="white" />
              </View>
              <Text style={styles.actionText}>Open Gate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={turnRelayOff}>
              <View style={[styles.iconContainer, { backgroundColor: colors.error }]}>
                <Ionicons name="close-circle" size={28} color="white" />
              </View>
              <Text style={styles.actionText}>Close Gate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={checkStatus}>
              <View style={[styles.iconContainer, { backgroundColor: colors.warning }]}>
                <Ionicons name="information-circle" size={28} color="white" />
              </View>
              <Text style={styles.actionText}>Check Status</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Status Card */}
        <Card title="Device Status" subtitle="Information about your Connect4v">
          <View style={styles.statusRow}>
            <Ionicons name="call" size={20} color={colors.text.secondary} />
            <Text style={styles.statusLabel}>Phone Number:</Text>
            <Text style={styles.statusValue}>{unitNumber || 'Not set'}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Ionicons name="time" size={20} color={colors.text.secondary} />
            <Text style={styles.statusLabel}>Last Action:</Text>
            <Text style={styles.statusValue}>
              {lastAction 
                ? `${lastAction.action} at ${lastAction.timestamp.toLocaleTimeString()}`
                : 'No recent activity'}
            </Text>
          </View>
        </Card>

        {/* Help Card - Redesigned for better appearance */}
        <Card title="Need Help?">
          <View style={styles.helpContainer}>
            <View style={styles.helpIconContainer}>
              <Ionicons name="help-buoy" size={32} color={colors.primary} />
            </View>
            <Text style={styles.helpText}>
              Having trouble with your Connect4v? Our support team is ready to assist you.
            </Text>
          </View>
          
          <View style={styles.contactMethodsContainer}>
            <TouchableOpacity 
              style={styles.emailButton}
              onPress={handleEmailPress}
            >
              <Ionicons name="mail" size={24} color="white" />
              <Text style={styles.emailButtonText}>Email Support</Text>
            </TouchableOpacity>
          
            <View style={styles.contactInfoContainer}>
              <View style={styles.contactInfoItem}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <Text style={styles.contactInfoLabel}>Email:</Text>
                <Text style={styles.contactInfoValue}>support@automotionplus.com.au</Text>
              </View>
              
              <View style={styles.contactInfoItem}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <Text style={styles.contactInfoLabel}>Phone:</Text>
                <Text style={styles.contactInfoValue}>1 800 694 283</Text>
              </View>
              
              <Text style={styles.supportNote}>Technical Support: Press 3</Text>
            </View>
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
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.sm,
  },
  actionText: {
    fontSize: 14,
    color: colors.text.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 8,
    width: 120,
  },
  statusValue: {
    fontSize: 16,
    color: colors.text.secondary,
    flex: 1,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  helpIconContainer: {
    marginRight: spacing.md,
  },
  helpText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  contactMethodsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  emailButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
    paddingVertical: 12,
    width: '100%',
    ...shadows.sm,
  },
  emailButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  contactInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactInfoLabel: {
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  contactInfoValue: {
    color: colors.text.secondary,
    flex: 1,
  },
  supportNote: {
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
