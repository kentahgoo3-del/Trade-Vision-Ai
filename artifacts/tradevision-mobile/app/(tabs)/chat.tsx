import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { fetch as expoFetch } from 'expo/fetch';
import { useColors } from '@/hooks/useColors';
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from '@workspace/api-client-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: convos, isLoading: convosLoading } = useListOpenaiConversations();
  const { mutateAsync: createConvo } = useCreateOpenaiConversation();

  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const startConversation = useCallback(async () => {
    const convo = await createConvo({ data: { title: 'Trading Analysis Chat' } });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setActiveConvoId(convo.id);
    setMessages([]);
  }, [createConvo, queryClient]);

  const openConversation = useCallback(async (id: number) => {
    try {
      const res = await expoFetch(`${API_BASE}/api/openai/conversations/${id}`);
      const data = await res.json() as { messages: { id: number; role: string; content: string }[] };
      setActiveConvoId(id);
      setMessages((data.messages ?? []).map((m) => ({
        id: String(m.id),
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })));
    } catch {
      setActiveConvoId(id);
      setMessages([]);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeConvoId || streaming) return;
    const text = input.trim();
    setInput('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    const assistantMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', streaming: true };
    setMessages((prev) => [assistantMsg, userMsg, ...prev]);
    setStreaming(true);

    try {
      const res = await expoFetch(`${API_BASE}/api/openai/conversations/${activeConvoId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });

      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload) as { text: string };
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((m) => m.id === assistantMsg.id ? { ...m, content: accumulated, streaming: true } : m)
              );
            } catch {}
          }
        }
      }
      setMessages((prev) =>
        prev.map((m) => m.id === assistantMsg.id ? { ...m, streaming: false } : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === assistantMsg.id ? { ...m, content: 'Sorry, I encountered an error. Please try again.', streaming: false } : m)
      );
    } finally {
      setStreaming(false);
    }
  }, [input, activeConvoId, streaming]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRight : styles.msgLeft]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="flash" size={14} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }],
          ]}
        >
          {item.streaming && !item.content ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Text style={[styles.bubbleText, { color: isUser ? colors.primaryForeground : colors.foreground }]}>
              {item.content}
              {item.streaming ? ' ▋' : ''}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Conversation list view
  if (!activeConvoId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.listHeader, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>AI Assistant</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Your institutional-grade trading analyst
          </Text>
        </View>

        <Pressable
          onPress={startConversation}
          style={({ pressed }) => [styles.newChatBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginHorizontal: 16 }]}
        >
          <Ionicons name="add-circle" size={20} color={colors.primaryForeground} />
          <Text style={[styles.newChatText, { color: colors.primaryForeground }]}>New Conversation</Text>
        </Pressable>

        {convosLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !convos?.length ? (
          <View style={{ flex: 1, marginTop: 40 }}>
            <View style={[styles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No conversations yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Start a conversation with your AI trading assistant
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={convos}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={[styles.convoList, { paddingBottom: bottomPad + 100 }]}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openConversation(item.id)}
                style={({ pressed }) => [styles.convoRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.convoIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.convoInfo}>
                  <Text style={[styles.convoTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.convoDate, { color: colors.mutedForeground }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          />
        )}
      </View>
    );
  }

  // Active chat view
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.chatHeader, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable onPress={() => setActiveConvoId(null)} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={[styles.aiIndicator, { backgroundColor: colors.primary + '15' }]}>
          <View style={[styles.aiDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.aiLabel, { color: colors.primary }]}>TradeVision AI</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={[styles.msgList, { paddingBottom: 16, paddingTop: bottomPad + 80 }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={styles.welcomeWrap}>
              <View style={[styles.welcomeIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="flash" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>TradeVision AI</Text>
              <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
                Ask me about technical analysis, chart patterns, risk management, or any trading strategy.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: Math.max(bottomPad, 8) + 8 }]}>
        <TextInput
          style={[styles.chatInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.primary + '60' }]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about trading, charts, patterns…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={1000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={sendMessage}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!input.trim() || streaming}
          style={({ pressed }) => [styles.sendBtn, { backgroundColor: input.trim() && !streaming ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 }]}
        >
          {streaming ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Ionicons name="arrow-up" size={20} color={input.trim() && !streaming ? colors.primaryForeground : colors.mutedForeground} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listHeader: { paddingHorizontal: 16, paddingBottom: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 20 },
  newChatText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  convoList: { paddingHorizontal: 16, gap: 0 },
  convoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10 },
  convoIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  convoInfo: { flex: 1 },
  convoTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  convoDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  emptyWrap: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  aiIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  aiDot: { width: 6, height: 6, borderRadius: 3 },
  aiLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  msgList: { paddingHorizontal: 16 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  msgLeft: { justifyContent: 'flex-start' },
  msgRight: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  chatInput: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: 'Inter_400Regular', maxHeight: 120 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  welcomeWrap: { alignItems: 'center', paddingVertical: 40, gap: 12, paddingHorizontal: 24 },
  welcomeIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  welcomeText: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
