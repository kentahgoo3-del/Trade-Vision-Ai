import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { JournalCard } from '@/components/JournalCard';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { useListJournalEntries, useGetJournalStats } from '@workspace/api-client-react';

type Filter = 'all' | 'win' | 'loss' | 'open';

export default function JournalScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: entries, isLoading } = useListJournalEntries();
  const { data: stats } = useGetJournalStats();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = entries?.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'open') return e.outcome === null || e.outcome === undefined;
    return e.outcome === filter;
  }) ?? [];

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'win', label: 'Wins' },
    { key: 'loss', label: 'Losses' },
    { key: 'open', label: 'Open' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Trade Journal</Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {entries?.length ?? 0} trades logged
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/journal/new')}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
          >
            <Icon name="add" size={22} color={colors.primaryForeground} />
          </Pressable>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <StatCard
              label="Win Rate"
              value={`${stats.winRate}%`}
              sub={`${stats.winCount}W / ${stats.lossCount}L`}
              accent={stats.winRate >= 50 ? 'bullish' : 'bearish'}
            />
            <StatCard
              label="Total P&L"
              value={`$${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(0)}`}
              accent={stats.totalPnl >= 0 ? 'bullish' : 'bearish'}
            />
          </View>
        )}

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.secondary,
                  borderColor: filter === f.key ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !filtered.length ? (
          <View style={{ height: 250 }}>
            <EmptyState
              icon="book-outline"
              title={filter === 'all' ? 'No trades logged' : `No ${filter} trades`}
              subtitle={filter === 'all' ? 'Log your first trade to start tracking performance' : 'Try a different filter'}
            />
          </View>
        ) : (
          filtered.map((e) => (
            <JournalCard
              key={e.id}
              entry={e}
              onPress={() => router.push(`/journal/${e.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  count: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  filterRow: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
