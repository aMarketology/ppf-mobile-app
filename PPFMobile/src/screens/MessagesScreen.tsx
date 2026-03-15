import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { messagesService } from '../services/messages';
import { useAuth } from '../context/AuthContext';
import type { Conversation } from '../lib/types';
import ConversationScreen from './ConversationScreen';

type Props = { onNavigate: (screen: string) => void };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function avatarLetters(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function MessagesScreen({ onNavigate }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openConv, setOpenConv] = useState<Conversation | null>(null);

  // ── If a conversation is open, show its screen ───────────────────────────
  if (openConv) {
    return (
      <ConversationScreen
        conversation={openConv}
        onBack={() => setOpenConv(null)}
      />
    );
  }

  const load = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const data = await messagesService.getMyConversations(user.id);
      setConversations(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mint} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>Sign in to view messages</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('Auth')}>
          <Text style={styles.actionBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <Text style={styles.headerSub}>{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.composeBtn}>
          <Text style={styles.composeBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.mint} />
          }>
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>Contact a supplier to get started</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('Marketplace')}>
                <Text style={styles.actionBtnText}>Browse Suppliers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            conversations.map((conv) => {
              const unread = conv.unread_count ?? 0;
              const title = conv.subject ?? 'Conversation';
              return (
                <TouchableOpacity key={conv.id} style={[styles.row, unread > 0 && styles.rowUnread]} activeOpacity={0.85} onPress={() => setOpenConv(conv)}>
                  <View style={[styles.avatar, unread > 0 && styles.avatarUnread]}>
                    <Text style={styles.avatarText}>{avatarLetters(title)}</Text>
                  </View>
                  <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                      <Text style={[styles.rowTitle, unread > 0 && styles.rowTitleBold]} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={styles.rowTime}>
                        {conv.last_message_at ? timeAgo(conv.last_message_at) : ''}
                      </Text>
                    </View>
                    <View style={styles.rowBottom}>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {conv.status === 'active' ? 'Active' : conv.status}
                      </Text>
                      {unread > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{unread}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 13, color: colors.mint, marginTop: 2, fontWeight: '600' },
  composeBtn: {
    backgroundColor: colors.mint, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  composeBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.white },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  actionBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: 1,
  },
  rowUnread: { backgroundColor: colors.mintLight },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.mintMid, alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  avatarUnread: { backgroundColor: colors.mint },
  avatarText: { fontSize: 16, fontWeight: '800', color: colors.mintDark },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: colors.textPrimary, flex: 1, marginRight: 8 },
  rowTitleBold: { fontWeight: '700' },
  rowTime: { fontSize: 12, color: colors.textMuted },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowSub: { fontSize: 13, color: colors.textMuted, flex: 1 },
  badge: {
    backgroundColor: colors.mint, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.white },
});
