import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  fetchConversations, searchUsers, getOrCreateConversation, fetchProfiles,
  fetchUnreadCount, type Conv, type UserResult,
} from '../services/messages';
import { spacing, radius, fonts } from '../theme';
import ConversationScreen from './ConversationScreen';

type SectionTab = 'all' | 'channels' | 'groups' | 'dms';

type Props = { onNavigate: (screen: string) => void };

export default function MessagesScreen({ onNavigate }: Props) {
  const { user, session, profile } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const jwt = session?.access_token ?? '';
  const tokenBalance = profile?.token_balance ?? 0;

  // ── Conversation list state ───────────────────────────────────────────────
  const [convs,    setConvs]    = useState<Conv[]>([]);
  const [userMap,  setUserMap]  = useState<Record<string, UserResult>>({});
  const [status,   setStatus]   = useState<'loading' | 'error' | 'done'>('loading');
  const [err,      setErr]      = useState<string | null>(null);
  const [open,     setOpen]     = useState<Conv | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});

  // ── New Message modal state ───────────────────────────────────────────────
  const [showModal,    setShowModal]    = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [starting,     setStarting]     = useState(false);
  const [modalErr,     setModalErr]     = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Section tab state ────────────────────────────────────────────────────
  const [sectionTab, setSectionTab] = useState<SectionTab>('all');
  const [convSearch, setConvSearch] = useState('');

  const SECTION_TABS: { key: SectionTab; label: string; icon: string }[] = [
    { key: 'all',      label: 'All',       icon: '💬' },
    { key: 'channels', label: 'Channels',  icon: '#' },
    { key: 'groups',   label: 'Groups',    icon: '👥' },
    { key: 'dms',      label: 'DMs',       icon: '✉️' },
  ];

  // ── Load conversations ────────────────────────────────────────────────────
  function loadConvs() {
    if (!user || !jwt) { setStatus('done'); return; }
    setStatus('loading');
    setErr(null);
    fetchConversations(user.id, jwt)
      .then(async data => {
        setConvs(data);
        // Resolve partner names
        const partnerIds = data.map(c =>
          c.participant_one_id === user.id ? c.participant_two_id : c.participant_one_id,
        ).filter(Boolean);
        const unique = [...new Set(partnerIds)];
        if (unique.length > 0) {
          try {
            const profiles = await fetchProfiles(unique, jwt);
            const map: Record<string, UserResult> = {};
            profiles.forEach(p => { map[p.id] = p; });
            setUserMap(prev => ({ ...prev, ...map }));
          } catch (_) { /* non-fatal */ }
        }
        // Fetch unread counts
        try {
          const counts = await fetchUnreadCount(user.id, data.map(c => c.id), jwt);
          setUnreadCounts(counts);
        } catch (_) { /* non-fatal */ }
        setStatus('done');
      })
      .catch(e => { setErr(String(e?.message ?? e)); setStatus('error'); });
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

  // ── Render: main inbox (Slack-style) ──────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Header with token balance */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Messages</Text>
          <Text style={s.subtitle}>Slack-style workspace</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.tokenBadge}
            onPress={() => onNavigate('Tokens')}
            activeOpacity={0.7}
          >
            <Text style={s.tokenIcon}>🪙</Text>
            <Text style={s.tokenText}>{tokenBalance}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.newBtn} onPress={() => setShowModal(true)}>
            <Text style={s.newBtnIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search conversations */}
      <View style={s.convSearchWrap}>
        <View style={s.convSearchBox}>
          <Text style={s.convSearchIcon}>🔍</Text>
          <TextInput
            style={s.convSearchInput}
            value={convSearch}
            onChangeText={setConvSearch}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {/* Section Tabs — Slack-style */}
      <View style={s.sectionTabs}>
        {SECTION_TABS.map(tab => {
          const isActive = sectionTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.sectionTab, isActive && s.sectionTabActive]}
              onPress={() => setSectionTab(tab.key)}
            >
              <Text style={s.sectionTabIcon}>{tab.icon}</Text>
              <Text style={[s.sectionTabText, isActive && s.sectionTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Conversation list */}
      {convs.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>💬</Text>
          <Text style={s.emptyTitle}>No conversations yet</Text>
          <Text style={s.muted}>Start a new message to get going</Text>
          <TouchableOpacity style={[s.newBtnLarge, { marginTop: 20 }]} onPress={() => setShowModal(true)}>
            <Text style={s.newBtnLargeText}>+ New Message</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={convs.filter(c => {
            if (convSearch) {
              const partnerId = c.participant_one_id === user?.id ? c.participant_two_id : c.participant_one_id;
              const name = (userMap[partnerId]?.full_name ?? '').toLowerCase();
              return name.includes(convSearch.toLowerCase());
            }
            return true;
          })}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const partnerId = item.participant_one_id === user?.id
              ? item.participant_two_id
              : item.participant_one_id;
            const partner = userMap[partnerId];
            const displayName = partner?.full_name ?? partner?.email ?? 'Direct Message';
            const initial = displayName[0].toUpperCase();
            const unreadCount = unreadCounts[item.id] ?? 0;
            const isUnlocked = item.is_unlocked !== false;
            const timeStr = item.last_message_at
              ? formatTime(item.last_message_at)
              : '';

            return (
              <TouchableOpacity
                style={[s.row, unreadCount > 0 && s.rowUnread]}
                onPress={() => setOpen(item)}
                activeOpacity={0.7}
              >
                {/* Avatar with online dot */}
                <View style={s.avatarWrap}>
                  <View style={[s.avatar, unreadCount > 0 && s.avatarUnread]}>
                    <Text style={s.avatarTxt}>{initial}</Text>
                  </View>
                  {!isUnlocked && (
                    <View style={s.lockBadge}>
                      <Text style={s.lockBadgeText}>🔒</Text>
                    </View>
                  )}
                </View>

                {/* Name + preview */}
                <View style={s.rowContent}>
                  <View style={s.rowTop}>
                    <Text style={[s.rowTitle, unreadCount > 0 && s.rowTitleUnread]} numberOfLines={1}>
                      {!isUnlocked ? '🔒 ' : ''}{displayName}
                    </Text>
                    {timeStr ? (
                      <Text style={[s.rowTime, unreadCount > 0 && s.rowTimeUnread]}>{timeStr}</Text>
                    ) : null}
                  </View>
                  <Text style={[s.rowPreview, unreadCount > 0 && s.rowPreviewUnread]} numberOfLines={1}>
                    {item.last_message_at ? 'Tap to view conversation' : 'New conversation — say hello! 👋'}
                  </Text>
                </View>

                {/* Unread badge */}
                {unreadCount > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeTxt}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
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
              style={s.searchField}
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const createStyles = (colors: any) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header:      {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title:       { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary },
  subtitle:    { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
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
  avatarWrap: {
    position: 'relative',
    width: 44, height: 44, borderRadius: 22,
    marginRight: 12,
  },
  avatar:      {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.mintMid, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt:   { fontSize: 16, fontWeight: '800', color: colors.mintDark },
  lockBadge: {
    position: 'absolute',
    right: -4, top: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
  },
  lockBadgeText: {
    fontSize: 12, color: '#fff',
  },
  rowContent: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  rowTitle:    { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  rowTitleUnread: { fontWeight: '700', color: colors.textPrimary },
  rowTime: {
    fontSize: 12, color: colors.textMuted,
  },
  rowTimeUnread: {
    fontWeight: '700', color: colors.textPrimary,
  },
  rowPreview: {
    fontSize: 13, color: colors.textMuted, marginTop: 2,
  },
  rowPreviewUnread: {
    fontWeight: '500', color: colors.textPrimary,
  },
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
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.textPrimary,
  },
  searchField: {
    flex: 1, fontSize: 15, color: colors.textPrimary,
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
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
  badge: {
    minWidth: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  badgeTxt: {
    fontSize: 12, fontWeight: '700', color: '#fff',
  },
  // Tabs
  tabs: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2, borderBottomColor: colors.mint,
  },
  tabTxt: {
    fontSize: 15, fontWeight: '600', color: colors.textPrimary,
  },
  tabTxtActive: {
    color: colors.mint,
  },
  // Section Tabs
  sectionTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 8,
  },
  sectionTab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
  },
  sectionTabActive: {
    backgroundColor: colors.mint, borderColor: colors.mint,
  },
  sectionTabIcon: {
    fontSize: 12,
  },
  sectionTabText: {
    fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary,
  },
  sectionTabTextActive: {
    color: colors.white,
  },
  // Header
  headerRight: {
    flexDirection: 'row', alignItems: 'center',
  },
  tokenBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.mint, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 6, marginRight: 12,
  },
  tokenIcon: {
    fontSize: 16, color: '#fff', marginRight: 4,
  },
  tokenText: {
    fontSize: 14, fontWeight: '700', color: '#fff',
  },
  newBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center',
  },
  newBtnIcon: {
    fontSize: 24, color: '#fff', lineHeight: 24,
  },
  // Empty state
  emptyIcon: {
    fontSize: 48,
  },
  newBtnLarge: {
    backgroundColor: colors.mint, borderRadius: radius.md, paddingVertical: 12,
    paddingHorizontal: 20, alignItems: 'center',
  },
  newBtnLargeText: {
    fontSize: 16, fontWeight: '700', color: '#fff',
  },
  // Row states
  rowUnread: {
    backgroundColor: 'rgba(14,165,233,0.12)', // sky-500/12 subtle highlight
  },
  avatarUnread: {
    borderWidth: 2, borderColor: colors.mint,
  },
  rowSub: {
    fontSize: 13, color: colors.textMuted, marginTop: 2,
  },
  // Search conversations
  convSearchWrap: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  convSearchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  convSearchIcon: {
    fontSize: 14, marginRight: 8, color: colors.textMuted,
  },
  convSearchInput: {
    flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.textPrimary,
  },
});
