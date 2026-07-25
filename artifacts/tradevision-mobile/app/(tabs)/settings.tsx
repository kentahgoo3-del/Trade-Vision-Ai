import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext';
import { Icon } from '@/components/Icon';

const THEME_OPTIONS: { value: ThemePreference; label: string; description: string; icon: string }[] = [
  { value: 'system', label: 'System',  description: 'Follow your device setting', icon: 'smartphone' },
  { value: 'light',  label: 'Light',   description: 'Always use the light theme',  icon: 'sun' },
  { value: 'dark',   label: 'Dark',    description: 'Always use the dark theme',   icon: 'moon' },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { preference, setPreference } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 16,
            paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Manage your app preferences
          </Text>
        </View>

        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="palette" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>App Theme</Text>
          </View>

          {THEME_OPTIONS.map((option, index) => {
            const isSelected = preference === option.value;
            const isLast = index === THEME_OPTIONS.length - 1;
            return (
              <View key={option.value}>
                <Pressable
                  onPress={() => setPreference(option.value)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    isSelected && { backgroundColor: colors.primary + '12' },
                    pressed && { opacity: 0.75 },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={option.label}
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.muted }]}>
                    <Icon name={option.icon as any} size={16} color={isSelected ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: isSelected ? colors.primary : colors.foreground }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                      {option.description}
                    </Text>
                  </View>
                  <View style={[
                    styles.radio,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}>
                    {isSelected && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </Pressable>
                {!isLast && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* App info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            TradeVision AI Pro
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: { gap: 4, paddingBottom: 8 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular' },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 12,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  optionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },

  footer: { alignItems: 'center', paddingTop: 8 },
  footerText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
