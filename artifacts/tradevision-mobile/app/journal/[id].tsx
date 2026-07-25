import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import {
  useGetJournalEntry,
  useDeleteJournalEntry,
  getListJournalEntriesQueryKey,
  getGetJournalStatsQueryKey,
  getGetPortfolioSummaryQueryKey,
} from '@workspace/api-client-react';

function Row({ label, value, valueColor }: { label: string; value: string | null | undefined; valueColor?: string }) {
  const colors = useColors();
  if (value === null || value === undefined) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: entry, isLoading } = useGetJournalEntry(Number(id));
  const { mutateAsync: deleteEntry } = useDeleteJournalEntry();

  const handleDelete = () => {
    Alert.alert('Delete', 'Remove this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteEntry({ id: Number(id) });
          queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetJournalStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() });
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Entry not found</Text>
      </View>
    );
  }

  const outcomeColor =
    entry.outcome === 'win' ? colors.bullish :
    entry.outcome === 'loss' ? colors.bearish :
    entry.outcome === 'breakeven' ? colors.gold :
    colors.neutral;

  const dirColor = entry.direction === 'long' ? colors.bullish : colors.bearish;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Icon name="trash-outline" size={22} color={colors.destructive} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={[styles.symbol, { color: colors.foreground }]}>{entry.symbol}</Text>
        <View style={[styles.dirBadge, { backgroundColor: dirColor + '20' }]}>
          <Icon name={entry.direction === 'long' ? 'trending-up' : 'trending-down'} size={14} color={dirColor} />
          <Text style={[styles.dirText, { color: dirColor }]}>{entry.direction === 'long' ? 'LONG' : 'SHORT'}</Text>
        </View>
        {entry.outcome ? (
          <View style={[styles.outcomeBadge, { backgroundColor: outcomeColor + '20', borderColor: outcomeColor + '40' }]}>
            <Text style={[styles.outcomeText, { color: outcomeColor }]}>{entry.outcome.toUpperCase()}</Text>
          </View>
        ) : (
          <View style={[styles.outcomeBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.outcomeText, { color: colors.mutedForeground }]}>OPEN</Text>
          </View>
        )}
      </View>

      {entry.pnl != null && (
        <Text style={[styles.pnl, { color: entry.pnl >= 0 ? colors.bullish : colors.bearish }]}>
          {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
        </Text>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Row label="Entry Price" value={String(entry.entryPrice)} />
        <Row label="Exit Price" value={entry.exitPrice != null ? String(entry.exitPrice) : null} />
        <Row label="Stop Loss" value={entry.stopLoss != null ? String(entry.stopLoss) : null} valueColor={colors.bearish} />
        <Row label="Take Profit" value={entry.takeProfit != null ? String(entry.takeProfit) : null} valueColor={colors.bullish} />
        <Row label="Position Size" value={entry.positionSize != null ? String(entry.positionSize) : null} />
        <Row label="Risk:Reward" value={entry.riskReward != null ? `1:${entry.riskReward}` : null} valueColor={colors.gold} />
        <Row label="Strategy" value={entry.strategy} />
        <Row label="Trade Date" value={new Date(entry.tradeDate).toLocaleDateString()} />
      </View>

      {entry.notes ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.notesTitle, { color: colors.foreground }]}>Notes</Text>
          <Text style={[styles.notesText, { color: colors.mutedForeground }]}>{entry.notes}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  symbol: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  dirBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dirText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  outcomeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  outcomeText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  pnl: { fontSize: 36, fontFamily: 'Inter_700Bold' },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  infoValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  notesTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  notesText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
