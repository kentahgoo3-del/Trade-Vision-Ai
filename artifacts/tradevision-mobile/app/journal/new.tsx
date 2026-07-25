import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import {
  useCreateJournalEntry,
  getListJournalEntriesQueryKey,
  getGetJournalStatsQueryKey,
  getGetPortfolioSummaryQueryKey,
} from '@workspace/api-client-react';

const OUTCOMES = ['', 'win', 'loss', 'breakeven'] as const;
const DIRECTIONS = ['long', 'short'] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

export default function NewJournalScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  // Pre-fill from analysis "Log This Trade" shortcut
  const params = useLocalSearchParams<{
    symbol?: string;
    direction?: string;
    entryPrice?: string;
    stopLoss?: string;
    takeProfit?: string;
    strategy?: string;
    analysisId?: string;
  }>();

  const { mutateAsync: createEntry, isPending } = useCreateJournalEntry();

  const [symbol, setSymbol] = useState(params.symbol ?? '');
  const [direction, setDirection] = useState<'long' | 'short'>(
    params.direction === 'short' ? 'short' : 'long'
  );
  const [entryPrice, setEntryPrice] = useState(params.entryPrice ?? '');
  const [exitPrice, setExitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState(params.stopLoss ?? '');
  const [takeProfit, setTakeProfit] = useState(params.takeProfit ?? '');
  const [positionSize, setPositionSize] = useState('');
  const [pnl, setPnl] = useState('');
  const [riskReward, setRiskReward] = useState('');
  const [outcome, setOutcome] = useState<'' | 'win' | 'loss' | 'breakeven'>('');
  const [strategy, setStrategy] = useState(params.strategy ?? '');
  const [notes, setNotes] = useState(params.analysisId ? `From AI Analysis #${params.analysisId}` : '');

  const numericInput = (s: string) => s.replace(/[^0-9.-]/g, '');

  const handleSave = async () => {
    if (!symbol.trim() || !entryPrice.trim()) {
      Alert.alert('Required', 'Symbol and entry price are required.');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createEntry({
        data: {
          symbol: symbol.trim().toUpperCase(),
          direction,
          entryPrice: parseFloat(entryPrice),
          exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
          stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
          takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
          positionSize: positionSize ? parseFloat(positionSize) : undefined,
          pnl: pnl ? parseFloat(pnl) : undefined,
          riskReward: riskReward ? parseFloat(riskReward) : undefined,
          outcome: outcome || undefined,
          strategy: strategy.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetJournalStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save trade entry.');
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }];
  const ph = colors.mutedForeground;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 40 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Log Trade</Text>
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.8 : 1 }]}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            {isPending ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <Field label="Symbol *">
        <TextInput style={inputStyle} value={symbol} onChangeText={setSymbol} placeholder="e.g. BTC/USD" placeholderTextColor={ph} autoCapitalize="characters" />
      </Field>

      <Field label="Direction">
        <View style={styles.segmentRow}>
          {DIRECTIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDirection(d)}
              style={[
                styles.segment,
                {
                  backgroundColor: direction === d ? (d === 'long' ? colors.bullish : colors.bearish) : colors.secondary,
                  borderColor: direction === d ? (d === 'long' ? colors.bullish : colors.bearish) : colors.border,
                },
              ]}
            >
              <Ionicons name={d === 'long' ? 'trending-up' : 'trending-down'} size={16} color={direction === d ? '#fff' : colors.mutedForeground} />
              <Text style={[styles.segmentText, { color: direction === d ? '#fff' : colors.foreground }]}>
                {d === 'long' ? 'Long' : 'Short'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Entry Price *">
        <TextInput style={inputStyle} value={entryPrice} onChangeText={(t) => setEntryPrice(numericInput(t))} placeholder="0.00" placeholderTextColor={ph} keyboardType="decimal-pad" />
      </Field>

      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Field label="Exit Price">
            <TextInput style={inputStyle} value={exitPrice} onChangeText={(t) => setExitPrice(numericInput(t))} placeholder="0.00" placeholderTextColor={ph} keyboardType="decimal-pad" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="P&L ($)">
            <TextInput style={inputStyle} value={pnl} onChangeText={(t) => setPnl(numericInput(t))} placeholder="0.00" placeholderTextColor={ph} keyboardType="decimal-pad" />
          </Field>
        </View>
      </View>

      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Field label="Stop Loss">
            <TextInput style={inputStyle} value={stopLoss} onChangeText={(t) => setStopLoss(numericInput(t))} placeholder="0.00" placeholderTextColor={ph} keyboardType="decimal-pad" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Take Profit">
            <TextInput style={inputStyle} value={takeProfit} onChangeText={(t) => setTakeProfit(numericInput(t))} placeholder="0.00" placeholderTextColor={ph} keyboardType="decimal-pad" />
          </Field>
        </View>
      </View>

      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Field label="Position Size">
            <TextInput style={inputStyle} value={positionSize} onChangeText={(t) => setPositionSize(numericInput(t))} placeholder="0.00" placeholderTextColor={ph} keyboardType="decimal-pad" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Risk:Reward">
            <TextInput style={inputStyle} value={riskReward} onChangeText={(t) => setRiskReward(numericInput(t))} placeholder="1.5" placeholderTextColor={ph} keyboardType="decimal-pad" />
          </Field>
        </View>
      </View>

      <Field label="Outcome">
        <View style={styles.outcomeRow}>
          {OUTCOMES.map((o) => (
            <Pressable
              key={o || 'open'}
              onPress={() => setOutcome(o)}
              style={[
                styles.outcomeChip,
                {
                  backgroundColor: outcome === o
                    ? o === 'win' ? colors.bullish : o === 'loss' ? colors.bearish : o === 'breakeven' ? colors.gold : colors.secondary
                    : colors.secondary,
                  borderColor: outcome === o
                    ? o === 'win' ? colors.bullish : o === 'loss' ? colors.bearish : o === 'breakeven' ? colors.gold : colors.border
                    : colors.border,
                },
              ]}
            >
              <Text style={[styles.outcomeText, { color: outcome === o && o !== '' ? '#fff' : colors.foreground }]}>
                {o || 'Open'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Strategy">
        <TextInput style={inputStyle} value={strategy} onChangeText={setStrategy} placeholder="e.g. Breakout, Reversal" placeholderTextColor={ph} />
      </Field>

      <Field label="Notes">
        <TextInput
          style={[inputStyle, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="What did you observe? What went well?"
          placeholderTextColor={ph}
          multiline
          numberOfLines={4}
        />
      </Field>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  textarea: { height: 100, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 12 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  segmentText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  outcomeRow: { flexDirection: 'row', gap: 10 },
  outcomeChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  outcomeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
