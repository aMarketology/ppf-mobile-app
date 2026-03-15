import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { colors, radius, spacing } from '../theme';
import { messagesService } from '../services/messages';
import { useAuth } from '../context/AuthContext';
import type { Conversation, Message } from '../lib/types';

type Props = {
  conversation: Conversation;
  onBack: () => void;
};

export default function ConversationScreen({ conversation, onBack }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const title =
    conversation.company?.company_name ??
    conversation.subject ??
    'Conversation';

  // ── Load messages ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const data = await messagesService.getMessages(conversation.id);
      setMessages(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    loadMessages();

    channelRef.current = messagesService.subscribeToMessages(
      conversation.id,
      (newMsg: Message) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      },
    );

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [loadMessages, conversation.id]);

  // ── Scroll to bottom on first load ────────────────────────────────────────
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [loading]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    setText('');
    try {
      const msg = await messagesService.sendMessage(conversation.id, user.id, trimmed);
      // Optimistically add (realtime will deduplicate)
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setText(trimmed); // restore if failed
      Alert.alert('Send failed', e.message ?? 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  // ── Render each message bubble ────────────────────────────────────────────
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const prev = index > 0 ? messages[index - 1] : null;
    const showSender = !isMe && item.sender_id !== prev?.sender_id;
    const senderName = item.sender?.full_name ?? item.sender?.email ?? 'User';

    const time = new Date(item.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (item.is_system_message) {
      return (
        <View style={styles.systemMsgWrap}>
          <Text style={styles.systemMsg}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {senderName[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={styles.msgContent}>
          {showSender && (
            <Text style={styles.msgSender}>{senderName}</Text>
          )}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
              {item.content}
            </Text>
          </View>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{time}</Text>
        </View>
      </View>
    );
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        {conversation.subject && conversation.company && (
          <Text style={styles.headerSub} numberOfLines={1}>{conversation.subject}</Text>
        )}
      </View>
      <View style={{ width: 36 }} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      {renderHeader()}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mint} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}>
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.sendBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, alignItems: 'center' },
  backArrow: { fontSize: 32, color: colors.mint, lineHeight: 36, marginTop: -4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  headerSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  // List
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md, flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: colors.textMuted },

  // Message rows
  msgRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.mintMid, alignItems: 'center', justifyContent: 'center',
    marginRight: 6, marginBottom: 2,
  },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: colors.mintDark },
  msgContent: { maxWidth: '75%' },
  msgSender: { fontSize: 11, color: colors.textMuted, marginBottom: 3, marginLeft: 12 },
  bubble: {
    borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 9,
  },
  bubbleMe: {
    backgroundColor: colors.mint,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  bubbleText: { fontSize: 15, color: colors.textPrimary, lineHeight: 21 },
  bubbleTextMe: { color: colors.white },
  msgTime: { fontSize: 10, color: colors.textMuted, marginTop: 3, marginLeft: 12 },
  msgTimeMe: { textAlign: 'right', marginRight: 4 },

  // System messages
  systemMsgWrap: { alignItems: 'center', marginVertical: 8 },
  systemMsg: {
    fontSize: 12, color: colors.textMuted,
    backgroundColor: colors.border, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.sm, paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.bg,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10,
    fontSize: 15, color: colors.textPrimary,
    maxHeight: 120, marginRight: 8,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.mintMid },
  sendBtnText: { fontSize: 20, color: colors.white, fontWeight: '700', marginTop: -2 },
});
