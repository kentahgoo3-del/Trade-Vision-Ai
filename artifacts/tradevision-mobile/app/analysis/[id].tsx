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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { TrendBadge } from '@/components/TrendBadge';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { PatternChip } from '@/components/PatternChip';
import {
  useGetAnalysis,
  useDeleteAnalysis,
  getListAnalysesQueryKey,
  getListRecentAnalysesQueryKey,
  getGetPortfolioSummaryQueryKey,
  getGetAnalysisStatsQueryKey,
} from '@workspace/api-client-react';

function InfoRow({ label, value, valueColor }: { label: string; value: string | null | undefined; valueColor?: string }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: analysis, isLoading } = useGetAnalysis(Number(id));
  const { mutateAsync: deleteAnalysis } = useDeleteAnalysis();

  const handleDelete = () => {
    Alert.alert('Delete Analysis', 'Remove this analysis?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteAnalysis({ id: Number(id) });
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListRecentAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
          router.back();
        },
      },
    ]);
  };

  const parseJsonArray = (s: string | null | undefined): string[] => {
    if (!s) return [];
    try { return JSON.parse(s) as string[]; } catch { return [s]; }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading analysis…</Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Analysis not found</Text>
      </View>
    );
  }

  const patterns = parseJsonArray(analysis.patterns as unknown as string | null);
  const strengths = parseJsonArray(analysis.strengths as unknown as string | null);
  const weaknesses = parseJsonArray(analysis.weaknesses as unknown as string | null);
  const risks = parseJsonArray(analysis.risks as unknown as string | null);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Nav */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Ionicons name="trash-outline" size={22} color={colors.destructive} />
        </Pressable>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.symbol, { color: colors.foreground }]}>
          {analysis.symbol ?? 'Chart Analysis'}
        </Text>
        {analysis.timeframe ? (
          <Text style={[styles.tf, { color: colors.mutedForeground, backgroundColor: colors.muted }]}>
            {analysis.timeframe}
          </Text>
        ) : null}
        {analysis.trend ? <TrendBadge trend={analysis.trend} /> : null}
      </View>

      {analysis.explanation ? (
        <Text style={[styles.explanation, { color: colors.mutedForeground }]}>
          {analysis.explanation}
        </Text>
      ) : null}

      {/* Confidence */}
      {analysis.confidence != null && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ConfidenceMeter confidence={analysis.confidence} label={analysis.confidenceLabel} />
        </View>
      )}

      {/* Patterns */}
      {patterns.length > 0 && (
        <Section title="Detected Patterns">
          <View style={styles.chipRow}>
            {patterns.map((p, i) => <PatternChip key={i} pattern={p} />)}
          </View>
        </Section>
      )}

      {/* Trade Setup */}
      {(analysis.tradeDirection || analysis.entryPrice) && (
        <Section title="Trade Setup">
          <InfoRow
            label="Direction"
            value={analysis.tradeDirection?.toUpperCase()}
            valueColor={analysis.tradeDirection === 'long' ? colors.bullish : analysis.tradeDirection === 'short' ? colors.bearish : colors.neutral}
          />
          <InfoRow label="Entry Zone" value={analysis.entryPrice} />
          <InfoRow label="Stop Loss" value={analysis.stopLoss} valueColor={colors.bearish} />
          <InfoRow label="Target 1" value={analysis.takeProfit1} valueColor={colors.bullish} />
          <InfoRow label="Target 2" value={analysis.takeProfit2} valueColor={colors.bullish} />
          <InfoRow label="Target 3" value={analysis.takeProfit3} valueColor={colors.bullish} />
          <InfoRow label="Risk:Reward" value={analysis.riskReward} valueColor={colors.gold} />
          <InfoRow label="Invalidation" value={analysis.invalidationLevel} valueColor={colors.bearish} />
        </Section>
      )}

      {/* Market Structure */}
      {(analysis.supportLevels || analysis.resistanceLevels || analysis.indicators) && (
        <Section title="Market Structure">
          <InfoRow label="Support" value={analysis.supportLevels} valueColor={colors.bullish} />
          <InfoRow label="Resistance" value={analysis.resistanceLevels} valueColor={colors.bearish} />
          <InfoRow label="Indicators" value={analysis.indicators} />
        </Section>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <Section title="Strengths">
          {strengths.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.bullish} />
              <Text style={[styles.bulletText, { color: colors.foreground }]}>{s}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Weaknesses & Risks */}
      {(weaknesses.length > 0 || risks.length > 0) && (
        <Section title="Risks & Weaknesses">
          {weaknesses.map((w, i) => (
            <View key={`w${i}`} style={styles.bulletRow}>
              <Ionicons name="alert-circle" size={16} color={colors.gold} />
              <Text style={[styles.bulletText, { color: colors.foreground }]}>{w}</Text>
            </View>
          ))}
          {risks.map((r, i) => (
            <View key={`r${i}`} style={styles.bulletRow}>
              <Ionicons name="warning" size={16} color={colors.bearish} />
              <Text style={[styles.bulletText, { color: colors.foreground }]}>{r}</Text>
            </View>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  symbol: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  tf: { fontSize: 13, fontFamily: 'Inter_500Medium', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  explanation: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  infoValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'right', flex: 1, marginLeft: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
