import React from 'react';
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
} from '@workspace/api-client-react';

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetPortfolioSummary();
  const { data: recent, isLoading: recentLoading, refetch: refetchRecent } = useListRecentAnalyses();

  const isLoading = summaryLoading || recentLoading;
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchRecent()]);
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginTop: 2 },
  analyzeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  analyzeBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  seeAll: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
