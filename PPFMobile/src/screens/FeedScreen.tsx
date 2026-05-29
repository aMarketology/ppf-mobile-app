/**
 * FeedScreen — Comprehensive PPF Community Feed
 *
 * Combines:
 *  • Community posts (updates, project showcases, milestones)
 *  • Job postings (job_post) — with apply CTA
 *  • Parts requests (parts_request) — with live bid panel
 *
 * Powered by PPFFeedSDK → precisionprojectflow.com
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  fetchFeed,
  createPost,
  toggleLike,
  fetchComments,
  postComment,
  fetchBids,
  placeBid,
} from '../services/feed';
import { colors, spacing, radius, fonts } from '../theme';
import type { FeedPost, FeedComment, FeedBid, PostType } from '../lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'update' | 'project_showcase' | 'job_post' | 'milestone' | 'parts_request';

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all',              label: 'All',       icon: '🌐' },
  { key: 'update',           label: 'Updates',   icon: '📝' },
  { key: 'project_showcase', label: 'Projects',  icon: '🏗️' },
  { key: 'job_post',         label: 'Jobs',      icon: '💼' },
  { key: 'milestone',        label: 'Milestones',icon: '🏆' },
  { key: 'parts_request',    label: 'Parts',     icon: '🔩' },
];

const POST_TYPES: { key: PostType; label: string; icon: string }[] = [
  { key: 'update',           label: 'Update',           icon: '📝' },
  { key: 'project_showcase', label: 'Project Showcase', icon: '🏗️' },
  { key: 'job_post',         label: 'Job Posting',      icon: '💼' },
  { key: 'milestone',        label: 'Milestone',        icon: '🏆' },
  { key: 'parts_request',    label: 'Parts Request',    icon: '🔩' },
];

const TYPE_COLORS: Record<string, string> = {
  update:           '#3b82f6',
  project_showcase: '#8b5cf6',
  job_post:         '#f59e0b',
  milestone:        '#10b981',
  parts_request:    '#ef4444',
};

type Props = { onNavigate: (screen: string) => void };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeedScreen({ onNavigate }: Props) {
  const { user, session } = useAuth();
  const jwt = session?.access_token ?? '';

  // Feed state
  const [posts,       setPosts]       = useState<FeedPost[]>([]);
  const [page,        setPage]        = useState(0);
  const [hasMore,     setHasMore]     = useState(true);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [filter,      setFilter]      = useState<FilterTab>('all');

  // Comments sheet
  const [commentsPost,    setCommentsPost]    = useState<FeedPost | null>(null);
  const [comments,        setComments]        = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText,     setCommentText]     = useState('');
  const [postingComment,  setPostingComment]  = useState(false);

  // Bids sheet
  const [bidsPost,    setBidsPost]    = useState<FeedPost | null>(null);
  const [bids,        setBids]        = useState<FeedBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidAmount,   setBidAmount]   = useState('');
  const [bidNote,     setBidNote]     = useState('');
  const [placingBid,  setPlacingBid]  = useState(false);

  // Create post modal
  const [showCreate,  setShowCreate]  = useState(false);
  const [newContent,  setNewContent]  = useState('');
  const [newType,     setNewType]     = useState<PostType>('update');
  const [newBudget,   setNewBudget]   = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating,    setCreating]    = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async (isRefresh = false, typeFilter?: FilterTab) => {
    if (!jwt) return;
    const active = typeFilter ?? filter;
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
      setError(null);
      const res = await fetchFeed(jwt, 0, active === 'all' ? 'all' : active);
      setPosts(res.posts ?? []);
      setPage(0);
      setHasMore(res.hasMore ?? false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwt, filter]);

  useEffect(() => { load(); }, [load]);

  async function loadMore() {
    if (!hasMore || loadingMore || !jwt) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await fetchFeed(jwt, next, filter === 'all' ? 'all' : filter);
      setPosts(prev => [...prev, ...(res.posts ?? [])]);
      setPage(next);
      setHasMore(res.hasMore ?? false);
    } catch (_) { /* ignore */ }
    finally { setLoadingMore(false); }
  }

  function changeFilter(f: FilterTab) {
    setFilter(f);
    load(false, f);
  }

  // ── Likes ──────────────────────────────────────────────────────────────────

  async function handleLike(postId: string) {
    if (!jwt) return;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasLiked = p.liked_by_me;
      return { ...p, liked_by_me: !wasLiked, likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1 };
    }));
    try { await toggleLike(jwt, postId); }
    catch (_) {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 };
      }));
    }
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async function openComments(post: FeedPost) {
    setCommentsPost(post);
    setComments([]);
    setCommentsLoading(true);
    try {
      const data = await fetchComments(jwt, post.id);
      setComments(data);
    } catch (_) { /* show empty */ }
    finally { setCommentsLoading(false); }
  }

  async function submitComment() {
    if (!commentText.trim() || postingComment || !commentsPost) return;
    const text = commentText.trim();
    setPostingComment(true);
    try {
      await postComment(jwt, commentsPost.id, text);
      setCommentText('');
      const data = await fetchComments(jwt, commentsPost.id);
      setComments(data);
      setPosts(prev => prev.map(p =>
        p.id === commentsPost.id ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to post comment');
    } finally { setPostingComment(false); }
  }

  // ── Bids ───────────────────────────────────────────────────────────────────

  async function openBids(post: FeedPost) {
    setBidsPost(post);
    setBids([]);
    setBidsLoading(true);
    try {
      const data = await fetchBids(jwt, post.id);
      setBids(data);
    } catch (_) { /* show empty */ }
    finally { setBidsLoading(false); }
  }

  async function submitBid() {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0 || placingBid || !bidsPost) return;
    setPlacingBid(true);
    try {
      const bid = await placeBid(jwt, bidsPost.id, amount, bidNote.trim() || undefined);
      setBids(prev => [bid, ...prev]);
      setBidAmount('');
      setBidNote('');
      setPosts(prev => prev.map(p =>
        p.id === bidsPost.id ? { ...p, bids_count: p.bids_count + 1 } : p
      ));
      Alert.alert('Bid Placed!', `Your bid of $${amount.toFixed(2)} has been submitted.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to place bid');
    } finally { setPlacingBid(false); }
  }

  // ── Create post ────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!newContent.trim() || creating || !jwt) return;
    setCreating(true);
    try {
      const budget   = newBudget   ? parseFloat(newBudget)   : undefined;
      const deadline = newDeadline ? newDeadline              : undefined;
      const post = await createPost(jwt, newContent.trim(), newType, [], budget, deadline);
      setPosts(prev => [post, ...prev]);
      setShowCreate(false);
      setNewContent('');
      setNewType('update');
      setNewBudget('');
      setNewDeadline('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create post');
    } finally { setCreating(false); }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  }

  function initial(name: string) {
    return name?.charAt(0)?.toUpperCase() ?? '?';
  }

  // ── Post card ──────────────────────────────────────────────────────────────

  const renderPost = ({ item }: { item: FeedPost }) => {
    const typeInfo  = FILTER_TABS.find(f => f.key === item.post_type) ?? FILTER_TABS[1];
    const typeColor = TYPE_COLORS[item.post_type] ?? colors.mint;
    const authorName = item.author?.full_name ?? 'Unknown';
    const companyName = item.author?.company_name;
    const liked = item.liked_by_me;
    const isPartsReq = item.post_type === 'parts_request';
    const isJob      = item.post_type === 'job_post';

    return (
      <View style={st.card}>
        <View style={[st.typeStrip, { backgroundColor: typeColor }]} />
        <View style={st.cardInner}>
          {/* Header */}
          <View style={st.cardHeader}>
            <View style={[st.avatar, { backgroundColor: typeColor + '22' }]}>
              <Text style={[st.avatarTxt, { color: typeColor }]}>{initial(authorName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.authorName}>{authorName}</Text>
              {companyName ? <Text style={st.companyName}>{companyName}</Text> : null}
              <Text style={st.timeAgoTxt}>{timeAgo(item.created_at)}</Text>
            </View>
            <View style={[st.typeBadge, { backgroundColor: typeColor + '18', borderColor: typeColor + '40' }]}>
              <Text style={st.typeBadgeIcon}>{typeInfo.icon}</Text>
              <Text style={[st.typeBadgeText, { color: typeColor }]}>{typeInfo.label}</Text>
            </View>
          </View>

          {/* Content */}
          <Text style={st.contentText}>{item.content}</Text>

          {/* Parts request / Job post meta: budget + deadline */}
          {(isPartsReq || isJob) && (item.budget || item.deadline) ? (
            <View style={st.metaRow}>
              {item.budget ? (
                <View style={st.metaChip}>
                  <Text style={st.metaChipIcon}>💰</Text>
                  <Text style={st.metaChipText}>Budget: ${Number(item.budget).toLocaleString()}</Text>
                </View>
              ) : null}
              {item.deadline ? (
                <View style={st.metaChip}>
                  <Text style={st.metaChipIcon}>📅</Text>
                  <Text style={st.metaChipText}>Due: {item.deadline}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Media */}
          {item.media_urls && item.media_urls.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.mediaRow} contentContainerStyle={{ gap: 8 }}>
              {item.media_urls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={st.mediaThumbnail} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : null}

          {/* Actions */}
          <View style={st.actions}>
            <TouchableOpacity style={st.actionBtn} onPress={() => handleLike(item.id)} activeOpacity={0.7}>
              <Text style={st.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
              <Text style={[st.actionCount, liked && { color: '#ef4444' }]}>{item.likes_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={() => openComments(item)} activeOpacity={0.7}>
              <Text style={st.actionIcon}>💬</Text>
              <Text style={st.actionCount}>{item.comments_count}</Text>
            </TouchableOpacity>
            {isPartsReq ? (
              <TouchableOpacity style={st.actionBtn} onPress={() => openBids(item)} activeOpacity={0.7}>
                <Text style={st.actionIcon}>🔩</Text>
                <Text style={[st.actionCount, { color: TYPE_COLORS.parts_request }]}>
                  {item.bids_count} {item.bids_count === 1 ? 'Bid' : 'Bids'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {isJob ? (
              <TouchableOpacity
                style={st.applyBtn}
                activeOpacity={0.8}
                onPress={() => {
                  // Navigate to Messages and start a conversation with the poster
                  onNavigate('Messages');
                  Alert.alert(
                    'Apply for Job',
                    `Send a message to ${item.author?.full_name ?? 'the poster'} to apply.`,
                    [{ text: 'OK' }],
                  );
                }}>
                <Text style={st.applyBtnTxt}>Apply →</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={st.root}>

      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerTitle}>Feed</Text>
          <Text style={st.headerSub}>Community · Jobs · Projects</Text>
        </View>
        <TouchableOpacity style={st.postBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
          <Text style={st.postBtnTxt}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={st.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterScroll}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[st.filterTab, filter === tab.key && st.filterTabActive]}
              onPress={() => changeFilter(tab.key)}
              activeOpacity={0.75}>
              <Text style={st.filterIcon}>{tab.icon}</Text>
              <Text style={[st.filterLabel, filter === tab.key && st.filterLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.mint} />
          <Text style={st.loadingTxt}>Loading feed…</Text>
        </View>
      ) : error ? (
        <View style={st.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={st.errorTxt}>{error}</Text>
          <TouchableOpacity style={st.mintBtn} onPress={() => load()}>
            <Text style={st.mintBtnTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          contentContainerStyle={st.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.mint} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.mint} style={{ paddingVertical: 20 }} /> : null}
          ListEmptyComponent={
            <View style={st.center}>
              <Text style={{ fontSize: 52, marginBottom: 12 }}>📡</Text>
              <Text style={st.emptyTitle}>Nothing here yet</Text>
              <Text style={st.emptySub}>Be the first to post!</Text>
              <TouchableOpacity style={[st.mintBtn, { marginTop: 20 }]} onPress={() => setShowCreate(true)}>
                <Text style={st.mintBtnTxt}>Create Post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ═══ COMMENTS SHEET ═══════════════════════════════════════════════════ */}
      <Modal visible={!!commentsPost} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCommentsPost(null)}>
        <KeyboardAvoidingView style={st.sheetRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={st.sheetHeader}>
            <TouchableOpacity onPress={() => setCommentsPost(null)}>
              <Text style={st.sheetClose}>✕</Text>
            </TouchableOpacity>
            <Text style={st.sheetTitle}>Comments</Text>
            <View style={{ width: 32 }} />
          </View>
          {commentsPost ? (
            <View style={st.sheetPreview}>
              <Text style={st.sheetPreviewAuthor}>{commentsPost.author?.full_name}</Text>
              <Text style={st.sheetPreviewContent} numberOfLines={2}>{commentsPost.content}</Text>
            </View>
          ) : null}
          <ScrollView style={st.sheetScroll} contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 16 }}>
            {commentsLoading ? (
              <ActivityIndicator size="small" color={colors.mint} style={{ marginTop: 24 }} />
            ) : comments.length === 0 ? (
              <View style={st.sheetEmpty}><Text style={{ fontSize: 32 }}>💬</Text><Text style={st.sheetEmptyTxt}>No comments yet!</Text></View>
            ) : (
              comments.map(c => (
                <View key={c.id} style={st.commentRow}>
                  <View style={st.commentAvatar}>
                    <Text style={st.commentAvatarTxt}>{initial(c.author?.full_name ?? '?')}</Text>
                  </View>
                  <View style={st.commentBubble}>
                    <Text style={st.commentAuthor}>{c.author?.full_name ?? 'User'}</Text>
                    <Text style={st.commentText}>{c.content}</Text>
                    <Text style={st.commentTime}>{timeAgo(c.created_at)}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          <View style={st.commentInputRow}>
            <TextInput
              style={st.commentInput}
              placeholder="Write a comment…"
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[st.commentSendBtn, (!commentText.trim() || postingComment) && st.commentSendDisabled]}
              onPress={submitComment}
              disabled={!commentText.trim() || postingComment}
              activeOpacity={0.8}>
              {postingComment
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Text style={st.commentSendTxt}>Send</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ BIDS SHEET ═══════════════════════════════════════════════════════ */}
      <Modal visible={!!bidsPost} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBidsPost(null)}>
        <KeyboardAvoidingView style={st.sheetRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={st.sheetHeader}>
            <TouchableOpacity onPress={() => setBidsPost(null)}>
              <Text style={st.sheetClose}>✕</Text>
            </TouchableOpacity>
            <Text style={st.sheetTitle}>🔩 Bids</Text>
            <View style={{ width: 32 }} />
          </View>
          {bidsPost ? (
            <View style={[st.sheetPreview, { borderLeftColor: TYPE_COLORS.parts_request }]}>
              <Text style={st.sheetPreviewAuthor}>{bidsPost.author?.full_name}</Text>
              <Text style={st.sheetPreviewContent} numberOfLines={2}>{bidsPost.content}</Text>
              {bidsPost.budget ? <Text style={st.bidBudget}>Budget: ${bidsPost.budget.toLocaleString()}</Text> : null}
            </View>
          ) : null}
          <ScrollView style={st.sheetScroll} contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 16 }}>
            {bidsLoading ? (
              <ActivityIndicator size="small" color={colors.mint} style={{ marginTop: 24 }} />
            ) : bids.length === 0 ? (
              <View style={st.sheetEmpty}><Text style={{ fontSize: 32 }}>🔩</Text><Text style={st.sheetEmptyTxt}>No bids yet — be first!</Text></View>
            ) : (
              bids.map((b, i) => (
                <View key={b.id} style={[st.bidRow, i === 0 && st.bidRowTop]}>
                  {i === 0 ? <Text style={st.bidLeader}>⭐ Lowest Bid</Text> : null}
                  <View style={st.bidRowInner}>
                    <View style={st.bidAvatar}>
                      <Text style={st.bidAvatarTxt}>{initial(b.bidder?.full_name ?? '?')}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.bidderName}>{b.bidder?.full_name ?? 'Bidder'}</Text>
                      {b.note ? <Text style={st.bidNote}>{b.note}</Text> : null}
                    </View>
                    <View style={st.bidAmountBadge}>
                      <Text style={st.bidAmount}>${b.amount.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          <View style={st.bidForm}>
            <Text style={st.bidFormTitle}>Place a Bid</Text>
            <View style={st.bidInputRow}>
              <View style={st.bidDollarWrap}>
                <Text style={st.bidDollar}>$</Text>
                <TextInput
                  style={st.bidAmountInput}
                  placeholder="Amount"
                  placeholderTextColor={colors.textMuted}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity
                style={[st.bidSubmitBtn, (!bidAmount || placingBid) && st.bidSubmitDisabled]}
                onPress={submitBid}
                disabled={!bidAmount || placingBid}
                activeOpacity={0.8}>
                {placingBid
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Text style={st.bidSubmitTxt}>Bid</Text>}
              </TouchableOpacity>
            </View>
            <TextInput
              style={st.bidNoteInput}
              placeholder="Note — delivery time, location, etc."
              placeholderTextColor={colors.textMuted}
              value={bidNote}
              onChangeText={setBidNote}
              maxLength={300}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ CREATE POST MODAL ════════════════════════════════════════════════ */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView style={st.sheetRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={st.sheetHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={st.sheetClose}>Cancel</Text>
            </TouchableOpacity>
            <Text style={st.sheetTitle}>New Post</Text>
            <TouchableOpacity onPress={handleCreate} disabled={!newContent.trim() || creating} activeOpacity={0.8}>
              <Text style={[st.postSubmit, (!newContent.trim() || creating) && st.postSubmitDisabled]}>
                {creating ? '…' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <Text style={st.createSectionLabel}>Post Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.typeScroll}>
              {POST_TYPES.map(pt => {
                const active  = newType === pt.key;
                const ptColor = TYPE_COLORS[pt.key];
                return (
                  <TouchableOpacity
                    key={pt.key}
                    style={[st.typeCard, active && { borderColor: ptColor, backgroundColor: ptColor + '12' }]}
                    onPress={() => setNewType(pt.key)}
                    activeOpacity={0.8}>
                    <Text style={st.typeCardIcon}>{pt.icon}</Text>
                    <Text style={[st.typeCardLabel, active && { color: ptColor }]}>{pt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={st.createSectionLabel}>Content</Text>
            <TextInput
              style={st.createInput}
              placeholder={
                newType === 'parts_request' ? "Describe the part, specs, quantity and standards required…"
                : newType === 'job_post'    ? "Describe the role, responsibilities and requirements…"
                : "What's happening in your project or industry?"
              }
              placeholderTextColor={colors.textMuted}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            {newType === 'parts_request' ? (
              <>
                <Text style={st.createSectionLabel}>Budget (USD) — optional</Text>
                <TextInput
                  style={[st.createInput, { minHeight: 48, marginBottom: 0 }]}
                  placeholder="e.g. 500"
                  placeholderTextColor={colors.textMuted}
                  value={newBudget}
                  onChangeText={setNewBudget}
                  keyboardType="decimal-pad"
                />
                <Text style={st.createSectionLabel}>Deadline — optional (YYYY-MM-DD)</Text>
                <TextInput
                  style={[st.createInput, { minHeight: 48, marginBottom: 0 }]}
                  placeholder="e.g. 2026-05-01"
                  placeholderTextColor={colors.textMuted}
                  value={newDeadline}
                  onChangeText={setNewDeadline}
                />
              </>
            ) : null}
            <View style={{ height: 48 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.extraBold, color: colors.textPrimary },
  headerSub:   { fontSize: 12, fontFamily: fonts.medium, color: colors.textMuted, marginTop: 1 },
  postBtn:     { backgroundColor: colors.mint, borderRadius: radius.full, paddingHorizontal: 18, paddingVertical: 9 },
  postBtnTxt:  { fontSize: 14, fontFamily: fonts.bold, color: colors.white },

  // Filters
  filterContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterScroll:    { paddingHorizontal: spacing.md, paddingVertical: 10, gap: 8 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
  },
  filterTabActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  filterIcon:      { fontSize: 12 },
  filterLabel:     { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary },
  filterLabelActive: { color: colors.white },

  // List
  listContent: { paddingTop: 12, paddingBottom: 32 },

  // Center states
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingTxt: { fontSize: 14, fontFamily: fonts.medium, color: colors.textMuted, marginTop: 10 },
  errorTxt:   { fontSize: 14, fontFamily: fonts.medium, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.textPrimary, marginTop: 4 },
  emptySub:   { fontSize: 14, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  mintBtn:    { backgroundColor: colors.mint, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 11 },
  mintBtnTxt: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },

  // Post card
  card: {
    flexDirection: 'row', backgroundColor: colors.white,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  typeStrip: { width: 4 },
  cardInner: { flex: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 17, fontFamily: fonts.extraBold },
  authorName: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary },
  companyName: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary, marginTop: 1 },
  timeAgoTxt: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 2 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeIcon: { fontSize: 10 },
  typeBadgeText: { fontSize: 10, fontFamily: fonts.semiBold },
  contentText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textPrimary, lineHeight: 21, marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.bg, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border,
  },
  metaChipIcon: { fontSize: 11 },
  metaChipText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary },
  mediaRow: { marginBottom: 10 },
  mediaThumbnail: { width: 140, height: 100, borderRadius: radius.md, backgroundColor: colors.bg },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 16 },
  actionCount: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.textMuted },
  applyBtn: { marginLeft: 'auto', backgroundColor: colors.textPrimary, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 6 },
  applyBtnTxt: { fontSize: 12, fontFamily: fonts.bold, color: colors.white },

  // Sheet shared
  sheetRoot: { flex: 1, backgroundColor: colors.bg },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 14,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetClose: { fontSize: 16, fontFamily: fonts.medium, color: colors.textMuted },
  sheetTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.textPrimary },
  sheetPreview: {
    marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.md,
    borderLeftWidth: 4, borderLeftColor: colors.mint,
    borderWidth: 1, borderColor: colors.border,
  },
  sheetPreviewAuthor: { fontSize: 13, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 4 },
  sheetPreviewContent: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 19 },
  sheetScroll: { flex: 1, marginTop: spacing.sm },
  sheetEmpty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  sheetEmptyTxt: { fontSize: 14, fontFamily: fonts.medium, color: colors.textMuted, textAlign: 'center' },

  // Comments
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center' },
  commentAvatarTxt: { fontSize: 13, fontFamily: fonts.bold, color: colors.mintDark },
  commentBubble: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: colors.border },
  commentAuthor: { fontSize: 13, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 3 },
  commentText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 18 },
  commentTime: { fontSize: 10, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 4 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  commentInput: {
    flex: 1, minHeight: 42, maxHeight: 100, backgroundColor: colors.bg,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontFamily: fonts.regular, color: colors.textPrimary,
  },
  commentSendBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10, minWidth: 60, alignItems: 'center' },
  commentSendDisabled: { backgroundColor: colors.border },
  commentSendTxt: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },

  // Bids
  bidBudget: { fontSize: 13, fontFamily: fonts.bold, color: '#ef4444', marginTop: 6 },
  bidRow: { backgroundColor: colors.white, borderRadius: radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  bidRowTop: { borderColor: colors.mint, borderWidth: 2 },
  bidLeader: { fontSize: 11, fontFamily: fonts.bold, color: colors.mint, marginBottom: 6 },
  bidRowInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bidAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center' },
  bidAvatarTxt: { fontSize: 14, fontFamily: fonts.bold, color: colors.mintDark },
  bidderName: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary },
  bidNote: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  bidAmountBadge: { backgroundColor: colors.mintLight, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  bidAmount: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.mintDark },
  bidForm: { padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  bidFormTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 10 },
  bidInputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  bidDollarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  bidDollar: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.textSecondary, marginRight: 4 },
  bidAmountInput: { flex: 1, height: 44, fontSize: 16, fontFamily: fonts.semiBold, color: colors.textPrimary },
  bidSubmitBtn: { backgroundColor: '#ef4444', borderRadius: radius.md, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  bidSubmitDisabled: { backgroundColor: colors.border },
  bidSubmitTxt: { fontSize: 15, fontFamily: fonts.bold, color: colors.white },
  bidNoteInput: { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 13, fontFamily: fonts.regular, color: colors.textPrimary, minHeight: 44 },

  // Create post
  createSectionLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: spacing.md, marginTop: 18, marginBottom: 8 },
  typeScroll: { paddingHorizontal: spacing.md, gap: 10 },
  typeCard: { alignItems: 'center', padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bg, minWidth: 90 },
  typeCardIcon: { fontSize: 22, marginBottom: 4 },
  typeCardLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.textSecondary, textAlign: 'center' },
  createInput: {
    marginHorizontal: spacing.md, backgroundColor: colors.white, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    fontSize: 15, fontFamily: fonts.regular, color: colors.textPrimary,
    lineHeight: 22, minHeight: 140, marginBottom: spacing.sm,
  },
  postSubmit: { fontSize: 16, fontFamily: fonts.bold, color: colors.mint },
  postSubmitDisabled: { color: colors.textMuted },
});
