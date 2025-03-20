import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, Alert, Platform, Linking, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { colors, spacing } from './styles/theme';

interface NotificationSettings {
  relayOn: {
    admin: boolean;
    caller: boolean;
  };
  relayOff: {
    admin: boolean;
    caller: boolean;
  };
}

export default function NotificationSettingsPage() {
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    relayOn: {
      admin: true,
      caller: true,
    },
    relayOff: {
      admin: false,
      caller: false,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedUnitNumber = await AsyncStorage.getItem('unitNumber');
      const savedPassword = await AsyncStorage.getItem('password');
      const savedNotificationSettings = await AsyncStorage.getItem('notificationSettings');

      if (savedUnitNumber) setUnitNumber(savedUnitNumber);
      if (savedPassword) setPassword(savedPassword);
      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      Alert.alert('Success', 'Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    }
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

  const updateRelayOnSettings = (type: 'admin' | 'caller', value: boolean) => {
    const newSettings = {
      ...notificationSettings,
      relayOn: {
        ...notificationSettings.relayOn,
        [type]: value,
      },
    };
    setNotificationSettings(newSettings);
  };

  const updateRelayOffSettings = (type: 'admin' | 'caller', value: boolean) => {
    const newSettings = {
      ...notificationSettings,
      relayOff: {
        ...notificationSettings.relayOff,
        [type]: value,
      },
    };
    setNotificationSettings(newSettings);
  };

  const applyRelayOnSettings = () => {
    const adminValue = notificationSettings.relayOn.admin ? '1' : '0';
    const callerValue = notificationSettings.relayOn.caller ? '1' : '0';
    const command = `${password}GON${adminValue}${callerValue}#Door Open#`;
    sendSMS(command);
    saveSettings();
  };

  const applyRelayOffSettings = () => {
    const adminValue = notificationSettings.relayOff.admin ? '1' : '0';
    const callerValue = notificationSettings.relayOff.caller ? '1' : '0';
    const command = `${password}GOFF${adminValue}${callerValue}#Door Close#`;
    sendSMS(command);
    saveSettings();
  };

  const disableAllOnNotifications = () => {
    const command = `${password}GON##`;
    sendSMS(command);
    
    // Update local settings to reflect disabled notifications
    const newSettings = {
      ...notificationSettings,
      relayOn: {
        admin: false,
        caller: false,
      },
    };
    setNotificationSettings(newSettings);
    saveSettings();
  };

  const disableAllOffNotifications = () => {
    const command = `${password}GOFF##`;
    sendSMS(command);
    
    // Update local settings to reflect disabled notifications
    const newSettings = {
      ...notificationSettings,
      relayOff: {
        admin: false,
        caller: false,
      },
    };
    setNotificationSettings(newSettings);
    saveSettings();
  };

  const stopRandomSMS = () => {
    const command = `${password}GTEL#`;
    sendSMS(command);
    Alert.alert('Command Sent', 'Request to stop random promotional SMS messages has been sent to the device.');
  };

  return (
    <View style={styles.container}>
      <Header title="Notification Settings" showBack backTo="/setup" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card elevated>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Configure who receives SMS notifications when the relay is activated or deactivated.
            </Text>
          </View>
        </Card>
        
        {/* Stop Random SMS Section */}
        <Card title="Stop Random SMS" style={styles.card}>
          <Text style={styles.sectionDescription}>
            Stop receiving random promotional SMS messages from your Connect4v device:
          </Text>
          
          <View style={styles.commandsContainer}>
            <View style={styles.commandItem}>
              <Text style={styles.commandText}>{password}GTEL#</Text>
              <Text style={styles.commandDescription}>Stops random promotional SMS messages</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.stopSmsButton} 
            onPress={stopRandomSMS}
            activeOpacity={0.7}
          >
            <Ionicons name="ban-outline" size={20} color={colors.white} />
            <Text style={styles.stopSmsButtonText}>Stop Random SMS</Text>
          </TouchableOpacity>
        </Card>
        
        {/* Disable All Notifications section */}
        <Card title="Disable All Notifications" style={styles.card}>
          <Text style={styles.sectionDescription}>
            Turn off all notifications for specific events:
          </Text>
          
          <View style={styles.disableButtonsContainer}>
            <TouchableOpacity 
              style={styles.disableButton} 
              onPress={disableAllOnNotifications}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-off-outline" size={20} color={colors.white} />
              <Text style={styles.disableButtonText}>Disable ON Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.disableButton} 
              onPress={disableAllOffNotifications}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-off-outline" size={20} color={colors.white} />
              <Text style={styles.disableButtonText}>Disable OFF Notifications</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.commandsContainer}>
            <View style={styles.commandItem}>
              <Text style={styles.commandLabel}>Commands:</Text>
              <Text style={styles.commandText}>{password}GON##</Text>
              <Text style={styles.commandDescription}>Disable all ON notifications</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={styles.commandText}>{password}GOFF##</Text>
              <Text style={styles.commandDescription}>Disable all OFF notifications</Text>
            </View>
          </View>
        </Card>
        
        {/* Simplified ON/OFF Notification Settings */}
        <Card title="Relay Notifications" style={styles.card}>
          <View style={styles.notificationSection}>
            <Text style={styles.notificationTitle}>When Relay Turns ON:</Text>
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleTitle}>Admin</Text>
              <Switch
                value={notificationSettings.relayOn.admin}
                onValueChange={(value) => updateRelayOnSettings('admin', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? colors.white : notificationSettings.relayOn.admin ? colors.primary : colors.white}
              />
            </View>
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleTitle}>Caller</Text>
              <Switch
                value={notificationSettings.relayOn.caller}
                onValueChange={(value) => updateRelayOnSettings('caller', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? colors.white : notificationSettings.relayOn.caller ? colors.primary : colors.white}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={applyRelayOnSettings}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.applyButtonText}>Apply {password}GON{notificationSettings.relayOn.admin ? '1' : '0'}{notificationSettings.relayOn.caller ? '1' : '0'}#</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.notificationSection}>
            <Text style={styles.notificationTitle}>When Relay Turns OFF:</Text>
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleTitle}>Admin</Text>
              <Switch
                value={notificationSettings.relayOff.admin}
                onValueChange={(value) => updateRelayOffSettings('admin', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? colors.white : notificationSettings.relayOff.admin ? colors.primary : colors.white}
              />
            </View>
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleTitle}>Caller</Text>
              <Switch
                value={notificationSettings.relayOff.caller}
                onValueChange={(value) => updateRelayOffSettings('caller', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? colors.white : notificationSettings.relayOff.caller ? colors.primary : colors.white}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={applyRelayOffSettings}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.applyButtonText}>Apply {password}GOFF{notificationSettings.relayOff.admin ? '1' : '0'}{notificationSettings.relayOff.caller ? '1' : '0'}#</Text>
            </TouchableOpacity>
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
  card: {
    marginTop: spacing.md,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
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
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  disableButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    flex: 0.48,
  },
  disableButtonText: {
    color: colors.white,
    marginLeft: spacing.xs,
    fontWeight: '500',
    fontSize: 14,
  },
  commandsContainer: {
    backgroundColor: colors.cardBackground,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commandItem: {
    marginBottom: spacing.sm,
  },
  commandLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  commandText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 15,
    color: colors.primary,
    marginBottom: 2,
  },
  commandDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notificationSection: {
    marginVertical: spacing.sm,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  applyButtonText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 14,
  },
  stopSmsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  stopSmsButtonText: {
    color: colors.white,
    marginLeft: spacing.xs,
    fontWeight: '500',
    fontSize: 14,
  },
});
