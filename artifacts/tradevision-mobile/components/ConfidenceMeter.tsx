import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  confidence: number | null | undefined;
  label?: string | null;
  showLabel?: boolean;
}

export function ConfidenceMeter({ confidence, label, showLabel = true }: Props) {
  const colors = useColors();
  const pct = confidence ?? 0;

  const trackColor =
    pct >= 75 ? colors.bullish :
    pct >= 50 ? colors.gold :
    colors.bearish;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.mutedForeground }]}>Confidence</Text>
        <Text style={[styles.value, { color: trackColor }]}>
          {pct}% {showLabel && label ? `· ${label}` : ''}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%` as `${number}%`,
              backgroundColor: trackColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  value: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
