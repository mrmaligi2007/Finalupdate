import { Platform, Linking, Alert } from 'react-native';

// Function to send an SMS with the given command to the specified number
export const sendSMS = async (
  command: string,
  unitNumber: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
) => {
  try {
    if (!unitNumber) {
      Alert.alert('Error', 'Connect4v number not set. Please configure in Settings first.');
      return false;
    }

    // Format the phone number according to platform requirements
    const formattedUnitNumber = Platform.OS === 'ios' ? unitNumber.replace('+', '') : unitNumber;

    // Create the appropriate SMS URL for the platform
    const smsUrl = Platform.select({
      ios: `sms:${formattedUnitNumber}&body=${encodeURIComponent(command)}`,
      android: `sms:${formattedUnitNumber}?body=${encodeURIComponent(command)}`,
      default: `sms:${formattedUnitNumber}?body=${encodeURIComponent(command)}`,
    });

    // Check if SMS functionality is available
    const supported = await Linking.canOpenURL(smsUrl);
    
    if (!supported) {
      Alert.alert(
        'Error',
        'SMS is not available on this device. Please ensure an SMS app is installed.'
      );
      if (onError) onError(new Error('SMS not supported'));
      return false;
    }

    // Open the SMS app with the pre-filled message
    await Linking.openURL(smsUrl);
    if (onSuccess) onSuccess();
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    Alert.alert(
      'Error',
      'Failed to open SMS. Please try again.'
    );
    if (onError) onError(error instanceof Error ? error : new Error('Failed to send SMS'));
    return false;
  }
};

// Format admin phone number to ensure it has 0061 prefix (for Australian numbers)
export const formatPhoneNumber = (number: string): string => {
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

// Collection of SMS utilities
const SMSUtils = {
  sendSMS,
  formatPhoneNumber
};

// Default export for expo-router compatibility
export default SMSUtils;
