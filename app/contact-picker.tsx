import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './components/Header';
import { colors, spacing } from './styles/theme';

type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
};

export default function ContactPickerPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const returnTo = params.returnTo as string || '/step3';

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        if (data.length > 0) {
          const contactsList: Contact[] = [];
          
          data.forEach(contact => {
            if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
              contact.phoneNumbers.forEach(phone => {
                if (phone.number) {
                  contactsList.push({
                    id: `${contact.id}-${phone.id}`,
                    name: contact.name || 'Unknown',
                    phoneNumber: phone.number,
                  });
                }
              });
            }
          });
          
          setContacts(contactsList);
          setFilteredContacts(contactsList);
        }
      } else {
        Alert.alert('Permission Denied', 'Please grant permission to access contacts');
      }
      
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = contacts.filter(
        contact => 
          contact.name.toLowerCase().includes(search.toLowerCase()) ||
          contact.phoneNumber.includes(search)
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [search, contacts]);

  const handleSelect = (contact: Contact) => {
    // Clean phone number - remove spaces, dashes, parentheses
    const cleanedNumber = contact.phoneNumber.replace(/[\s\(\)\-]/g, '');
    
    // Add timestamp to force update of params in receiving screen
    router.push({
      pathname: returnTo,
      params: { 
        contactPhone: cleanedNumber, 
        contactName: contact.name,
        timestamp: Date.now().toString()
      }
    });
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.contactIcon}>
        <Ionicons name="person" size={24} color={colors.white} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Select Contact" showBack backTo={returnTo} />
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={search}
          onChangeText={setSearch}
          clearButtonMode="always"
        />
      </View>
      
      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="people" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No contacts found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  contactPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
