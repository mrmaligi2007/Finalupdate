import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.disabled,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: 'white',
          height: 75, // Increased from 60
          paddingBottom: 10, // Increased from 5
          paddingTop: 8, // Added top padding
        },
        tabBarLabelStyle: {
          fontSize: 13, // Increased from 12
          fontWeight: '500',
          marginTop: 2, // Added to improve layout with larger icons
        },
        tabBarIconStyle: {
          marginBottom: -2, // Adjust position of icon
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size + 4} /> // Increased icon size
          ),
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          title: 'Setup',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" color={color} size={size + 4} /> // Increased icon size
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size + 4} /> // Increased icon size
          ),
        }}
      />
    </Tabs>
  );
}