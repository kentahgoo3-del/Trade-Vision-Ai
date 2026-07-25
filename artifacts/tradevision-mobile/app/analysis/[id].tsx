import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import {
  useGetAnalysis,
  useDeleteAnalysis,
  useUpdateAnalysis,
  getListAnalysesQueryKey,
  getListRecentAnalysesQueryKey,
  getGetPortfolioSummaryQueryKey,
  getGetAnalysisStatsQueryKey,
  getGetAnalysisQueryKey,
} from '@workspace/api-client-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ConfidenceBreakdown {
  trendStrength: number; momentum: number; patternQuality: number;
  volumeConfirmation: number; supportResistance: number; riskReward: number;
  indicatorAlignment: number; newsSentiment: number; marketVolatility: number;
  liquidity: number; multiTimeframeAlignment: number;
}
interface TradePlan {
  entryZone?: string; optimalEntry?: string; stopLoss?: string;
  takeProfit1?: string; takeProfit2?: string; takeProfit3?: string;
  breakeven?: string; trailingStop?: string; maxLoss?: string;
  expectedProfit?: string; riskRewardRatio?: string;
}
interface Scenario { name: string; probability: number; action: string; description: string; }
interface MultiTF { timeframe: string; bias: string; agreement: boolean; }
interface RiskBreakdown {
  volatility: string; drawdownRisk: string; trendRisk: string; gapRisk: string;
  newsRisk: string; liquidityRisk: string; slippageRisk: string; overall: string;
}
interface PatternExplanation {
  name: string; what: string; why: string;
  successRate: string; failures: string; confirmation: string;
}
interface NewsSentiment { classification: string; score: number; impact: string; summary: string; }
interface TradeChecklist {
  trendConfirmed: boolean; patternConfirmed: boolean; volumeConfirmed: boolean;
  momentumConfirmed: boolean; indicatorsAligned: boolean; supportNearby: boolean;
  resistanceIdentified: boolean; riskAcceptable: boolean; noConflictingSignals: boolean;
  noMajorNews: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseJsonField<T>(v: unknown): T | null {
  if (!v) return null;
  if (typeof v === 'object') return v as T;
  try { return JSON.parse(v as string) as T; } catch { return null; }
}
function parseJsonArray(s: unknown): string[] {
  if (!s) return [];
  if (Array.isArray(s)) return s as string[];
  try { return JSON.parse(s as string) as string[]; } catch { return [String(s)]; }
}
function parsePrice(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.replace(/[$,]/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]!) : null;
}

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(score: number, colors: ReturnType<typeof useColors>) {
  if (score >= 95) return '#00E5A0';
  if (score >= 85) return colors.primary;
  if (score >= 75) return '#84CC16';
  if (score >= 60) return colors.gold;
  return colors.bearish;
}
function scoreLabel(score: number) {
  if (score >= 95) return 'Exceptional';
  if (score >= 85) return 'Strong';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Moderate';
  return 'Avoid';
}
function decisionColor(d: string, colors: ReturnType<typeof useColors>) {
  if (d === 'BUY') return colors.bullish;
  if (d === 'SELL') return colors.bearish;
  if (d === 'WAIT') return colors.gold;
  return colors.mutedForeground;
}
function riskColor(r: string, colors: ReturnType<typeof useColors>) {
  if (r === 'Low') return colors.bullish;
  if (r === 'High') return colors.bearish;
  return colors.gold;
}
function biasColor(b: string, colors: ReturnType<typeof useColors>) {
  if (b === 'Bullish') return colors.bullish;
  if (b === 'Bearish') return colors.bearish;
  return colors.mutedForeground;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const colors = useColors();
  return (
    <View style={[{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }, style]}>
      {children}
    </View>
  );
}

function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {icon ? <Ionicons name={icon as any} size={16} color={colors.primary} /> : null}
      <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 1, textTransform: 'uppercase' }}>
        {title}
      </Text>
    </View>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value?: string | null; valueColor?: string }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border + '60' }}>
      <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: valueColor ?? colors.foreground, flex: 1.2, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

function BarRow({ label, value }: { label: string; value: number }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value / 100, duration: 800, useNativeDriver: false }).start();
  }, [value]);
  const color = scoreColor(value, colors);
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>{label}</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color }}>{value}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={{ height: 6, borderRadius: 3, backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
    </View>
  );
}

function StarRating({ stars }: { stars: number }) {
  const colors = useColors();
  const labels = ['', 'Avoid', 'Weak', 'Average', 'High Quality', 'Institutional Grade'];
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons key={i} name={i <= stars ? 'star' : 'star-outline'} size={24} color={i <= stars ? colors.gold : colors.muted} />
        ))}
      </View>
      <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.gold }}>{labels[stars] ?? ''}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [accountBalance, setAccountBalance] = useState('');
  const [riskPercent, setRiskPercent] = useState('2');
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());

  const { data: analysis, isLoading } = useGetAnalysis(Number(id));
  const { mutateAsync: deleteAnalysis } = useDeleteAnalysis();
  const { mutateAsync: updateAnalysis, isPending: updatingOutcome } = useUpdateAnalysis();
  const [outcomeLoading, setOutcomeLoading] = useState<string | null>(null);

  const handleSetOutcome = async (outcome: 'won' | 'lost' | 'skipped') => {
    const current = analysis?.tradeOutcome as string | null;
    // Toggle off if same
    const newOutcome = current === outcome ? '' : outcome;
    setOutcomeLoading(outcome);
    try {
      await updateAnalysis({ id: Number(id), data: { tradeOutcome: newOutcome } });
      queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(Number(id)) });
      queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
    } finally {
      setOutcomeLoading(null);
    }
  };

  const handleLogTrade = () => {
    if (!analysis) return;
    const tradePlanParsed = parseJsonField<TradePlan>(analysis.tradePlan);
    const direction = (analysis.tradeDirection ?? 'long') === 'short' ? 'short' : 'long';
    const entryPrice = tradePlanParsed?.optimalEntry ?? analysis.entryPrice ?? '';
    const stopLoss = tradePlanParsed?.stopLoss ?? analysis.stopLoss ?? '';
    const takeProfit = tradePlanParsed?.takeProfit1 ?? analysis.takeProfit1 ?? '';
    router.push({
      pathname: '/journal/new',
      params: {
        symbol: analysis.symbol ?? '',
        direction,
        entryPrice: entryPrice.replace(/[^0-9.]/g, ''),
        stopLoss: stopLoss.replace(/[^0-9.]/g, ''),
        takeProfit: takeProfit.replace(/[^0-9.]/g, ''),
        strategy: (analysis.setupType as string | null) ?? '',
        analysisId: String(id),
      },
    });
  };

  const overallScore = (analysis?.overallScore as number | null) ?? (analysis?.confidence as number | null) ?? 0;

  useEffect(() => {
    if (overallScore > 0) {
      Animated.timing(scoreAnim, { toValue: overallScore, duration: 1200, useNativeDriver: false }).start();
    }
  }, [overallScore]);

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

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: 'Inter_400Regular' }}>Analyzing chart…</Text>
      </View>
    );
  }
  if (!analysis) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Analysis not found</Text>
      </View>
    );
  }

  // Parse all fields
  const decision = (analysis.tradeDecision as string | null) ?? 'WAIT';
  const cb = parseJsonField<ConfidenceBreakdown>(analysis.confidenceBreakdown);
  const tradePlan = parseJsonField<TradePlan>(analysis.tradePlan);
  const scenarios = parseJsonField<Scenario[]>(analysis.scenarios) ?? [];
  const psychology = parseJsonField<string[]>(analysis.marketPsychology) ?? [];
  const checklist = parseJsonField<TradeChecklist>(analysis.tradeChecklist);
  const mtf = parseJsonField<MultiTF[]>(analysis.multiTimeframe) ?? [];
  const riskBd = parseJsonField<RiskBreakdown>(analysis.riskBreakdown);
  const stars = (analysis.tradeQualityStars as number | null) ?? 0;
  const coaching = parseJsonField<string[]>(analysis.coachAdvice) ?? [];
  const patternExps = parseJsonField<PatternExplanation[]>(analysis.patternExplanations) ?? [];
  const news = parseJsonField<NewsSentiment>(analysis.newsSentiment);
  const patterns = parseJsonArray(analysis.patterns);
  const strengths = parseJsonArray(analysis.strengths);
  const weaknesses = parseJsonArray(analysis.weaknesses);
  const risks = parseJsonArray(analysis.risks);
  const decColor = decisionColor(decision, colors);
  const sColor = scoreColor(overallScore, colors);

  // Position size calculator
  const bal = parseFloat(accountBalance.replace(/,/g, '')) || 0;
  const rPct = parseFloat(riskPercent) || 0;
  const maxDollarRisk = bal > 0 && rPct > 0 ? bal * (rPct / 100) : null;
  const entryNum = parsePrice(tradePlan?.optimalEntry ?? analysis.entryPrice);
  const slNum = parsePrice(tradePlan?.stopLoss ?? analysis.stopLoss);
  const positionSize = maxDollarRisk && entryNum && slNum && Math.abs(entryNum - slNum) > 0
    ? maxDollarRisk / Math.abs(entryNum - slNum)
    : null;

  const mtfAgreementCount = mtf.filter((t) => t.agreement).length;
  const mtfAlignPct = mtf.length > 0 ? Math.round((mtfAgreementCount / mtf.length) * 100) : null;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad + 40, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Nav */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground }}>
            {analysis.symbol ?? 'Analysis'}
          </Text>
          {analysis.timeframe ? (
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>{analysis.timeframe}</Text>
          ) : null}
        </View>
        <Pressable onPress={handleDelete} hitSlop={12} style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      {/* ── Decision Banner ── */}
      <View style={[styles.decisionBanner, { backgroundColor: decColor + '18', borderColor: decColor, borderWidth: 1.5 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.decisionBadge, { backgroundColor: decColor }]}>
            <Ionicons
              name={decision === 'BUY' ? 'trending-up' : decision === 'SELL' ? 'trending-down' : 'time-outline'}
              size={20} color="#fff"
            />
          </View>
          <View>
            <Text style={{ fontSize: 26, fontFamily: 'Inter_700Bold', color: decColor, letterSpacing: 2 }}>{decision}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>AI Recommendation</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 36, fontFamily: 'Inter_700Bold', color: sColor }}>{overallScore}</Text>
          <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>/ 100 — {scoreLabel(overallScore)}</Text>
        </View>
      </View>

      {/* ── Trade Outcome + Log Trade ── */}
      <Card>
        <SectionTitle title="Your Trade Outcome" icon="trophy" />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {(['won', 'lost', 'skipped'] as const).map((o) => {
            const active = (analysis.tradeOutcome as string | null) === o;
            const col = o === 'won' ? colors.bullish : o === 'lost' ? colors.bearish : colors.gold;
            const icon = o === 'won' ? 'checkmark-circle' : o === 'lost' ? 'close-circle' : 'remove-circle';
            return (
              <Pressable
                key={o}
                onPress={() => handleSetOutcome(o)}
                disabled={!!outcomeLoading}
                style={({ pressed }) => [{
                  flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
                  gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
                  backgroundColor: active ? col + '20' : colors.secondary,
                  borderColor: active ? col : colors.border,
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                {outcomeLoading === o
                  ? <ActivityIndicator size="small" color={col} />
                  : <Ionicons name={icon as any} size={16} color={active ? col : colors.mutedForeground} />
                }
                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: active ? col : colors.mutedForeground }}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={handleLogTrade}
          style={({ pressed }) => [{
            flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
            gap: 8, paddingVertical: 14, borderRadius: 14,
            backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1,
          }]}
        >
          <Ionicons name="journal-outline" size={18} color={colors.primaryForeground} />
          <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.primaryForeground }}>
            Log This Trade
          </Text>
        </Pressable>
      </Card>

      {/* ── Trade Quality Stars ── */}
      {stars > 0 && (
        <Card>
          <SectionTitle title="Trade Quality" icon="star" />
          <StarRating stars={stars} />
        </Card>
      )}

      {/* ── Summary ── */}
      {analysis.explanation ? (
        <Card>
          <SectionTitle title="AI Summary" icon="flash" />
          <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.foreground, lineHeight: 22 }}>
            {analysis.explanation}
          </Text>
        </Card>
      ) : null}

      {/* ── Confidence Breakdown ── */}
      {cb && (
        <Card>
          <SectionTitle title="Confidence Breakdown" icon="analytics" />
          <BarRow label="Trend Strength" value={cb.trendStrength} />
          <BarRow label="Momentum" value={cb.momentum} />
          <BarRow label="Pattern Quality" value={cb.patternQuality} />
          <BarRow label="Volume Confirmation" value={cb.volumeConfirmation} />
          <BarRow label="Support & Resistance" value={cb.supportResistance} />
          <BarRow label="Risk-to-Reward" value={cb.riskReward} />
          <BarRow label="Indicator Alignment" value={cb.indicatorAlignment} />
          <BarRow label="News Sentiment" value={cb.newsSentiment} />
          <BarRow label="Market Volatility" value={cb.marketVolatility} />
          <BarRow label="Liquidity" value={cb.liquidity} />
          <BarRow label="Multi-TF Alignment" value={cb.multiTimeframeAlignment} />
        </Card>
      )}

      {/* ── Trade Plan ── */}
      {tradePlan && (
        <Card>
          <SectionTitle title="Trade Plan" icon="map" />
          <InfoRow label="Entry Zone" value={tradePlan.entryZone} />
          <InfoRow label="Optimal Entry" value={tradePlan.optimalEntry} valueColor={colors.primary} />
          <InfoRow label="Stop Loss" value={tradePlan.stopLoss} valueColor={colors.bearish} />
          <InfoRow label="Take Profit 1" value={tradePlan.takeProfit1} valueColor={colors.bullish} />
          <InfoRow label="Take Profit 2" value={tradePlan.takeProfit2} valueColor={colors.bullish} />
          <InfoRow label="Take Profit 3" value={tradePlan.takeProfit3} valueColor={colors.bullish} />
          <InfoRow label="Break-even" value={tradePlan.breakeven} />
          <InfoRow label="Trailing Stop" value={tradePlan.trailingStop} />
          <InfoRow label="Max Loss" value={tradePlan.maxLoss} valueColor={colors.bearish} />
          <InfoRow label="Expected Profit" value={tradePlan.expectedProfit} valueColor={colors.bullish} />
          <InfoRow label="Risk:Reward" value={tradePlan.riskRewardRatio} valueColor={colors.gold} />
        </Card>
      )}

      {/* ── Position Size Calculator ── */}
      <Card>
        <SectionTitle title="Position Size Calculator" icon="calculator" />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 2 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginBottom: 6 }}>Account Balance ($)</Text>
            <TextInput
              style={[styles.calcInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              value={accountBalance}
              onChangeText={setAccountBalance}
              placeholder="10,000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginBottom: 6 }}>Risk %</Text>
            <TextInput
              style={[styles.calcInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              value={riskPercent}
              onChangeText={setRiskPercent}
              placeholder="2"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>
        </View>
        {maxDollarRisk !== null ? (
          <View style={{ gap: 8 }}>
            <View style={[styles.calcResult, { backgroundColor: colors.bearish + '15', borderColor: colors.bearish + '40' }]}>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>Max Dollar Risk</Text>
              <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.bearish }}>${maxDollarRisk.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
            </View>
            {positionSize !== null && (
              <View style={[styles.calcResult, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>Position Size (units)</Text>
                <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary }}>{positionSize.toLocaleString('en-US', { maximumFractionDigits: 4 })}</Text>
              </View>
            )}
            {maxDollarRisk && analysis.riskReward && (
              <View style={[styles.calcResult, { backgroundColor: colors.bullish + '15', borderColor: colors.bullish + '40' }]}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>R:R — {analysis.riskReward}</Text>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.bullish }}>
                  Potential: ${(() => { const ratio = parseFloat((analysis.riskReward ?? '1:2').split(':')[1] ?? '2'); return (maxDollarRisk * ratio).toLocaleString('en-US', { maximumFractionDigits: 0 }); })()}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, textAlign: 'center', paddingVertical: 8 }}>
            Enter your account balance and risk % above
          </Text>
        )}
      </Card>

      {/* ── Trade Checklist ── */}
      {checklist && (
        <Card>
          <SectionTitle title="Trade Checklist" icon="checkmark-circle" />
          {([
            ['trendConfirmed', 'Trend confirmed'],
            ['patternConfirmed', 'Pattern confirmed'],
            ['volumeConfirmed', 'Volume confirmed'],
            ['momentumConfirmed', 'Momentum confirmed'],
            ['indicatorsAligned', 'Indicators aligned'],
            ['supportNearby', 'Support nearby'],
            ['resistanceIdentified', 'Resistance identified'],
            ['riskAcceptable', 'Risk acceptable'],
            ['noConflictingSignals', 'No conflicting signals'],
            ['noMajorNews', 'No major news within 1h'],
          ] as [keyof TradeChecklist, string][]).map(([key, label]) => {
            const passed = checklist[key];
            return (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                <Ionicons
                  name={passed ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={passed ? colors.bullish : colors.bearish}
                />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground }}>{label}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* ── Multi-Timeframe Alignment ── */}
      {mtf.length > 0 && (
        <Card>
          <SectionTitle title="Multi-Timeframe Alignment" icon="layers" />
          {mtfAlignPct !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>Overall alignment</Text>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: scoreColor(mtfAlignPct, colors) }}>{mtfAlignPct}%</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {mtf.map((t) => (
              <View key={t.timeframe} style={[styles.tfChip, { backgroundColor: biasColor(t.bias, colors) + '18', borderColor: biasColor(t.bias, colors) + '60' }]}>
                <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.mutedForeground }}>{t.timeframe}</Text>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: biasColor(t.bias, colors) }}>{t.bias}</Text>
                <Ionicons name={t.agreement ? 'checkmark-circle' : 'alert-circle'} size={13} color={t.agreement ? colors.bullish : colors.gold} />
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* ── Alternative Scenarios ── */}
      {scenarios.length > 0 && (
        <Card>
          <SectionTitle title="Alternative Scenarios" icon="git-branch" />
          {scenarios.map((s, i) => {
            const sc = decisionColor(s.action, colors);
            return (
              <View key={i} style={[styles.scenarioRow, { borderColor: sc + '40', backgroundColor: sc + '0A' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground }}>{s.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: sc, backgroundColor: sc + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>{s.action}</Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: sc }}>{s.probability}%</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>{s.description}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* ── Market Psychology ── */}
      {psychology.length > 0 && (
        <Card>
          <SectionTitle title="Market Psychology" icon="people" />
          {psychology.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7, flexShrink: 0 }} />
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground, flex: 1, lineHeight: 20 }}>{p}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* ── Risk Breakdown ── */}
      {riskBd && (
        <Card>
          <SectionTitle title="Risk Assessment" icon="warning" />
          <View style={[styles.overallRisk, { backgroundColor: riskColor(riskBd.overall, colors) + '18', borderColor: riskColor(riskBd.overall, colors) }]}>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>Overall Risk</Text>
            <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: riskColor(riskBd.overall, colors) }}>{riskBd.overall}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {([
              ['Volatility', riskBd.volatility], ['Drawdown', riskBd.drawdownRisk], ['Trend', riskBd.trendRisk],
              ['Gap', riskBd.gapRisk], ['News', riskBd.newsRisk], ['Liquidity', riskBd.liquidityRisk], ['Slippage', riskBd.slippageRisk],
            ] as [string, string][]).map(([label, level]) => (
              <View key={label} style={[styles.riskPill, { borderColor: riskColor(level, colors) + '60', backgroundColor: riskColor(level, colors) + '12' }]}>
                <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>{label}</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: riskColor(level, colors) }}>{level}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* ── Pattern Explanations ── */}
      {patternExps.length > 0 && (
        <Card>
          <SectionTitle title="Pattern Breakdown" icon="shapes" />
          {patternExps.map((pe, i) => {
            const expanded = expandedPatterns.has(pe.name);
            return (
              <View key={i} style={{ marginBottom: i < patternExps.length - 1 ? 12 : 0 }}>
                <Pressable
                  onPress={() => setExpandedPatterns((prev) => {
                    const s = new Set(prev);
                    s.has(pe.name) ? s.delete(pe.name) : s.add(pe.name);
                    return s;
                  })}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground }}>{pe.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>{pe.successRate}</Text>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
                  </View>
                </Pressable>
                {expanded && (
                  <View style={{ gap: 8, paddingTop: 4 }}>
                    <View style={[styles.patternRow, { backgroundColor: colors.primary + '12' }]}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primary, marginBottom: 2 }}>WHAT IT IS</Text>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground }}>{pe.what}</Text>
                    </View>
                    <View style={[styles.patternRow, { backgroundColor: colors.bullish + '12' }]}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.bullish, marginBottom: 2 }}>WHY IT MATTERS</Text>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground }}>{pe.why}</Text>
                    </View>
                    <View style={[styles.patternRow, { backgroundColor: colors.bearish + '12' }]}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.bearish, marginBottom: 2 }}>COMMON FAILURES</Text>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground }}>{pe.failures}</Text>
                    </View>
                    <View style={[styles.patternRow, { backgroundColor: colors.gold + '12' }]}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.gold, marginBottom: 2 }}>IDEAL CONFIRMATION</Text>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground }}>{pe.confirmation}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      )}

      {/* ── AI Coaching ── */}
      {coaching.length > 0 && (
        <Card>
          <SectionTitle title="AI Trade Coach" icon="school" />
          {coaching.map((tip, i) => (
            <View key={i} style={[styles.coachTip, { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary }]}>
              <Ionicons name="bulb-outline" size={14} color={colors.primary} />
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground, flex: 1, lineHeight: 19 }}>{tip}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* ── News Sentiment ── */}
      {news && (
        <Card>
          <SectionTitle title="News & Sentiment" icon="newspaper" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: scoreColor(news.score, colors) }}>{news.classification}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: scoreColor(news.score, colors) }}>{news.score}/100</Text>
          </View>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground, lineHeight: 20, marginBottom: 8 }}>{news.impact}</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, lineHeight: 18 }}>{news.summary}</Text>
        </Card>
      )}

      {/* ── Beginner Explanation ── */}
      {analysis.beginnerExplanation && (
        <Card>
          <SectionTitle title="Explain Like I'm New" icon="help-circle" />
          <View style={[styles.beginnerBox, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '30' }]}>
            <Ionicons name="school-outline" size={20} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.foreground, lineHeight: 22 }}>
              {analysis.beginnerExplanation as string}
            </Text>
          </View>
        </Card>
      )}

      {/* ── AI Reasoning (strengths/weaknesses/risks) ── */}
      {(strengths.length > 0 || weaknesses.length > 0 || risks.length > 0) && (
        <Card>
          <SectionTitle title="AI Reasoning" icon="flask" />
          {strengths.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.bullish, marginBottom: 6, letterSpacing: 0.8 }}>SUPPORTING EVIDENCE</Text>
              {strengths.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 3 }}>
                  <Text style={{ color: colors.bullish }}>✓</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground, flex: 1 }}>{s}</Text>
                </View>
              ))}
            </View>
          )}
          {weaknesses.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.gold, marginBottom: 6, letterSpacing: 0.8 }}>WEAKNESSES</Text>
              {weaknesses.map((w, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 3 }}>
                  <Text style={{ color: colors.gold }}>⚠</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground, flex: 1 }}>{w}</Text>
                </View>
              ))}
            </View>
          )}
          {risks.length > 0 && (
            <View>
              <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.bearish, marginBottom: 6, letterSpacing: 0.8 }}>RISK FACTORS</Text>
              {risks.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 3 }}>
                  <Text style={{ color: colors.bearish }}>✗</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground, flex: 1 }}>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* ── Market Structure (legacy) ── */}
      {(analysis.supportLevels || analysis.resistanceLevels || analysis.indicators || analysis.invalidationLevel) && (
        <Card>
          <SectionTitle title="Market Structure" icon="pulse" />
          <InfoRow label="Support" value={analysis.supportLevels} valueColor={colors.bullish} />
          <InfoRow label="Resistance" value={analysis.resistanceLevels} valueColor={colors.bearish} />
          <InfoRow label="Indicators" value={analysis.indicators} />
          <InfoRow label="Invalidation" value={analysis.invalidationLevel} valueColor={colors.bearish} />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  decisionBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, padding: 18, marginBottom: 12 },
  decisionBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  calcInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontFamily: 'Inter_400Regular' },
  calcResult: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tfChip: { borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', gap: 3, minWidth: 64 },
  scenarioRow: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  overallRisk: { borderRadius: 12, borderWidth: 1.5, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  riskPill: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', gap: 2 },
  patternRow: { borderRadius: 10, padding: 10 },
  coachTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderLeftWidth: 3, marginBottom: 8 },
  beginnerBox: { borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center' },
});
