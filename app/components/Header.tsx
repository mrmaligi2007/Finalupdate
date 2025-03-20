import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { colors, shadows } from '../styles/theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  backTo = '/',
  rightAction,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (backTo) {
      router.push(backTo as any);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {showBack ? (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      
      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingTop: 60, // Increased from 50
    paddingBottom: 16, // Increased from 12
    paddingHorizontal: 20, // Increased from 16
    ...shadows.sm,
  },
  backButton: {
    padding: 10, // Increased from 8
    marginRight: 8,
    borderRadius: 24, // Increased radius
  },
  title: {
    fontSize: 22, // Increased from 18
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 48, // Increased from 40
  },
  rightAction: {
    width: 48, // Increased from 40
    alignItems: 'flex-end',
  },
});

// Add default export for expo-router compatibility
export default Header;