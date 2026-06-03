import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Coins } from 'lucide-react-native';
import { supabase, type Message, type Profile } from '../../lib/supabase';
import { colors, spacing, radius, fonts } from '../../lib/theme';
import { format } from 'date-fns';

const FIRST_MESSAGE_COST = 5;

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load my profile
    const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setMyProfile(me);

    // Load conversation + other user
    const { data: convo } = await supabase
      .from('user_conversations')
      .select('*, p1:profiles!participant_one_id(*), p2:profiles!participant_two_id(*)')
      .eq('id', conversationId)
      .single();

    if (convo) {
      const other = convo.participant_one_id === user.id ? convo.p2 : convo.p1;
      setOtherProfile(other);
    }

    // Load messages
    const { data: msgs } = await supabase
      .from('user_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    const msgList = msgs ?? [];
    setMessages(msgList);

    // Check if this user has ever sent a message in this conversation
    const myMsgs = msgList.filter((m: Message) => m.sender_id === user.id);
    setIsFirstMessage(myMsgs.length === 0);

    // Mark as read
    await supabase.from('user_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id);

    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }

  async function handleSend() {
    if (!newMessage.trim() || sending || !myProfile) return;
    setSending(true);
    const content = newMessage.trim();

    if (isFirstMessage) {
      // Deduct 5 tokens
      const { data: result } = await supabase.rpc('spend_tokens', {
        p_user_id: myProfile.id,
        p_amount: FIRST_MESSAGE_COST,
        p_description: 'Unlock new conversation',
        p_reference_id: conversationId,
      });
      if (result === 'insufficient_tokens') {
        setSending(false);
        Alert.alert(
          'Insufficient Tokens',
          `You need ${FIRST_MESSAGE_COST} tokens to start a new conversation. Buy more tokens?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Buy Tokens', onPress: () => router.push('/buy-tokens') },
          ]
        );
        return;
      }
    }

    setNewMessage('');
    const { error } = await supabase.from('user_messages').insert({
      conversation_id: conversationId,
      sender_id: myProfile.id,
      content,
      is_read: false,
      is_paid: isFirstMessage,
    });
    if (error) Alert.alert('Error', 'Failed to send message.');
    else setIsFirstMessage(false);
    setSending(false);
  }

  function renderMessage({ item }: { item: Message }) {
    const isMe = item.sender_id === myProfile?.id;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
            {format(new Date(item.created_at), 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherProfile?.full_name ?? 'Conversation'}</Text>
          {otherProfile?.company_name ? (
            <Text style={styles.headerSub}>{otherProfile.company_name}</Text>
          ) : null}
        </View>
        <View style={styles.tokenBadge}>
          <Coins size={13} color={colors.accent} />
          <Text style={styles.tokenText}>{myProfile?.token_balance ?? 0}</Text>
        </View>
      </View>

      {/* First message notice */}
      {isFirstMessage && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>
            💬 First message costs {FIRST_MESSAGE_COST} tokens. You have {myProfile?.token_balance ?? 0}.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Send size={18} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: spacing.sm },
  headerName: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  headerSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  tokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.background, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  tokenText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.accent },
  noticeBanner: {
    backgroundColor: '#FEF3C7', padding: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  noticeText: { fontFamily: fonts.medium, fontSize: 12, color: '#92400E', textAlign: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.lg },
  msgRow: { marginBottom: spacing.sm, alignItems: 'flex-start' },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  bubbleMe: { backgroundColor: colors.primary, borderColor: colors.primary },
  bubbleThem: {},
  bubbleText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 21 },
  bubbleTextMe: { color: colors.white },
  msgTime: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: 'rgba(255,255,255,0.6)' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontFamily: fonts.regular, fontSize: 15, color: colors.text, backgroundColor: colors.background,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.textMuted },
});
