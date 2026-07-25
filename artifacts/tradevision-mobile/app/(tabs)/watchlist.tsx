import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { EmptyState } from '@/components/EmptyState';
import {
  useListWatchlist,
  useAddWatchlistItem,
  useRemoveWatchlistItem,
  useUpdateWatchlistItem,
  getListWatchlistQueryKey,
  getGetPortfolioSummaryQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

const CATEGORIES = ['crypto', 'forex', 'stocks', 'commodities', 'indices'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  crypto: '#F59E0B',
  forex: '#3B82F6',
  stocks: '#8B5CF6',
  commodities: '#10B981',
  indices: '#EC4899',
};

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: items, isLoading } = useListWatchlist();
  const { mutateAsync: addItem } = useAddWatchlistItem();
  const { mutateAsync: removeItem } = useRemoveWatchlistItem();
  const { mutateAsync: updateItem } = useUpdateWatchlistItem();

  const [showModal, setShowModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('crypto');
  const [newNotes, setNewNotes] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [adding, setAdding] = useState(false);

  // Inline target-price edit
  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [editTargetValue, setEditTargetValue] = useState('');

  const handleAdd = async () => {
    if (!newSymbol.trim()) return;
    setAdding(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await addItem({
        data: {
          symbol: newSymbol.trim().toUpperCase(),
          name: newName.trim() || undefined,
          category: newCategory,
          notes: newNotes.trim() || undefined,
          targetPrice: newTargetPrice.trim() || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() });
      setShowModal(false);
      setNewSymbol(''); setNewName(''); setNewNotes(''); setNewTargetPrice('');
    } catch {
      Alert.alert('Error', 'Could not add item.');
    } finally {
      setAdding(false);
    }
  };

  const handleSaveTarget = async (id: number) => {
    try {
      await updateItem({ id, data: { targetPrice: editTargetValue.trim() || undefined } });
      queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
    } catch {
      Alert.alert('Error', 'Could not update target price.');
    } finally {
      setEditTargetId(null);
      setEditTargetValue('');
    }
  };

  const handleRemove = (id: number, symbol: string) => {
    Alert.alert('Remove', `Remove ${symbol} from watchlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await removeItem({ id });
          queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() });
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Watchlist</Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {items?.length ?? 0} symbols tracked
            </Text>
          </View>
          <Pressable
            onPress={() => setShowModal(true)}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
          >
            <Icon name="add" size={22} color={colors.primaryForeground} />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !items?.length ? (
          <View style={{ height: 300 }}>
            <EmptyState
              icon="eye-outline"
              title="Watchlist is empty"
              subtitle="Add symbols to track markets you're interested in"
            />
          </View>
        ) : (
          items.map((item) => {
            const catColor = CATEGORY_COLORS[item.category as Category] ?? colors.primary;
            return (
              <View
                key={item.id}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.catDot, { backgroundColor: catColor + '30' }]}>
                  <View style={[styles.catDotInner, { backgroundColor: catColor }]} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowSymbol, { color: colors.foreground }]}>{item.symbol}</Text>
                  <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                    {item.name ? `${item.name} · ` : ''}{item.category}
                    {item.notes ? ` · ${item.notes}` : ''}
                  </Text>
                  {/* Inline target price editor */}
                  {editTargetId === item.id ? (
                    <View style={styles.targetEditRow}>
                      <TextInput
                        style={[styles.targetInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
                        value={editTargetValue}
                        onChangeText={setEditTargetValue}
                        placeholder="e.g. 42000"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="decimal-pad"
                        autoFocus
                        onSubmitEditing={() => handleSaveTarget(item.id)}
                      />
                      <Pressable onPress={() => handleSaveTarget(item.id)}
                        style={[styles.targetSaveBtn, { backgroundColor: colors.primary }]}>
                        <Icon name="checkmark" size={14} color={colors.primaryForeground} />
                      </Pressable>
                      <Pressable onPress={() => setEditTargetId(null)} hitSlop={8}>
                        <Icon name="close" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => { setEditTargetId(item.id); setEditTargetValue(item.targetPrice ?? ''); }}
                      style={styles.targetBadgeTap}
                    >
                      {item.targetPrice ? (
                        <View style={[styles.targetBadge, { backgroundColor: colors.gold + '20', borderColor: colors.gold + '50' }]}>
                          <Icon name="flag-outline" size={11} color={colors.gold} />
                          <Text style={[styles.targetText, { color: colors.gold }]}>Target: {item.targetPrice}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.targetEmpty, { color: colors.mutedForeground }]}>+ Set target price</Text>
                      )}
                    </Pressable>
                  )}
                </View>
                <View style={[styles.catBadge, { backgroundColor: catColor + '20' }]}>
                  <Text style={[styles.catLabel, { color: catColor }]}>
                    {item.category.toUpperCase()}
                  </Text>
                </View>
                <Pressable onPress={() => handleRemove(item.id, item.symbol)} hitSlop={10}>
                  <Icon name="trash-outline" size={18} color={colors.destructive} />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Symbol</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Icon name="close" size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Symbol *</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              value={newSymbol}
              onChangeText={setNewSymbol}
              placeholder="e.g. BTC, AAPL, EUR/USD"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Bitcoin, Apple, Euro/Dollar"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {CATEGORIES.map((cat) => {
                const c = CATEGORY_COLORS[cat];
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setNewCategory(cat)}
                    style={[styles.catChip, { backgroundColor: newCategory === cat ? c : colors.secondary, borderColor: newCategory === cat ? c : colors.border }]}
                  >
                    <Text style={[styles.catChipText, { color: newCategory === cat ? '#fff' : colors.foreground }]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Target Price</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              value={newTargetPrice}
              onChangeText={setNewTargetPrice}
              placeholder="e.g. 42000 (optional)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              value={newNotes}
              onChangeText={setNewNotes}
              placeholder="Optional notes"
              placeholderTextColor={colors.mutedForeground}
            />

            <Pressable
              onPress={handleAdd}
              disabled={!newSymbol.trim() || adding}
              style={({ pressed }) => [styles.addConfirmBtn, { backgroundColor: colors.primary, opacity: pressed || adding ? 0.8 : 1 }]}
            >
              {adding ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : null}
              <Text style={[styles.addConfirmText, { color: colors.primaryForeground }]}>
                {adding ? 'Adding…' : 'Add to Watchlist'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  count: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  targetEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  targetInput: { flex: 1, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, fontFamily: 'Inter_400Regular' },
  targetSaveBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  targetBadgeTap: { marginTop: 4 },
  targetBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
  targetText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  targetEmpty: { fontSize: 11, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  catDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  catDotInner: { width: 10, height: 10, borderRadius: 5 },
  rowInfo: { flex: 1 },
  rowSymbol: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  rowMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  catLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: -4 },
  fieldInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  catRow: { marginBottom: 0 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  catChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  addConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  addConfirmText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
