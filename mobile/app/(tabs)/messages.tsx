import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MessageCircle } from 'lucide-react-native';
import { supabase, type Conversation, type Profile } from '../../lib/supabase';
import { colors, spacing, radius, fonts, shadows } from '../../lib/theme';
import { formatDistanceToNow } from 'date-fns';

type ConversationWithProfiles = Conversation & {
  p1: Profile;
  p2: Profile;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
};

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<ConversationWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myId, setMyId] = useState<string>('');

  useEffect(() => { loadConversations(); }, []);

  async function loadConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyId(user.id);

    const { data } = await supabase
      .from('user_conversations')
      .select(`
        *,
        p1:profiles!participant_one_id(*),
        p2:profiles!participant_two_id(*)
      `)
      .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    setConversations((data as ConversationWithProfiles[]) ?? []);
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  function getOtherProfile(convo: ConversationWithProfiles): Profile {
    return convo.participant_one_id === myId ? convo.p2 : convo.p1;
  }

  function renderConversation({ item }: { item: ConversationWithProfiles }) {
    const other = getOtherProfile(item);
    const hasUnread = (item.unread_count ?? 0) > 0;

    return (
      <TouchableOpacity
        style={styles.convoRow}
        onPress={() => router.push(`/messages/${item.id}` as any)}
        activeOpacity={0.7}
      >
        {other.avatar_url ? (
          <Image source={{ uri: other.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{other.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={styles.convoInfo}>
          <View style={styles.convoTop}>
            <Text style={[styles.convoName, hasUnread && styles.bold]}>{other.full_name}</Text>
            {item.last_message_at && (
              <Text style={styles.time}>
                {formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })}
              </Text>
            )}
          </View>
          <View style={styles.convoBottom}>
            <Text style={[styles.lastMsg, hasUnread && styles.bold]} numberOfLines={1}>
              {item.last_message ?? 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
          {other.company_name ? (
            <Text style={styles.company}>{other.company_name}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
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
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={c => c.id}
        renderItem={renderConversation}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MessageCircle size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Browse the marketplace and send a message to an engineer to get started.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  convoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 20, color: colors.primary },
  convoInfo: { flex: 1, marginLeft: spacing.md },
  convoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convoName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  time: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  convoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, flex: 1 },
  bold: { fontFamily: fonts.semiBold, color: colors.text },
  unreadBadge: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  company: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 78 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
