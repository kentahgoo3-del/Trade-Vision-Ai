import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { HomeIcon, AnalyzeIcon, WatchlistIcon, JournalIcon, ChatIcon, SettingsIcon } from '@/components/TabIcon';

export default function TabLayout() {
  const colors = useColors();
  const { resolvedScheme } = useTheme();
  const isDark = resolvedScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : undefined,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} size={24} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: 'Analyze',
          tabBarIcon: ({ color, focused }) => (
            <AnalyzeIcon color={color} size={24} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color, focused }) => (
            <WatchlistIcon color={color} size={24} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, focused }) => (
            <JournalIcon color={color} size={24} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color, focused }) => (
            <ChatIcon color={color} size={24} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <SettingsIcon color={color} size={24} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
