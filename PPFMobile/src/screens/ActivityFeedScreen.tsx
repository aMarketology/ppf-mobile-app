/**
 * ActivityFeedScreen — Modern Social Feed with Deep Blue Branding
 *
 * Instagram-style layout with distinct post type styling:
 *  • Deep Blue gradient hero with blockchain badge + total count
 *  • Clean top bar with logo + post button
 *  • Full-width cards with type-specific colors and icons
 *  • RFQ cards → blue accent, Offer cards → rose, Company → cyan, etc.
 *  • Full-screen create post modal with image support
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  ScrollView,
  AppState,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  type AppStateStatus,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Camera, FileText, Heart, Image as ImageIcon, MessageCircle, Receipt, Repeat2 } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { fetchActivities, subscribeToActivities } from '../services/activities';
import { createPost, fetchComments, createComment, fetchFeed, toggleLike, deleteComment } from '../services/feed';
import { useTheme } from '../context/ThemeContext';
import { ENV } from '../config/env';
import { spacing, radius, fonts, shadows } from '../theme';
import type { SiteActivity, ActivityType, ActivityFilter, FeedPost, FeedComment } from '../lib/types';

// ─── Type-specific styling ────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { icon: string; bg: string; border: string; label: string }> = {
  rfq_posted:           { icon: '📄', bg: '#EFF6FF', border: '#BFDBFE', label: 'RFQ Posted' },
  rfq_awarded:          { icon: '🏆', bg: '#D1FAE5', border: '#A7F3D0', label: 'Awarded' },
  offer_submitted:      { icon: '📈', bg: '#FFE4E6', border: '#FECDD3', label: 'Offer' },
  social_post_created:  { icon: '💬', bg: '#F3E8FF', border: '#E9D5FF', label: 'Post' },
  order_placed:         { icon: '🛒', bg: '#FEF3C7', border: '#FDE68A', label: 'Order' },
  order_completed:      { icon: '✅', bg: '#D1FAE5', border: '#A7F3D0', label: 'Completed' },
  company_joined:       { icon: '🏢', bg: '#CFFAFE', border: '#A5F3FC', label: 'New Company' },
  team_member_added:    { icon: '👤', bg: '#FFE4E6', border: '#FECDD3', label: 'Team Join' },
};

const FILTERS: ActivityFilter[] = [
  { key: 'all',                  label: 'All',         icon: '🌐' },
  { key: 'rfq_posted',           label: 'RFQs',        icon: '📄' },
  { key: 'offer_submitted',      label: 'Offers',      icon: '📈' },
  { key: 'order_placed',         label: 'Orders',      icon: '🛒' },
  { key: 'company_joined',       label: 'Companies',   icon: '🏢' },
  { key: 'social_post_created',  label: 'Posts',       icon: '💬' },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

type Props = { onNavigate: (screen: string) => void; onOpenProfile?: (userId: string) => void };

export default function ActivityFeedScreen({ onNavigate, onOpenProfile }: Props) {
  const { session, user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const jwt = session?.access_token ?? '';

  // Data — merged feed of activities + user posts
  const [activities, setActivities] = useState<SiteActivity[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all');

  // Create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [postText, setPostText] = useState('');
  const [postType, setPostType] = useState<string>('question');
  const [postBudget, setPostBudget] = useState('');
  const [postDeadline, setPostDeadline] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postImageBase64, setPostImageBase64] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // Vision assist
  const [assisting, setAssisting] = useState(false);
  const [assistError, setAssistError] = useState<string | null>(null);

  // Comment sheet
  const [commentPost, setCommentPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Merge activities + feed posts, sorted by created_at desc
  // Feed posts get priority (appear first for same timestamp)
  const mergedFeed = useMemo(() => {
    const items: Array<{ type: 'activity' | 'post'; data: SiteActivity | FeedPost; created_at: string }> = [
      ...activities.map(a => ({ type: 'activity' as const, data: a, created_at: a.created_at })),
      ...feedPosts.map(p => ({ type: 'post' as const, data: p, created_at: p.created_at })),
    ];
    // Sort by created_at desc, with posts getting priority
    items.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (diff === 0) return a.type === 'post' ? -1 : 1;
      return diff;
    });
    return items;
  }, [activities, feedPosts]);

  const load = useCallback(async (pageNum: number, type: ActivityType | 'all', search: string, isRefresh = false) => {
    if (!jwt) return;
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      // Fetch both activities and feed posts
      const [activityResult, feedResult] = await Promise.all([
        fetchActivities(jwt, pageNum, type, search),
        fetchFeed(jwt, pageNum, type === 'all' ? 'all' : type).catch(() => ({ posts: [], page: 0, hasMore: false })),
      ]);

      if (pageNum === 0) {
        setActivities(activityResult.activities);
        setFeedPosts(feedResult.posts ?? []);
      } else {
        setActivities(prev => [...prev, ...activityResult.activities]);
        setFeedPosts(prev => [...prev, ...(feedResult.posts ?? [])]);
      }
      setPage(activityResult.page);
      setHasMore(activityResult.hasMore || (feedResult.posts?.length ?? 0) >= 20);
      setTotal(activityResult.total);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [jwt]);

  useEffect(() => { load(0, activeFilter, ''); }, [load]);

  useEffect(() => {
    if (!jwt) return;
    const unsub = subscribeToActivities(jwt, (activity) => {
      setActivities(prev => [activity, ...prev]);
      setTotal(t => t + 1);
    });
    const listener = AppState.addEventListener('change', () => {});
    return () => { unsub(); listener.remove(); };
  }, [jwt]);

  function changeFilter(f: ActivityType | 'all') { setActiveFilter(f); load(0, f, ''); }
  function loadMore() { if (hasMore && !loadingMore && jwt) { const next = page + 1; load(next, activeFilter, ''); } }
  function onRefresh() { load(0, activeFilter, '', true); }

  function handleActivityPress(activity: SiteActivity) {
    if (activity.target_type === 'rfq' || activity.target_type === 'offer') onNavigate('RFQ');
  }

  async function handlePostSubmit() {
    if (!postText.trim() || !user?.id) return;
    setCreating(true);
    try {
      await createPost(jwt, postText.trim(), postType, postImageBase64 ? [postImageBase64] : [], postBudget ? parseFloat(postBudget) : undefined, postDeadline || undefined, user.id);
      setPostText(''); setPostType('question'); setPostBudget(''); setPostDeadline(''); setPostImage(null); setPostImageBase64(null); setShowCreate(false);
      Alert.alert('Posted!', 'Your update is live.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to post.');
    } finally { setCreating(false); }
  }

  async function pickImage() {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024, includeBase64: true });
    if (res.didCancel) return;
    const asset = res.assets?.[0];
    if (asset?.uri) setPostImage(asset.uri ?? null);
    if (asset?.base64) setPostImageBase64(asset.base64 ?? null);
  }

  async function takePhoto() {
    const res = await launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024, includeBase64: true });
    if (res.didCancel) return;
    const asset = res.assets?.[0];
    if (asset?.uri) setPostImage(asset.uri ?? null);
    if (asset?.base64) setPostImageBase64(asset.base64 ?? null);
  }

  // ── Vision assist: analyze the attached image and pre-fill the post ──────
  async function runVisionAssist() {
    if (!postImageBase64) {
      Alert.alert('Add an image first', 'Attach a photo, then tap "✨ Auto-write" to generate your post.');
      return;
    }
    setAssisting(true);
    setAssistError(null);
    try {
      const res = await fetch(`${ENV.SUPABASE_URL}/functions/v1/vision-assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ image_base64: postImageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Vision assist failed');

      // Pre-fill the post body with the suggested text (user can edit)
      const suggested = data.suggested_body || data.ocr_text || '';
      if (suggested) setPostText(suggested);
      Alert.alert('✨ Draft ready!', 'We analyzed your image and drafted a post. Edit it before publishing.');
    } catch (e: any) {
      setAssistError(e?.message ?? 'Could not analyze image');
      Alert.alert('Vision assist failed', e?.message ?? 'Could not analyze image');
    } finally {
      setAssisting(false);
    }
  }

  async function handleLike(postId: string) {
    if (!jwt) {
      Alert.alert('Sign in required', 'You must be signed in to like posts.');
      return;
    }
    // Optimistic update
    setFeedPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasLiked = !!p.liked_by_me;
      return { ...p, liked_by_me: !wasLiked, likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1 };
    }));
    try {
      await toggleLike(jwt, postId);
    } catch (e: any) {
      Alert.alert('Like failed', e?.message ?? 'Could not like post');
    }
  }

  async function handleComment(post: FeedPost) {
    setCommentPost(post);
    setCommentsLoading(true);
    setComments([]);
    try {
      const commentsData = await fetchComments(post.id, jwt);
      setComments(commentsData);
    } catch (e) {
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!jwt) return;
    try {
      await deleteComment(jwt, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (commentPost) {
        setFeedPosts(prev => prev.map(p =>
          p.id === commentPost.id
            ? { ...p, comments_count: Math.max(0, (p.comments_count ?? 1) - 1) }
            : p
        ));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to delete comment.');
    }
  }

  async function handleCommentSubmit() {
    if (!commentText.trim() || !commentPost?.id) return;
    setSubmittingComment(true);
    try {
      const newComment = await createComment(jwt ?? '', commentPost.id, commentText.trim(), user?.id);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      // Update post comment count in feed
      setFeedPosts(prev => prev.map(p =>
        p.id === commentPost.id
          ? { ...p, comments_count: (p.comments_count ?? 0) + 1 }
          : p
      ));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  }

  // ── Render: Header ──────────────────────────────────────────────────────

  const renderHeader = () => (
    <View>
      {/* Compose prompt — tap to create */}
      <View style={styles.composeWrap}>
        <TouchableOpacity
          style={styles.composeBox}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
        >
          <View style={styles.composeAvatar}>
            <Text style={styles.composeAvatarText}>
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.composePlaceholder} numberOfLines={1}>
            What's up? Write your post or need help with a project?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity key={f.key} style={[styles.filterPill, isActive && styles.filterPillActive]} onPress={() => changeFilter(f.key)} activeOpacity={0.7}>
                <Text style={styles.filterPillIcon}>{f.icon}</Text>
                <Text style={[styles.filterPillLabel, isActive && styles.filterPillLabelActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  // ── Render: Feed Post (user-created, with image support) ──────────────

  function renderFeedPost(post: FeedPost) {
    console.log('[Feed] rendering feed post:', post.id, 'liked:', post.liked_by_me);
    const typeStyle = TYPE_STYLES['social_post_created'] ?? { icon: '💬', bg: '#F3E8FF', border: '#E9D5FF', label: 'Post' };
    const typeLabel = post.post_type === 'parts_request' ? 'Parts Request' : post.post_type === 'project_showcase' ? 'Project' : 'Update';
    const initials = (post.author?.full_name ?? '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
    const hasImage = post.media_urls && post.media_urls.length > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
      >
        {/* Card Header — avatar + name + type chip + time; taps open profile */}
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.7}
          disabled={!onOpenProfile || !post.author?.id}
          onPress={() => { console.log('[Feed] header pressed, opening profile:', post.author?.id); onOpenProfile?.(post.author!.id!); }}
        >
          <View style={styles.cardAvatar}>
            <Text style={styles.cardAvatarText}>{initials}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>{post.author?.full_name ?? 'Unknown'}</Text>
              <View style={[styles.inlineChip, { backgroundColor: typeStyle.bg }]}>
                <Text style={styles.inlineChipIcon}>{typeStyle.icon}</Text>
                <Text style={[styles.inlineChipText, { color: '#7C3AED' }]}>{typeLabel}</Text>
              </View>
            </View>
            <Text style={styles.cardTime}>{timeAgo(post.created_at)}</Text>
          </View>
        </TouchableOpacity>

        {/* Image thumbnail — handles both data URIs and raw base64 */}
        {hasImage && (
          <View style={styles.postImageWrap}>
            <Image
              source={{ uri: post.media_urls[0].startsWith('data:') || post.media_urls[0].startsWith('http') ? post.media_urls[0] : `data:image/jpeg;base64,${post.media_urls[0]}` }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Content */}
        <Text style={styles.cardContent}>{post.content}</Text>

        {/* Parts request metadata */}
        {post.post_type === 'parts_request' && (
          <View style={styles.cardMeta}>
            {post.budget && <Text style={styles.metaTag}>💰 ${post.budget.toLocaleString()}</Text>}
            {post.deadline && <Text style={styles.metaTag}>⏱️ {post.deadline}</Text>}
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => handleLike(post.id)}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Heart size={22} color={post.liked_by_me ? '#EF4444' : colors.textMuted} fill={post.liked_by_me ? '#EF4444' : 'none'} strokeWidth={post.liked_by_me ? 2.4 : 1.8} />
            <Text style={styles.actionCount}>{post.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => handleComment(post)}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MessageCircle size={22} color={colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.actionCount}>{post.comments_count}</Text>
          </TouchableOpacity>
          {post.post_type === 'parts_request' && (
            <View style={styles.actionRow}>
              <Text style={styles.actionLink}>Bid →</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ── Render: Activity Card with type-specific styling ────────────────────

  function renderActivity(activity: SiteActivity) {
    const typeStyle = TYPE_STYLES[activity.activity_type] ?? { icon: '📌', bg: colors.bg, border: colors.border, label: 'Event' };
    const initials = (activity.actor?.full_name ?? '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={() => handleActivityPress(activity)}>
        {/* Card Header — avatar + name + type chip + time */}
        <View style={styles.cardHeader}>
          <View style={styles.cardAvatar}>
            <Text style={styles.cardAvatarText}>{initials}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>{activity.actor?.full_name ?? 'Unknown'}</Text>
              <View style={[styles.inlineChip, { backgroundColor: typeStyle.bg }]}>
                <Text style={styles.inlineChipIcon}>{typeStyle.icon}</Text>
                <Text style={[styles.inlineChipText, { color: typeStyle.border === '#BFDBFE' ? colors.mint : colors.textSecondary }]}>{typeStyle.label}</Text>
              </View>
            </View>
            <Text style={styles.cardTime}>{timeAgo(activity.created_at)}</Text>
          </View>
        </View>

        {/* Card Content */}
        <Text style={styles.cardContent}>{activity.summary}</Text>

        {/* Metadata tags */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <View style={styles.cardMeta}>
            {activity.metadata?.budget && <Text style={styles.metaTag}>💰 {activity.metadata.budget}</Text>}
            {activity.metadata?.location && <Text style={styles.metaTag}>📍 {activity.metadata.location}</Text>}
            {activity.metadata?.category && <View style={[styles.metaPill, { backgroundColor: typeStyle.bg }]}><Text style={[styles.metaPillText, { color: typeStyle.border === '#BFDBFE' ? colors.mint : colors.textSecondary }]}>{activity.metadata.category}</Text></View>}
            {activity.metadata?.offer_amount && <Text style={styles.metaTag}>💵 ${Number(activity.metadata.offer_amount).toLocaleString()}</Text>}
          </View>
        )}

        {/* Card Actions */}
        <View style={styles.cardActions}>
          <View style={styles.actionRow}>
            <Heart size={16} color={colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.actionCount}>0</Text>
          </View>
          <View style={styles.actionRow}>
            <MessageCircle size={16} color={colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.actionCount}>0</Text>
          </View>
          <View style={styles.actionRow}>
            <Repeat2 size={16} color={colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.actionCount}>{activity.row_hash?.substring(0, 6) ?? '...'}</Text>
          </View>
          {activity.target_type === 'rfq' && (
            <View style={styles.actionRow}>
              <Text style={styles.actionLink}>View →</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ── Render: Footer ──────────────────────────────────────────────────────

  function renderFooter() {
    if (loading || activities.length === 0) return null;
    return (
      <View style={styles.footer}>
        {hasMore && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
            {loadingMore ? <ActivityIndicator size="small" color={colors.mint} /> : <Text style={styles.loadMoreText}>Load more</Text>}
          </TouchableOpacity>
        )}
        <View style={styles.footerInfo}>
          <Text style={styles.footerInfoText}>🔗 {total.toLocaleString()} events · SHA256 chained</Text>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>No activity yet</Text>
        <Text style={styles.emptyText}>Activity will appear here as things happen on the platform.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mint} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle={colors.bg === '#080808' ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      <FlatList
        data={mergedFeed}
        keyExtractor={item => `${item.type}-${item.data.id}`}
        renderItem={({ item }) => {
          if (item.type === 'post') {
            const post = item.data as FeedPost;
            return renderFeedPost(post);
          }
          return renderActivity(item.data as SiteActivity);
        }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Create Post Modal ──────────────────────────────────────────────── */}
      <Modal visible={showCreate} animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.createRoot}>
          <View style={styles.createTopBar}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.createCancelBtn}>
              <Text style={styles.createCancelText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.createTitle}>New Post</Text>
            <TouchableOpacity onPress={handlePostSubmit} disabled={creating || !postText.trim()} style={[styles.createPostBtn, (!postText.trim() || creating) && styles.createPostBtnDisabled]}>
              {creating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.createPostText}>Post</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.createBody} keyboardShouldPersistTaps="handled">
            {/* Composer header — avatar + name */}
            <View style={styles.composerHeader}>
              <View style={styles.composerAvatar}>
                <Text style={styles.composerAvatarText}>
                  {(user?.email?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.composerName}>{user?.email ?? 'You'}</Text>
                <Text style={styles.composerPrompt}>
                  {postType === 'parts_request' ? 'Request parts or services' : postType === 'project_showcase' ? 'Showcase your work' : 'Ask the community'}
                </Text>
              </View>
            </View>

            {/* Post type chips: question, photo, service */}
            <View style={styles.createTypeRow}>
              {[
                { key: 'question', label: '❓ Question' },
                { key: 'project_showcase', label: '📸 Photo' },
                { key: 'parts_request', label: '🔩 Service' },
              ].map(item => {
                const isActive = postType === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.createTypeChip, isActive && styles.createTypeChipActive]}
                    onPress={() => setPostType(item.key)}
                  >
                    <Text style={[styles.createTypeChipText, isActive && styles.createTypeChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Image Preview */}
            {postImage && (
              <View style={styles.createImageWrap}>
                <Image source={{ uri: postImage }} style={styles.createImage} />
                <TouchableOpacity style={styles.createRemoveImage} onPress={() => { setPostImage(null); setPostImageBase64(null); }}>
                  <Text style={styles.createRemoveImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.createInput}
              value={postText}
              onChangeText={setPostText}
              placeholder={
                postType === 'parts_request'
                  ? "Describe the parts or service you need...\n\nInclude: material, quantity, tolerances, timeline"
                  : postType === 'project_showcase'
                  ? "Share your project photo...\n\nWhat did you build? What machinery was used?"
                  : "Ask your question...\n\nInclude details so the community can help"
              }
              placeholderTextColor={colors.textMuted}
              multiline textAlignVertical="top" autoFocus
            />

            {postType === 'parts_request' && (
              <View style={styles.createExtras}>
                <TextInput style={styles.createExtraInput} value={postBudget} onChangeText={setPostBudget} placeholder="Budget ($)" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
                <TextInput style={styles.createExtraInput} value={postDeadline} onChangeText={setPostDeadline} placeholder="Deadline (e.g. 2 weeks)" placeholderTextColor={colors.textMuted} />
              </View>
            )}

            {/* Toolbar Action Row: Camera, Gallery, Scan Receipt, New RFQ */}
            <View style={styles.toolsRow}>
              <TouchableOpacity style={styles.toolIconBtn} onPress={takePhoto} activeOpacity={0.7}>
                <Camera size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolIconBtn} onPress={pickImage} activeOpacity={0.7}>
                <ImageIcon size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              {postImageBase64 && (
                <TouchableOpacity
                  style={[styles.toolNavBtn, assisting && styles.toolNavBtnDisabled]}
                  onPress={runVisionAssist}
                  disabled={assisting}
                  activeOpacity={0.7}
                >
                  {assisting ? (
                    <ActivityIndicator size="small" color={colors.mint} style={{ marginRight: 6 }} />
                  ) : (
                    <Text style={{ fontSize: 14, marginRight: 6 }}>✨</Text>
                  )}
                  <Text style={styles.toolNavBtnText}>{assisting ? 'Analyzing…' : 'Auto-write'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.toolNavBtn}
                onPress={() => { setShowCreate(false); onNavigate('ScanReceipt'); }}
                activeOpacity={0.7}
              >
                <Receipt size={16} color={colors.mint} style={{ marginRight: 6 }} />
                <Text style={styles.toolNavBtnText}>Scan Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolNavBtn}
                onPress={() => { setShowCreate(false); onNavigate('CreateRFQ'); }}
                activeOpacity={0.7}
              >
                <FileText size={16} color={colors.mint} style={{ marginRight: 6 }} />
                <Text style={styles.toolNavBtnText}>New RFQ</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Comment Sheet ──────────────────────────────────────────────────── */}
      <Modal
        visible={commentPost !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCommentPost(null)}
      >
        <KeyboardAvoidingView style={styles.commentRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={styles.commentTopBar}>
            <TouchableOpacity onPress={() => setCommentPost(null)} style={styles.createCancelBtn}>
              <Text style={styles.createCancelText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.createTitle}>Comments</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Comment list */}
          <FlatList
            data={comments}
            keyExtractor={c => c.id}
            contentContainerStyle={styles.commentList}
            ListEmptyComponent={
              commentsLoading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="small" color={colors.mint} />
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptyText}>Be the first to reply.</Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <View style={styles.cardAvatar}>
                  <Text style={styles.cardAvatarText}>
                    {(item.author?.full_name ?? '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')}
                  </Text>
                </View>
                <View style={styles.commentBubble}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.author?.full_name ?? 'Unknown'}</Text>
                    <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
                {item.author?.id === user?.id && (
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => Alert.alert('Delete comment', 'Remove this comment?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteComment(item.id) },
                    ])}
                    style={styles.commentDeleteBtn}
                  >
                    <Text style={styles.commentDeleteText}>🗑</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          {/* Composer */}
          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.commentSendBtn, (!commentText.trim() || submittingComment) && styles.commentSendBtnDisabled]}
              onPress={handleCommentSubmit}
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.commentSendText}>Post</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  listContent: { paddingBottom: 24 },

  // Compose prompt (Twitter-style)
  composeWrap: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  composeBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 24,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  composeAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  composeAvatarText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' },
  composePlaceholder: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Filter Pills
  filterWrap: {
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
  },
  filterPillActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  filterPillIcon: { fontSize: 12 },
  filterPillLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSecondary },
  filterPillLabelActive: { color: colors.white },

  // Card — flat, edge-to-edge, divider-only (Twitter-style)
  card: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },

  // Inline type chip (next to name)
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inlineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 8,
  },
  inlineChipIcon: { fontSize: 9 },
  inlineChipText: { fontFamily: fonts.semiBold, fontSize: 10 },

  // Type Badge
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
    marginBottom: 8,
  },
  typeBadgeIcon: { fontSize: 12 },
  typeBadgeLabel: { fontFamily: fonts.semiBold, fontSize: 10 },

  // Card Header
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  cardAvatarText: { fontFamily: fonts.bold, fontSize: 13, color: colors.mint },
  cardHeaderText: { flex: 1 },
  cardName: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textPrimary },
  cardTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },

  // Content
  cardContent: {
    fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary,
    lineHeight: 20, marginBottom: 8,
  },

  // Post image
  postImageWrap: {
    borderRadius: 10, overflow: 'hidden',
    marginBottom: 8,
  },
  postImage: {
    width: '100%', height: 180,
    borderRadius: 10, backgroundColor: colors.border,
  },

  // Meta
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  metaTag: {
    fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary,
    backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 12,
  },
  metaPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  metaPillText: { fontFamily: fonts.semiBold, fontSize: 11 },

  // Actions
  cardActions: {
    flexDirection: 'row', gap: 32,
    paddingTop: 8,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 12,
    minWidth: 64, minHeight: 44, justifyContent: 'center',
  },
  actionCount: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  actionLink: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.mint },

  // Footer
  footer: { paddingVertical: 24, alignItems: 'center', gap: 12 },
  loadMoreBtn: { paddingHorizontal: 24, paddingVertical: 10 },
  loadMoreText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.mint },
  footerInfo: { paddingHorizontal: 16 },
  footerInfoText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary, marginBottom: 6 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // ── Create Post Modal ──────────────────────────────────────────────────
  createRoot: { flex: 1, backgroundColor: colors.bg },
  createTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  createCancelBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  createCancelText: { fontFamily: fonts.bold, fontSize: 16, color: colors.textSecondary },
  createTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.textPrimary },
  createPostBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  createPostBtnDisabled: { opacity: 0.4 },
  createPostText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' },
  createBody: { padding: 16, gap: 16, paddingBottom: 40 },

  // Composer header (avatar + name + prompt)
  composerHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10,
  },
  composerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center',
  },
  composerAvatarText: { fontFamily: fonts.bold, fontSize: 16, color: '#FFFFFF' },
  composerName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary },
  composerPrompt: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 1 },

  createImageWrap: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  createImage: { width: '100%', height: 240, borderRadius: 16, backgroundColor: colors.border },
  createRemoveImage: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  createRemoveImageText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' },
  createImagePlaceholder: { flexDirection: 'row', gap: 12, height: 100 },
  createImageBtn: { flex: 1, backgroundColor: colors.bg, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  createImageBtnIcon: { fontSize: 28, marginBottom: 6 },
  createImageBtnText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  createTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  createTypeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  createTypeChipActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  createTypeChipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  createTypeChipTextActive: { color: colors.white },
  createInput: {
    fontFamily: fonts.regular, fontSize: 16, color: colors.textPrimary,
    backgroundColor: colors.bg, borderRadius: 16, padding: 16,
    minHeight: 160, borderWidth: 1, borderColor: colors.border,
    textAlignVertical: 'top', lineHeight: 24,
  },
  createExtras: { gap: 12 },
  createExtraInput: {
    fontFamily: fonts.regular, fontSize: 15, color: colors.textPrimary,
    backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border,
  },

  // Tools Row (camera, gallery, receipt scan, RFQ)
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toolIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolNavBtnDisabled: {
    opacity: 0.6,
  },
  toolNavBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
  },

  // ── Comment Sheet Styles ────────────────────────────────────────────────
  commentRoot: { flex: 1, backgroundColor: colors.bg },
  commentTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  commentList: { paddingHorizontal: 16, paddingBottom: 16 },
  commentRow: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    maxWidth: '80%',
  },
  commentHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
  },
  commentText: {
    fontFamily: fonts.regular, fontSize: 14, color: colors.textPrimary,
    lineHeight: 20,
  },
  commentDeleteBtn: {
    marginLeft: 4, padding: 4, alignSelf: 'flex-start',
  },
  commentDeleteText: { fontSize: 14 },
  commentComposer: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingTop: 12, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  commentInput: {
    flex: 1,
    fontFamily: fonts.regular, fontSize: 16, color: colors.textPrimary,
    backgroundColor: colors.bg, borderRadius: 16, padding: 12,
    marginRight: 8,
    maxHeight: 120,
    borderWidth: 1, borderColor: colors.border,
    textAlignVertical: 'top', lineHeight: 22,
  },
  commentSendBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  commentSendBtnDisabled: { opacity: 0.4 },
  commentSendText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' },
});