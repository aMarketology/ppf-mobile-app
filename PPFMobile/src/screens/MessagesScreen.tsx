import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  fetchConversations, searchUsers, getOrCreateConversation,
  type Conv, type UserResult,
} from '../services/messages';
import { colors, spacing, radius } from '../theme';
import ConversationScreen from './ConversationScreen';

type Props = { onNavigate: (screen: string) => void };

export default function MessagesScreen({ onNavigate }: Props) {
  const { user, session } = useAuth();
  const jwt = session?.access_token ?? '';

  // ── Conversation list state ───────────────────────────────────────────────
  const [convs,   setConvs]   = useState<Conv[]>([]);
  const [status,  setStatus]  = useState<'loading' | 'error' | 'done'>('loading');
  const [err,     setErr]     = useState<string | null>(null);
  const [open,    setOpen]    = useState<Conv | null>(null);

  // ── New Message modal state ───────────────────────────────────────────────
  const [showModal,    setShowModal]    = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [starting,     setStarting]     = useState(false);
  const [modalErr,     setModalErr]     = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load conversations ────────────────────────────────────────────────────
  function loadConvs() {
    if (!user || !jwt) { setStatus('done'); return; }
    setStatus('loading');
    setErr(null);
    fetchConversations(user.id, jwt)
      .then(data => { setConvs(data); setStatus('done'); })
      .catch(e  => { setErr(String(e?.message ?? e)); setStatus('error'); });
  }

  useEffect(() => { loadConvs(); }, [user?.id, jwt]);

  // ── Search users (debounced 400ms) ────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }

    setSearching(true);
    searchTimer.current = setTimeout(() => {
      searchUsers(searchQuery.trim(), jwt)
        .then(r  => { setSearchResults(r.filter(u => u.id !== user?.id)); setSearching(false); })
        .catch(() => setSearching(false));
    }, 400);

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, jwt]);

  // ── Start conversation ────────────────────────────────────────────────────
  async function startConversation(other: UserResult) {
    if (!user || starting) return;
    setStarting(true);
    setModalErr(null);
    try {
      const conv = await getOrCreateConversation(user.id, other.id, jwt);
      // Add to list if not already there
      setConvs(prev => prev.find(c => c.id === conv.id) ? prev : [conv, ...prev]);
      closeModal();
      setOpen(conv);
    } catch (e: any) {
      setModalErr(String(e?.message ?? e));
    } finally {
      setStarting(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setModalErr(null);
  }

  // ── Render: open conversation ─────────────────────────────────────────────
  if (open) {
    return (
      <ConversationScreen
        conv={open}
        userId={user!.id}
        jwt={jwt}
        onBack={() => { setOpen(null); loadConvs(); }}
      />
    );
  }

  // ── Render: loading / error ───────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.mint} />
        <Text style={s.muted}>Loading messages…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={s.center}>
        <Text style={s.errText}>{err}</Text>
        <TouchableOpacity style={s.btn} onPress={loadConvs}>
          <Text style={s.btnTxt}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: main inbox ────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
        <TouchableOpacity style={s.btn} onPress={() => setShowModal(true)}>
          <Text style={s.btnTxt}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Conversation list */}
      {convs.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>💬</Text>
          <Text style={s.emptyTitle}>No conversations yet</Text>
          <Text style={s.muted}>Start a new message to get going</Text>
          <TouchableOpacity style={[s.btn, { marginTop: 20 }]} onPress={() => setShowModal(true)}>
            <Text style={s.btnTxt}>+ New Message</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const initial = (item.subject ?? item.created_by ?? 'C')[0].toUpperCase();
            return (
              <TouchableOpacity style={s.row} onPress={() => setOpen(item)}>
                <View style={s.avatar}>
                  <Text style={s.avatarTxt}>{initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>
                    {item.subject ?? 'Direct Message'}
                  </Text>
                  <Text style={s.rowSub}>
                    {item.last_message_at
                      ? new Date(item.last_message_at).toLocaleDateString()
                      : item.status ?? 'active'}
                  </Text>
                </View>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── New Message Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={s.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Modal header */}
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={s.modalCancel}>
              <Text style={s.modalCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>New Message</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Search input */}
          <View style={s.searchRow}>
            <Text style={s.searchLabel}>To:</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search by name…"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color={colors.mint} style={{ marginLeft: 8 }} />}
          </View>

          {/* Error */}
          {modalErr && (
            <Text style={s.modalErr}>{modalErr}</Text>
          )}

          {/* Results */}
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              searchQuery.trim().length >= 2 && !searching ? (
                <Text style={[s.muted, { padding: 24, textAlign: 'center' }]}>No users found</Text>
              ) : searchQuery.trim().length < 2 ? (
                <Text style={[s.muted, { padding: 24, textAlign: 'center' }]}>Type 2+ characters to search</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.resultRow}
                onPress={() => startConversation(item)}
                disabled={starting}>
                <View style={s.resultAvatar}>
                  <Text style={s.avatarTxt}>
                    {(item.full_name ?? item.email)[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{item.full_name ?? '—'}</Text>
                  <Text style={s.rowSub}>{item.email}</Text>
                </View>
                {starting && <ActivityIndicator size="small" color={colors.mint} />}
              </TouchableOpacity>
            )}
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header:      {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title:       { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  muted:       { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  errText:     { fontSize: 13, color: '#e53e3e', textAlign: 'center', marginBottom: 16 },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginTop: 8, marginBottom: 4 },
  btn:         { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 10 },
  btnTxt:      { fontSize: 14, fontWeight: '700', color: '#fff' },
  row:         {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  avatar:      {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.mintMid, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarTxt:   { fontSize: 16, fontWeight: '800', color: colors.mintDark },
  rowTitle:    { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  rowSub:      { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron:     { fontSize: 22, color: colors.textMuted, marginLeft: 8 },
  // Modal
  modal:       { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  modalTitle:     { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  modalCancel:    { width: 60 },
  modalCancelTxt: { fontSize: 16, color: colors.mint },
  modalErr:       { fontSize: 13, color: '#e53e3e', paddingHorizontal: spacing.md, paddingVertical: 8 },
  searchRow:   {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  searchLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  resultRow:   {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  resultAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.mintMid, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
});
