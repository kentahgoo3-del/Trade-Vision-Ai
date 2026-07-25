import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const STORAGE_KEY = '@tradevision:checklist_v1';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  isDefault: boolean;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'd1', label: 'Trend is clearly identified on higher timeframe', isDefault: true },
  { id: 'd2', label: 'Setup pattern is confirmed (not speculative)', isDefault: true },
  { id: 'd3', label: 'Volume supports the move', isDefault: true },
  { id: 'd4', label: 'Risk:Reward is at least 1:2', isDefault: true },
  { id: 'd5', label: 'Entry is within an active trading session', isDefault: true },
  { id: 'd6', label: 'No major news events in the next 2 hours', isDefault: true },
  { id: 'd7', label: 'Position size calculated and risk % set', isDefault: true },
  { id: 'd8', label: 'Stop loss level identified and placed', isDefault: true },
  { id: 'd9', label: 'Take profit targets defined (TP1, TP2)', isDefault: true },
  { id: 'd10', label: 'Invalidation level noted', isDefault: true },
];

function loadDefault(): ChecklistItem[] {
  return DEFAULT_ITEMS.map((d) => ({ ...d, checked: false }));
}

export default function ChecklistScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [items, setItems] = useState<ChecklistItem[]>(loadDefault());
  const [newLabel, setNewLabel] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  // Load persisted state
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as ChecklistItem[];
        setItems(saved);
      } catch {}
    });
  }, []);

  const persist = useCallback((updated: ChecklistItem[]) => {
    setItems(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const toggle = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    persist(items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const addItem = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const newItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      label,
      checked: false,
      isDefault: false,
    };
    persist([...items, newItem]);
    setNewLabel('');
    setShowAddInput(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const removeItem = (id: string) => {
    Alert.alert('Remove Item', 'Remove this checklist item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => persist(items.filter((i) => i.id !== id)) },
    ]);
  };

  const resetAll = () => {
    Alert.alert('Reset Checklist', 'Uncheck all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => persist(items.map((i) => ({ ...i, checked: false }))) },
    ]);
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const total = items.length;
  const allPassed = checkedCount === total;
  const readinessColor = allPassed ? colors.bullish : checkedCount >= total * 0.8 ? colors.gold : colors.bearish;
  const readinessLabel = allPassed ? 'Ready to Trade' : checkedCount >= total * 0.8 ? 'Almost Ready' : 'Not Ready';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}
            style={[styles.backBtn, { borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Pre-Trade Checklist</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Complete before every trade</Text>
          </View>
          <Pressable onPress={resetAll} hitSlop={12}>
            <Text style={[styles.resetText, { color: colors.mutedForeground }]}>Reset</Text>
          </Pressable>
        </View>

        {/* Readiness Score */}
        <View style={[styles.scoreCard, { backgroundColor: readinessColor + '15', borderColor: readinessColor + '40' }]}>
          <View style={styles.scoreLeft}>
            <Text style={[styles.scoreNumber, { color: readinessColor }]}>{checkedCount}/{total}</Text>
            <Text style={[styles.scoreLabel, { color: readinessColor }]}>{readinessLabel}</Text>
          </View>
          <View style={styles.scoreRight}>
            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, {
                backgroundColor: readinessColor,
                width: `${total > 0 ? (checkedCount / total) * 100 : 0}%` as `${number}%`,
              }]} />
            </View>
            <Text style={[styles.progressPct, { color: colors.mutedForeground }]}>
              {total > 0 ? Math.round((checkedCount / total) * 100) : 0}% complete
            </Text>
          </View>
        </View>

        {/* Checklist Items */}
        <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <Pressable
                style={styles.row}
                onPress={() => toggle(item.id)}
                onLongPress={() => !item.isDefault && removeItem(item.id)}
              >
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: item.checked ? colors.bullish : 'transparent',
                    borderColor: item.checked ? colors.bullish : colors.border,
                  }
                ]}>
                  {item.checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[
                  styles.rowLabel,
                  {
                    color: item.checked ? colors.mutedForeground : colors.foreground,
                    textDecorationLine: item.checked ? 'line-through' : 'none',
                  }
                ]} numberOfLines={2}>
                  {item.label}
                </Text>
                {!item.isDefault && (
                  <Pressable onPress={() => removeItem(item.id)} hitSlop={10}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </Pressable>
            </View>
          ))}
        </View>

        {/* Add custom item */}
        {showAddInput ? (
          <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.addInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="e.g. Check correlation with DXY"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <View style={styles.addButtons}>
              <Pressable onPress={() => { setShowAddInput(false); setNewLabel(''); }}
                style={[styles.addCancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.addCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addItem} disabled={!newLabel.trim()}
                style={({ pressed }) => [styles.addConfirmBtn, { backgroundColor: colors.primary, opacity: pressed || !newLabel.trim() ? 0.6 : 1 }]}>
                <Text style={[styles.addConfirmText, { color: colors.primaryForeground }]}>Add</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowAddInput(true)}
            style={({ pressed }) => [styles.addItemBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.addItemText, { color: colors.primary }]}>Add Custom Item</Text>
          </Pressable>
        )}

        {/* Hint */}
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Long-press a custom item to remove it. Your progress is saved automatically.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  resetText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  scoreCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreLeft: { alignItems: 'center', minWidth: 56 },
  scoreNumber: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  scoreLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2, letterSpacing: 0.3 },
  scoreRight: { flex: 1, gap: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressPct: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  listCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  divider: { height: 1, marginHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  addCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  addInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addButtons: { flexDirection: 'row', gap: 10 },
  addCancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  addCancelText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  addConfirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addConfirmText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 14 },
  addItemText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 16, lineHeight: 18 },
});
