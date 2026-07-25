import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCreateAnalysis, useListAnalyses } from '@workspace/api-client-react';
import { AnalysisCard } from '@/components/AnalysisCard';
import { EmptyState } from '@/components/EmptyState';
import { useQueryClient } from '@tanstack/react-query';
import { getListAnalysesQueryKey, getListRecentAnalysesQueryKey, getGetPortfolioSummaryQueryKey } from '@workspace/api-client-react';

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

export default function AnalyzeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('1H');

  const { data: analyses, isLoading: listLoading } = useListAnalyses();
  const { mutateAsync: createAnalysis, isPending } = useCreateAnalysis();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload charts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await createAnalysis({
        data: { imageBase64, symbol: symbol.toUpperCase() || undefined, timeframe: timeframe || undefined },
      });
      queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListRecentAnalysesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPortfolioSummaryQueryKey() });
      setImageBase64(null);
      setImageUri(null);
      setSymbol('');
      router.push(`/analysis/${result.id}`);
    } catch (err) {
      Alert.alert('Error', 'Analysis failed. Please try again.');
    }
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Chart Analysis</Text>
      <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
        Upload any trading chart for institutional-grade AI analysis
      </Text>

      {/* Upload Area */}
      <View style={[styles.uploadCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <Pressable
              onPress={() => { setImageUri(null); setImageBase64(null); }}
              style={[styles.clearBtn, { backgroundColor: colors.destructive }]}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.uploadPrompt}>
            <View style={[styles.uploadIconWrap, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="bar-chart-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Upload Chart</Text>
            <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
              Supports any trading chart screenshot
            </Text>
            <View style={styles.uploadButtons}>
              <Pressable
                onPress={pickImage}
                style={({ pressed }) => [styles.uploadBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="images-outline" size={18} color={colors.primaryForeground} />
                <Text style={[styles.uploadBtnText, { color: colors.primaryForeground }]}>Gallery</Text>
              </Pressable>
              <Pressable
                onPress={takePhoto}
                style={({ pressed }) => [styles.uploadBtn, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="camera-outline" size={18} color={colors.foreground} />
                <Text style={[styles.uploadBtnText, { color: colors.foreground }]}>Camera</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Symbol & Timeframe */}
      <View style={styles.inputRow}>
        <View style={[styles.symbolWrap, { flex: 1 }]}>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Symbol (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
            value={symbol}
            onChangeText={setSymbol}
            placeholder="e.g. BTC/USD"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View>
        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Timeframe</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tfRow}>
          {TIMEFRAMES.map((tf) => (
            <Pressable
              key={tf}
              onPress={() => setTimeframe(tf)}
              style={[
                styles.tfChip,
                {
                  backgroundColor: timeframe === tf ? colors.primary : colors.secondary,
                  borderColor: timeframe === tf ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.tfText, { color: timeframe === tf ? colors.primaryForeground : colors.foreground }]}>
                {tf}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Analyze Button */}
      <Pressable
        onPress={handleAnalyze}
        disabled={!imageBase64 || isPending}
        style={({ pressed }) => [
          styles.analyzeBtn,
          {
            backgroundColor: !imageBase64 ? colors.muted : colors.primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {isPending ? (
          <>
            <ActivityIndicator color={colors.primaryForeground} size="small" />
            <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>Analyzing with AI…</Text>
          </>
        ) : (
          <>
            <Ionicons name="flash" size={20} color={!imageBase64 ? colors.mutedForeground : colors.primaryForeground} />
            <Text style={[styles.analyzeBtnText, { color: !imageBase64 ? colors.mutedForeground : colors.primaryForeground }]}>
              Analyze Chart
            </Text>
          </>
        )}
      </Pressable>

      {/* History */}
      <View style={styles.history}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Analysis History</Text>
        {listLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : !analyses?.length ? (
          <View style={{ height: 160 }}>
            <EmptyState
              icon="time-outline"
              title="No analyses yet"
              subtitle="Your chart analyses will appear here"
            />
          </View>
        ) : (
          analyses.map((a) => (
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
  content: { paddingHorizontal: 16, gap: 16 },
  pageTitle: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  pageSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginTop: -8 },
  uploadCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  uploadPrompt: { padding: 28, alignItems: 'center', gap: 10 },
  uploadIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  uploadSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  uploadButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  uploadBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  previewContainer: { position: 'relative' },
  previewImage: { width: '100%', height: 220 },
  clearBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', gap: 12 },
  symbolWrap: {},
  inputLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_500Medium' },
  tfRow: { marginTop: 0 },
  tfChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  tfText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  analyzeBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  history: { gap: 0, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 14 },
});
