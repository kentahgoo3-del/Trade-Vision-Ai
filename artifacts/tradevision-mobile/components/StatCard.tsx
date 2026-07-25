import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: 'primary' | 'gold' | 'bullish' | 'bearish' | 'neutral';
}

export function StatCard({ label, value, sub, accent = 'primary' }: Props) {
  const colors = useColors();

  const accentColor =
    accent === 'gold' ? colors.gold :
    accent === 'bullish' ? colors.bullish :
    accent === 'bearish' ? colors.bearish :
    accent === 'neutral' ? colors.neutral :
    colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {sub ? <Text style={[styles.sub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  sub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
