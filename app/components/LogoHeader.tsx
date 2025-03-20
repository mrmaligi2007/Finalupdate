import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { Logo } from './Logo';

interface LogoHeaderProps {
  showBack?: boolean;
  backTo?: string;
}

export function LogoHeader({ showBack = false, backTo = "/" }: LogoHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backTo) {
      router.push(backTo as any);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Logo />
      </View>
      
      {showBack && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 50, // Increased to match Header component
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    position: 'relative',
    height: 100, // Make the header taller
  },
  logoContainer: {
    alignItems: 'flex-start', // Align to the left
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    right: spacing.md,
    top: 50,
    padding: 8,
    borderRadius: 24,
  },
});

export default LogoHeader;
