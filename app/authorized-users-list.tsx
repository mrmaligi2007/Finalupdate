import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './components/Header';
import { useFocusEffect } from 'expo-router';

export default function AuthorizedUsersList() {
  const [authorizedUsers, setAuthorizedUsers] = useState([]);

  const loadAuthorizedUsers = async () => {
    try {
      const savedUsers = await AsyncStorage.getItem('authorizedUsers');
      if (savedUsers) {
        setAuthorizedUsers(JSON.parse(savedUsers));
      }
    } catch (error) {
      console.error('Error loading authorized users', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAuthorizedUsers();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header title="Authorized Users List" />
      <ScrollView style={styles.content}>
        {authorizedUsers.length === 0 ? (
          <Text style={styles.noUserText}>No authorized users found.</Text>
        ) : (
          authorizedUsers.map((user, index) => (
            <View key={index} style={styles.userCard}>
              <Text style={styles.userTitle}>User {user.serial}</Text>
              <Text style={styles.userDetail}>Phone: {user.phone || 'N/A'}</Text>
              {user.startTime && user.endTime && (
                <Text style={styles.userDetail}>
                  Access Time: {user.startTime} to {user.endTime}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 16,
  },
  noUserText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  userCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  userTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 16,
    color: '#333',
  },
});
