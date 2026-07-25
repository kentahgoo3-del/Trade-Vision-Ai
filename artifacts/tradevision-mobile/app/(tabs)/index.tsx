import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { StatCard } from '@/components/StatCard';
import { AnalysisCard } from '@/components/AnalysisCard';
import { EmptyState } from '@/components/EmptyState';
import {
  useGetPortfolioSummary,
  useListRecentAnalyses,
  useGetAnalysisStats,
} from '@workspace/api-client-react';

// ── Market Sessions ────────────────────────────────────────────────────────────
const SESSIONS = [
  { name: 'Sydney',   openH: 21, closeH: 6,  flag: '🇦🇺', color: '#8B5CF6' },
  { name: 'Tokyo',    openH: 0,  closeH: 9,  flag: '🇯🇵', color: '#F59E0B' },
  { name: 'London',   openH: 7,  closeH: 16, flag: '🇬🇧', color: '#3B82F6' },
  { name: 'New York', openH: 12, closeH: 21, flag: '🇺🇸', color: '#10B981' },
] as const;

function isSessionOpen(h: number, openH: number, closeH: number) {
  if (openH < closeH) return h >= openH && h < closeH;
  return h >= openH || h < closeH; // crosses midnight
}

function minsToOpen(h: number, m: number, openH: number) {
  const now = h * 60 + m;
  const target = openH * 60;
  return target > now ? target - now : 24 * 60 - now + target;
}

function formatMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function MarketSessionsWidget() {
  const colors = useColors();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();

  const openSessions = SESSIONS.filter((s) => isSessionOpen(utcH, s.openH, s.closeH));
  const nextSession = openSessions.length < SESSIONS.length
    ? SESSIONS.filter((s) => !isSessionOpen(utcH, s.openH, s.closeH))
        .map((s) => ({ ...s, mins: minsToOpen(utcH, utcM, s.openH) }))
        .sort((a, b) => a.mins - b.mins)[0]
    : null;

  return (
    <View style={[mwStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={mwStyles.header}>
        <Text style={[mwStyles.title, { color: colors.foreground }]}>Market Sessions</Text>
        <Text style={[mwStyles.utc, { color: colors.mutedForeground }]}>
          {String(utcH).padStart(2, '0')}:{String(utcM).padStart(2, '0')} UTC
        </Text>
      </View>
      <View style={mwStyles.sessions}>
        {SESSIONS.map((s) => {
          const open = isSessionOpen(utcH, s.openH, s.closeH);
          return (
            <View key={s.name} style={[mwStyles.session, {
              backgroundColor: open ? s.color + '20' : colors.secondary,
              borderColor: open ? s.color + '60' : colors.border,
            }]}>
              <Text style={mwStyles.flag}>{s.flag}</Text>
              <Text style={[mwStyles.sessionName, { color: open ? s.color : colors.mutedForeground }]} numberOfLines={1}>
                {s.name}
              </Text>
              <View style={[mwStyles.dot, { backgroundColor: open ? s.color : colors.muted }]} />
            </View>
          );
        })}
      </View>
      {nextSession && (
        <Text style={[mwStyles.next, { color: colors.mutedForeground }]}>
          {nextSession.flag} {nextSession.name} opens in {formatMins(nextSession.mins)}
        </Text>
      )}
      {openSessions.length === SESSIONS.length && (
        <Text style={[mwStyles.next, { color: colors.bullish }]}>All sessions active</Text>
      )}
    </View>
  );
}

const mwStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  utc: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  sessions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  session: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 8, alignItems: 'center', gap: 4 },
  flag: { fontSize: 16 },
  sessionName: { fontSize: 9, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  next: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetPortfolioSummary();
  const { data: recent, isLoading: recentLoading, refetch: refetchRecent } = useListRecentAnalyses();
  const { data: stats, refetch: refetchStats } = useGetAnalysisStats();

  const isLoading = summaryLoading || recentLoading;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchRecent(), refetchStats()]);
    setRefreshing(false);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>TradeVision AI Pro</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Dashboard</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/analyze')}
          style={({ pressed }) => [styles.analyzeBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>+ Analyze</Text>
        </Pressable>
      </View>

      {/* Market Sessions */}
      <MarketSessionsWidget />

      {/* Stats Grid */}
      {summaryLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard
              label="Total P&L"
              value={summary ? `$${summary.totalPnl >= 0 ? '+' : ''}${summary.totalPnl.toFixed(0)}` : '--'}
              accent={summary && summary.totalPnl >= 0 ? 'bullish' : 'bearish'}
            />
            <StatCard
              label="Win Rate"
              value={summary ? `${summary.winRate}%` : '--'}
              sub={summary ? `${summary.totalTrades} trades` : undefined}
              accent="primary"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Avg R:R"
              value={summary ? `1:${summary.avgRiskReward.toFixed(1)}` : '--'}
              accent="gold"
            />
            <StatCard
              label="AI Analyses"
              value={summary ? String(summary.totalAnalyses) : '--'}
              sub={summary ? `${summary.watchlistCount} watching` : undefined}
              accent="neutral"
            />
          </View>

          {/* AI Performance Row */}
          {stats && (stats.aiAccuracyRate !== null || stats.currentWinStreak > 0 || stats.avgScore !== null) && (
            <View style={styles.statsRow}>
              {stats.aiAccuracyRate !== null && (
                <StatCard
                  label="AI Accuracy"
                  value={`${stats.aiAccuracyRate}%`}
                  sub={`${stats.wonCount}W / ${stats.lostCount}L`}
                  accent="bullish"
                />
              )}
              {stats.currentWinStreak > 0 && (
                <StatCard
                  label="Win Streak"
                  value={`${stats.currentWinStreak}🔥`}
                  sub="consecutive wins"
                  accent="gold"
                />
              )}
              {stats.avgScore !== null && stats.aiAccuracyRate === null && (
                <StatCard
                  label="Avg AI Score"
                  value={`${stats.avgScore}/100`}
                  sub={stats.bestScore ? `Best: ${stats.bestScore}` : undefined}
                  accent="primary"
                />
              )}
            </View>
          )}

          {/* Setup Breakdown */}
          {stats && stats.setupBreakdown.length > 0 && (
            <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.setupTitle, { color: colors.foreground }]}>Setup Performance</Text>
              {(stats.setupBreakdown as { setupType: string; count: number; avgScore: number | null }[])
                .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
                .map((s) => (
                  <View key={s.setupType} style={styles.setupRow}>
                    <Text style={[styles.setupName, { color: colors.foreground }]}>{s.setupType}</Text>
                    <Text style={[styles.setupCount, { color: colors.mutedForeground }]}>{s.count} trade{s.count !== 1 ? 's' : ''}</Text>
                    {s.avgScore !== null && (
                      <Text style={[styles.setupScore, { color: s.avgScore >= 75 ? colors.bullish : s.avgScore >= 60 ? colors.gold : colors.bearish }]}>
                        {s.avgScore}/100
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          )}
        </>
      )}

      {/* Recent Analyses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Analyses</Text>
          <Pressable onPress={() => router.push('/(tabs)/analyze')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </Pressable>
        </View>

        {recentLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : !recent?.length ? (
          <EmptyState
            icon="bar-chart-outline"
            title="No analyses yet"
            subtitle="Upload a chart to get your first AI analysis"
          />
        ) : (
          recent.map((a) => (
            <AnalysisCard
              key={a.id}
              analysis={a}
              onPress={() => router.push(`/analysis/${a.id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginTop: 2 },
  analyzeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  analyzeBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  setupCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  setupTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  setupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  setupName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  setupCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  setupScore: { fontSize: 13, fontFamily: 'Inter_700Bold', minWidth: 52, textAlign: 'right' },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  seeAll: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
