import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { useColors } from '@/hooks/useColors';

interface Props {
  trend: string | null | undefined;
  size?: 'sm' | 'md';
}

export function TrendBadge({ trend, size = 'md' }: Props) {
  const colors = useColors();

  const config =
    trend === 'bullish'
      ? { label: 'BULLISH', color: colors.bullish, icon: 'trending-up' as const }
      : trend === 'bearish'
      ? { label: 'BEARISH', color: colors.bearish, icon: 'trending-down' as const }
      : { label: 'NEUTRAL', color: colors.neutral, icon: 'remove' as const };

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20', borderColor: config.color + '40' }]}>
      <Icon name={config.icon} size={isSmall ? 11 : 13} color={config.color} />
      <Text style={[styles.label, { color: config.color, fontSize: isSmall ? 9 : 11 }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});
