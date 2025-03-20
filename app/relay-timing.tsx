import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { TextInputField } from './components/TextInputField';
import { colors, spacing } from './styles/theme';

export default function RelayTimingPage() {
  const router = useRouter();
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('');
  const [relaySettings, setRelaySettings] = useState({
    latchTime: '000',  // Relay latch time in seconds (000-999)
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
      if (savedRelaySettings) {
        const settings = JSON.parse(savedRelaySettings);
        setRelaySettings({
          latchTime: settings.latchTime || '000'
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveRelaySettings = async () => {
    try {
      // Get existing relay settings first to preserve other settings
      const savedRelaySettings = await AsyncStorage.getItem('relaySettings');
      let settings = { latchTime: relaySettings.latchTime };
      
      if (savedRelaySettings) {
        const existingSettings = JSON.parse(savedRelaySettings);
        settings = { 
          ...existingSettings, 
          latchTime: relaySettings.latchTime 
        };
      }
      
      await AsyncStorage.setItem('relaySettings', JSON.stringify(settings));
      Alert.alert('Success', 'Relay timing settings saved');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save settings');
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
  
  const handleLatchTimeChange = (text: string) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 3);
    setRelaySettings(prev => ({ ...prev, latchTime: filtered }));
  };
  
  const setLatchTime = async () => {
    const latchTime = relaySettings.latchTime.padStart(3, '0');
    sendSMS(`${password}GOT${latchTime}#`);
    saveRelaySettings();
  };

  return (
    <View style={styles.container}>
      <Header title="Relay Timing Settings" showBack backTo="/setup" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card title="Configure Relay Timing" elevated>
          <View style={styles.infoContainer}>
            <Ionicons name="time-outline" size={24} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Set how long the relay stays active after being triggered by a call. The value ranges from 000 to 999 seconds.
            </Text>
          </View>
          
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>Relay Latch Time (seconds)</Text>
            <Text style={styles.settingHint}>
              Set value between 000-999 seconds
            </Text>
            
            <TextInputField
              value={relaySettings.latchTime}
              onChangeText={handleLatchTimeChange}
              placeholder="Enter time in seconds"
              keyboardType="number-pad"
              maxLength={3}
            />
            
            <View style={styles.recommendedSettings}>
              <Text style={styles.recommendedTitle}>Recommended Settings:</Text>
              <View style={styles.recommendedItem}>
                <Text style={styles.recommendedValue}>000</Text>
                <Text style={styles.recommendedDescription}>
                  For automatic gates (momentary pulse of 0.5 seconds)
                </Text>
              </View>
              <View style={styles.recommendedItem}>
                <Text style={styles.recommendedValue}>001-998</Text>
                <Text style={styles.recommendedDescription}>
                  Relay stays ON for the specified number of seconds
                </Text>
              </View>
              <View style={styles.recommendedItem}>
                <Text style={styles.recommendedValue}>999</Text>
                <Text style={styles.recommendedDescription}>
                  Relay stays ON until next call (toggle mode)
                </Text>
              </View>
            </View>
            
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Command Preview:</Text>
              <Text style={styles.previewText}>{password}GOT{relaySettings.latchTime.padStart(3, '0')}#</Text>
            </View>
            
            <Button
              title="Apply Setting"
              onPress={setLatchTime}
              loading={isLoading}
              icon={<Ionicons name="save-outline" size={20} color="white" />}
              fullWidth
            />
          </View>
        </Card>
        
        <Card title="Understanding Relay Timing" style={styles.infoCard}>
          <View style={styles.timingInfoItem}>
            <View style={styles.timingInfoIcon}>
              <Ionicons name="flash-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.timingInfoContent}>
              <Text style={styles.timingInfoTitle}>Momentary Pulse (000)</Text>
              <Text style={styles.timingInfoText}>
                The relay activates for 0.5 seconds and then turns off automatically. Ideal for automatic gates or garage door openers that only need a momentary signal.
              </Text>
            </View>
          </View>
          
          <View style={styles.timingInfoItem}>
            <View style={styles.timingInfoIcon}>
              <Ionicons name="timer-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.timingInfoContent}>
              <Text style={styles.timingInfoTitle}>Timed Mode (001-998)</Text>
              <Text style={styles.timingInfoText}>
                The relay stays active for the specified number of seconds and then turns off automatically. Useful for timed access control or equipment operation.
              </Text>
            </View>
          </View>
          
          <View style={styles.timingInfoItem}>
            <View style={styles.timingInfoIcon}>
              <Ionicons name="toggle-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.timingInfoContent}>
              <Text style={styles.timingInfoTitle}>Toggle Mode (999)</Text>
              <Text style={styles.timingInfoText}>
                The relay stays ON until the next call comes in. Each call toggles the relay state (ON/OFF). Useful for lighting or equipment that needs to stay on indefinitely.
              </Text>
            </View>
          </View>
          
          <View style={styles.commandInfo}>
            <Text style={styles.commandInfoTitle}>Command Format:</Text>
            <Text style={styles.commandInfoText}>
              {password}GOT<Text style={styles.highlightText}>xxx</Text>#
            </Text>
            <Text style={styles.commandInfoExample}>
              Example: {password}GOT030# (stays ON for 30 seconds)
            </Text>
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
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
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
  settingContainer: {
    marginTop: spacing.sm,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  settingHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  previewContainer: {
    backgroundColor: colors.cardBackground,
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    color: colors.primary,
  },
  infoCard: {
    marginTop: spacing.lg,
  },
  timingInfoItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timingInfoIcon: {
    width: 40,
    alignItems: 'center',
  },
  timingInfoContent: {
    flex: 1,
  },
  timingInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  timingInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recommendedSettings: {
    marginVertical: spacing.md,
    backgroundColor: `${colors.primary}10`,
    padding: spacing.sm,
    borderRadius: 8,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recommendedItem: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'center',
  },
  recommendedValue: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  recommendedDescription: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
  },
  commandInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${colors.border}80`,
  },
  commandInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  commandInfoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 15,
    color: colors.primary,
  },
  commandInfoExample: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  highlightText: {
    fontWeight: 'bold',
    color: colors.error,
  },
});
