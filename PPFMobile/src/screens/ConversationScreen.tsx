import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { fetchMessages, sendMessage, fetchProfiles, type Conv, type Msg, type UserResult } from '../services/messages';
import { colors, spacing, radius } from '../theme';

const WEB_URL = 'https://precisionprojectflow.com';

type Props = {
  conv: Conv;
  userId: string;
  jwt: string;
  onBack: () => void;
};

export default function ConversationScreen({ conv, userId, jwt, onBack }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('Conversation');
  const listRef = useRef<FlatList>(null);

  // Resolve partner name
  const partnerId = conv.participant_one_id === userId
    ? conv.participant_two_id
    : conv.participant_one_id;

  useEffect(() => {
    fetchProfiles([partnerId], jwt)
      .then(profiles => {
        if (profiles.length > 0) {
          setPartnerName(profiles[0].full_name ?? profiles[0].email ?? 'User');
        }
      })
      .catch(() => {});
  }, [partnerId, jwt]);

  useEffect(() => {
    fetchMessages(conv.id, jwt)
      .then(data => { setMsgs(data); setLoading(false); })
      .catch(e => { setErr(String(e?.message ?? e)); setLoading(false); });
  }, [conv.id, jwt]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setSending(true);
    try {
      // Try web API first (handles token deduction), fall back to direct insert
      let msg: Msg;
      try {
        const res = await fetch(`${WEB_URL}/api/messages/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ conversationId: conv.id, content: trimmed }),
        });
        if (res.status === 402) {
          setErr('Insufficient tokens. Buy more tokens to continue messaging.');
          setText(trimmed);
          setSending(false);
          return;
        }
        if (res.ok) {
          const json = await res.json();
          msg = json.message ?? json;
        } else {
          // Web API not available — fall back to direct insert
          msg = await sendMessage(conv.id, userId, trimmed, jwt);
        }
      } catch (_) {
        // Network error to web API — fall back to direct insert
        msg = await sendMessage(conv.id, userId, trimmed, jwt);
      }
      setMsgs(prev => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to send');
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>
          {partnerName}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Error banner */}
      {err && (
        <View style={s.errBanner}>
          <Text style={s.errTxt}>{err}</Text>
          <TouchableOpacity onPress={() => setErr(null)}>
            <Text style={s.errDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.mint} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={item => item.id}
          contentContainerStyle={s.msgList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.muted}>No messages yet. Say hello! 👋</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === userId;
            return (
              <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                <Text style={[s.bubbleTxt, mine ? s.bubbleTxtMine : s.bubbleTxtTheirs]}>
                  {item.content}
                </Text>
                <Text style={[s.bubbleTime, !mine && s.bubbleTimeTheirs]}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          placeholderTextColor={colors.textMuted}
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}>
          <Text style={s.sendTxt}>{sending ? '…' : '↑'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backBtn: { width: 60 },
  backTxt: { fontSize: 15, color: colors.mint, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1, textAlign: 'center' },
  errBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff5f5', paddingHorizontal: spacing.md, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#fed7d7',
  },
  errTxt: { fontSize: 13, color: '#e53e3e', flex: 1 },
  errDismiss: { fontSize: 16, color: '#e53e3e', paddingLeft: 12 },
  muted: { fontSize: 14, color: colors.textMuted },
  msgList: { padding: spacing.md, paddingBottom: 12 },
  bubble: {
    maxWidth: '80%', borderRadius: radius.md, padding: 10,
    marginBottom: 8,
  },
  bubbleMine: {
    alignSelf: 'flex-end', backgroundColor: colors.mint,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start', backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  bubbleTxt: { fontSize: 15, lineHeight: 20 },
  bubbleTxtMine: { color: '#fff' },
  bubbleTxtTheirs: { color: colors.textPrimary },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeTheirs: { color: 'rgba(0,0,0,0.35)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 120,
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    fontSize: 15, color: colors.textPrimary,
    backgroundColor: colors.bg,
    marginRight: 10,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.mintMid },
  sendTxt: { fontSize: 18, color: '#fff', fontWeight: '700', lineHeight: 22 },
});
