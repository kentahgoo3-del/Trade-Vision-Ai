import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { Tabs, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeIcon, AnalyzeIcon, WatchlistIcon, JournalIcon, ChatIcon, SettingsIcon } from '@/components/TabIcon';

const LAST_TAB_KEY = '@tradevision:last_active_tab';
const VALID_TABS = ['index', 'analyze', 'watchlist', 'journal', 'chat', 'settings'] as const;
type TabName = typeof VALID_TABS[number];

export default function TabLayout() {
  const colors = useColors();
  const { resolvedScheme } = useTheme();
  const isDark = resolvedScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const didRestoreTab = useRef(false);

  // Restore last active tab on first mount
  useEffect(() => {
    if (didRestoreTab.current) return;
    didRestoreTab.current = true;

    AsyncStorage.getItem(LAST_TAB_KEY)
      .then((val) => {
        if (val && VALID_TABS.includes(val as TabName) && val !== 'index') {
          // Navigate to the stored tab; 'index' is home and needs no redirect
          router.replace(`/(tabs)/${val}` as any);
        }
      })
      .catch(() => {
        // Ignore read errors — fall back to Home
      });
  }, []);

  return (
    <Tabs
      screenListeners={{
        focus: (e) => {
          // e.target is a route key like "analyze-abc123"; the name is the prefix before the first '-'
          const tabName = e.target?.split('-')[0];
          if (tabName && VALID_TABS.includes(tabName as TabName)) {
            AsyncStorage.setItem(LAST_TAB_KEY, tabName).catch(() => {});
          }
        },
      }}
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
