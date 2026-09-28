/**
 * UserProfileScreen — Public profile for any user.
 * Shows avatar, name, user type, company (if vendor), and recent posts.
 * Opened from feed post avatars / names.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, fonts, shadows } from '../theme';
import { restGet } from '../lib/restClient';
import { createPost } from '../services/feed';
import type { FeedPost } from '../lib/types';

interface Props {
  userId: string;
  onBack: () => void;
}

export default function UserProfileScreen({ userId, onBack }: Props) {
  const { session, user } = useAuth();
  const { colors } = useTheme();
  const jwt = session?.access_token ?? null;
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!jwt) return;
      setLoading(true);
      try {
        // Fetch profile
        const profiles = await restGet<any[]>(
          `profiles?select=id,full_name,user_type,avatar_url,company_id,created_at&id=eq.${userId}`,
          jwt,
        );
        if (cancelled) return;
        const p = Array.isArray(profiles) ? profiles[0] : null;
        setProfile(p);

        // Fetch recent posts by this user
        const rows = await restGet<any[]>(
          `feed_posts?select=id,author_id,content,post_type,media_urls,likes_count,comments_count,created_at` +
          `&author_id=eq.${userId}&is_published=eq.true&order=created_at.desc&limit=20`,
          jwt,
        );
        if (cancelled) return;
        const author = {
          id: userId,
          full_name: p?.full_name ?? 'Unknown',
          user_type: p?.user_type ?? 'vendor',
          avatar_url: p?.avatar_url ?? null,
          company_name: null,
        };
        setPosts((rows ?? []).map((r: any) => ({
          id: r.id,
          content: r.content,
          post_type: r.post_type,
          media_urls: r.media_urls ?? [],
          likes_count: r.likes_count ?? 0,
          comments_count: r.comments_count ?? 0,
          bids_count: r.bids_count ?? 0,
          budget: r.budget ?? null,
          deadline: r.deadline ?? null,
          created_at: r.created_at,
          author,
          liked_by_me: false,
        })));
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, jwt]);

  const initials = (profile?.full_name ?? '?')
    .split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('') || '?';

  function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.mint} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textMuted }}>Profile not found</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.mint, fontFamily: fonts.semiBold }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        ListHeaderComponent={
          <View>
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <ArrowLeft size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Profile</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Profile hero */}
            <View style={styles.hero}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <Text style={styles.name}>{profile.full_name ?? 'Unknown'}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {profile.user_type === 'vendor' ? '🔧 Vendor' : profile.user_type === 'contractor' ? '🏗️ Contractor' : '👤 Member'}
                </Text>
              </View>
              <Text style={styles.joined}>
                Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{posts.reduce((a, p) => a + (p.likes_count ?? 0), 0)}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
            </View>

            {/* Recent posts heading */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Posts</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postContent}>{item.content}</Text>
            {item.media_urls && item.media_urls.length > 0 && item.media_urls[0].startsWith('data:') === false && (
              <Image source={{ uri: item.media_urls[0] }} style={styles.postImage} resizeMode="cover" />
            )}
            <View style={styles.postMeta}>
              <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
              <Text style={styles.postStats}>❤️ {item.likes_count} · 💬 {item.comments_count}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={posts.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  topBarTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarFallback: { backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 32, color: colors.mint },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary, marginBottom: 8 },
  typeBadge: {
    backgroundColor: colors.mintLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 8,
  },
  typeBadgeText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.mint },
  joined: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },

  statsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statNum: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },

  sectionHeader: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textSecondary },

  postCard: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  postContent: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  postImage: { width: '100%', height: 180, borderRadius: 10, marginTop: 10, backgroundColor: colors.border },
  postMeta: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
  },
  postTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  postStats: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textMuted },
});
