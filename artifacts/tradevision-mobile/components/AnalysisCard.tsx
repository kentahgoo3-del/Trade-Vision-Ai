import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { TrendBadge } from './TrendBadge';
import { ConfidenceMeter } from './ConfidenceMeter';
import type { Analysis } from '@workspace/api-client-react';

interface Props {
  analysis: Analysis;
  onPress?: () => void;
}

export function AnalysisCard({ analysis, onPress }: Props) {
  const colors = useColors();

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>
            {analysis.symbol ?? 'CHART'}
          </Text>
          {analysis.timeframe ? (
            <Text style={[styles.tf, { color: colors.mutedForeground, backgroundColor: colors.muted }]}>
              {analysis.timeframe}
            </Text>
          ) : null}
          {analysis.status === 'complete' ? <TrendBadge trend={analysis.trend} size="sm" /> : null}
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(analysis.createdAt)}</Text>
      </View>

      {analysis.status === 'complete' && (
        <>
          {analysis.explanation ? (
            <Text style={[styles.explanation, { color: colors.mutedForeground }]} numberOfLines={2}>
              {analysis.explanation}
            </Text>
          ) : null}
          <ConfidenceMeter confidence={analysis.confidence} label={analysis.confidenceLabel} />
          {analysis.tradeDirection && analysis.tradeDirection !== 'wait' ? (
            <View style={styles.tradeRow}>
              <Ionicons
                name={analysis.tradeDirection === 'long' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={14}
                color={analysis.tradeDirection === 'long' ? colors.bullish : colors.bearish}
              />
              <Text style={[styles.tradeText, { color: analysis.tradeDirection === 'long' ? colors.bullish : colors.bearish }]}>
                {analysis.tradeDirection === 'long' ? 'LONG' : 'SHORT'} · Entry: {analysis.entryPrice} · RR: {analysis.riskReward}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {analysis.status === 'pending' && (
        <Text style={[styles.pending, { color: colors.gold }]}>⚡ Analyzing…</Text>
      )}

      {analysis.status === 'error' && (
        <Text style={[styles.pending, { color: colors.bearish }]}>Analysis failed</Text>
      )}

      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.mutedForeground}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  symbol: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  tf: { fontSize: 11, fontFamily: 'Inter_500Medium', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  explanation: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  tradeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tradeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  pending: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  chevron: { position: 'absolute', right: 16, bottom: 16 },
});
