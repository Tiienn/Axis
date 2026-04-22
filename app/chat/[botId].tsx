import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotAvatar } from '@/components/bot-avatar';
import { BOTS, type BotId } from '@/constants/bots';
import { AxisColors, FontFamily } from '@/constants/theme';
import { useSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
};

export default function Chat() {
  const { botId } = useLocalSearchParams<{ botId: BotId }>();
  const bot = BOTS[botId];
  const { session } = useSession();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<UiMessage>>(null);

  const loadHistory = useCallback(async () => {
    if (!session || !bot) return;
    setLoading(true);
    const { data: botRow } = await supabase.from('bots').select('id').eq('name', bot.name).single();
    if (!botRow) {
      setLoading(false);
      return;
    }
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('bot_id', botRow.id)
      .maybeSingle();
    if (!conv) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const { data: rows } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    setMessages(
      (rows ?? []).map((r) => ({
        id: r.id,
        role: r.role as 'user' | 'assistant',
        content: r.content,
      })),
    );
    setLoading(false);
  }, [session, bot]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !bot) return;
    const { data: botRow } = await supabase.from('bots').select('id').eq('name', bot.name).single();
    if (!botRow) {
      Alert.alert('Error', 'Bot not available.');
      return;
    }

    const optimisticUserId = `tmp-u-${Date.now()}`;
    const optimisticBotId = `tmp-a-${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: optimisticUserId, role: 'user', content: text },
      { id: optimisticBotId, role: 'assistant', content: '…', pending: true },
    ]);
    setInput('');
    setSending(true);

    const { data, error } = await supabase.functions.invoke<{ reply: string; messageId: string }>(
      'send-message',
      { body: { botId: botRow.id, userMessage: text } },
    );

    setSending(false);
    if (error || !data?.reply) {
      setMessages((m) => m.filter((x) => x.id !== optimisticUserId && x.id !== optimisticBotId));
      Alert.alert('Something went wrong', error?.message ?? 'Please try again.');
      setInput(text);
      return;
    }
    setMessages((m) =>
      m.map((x) =>
        x.id === optimisticBotId
          ? { id: data.messageId ?? optimisticBotId, role: 'assistant', content: data.reply }
          : x,
      ),
    );
  };

  if (!bot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.missing}>Unknown bot.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={AxisColors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <BotAvatar letter={bot.letter} color={bot.color} size={32} />
          <Text style={styles.name}>{bot.name}</Text>
        </View>
        <View style={styles.back} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={AxisColors.textSecondary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Say hi to {bot.name}.</Text>
            <Text style={styles.emptySub}>{bot.role}.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubbleRow,
                  item.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowBot,
                ]}
              >
                {item.role === 'assistant' && (
                  <BotAvatar letter={bot.letter} color={bot.color} size={24} />
                )}
                <View
                  style={[
                    styles.bubble,
                    item.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot,
                      item.pending && styles.bubbleTextPending,
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${bot.name}…`}
            placeholderTextColor={AxisColors.muted}
            value={input}
            onChangeText={setInput}
            editable={!sending}
            multiline
            onSubmitEditing={send}
            blurOnSubmit={false}
            onKeyPress={(e) => {
              const ne = e.nativeEvent as { key: string; shiftKey?: boolean };
              if (ne.key === 'Enter' && !ne.shiftKey) {
                (e as unknown as { preventDefault?: () => void }).preventDefault?.();
                send();
              }
            }}
          />
          <Pressable
            onPress={send}
            disabled={!input.trim() || sending}
            style={[
              styles.sendButton,
              (!input.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={AxisColors.textPrimary} />
            ) : (
              <Ionicons
                name="arrow-up"
                size={18}
                color={input.trim() ? AxisColors.textPrimary : AxisColors.muted}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AxisColors.background,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: AxisColors.border,
    borderBottomWidth: 1,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serif,
    fontSize: 22,
    textAlign: 'center',
  },
  emptySub: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '100%',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowBot: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: AxisColors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: AxisColors.surface,
    borderColor: AxisColors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sans,
  },
  bubbleTextBot: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serif,
  },
  bubbleTextPending: {
    color: AxisColors.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopColor: AxisColors.border,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: AxisColors.surface,
    borderColor: AxisColors.border,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    maxHeight: 140,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AxisColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: AxisColors.surface,
  },
  missing: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    padding: 20,
  },
});
