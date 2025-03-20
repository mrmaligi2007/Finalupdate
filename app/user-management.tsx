import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Linking, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { colors, spacing } from './styles/theme';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';

// User interface for authorized users
interface AuthorizedUser {
  serial: string;
  phone: string;
  name?: string;
  startTime?: string; // Optional time restriction (YYMMDDHHMM)
  endTime?: string;   // Optional time restriction (YYMMDDHHMM)
}

export default function UserManagementPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [unitNumber, setUnitNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [newUser, setNewUser] = useState({
    serial: '',
    phone: '',
    name: '',
    startTime: '',
    endTime: '',
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'list'
  
  const initialLoadDone = useRef(false);

  // Date picker state
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDateType, setSelectedDateType] = useState<'start' | 'end'>('start');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Years, months, days for pickers
  const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() + i);
  const months = [
    {value: '01', label: 'January'},
    {value: '02', label: 'February'},
    {value: '03', label: 'March'},
    {value: '04', label: 'April'},
    {value: '05', label: 'May'},
    {value: '06', label: 'June'},
    {value: '07', label: 'July'},
    {value: '08', label: 'August'},
    {value: '09', label: 'September'},
    {value: '10', label: 'October'},
    {value: '11', label: 'November'},
    {value: '12', label: 'December'},
  ];
  
  // Generate days 01-31
  const days = Array.from({length: 31}, (_, i) => {
    const num = i + 1;
    return {value: num < 10 ? `0${num}` : `${num}`, label: `${num}`};
  });
  
  // Generate hours 00-23
  const hours = Array.from({length: 24}, (_, i) => {
    const num = i;
    return {value: num < 10 ? `0${num}` : `${num}`, label: `${num}:00`};
  });
  
  // Generate minutes 00-59 (in 5-minute increments for simplicity)
  const minutes = Array.from({length: 12}, (_, i) => {
    const num = i * 5;
    return {value: num < 10 ? `0${num}` : `${num}`, label: `:${num < 10 ? `0${num}` : num}`};
  });

  // Only load data when component first mounts
  useEffect(() => {
    loadData();
  }, []);

  // Focus effect for contact handling
  useFocusEffect(
    React.useCallback(() => {
      if (params.contactPhone && params.contactName && params.timestamp) {
        setNewUser({
          ...newUser,
          phone: params.contactPhone as string,
          name: params.contactName as string
        });
        setActiveTab('add');
        
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
      const savedUsers = await AsyncStorage.getItem('authorizedUsers');

      if (savedUnitNumber) setUnitNumber(savedUnitNumber);
      if (savedPassword) setPassword(savedPassword);
      if (savedUsers) setUsers(JSON.parse(savedUsers));
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    initialLoadDone.current = true;
  };

  const saveUsers = async (updatedUsers: AuthorizedUser[]) => {
    try {
      await AsyncStorage.setItem('authorizedUsers', JSON.stringify(updatedUsers));
      console.log('Users saved to storage');
    } catch (error) {
      console.error('Error saving users:', error);
      Alert.alert('Error', 'Failed to save users to storage');
    }
  };

  const sendSMS = async (command: string) => {
    setIsLoading(true);
    
    try {
      // Format the unit number for SMS (remove spaces, dashes, etc.)
      const formattedUnitNumber = unitNumber.replace(/[^0-9]/g, '');
      
      // Set up SMS URL based on platform
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
    
    // Validate time format if provided
    if ((newUser.startTime && !newUser.endTime) || (!newUser.startTime && newUser.endTime)) {
      Alert.alert('Error', 'Both start time and end time must be provided if using time restrictions');
      return;
    }
    
    if (newUser.startTime && newUser.endTime) {
      // Validate time format (YYMMDDHHMM)
      const timeRegex = /^\d{10}$/;
      if (!timeRegex.test(newUser.startTime) || !timeRegex.test(newUser.endTime)) {
        Alert.alert('Error', 'Time format must be YYMMDDHHMM (e.g., 2409051000)');
        return;
      }
    }
    
    // Format serial to 3 digits
    const formattedSerial = newUser.serial.padStart(3, '0');
    
    // Check if serial already exists
    const existingUserIndex = users.findIndex(user => user.serial === formattedSerial);
    
    // Update or add user
    if (existingUserIndex >= 0) {
      const updatedUsers = [...users];
      updatedUsers[existingUserIndex] = {
        ...newUser,
        serial: formattedSerial
      };
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
    } else {
      const updatedUsers = [
        ...users,
        {
          ...newUser,
          serial: formattedSerial
        }
      ];
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
    }
    
    // Build command
    let command = `${password}A${formattedSerial}#${newUser.phone}#`;
    
    // Add time restrictions if provided
    if (newUser.startTime && newUser.endTime) {
      command += `${newUser.startTime}#${newUser.endTime}#`;
    }
    
    // Send command to device
    sendSMS(command);
    
    // Reset form
    setNewUser({
      serial: '',
      phone: '',
      name: '',
      startTime: '',
      endTime: '',
    });
    
    // Switch to the list tab to show the updated list
    setActiveTab('list');
  };

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
            
            // Update local state
            const updatedUsers = users.filter(user => user.serial !== serial);
            setUsers(updatedUsers);
            saveUsers(updatedUsers);
          }
        }
      ]
    );
  };

  // Functions for contact picker
  const pickContact = () => {
    router.push('/contact-picker?returnTo=/user-management');
  };

  // Helper function to format datetime for display
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr || dateTimeStr.length !== 10) return dateTimeStr;
    
    try {
      const year = "20" + dateTimeStr.substring(0, 2);
      const month = dateTimeStr.substring(2, 4);
      const day = dateTimeStr.substring(4, 6);
      const hour = dateTimeStr.substring(6, 8);
      const minute = dateTimeStr.substring(8, 10);
      
      return `${day}/${month}/${year} ${hour}:${minute}`;
    } catch (error) {
      return dateTimeStr;
    }
  };

  // Function to open date picker
  const openDatePicker = (type: 'start' | 'end') => {
    setSelectedDateType(type);
    
    // If there's already a date set, parse it
    let date = new Date();
    
    const timeStr = type === 'start' ? newUser.startTime : newUser.endTime;
    if (timeStr && timeStr.length === 10) {
      try {
        const year = 2000 + parseInt(timeStr.substring(0, 2));
        const month = parseInt(timeStr.substring(2, 4)) - 1; // 0-based months
        const day = parseInt(timeStr.substring(4, 6));
        const hour = parseInt(timeStr.substring(6, 8));
        const minute = parseInt(timeStr.substring(8, 10));
        
        date = new Date(year, month, day, hour, minute);
      } catch (error) {
        console.error('Failed to parse date:', error);
      }
    }
    
    setSelectedDate(date);
    setDatePickerVisible(true);
  };
  
  // Function to handle date selection
  const handleDateSelection = (year: string, month: string, day: string, hour: string, minute: string) => {
    // Format as YYMMDDHHMM (10 digits)
    const shortYear = year.substring(2, 4); // Get only the last 2 digits of the year
    const formattedDate = `${shortYear}${month}${day}${hour}${minute}`;
    
    if (selectedDateType === 'start') {
      setNewUser(prev => ({...prev, startTime: formattedDate}));
    } else {
      setNewUser(prev => ({...prev, endTime: formattedDate}));
    }
    
    setDatePickerVisible(false);
  };
  
  // Function to clear date restriction
  const clearDateRestriction = () => {
    setNewUser(prev => ({...prev, startTime: '', endTime: ''}));
  };

  // UI Components
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'add' && styles.activeTab]}
        onPress={() => setActiveTab('add')}
      >
        <Ionicons 
          name="person-add-outline" 
          size={20} 
          color={activeTab === 'add' ? colors.primary : colors.textSecondary} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'add' && styles.activeTabText
        ]}>Add User</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'list' && styles.activeTab]}
        onPress={() => setActiveTab('list')}
      >
        <Ionicons 
          name="people-outline" 
          size={20} 
          color={activeTab === 'list' ? colors.primary : colors.textSecondary} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'list' && styles.activeTabText
        ]}>User List</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddUserTab = () => (
    <Card title="Add Authorized User">
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
            style={styles.contactPickerButton}
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
      
      <View style={styles.timeRestrictionContainer}>
        <Text style={styles.sectionLabel}>Time Restrictions (Optional)</Text>
        <Text style={styles.helperText}>
          Specify when this user can access the device. Leave empty for unrestricted access.
        </Text>
        
        <View style={styles.timeRow}>
          <View style={styles.timeColumn}>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity 
              style={styles.datePickerButton} 
              onPress={() => openDatePicker('start')}
            >
              <Text style={styles.datePickerText}>
                {newUser.startTime 
                  ? formatDateTime(newUser.startTime) 
                  : 'Select start date & time'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.helperText}>Format: YYMMDDHHMM</Text>
            <Text style={styles.helperText}>Example: 2409051000 (Sep 5, 2024 10:00AM)</Text>
          </View>
          
          <View style={styles.timeColumn}>
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => openDatePicker('end')}
            >
              <Text style={styles.datePickerText}>
                {newUser.endTime 
                  ? formatDateTime(newUser.endTime) 
                  : 'Select end date & time'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.helperText}>Format: YYMMDDHHMM</Text>
            <Text style={styles.helperText}>Example: 2409051000 (Sep 5, 2024 10:00AM)</Text>
          </View>
        </View>
        
        {(newUser.startTime || newUser.endTime) && (
          <TouchableOpacity 
            style={styles.clearDatesButton}
            onPress={clearDateRestriction}
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.error} />
            <Text style={styles.clearDatesText}>Clear Time Restrictions</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.commandPreviewContainer}>
        <Text style={styles.commandLabel}>Command Preview:</Text>
        <Text style={styles.commandText}>
          {password}A{newUser.serial.padStart(3, '0') || '001'}#{newUser.phone || 'xxxxxxxxxx'}#
          {newUser.startTime && newUser.endTime ? `${newUser.startTime}#${newUser.endTime}#` : ''}
        </Text>
      </View>
      
      <Button
        title="Add User"
        onPress={addUser}
        loading={isLoading === true}
        icon={<Ionicons name="person-add-outline" size={20} color="white" />}
        fullWidth
        disabled={!newUser.serial || !newUser.phone}
      />
    </Card>
  );

  const renderUserListTab = () => (
    <Card title="Authorized Users">
      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No authorized users added yet.</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setActiveTab('add')}
          >
            <Text style={styles.emptyButtonText}>Add a user</Text>
          </TouchableOpacity>
        </View>
      ) : (
        users.map((user, index) => (
          <View key={user.serial} style={[
            styles.userItem,
            index < users.length - 1 && styles.userItemBorder
          ]}>
            <View style={styles.userInfo}>
              <View style={styles.userSerialContainer}>
                <Text style={styles.userSerial}>{user.serial}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name || `User ${user.serial}`}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
                {user.startTime && user.endTime && (
                  <Text style={styles.userTimeRestriction}>
                    Access: {formatDateTime(user.startTime)} - {formatDateTime(user.endTime)}
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
    </Card>
  );

  // Date Time Picker Modal Component
  const renderDatePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={datePickerVisible}
      onRequestClose={() => setDatePickerVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDateType === 'start' ? 'Select Start Time' : 'Select End Time'}
            </Text>
            <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.picker}>
                  {years.map(year => (
                    <TouchableOpacity 
                      key={year} 
                      style={[
                        styles.pickerItem,
                        selectedDate.getFullYear() === year && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setFullYear(year);
                        setSelectedDate(newDate);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDate.getFullYear() === year && styles.pickerItemTextSelected
                      ]}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.picker}>
                  {months.map(month => (
                    <TouchableOpacity 
                      key={month.value} 
                      style={[
                        styles.pickerItem,
                        selectedDate.getMonth() + 1 === parseInt(month.value) && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(parseInt(month.value) - 1);
                        setSelectedDate(newDate);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDate.getMonth() + 1 === parseInt(month.value) && styles.pickerItemTextSelected
                      ]}>{month.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.picker}>
                  {days.map(day => (
                    <TouchableOpacity 
                      key={day.value} 
                      style={[
                        styles.pickerItem,
                        selectedDate.getDate() === parseInt(day.value) && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(parseInt(day.value));
                        setSelectedDate(newDate);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDate.getDate() === parseInt(day.value) && styles.pickerItemTextSelected
                      ]}>{day.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Hour Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView style={styles.picker}>
                  {hours.map(hour => (
                    <TouchableOpacity 
                      key={hour.value} 
                      style={[
                        styles.pickerItem,
                        selectedDate.getHours() === parseInt(hour.value) && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setHours(parseInt(hour.value));
                        setSelectedDate(newDate);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDate.getHours() === parseInt(hour.value) && styles.pickerItemTextSelected
                      ]}>{hour.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Minute Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Min</Text>
                <ScrollView style={styles.picker}>
                  {minutes.map(minute => (
                    <TouchableOpacity 
                      key={minute.value} 
                      style={[
                        styles.pickerItem,
                        Math.floor(selectedDate.getMinutes() / 5) * 5 === parseInt(minute.value) && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMinutes(parseInt(minute.value));
                        setSelectedDate(newDate);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        Math.floor(selectedDate.getMinutes() / 5) * 5 === parseInt(minute.value) && styles.pickerItemTextSelected
                      ]}>{minute.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
          
          <Button
            title="Confirm"
            onPress={() => {
              const year = selectedDate.getFullYear().toString();
              const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
              const day = selectedDate.getDate().toString().padStart(2, '0');
              const hour = selectedDate.getHours().toString().padStart(2, '0');
              const minute = Math.floor(selectedDate.getMinutes() / 5) * 5;
              const minuteStr = minute.toString().padStart(2, '0');
              
              handleDateSelection(year, month, day, hour, minuteStr);
            }}
            loading={false}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="User Management" showBack backTo="/step4" />
      
      {renderTabBar()}
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'add' && renderAddUserTab()}
        {activeTab === 'list' && renderUserListTab()}
      </ScrollView>
      
      {renderDatePickerModal()}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
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
  contactPickerButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primaryLight + '30',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  userItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userSerialContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.errorLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRestrictionContainer: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  timeColumn: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  userTimeRestriction: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  datePickerButton: {
    flexDirection: 'row',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  clearDatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  clearDatesText: {
    color: colors.error,
    fontSize: 14,
    marginLeft: spacing.xxs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  pickerColumn: {
    marginRight: spacing.md,
    width: 100,
  },
  pickerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  picker: {
    height: 200,
  },
  pickerItem: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: colors.primaryLight + '30',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
