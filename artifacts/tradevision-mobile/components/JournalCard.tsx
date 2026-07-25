import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import type { JournalEntry } from '@workspace/api-client-react';

interface Props {
  entry: JournalEntry;
  onPress?: () => void;
  onDelete?: () => void;
}

function RightAction({
  drag,
  onDelete,
}: {
  drag: SharedValue<number>;
  onDelete?: () => void;
}) {
  const colors = useColors();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 72 }],
  }));
  return (
    <Animated.View style={[styles.deleteAction, style]}>
      <Pressable
        style={[styles.deleteBtn, { backgroundColor: colors.destructive }]}
        onPress={() => {
          // Call onDelete directly — do NOT close() the swipeable first,
          // as the close animation races with Alert.alert on Android.
          onDelete?.();
        }}
      >
        <Icon name="trash-outline" size={20} color={colors.destructiveForeground} />
        <Text style={[styles.deleteBtnText, { color: colors.destructiveForeground }]}>Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

export function JournalCard({ entry, onPress, onDelete }: Props) {
  const colors = useColors();
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  const outcomeColor =
    entry.outcome === 'win' ? colors.bullish :
    entry.outcome === 'loss' ? colors.bearish :
    colors.neutral;

  const outcomeLabel =
    entry.outcome === 'win' ? 'WIN' :
    entry.outcome === 'loss' ? 'LOSS' :
    entry.outcome === 'breakeven' ? 'B/E' : 'OPEN';

  const dirColor = entry.direction === 'long' ? colors.bullish : colors.bearish;

  const card = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.symbolRow}>
            <Text style={[styles.symbol, { color: colors.foreground }]}>{entry.symbol}</Text>
            <View style={[styles.dirBadge, { backgroundColor: dirColor + '20' }]}>
              <Icon
                name={entry.direction === 'long' ? 'trending-up' : 'trending-down'}
                size={11}
                color={dirColor}
              />
              <Text style={[styles.dirLabel, { color: dirColor }]}>
                {entry.direction === 'long' ? 'LONG' : 'SHORT'}
              </Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            Entry: {entry.entryPrice}
            {entry.exitPrice ? ` → ${entry.exitPrice}` : ''}
            {entry.strategy ? ` · ${entry.strategy}` : ''}
          </Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.outcomeBadge, { backgroundColor: outcomeColor + '20', borderColor: outcomeColor + '40' }]}>
            <Text style={[styles.outcomeLabel, { color: outcomeColor }]}>{outcomeLabel}</Text>
          </View>
          {entry.pnl != null ? (
            <Text style={[styles.pnl, { color: entry.pnl >= 0 ? colors.bullish : colors.bearish }]}>
              {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}
            </Text>
          ) : null}
        </View>
      </View>
      {entry.notes ? (
        <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
          {entry.notes}
        </Text>
      ) : null}
    </Pressable>
  );

  if (!onDelete) return card;

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={(_, drag) => (
        <RightAction drag={drag} onDelete={onDelete} />
      )}
    >
      {card}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  left: { gap: 4, flex: 1 },
  right: { alignItems: 'flex-end', gap: 4 },
  symbolRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symbol: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  dirBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  dirLabel: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  outcomeBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1,
  },
  outcomeLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  pnl: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  notes: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  deleteAction: {
    width: 72,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteBtn: {
    width: 72,
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
