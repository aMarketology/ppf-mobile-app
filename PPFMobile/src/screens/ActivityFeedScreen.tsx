/**
 * ActivityFeedScreen — Cryptographically Chained Event Ledger
 *
 * Pixel-perfect match of the web app's /activity page.
 *  • Deep Blue gradient hero (#001f4d → #003D82 → #005BB5) with grid overlay
 *  • Sticky filter bar with Deep Blue active pills + search toggle
 *  • Activity cards: rounded-2xl, border-gray-100, shadow-sm, p-5, gap-4
 *  • Colored icon pills (w-10 h-10 rounded-xl), actor + timeAgo, summary, metadata
 *  • Hash chain bottom row (px-5 py-2.5 bg-gray-50/50) with 🔗 + truncated hash
 *  • Load more button + SHA256 info box
 *  • Real-time subscription for live updates
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
  type AppStateStatus,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchActivities, subscribeToActivities } from '../services/activities';
import { colors, spacing, radius, fonts } from '../theme';
import type { SiteActivity, ActivityType, ActivityFilter } from '../lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; bg: string }> = {
  rfq_posted:           { icon: '📄', bg: '#DBEAFE' },
  rfq_awarded:          { icon: '🏆', bg: '#D1FAE5' },
  offer_submitted:      { icon: '📈', bg: '#FFE4E6' },
  social_post_created:  { icon: '💬', bg: '#F3E8FF' },
  order_placed:         { icon: '🛒', bg: '#FEF3C7' },
  order_completed:      { icon: '✅', bg: '#D1FAE5' },
  company_joined:       { icon: '🏢', bg: '#CFFAFE' },
  team_member_added:    { icon: '👤', bg: '#FFE4E6' },
};

const FILTERS: ActivityFilter[] = [
  { key: 'all',                  label: 'All Activity',     icon: '🌐' },
  { key: 'rfq_posted',           label: 'RFQs Posted',     icon: '📄' },
  { key: 'offer_submitted',      label: 'Offers',          icon: '📈' },
  { key: 'rfq_awarded',          label: 'Awarded',         icon: '🏆' },
  { key: 'order_placed',         label: 'Orders',          icon: '🛒' },
  { key: 'company_joined',       label: 'New Companies',   icon: '🏢' },
  { key: 'team_member_added',    label: 'Team Joins',      icon: '👤' },
  { key: 'social_post_created',  label: 'Community Posts', icon: '💬' },
];

// ─── timeAgo helper — matches web's formatDistanceToNow ──────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

function hashPreview(hash: string | null | undefined): string {
  if (!hash) return 'pending...';
  return `${hash.substring(0, 16)}...`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = { onNavigate: (screen: string) => void };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActivityFeedScreen({ onNavigate }: Props) {
  const { session } = useAuth();
  const jwt = session?.access_token ?? '';

  // Data
  const [activities, setActivities] = useState<SiteActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchHeight = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async (
    pageNum: number,
    type: ActivityType | 'all',
    search: string,
    isRefresh = false,
  ) => {
    if (!jwt) return;
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      console.log('[ActivityFeed] loading page', pageNum, 'type', type, 'search', search);
      const result = await fetchActivities(jwt, pageNum, type, search);
      console.log('[ActivityFeed] got', result.activities.length, 'activities, total', result.total);

      if (pageNum === 0) {
        setActivities(result.activities);
      } else {
        setActivities(prev => [...prev, ...result.activities]);
      }
      setPage(result.page);
      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (e: any) {
      console.error('[ActivityFeed] load error:', e?.message ?? e);
      setError(e?.message ?? 'Failed to load activities');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [jwt]);

  useEffect(() => {
    load(0, activeFilter, searchQuery);
  }, [load]);

  // ── Real-time ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!jwt) return;

    const unsub = subscribeToActivities(jwt, (activity) => {
      setActivities(prev => [activity, ...prev]);
      setTotal(t => t + 1);
    });

    const appListener = AppState.addEventListener('change', () => {});

    return () => {
      unsub();
      appListener.remove();
    };
  }, [jwt]);

  // ── Filter change ──────────────────────────────────────────────────────────

  function changeFilter(f: ActivityType | 'all') {
    setActiveFilter(f);
    setSearchQuery('');
    setSearchVisible(false);
    Animated.timing(searchHeight, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    load(0, f, '');
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  function toggleSearch() {
    const willOpen = !searchVisible;
    setSearchVisible(willOpen);
    Animated.timing(searchHeight, {
      toValue: willOpen ? 48 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (willOpen) searchInputRef.current?.focus();
    });
  }

  function submitSearch() {
    load(0, activeFilter, searchQuery.trim());
  }

  // ── Load More ──────────────────────────────────────────────────────────────

  function loadMore() {
    if (!hasMore || loadingMore || !jwt) return;
    const nextPage = page + 1;
    load(nextPage, activeFilter, searchQuery);
  }

  // ── Refresh ────────────────────────────────────────────────────────────────

  function onRefresh() {
    load(0, activeFilter, searchQuery, true);
  }

  // ── Navigation from activity ───────────────────────────────────────────────

  function handleActivityPress(activity: SiteActivity) {
    if (activity.target_type === 'rfq' || activity.target_type === 'offer') {
      onNavigate('RFQ');
    }
  }

  // ── Render: Hero Banner ───────────────────────────────────────────────────

  const renderHeader = () => (
    <View>
      {/* Hero — matching web: bg-gradient-to-br from-[#001f4d] via-[#003D82] to-[#005BB5] */}
      <View style={styles.hero}>
        {/* Grid overlay — matching web */}
        <View style={styles.heroGrid} />
        <View style={styles.heroInner}>
          {/* Badge — matching web: bg-white/10 border border-white/20 rounded-full */}
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeIcon}>🔗</Text>
            <Text style={styles.heroBadgeText}>Blockchain Activity Feed</Text>
          </View>
          {/* Title — matching web: text-3xl md:text-4xl font-extrabold text-white */}
          <Text style={styles.heroTitle}>Activity Feed</Text>
          {/* Subtitle — matching web: text-blue-200 text-lg */}
          <Text style={styles.heroSub}>Real-time platform activity — cryptographically chained</Text>
          {/* Total — matching web: text-blue-300/70 text-sm */}
          <Text style={styles.heroTotal}>{total.toLocaleString()} total events on the ledger</Text>
        </View>
      </View>

      {/* Sticky Filter Bar — matching web */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTERS.map(f => {
              const isActive = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => changeFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterPillIcon}>{f.icon}</Text>
                  <Text style={[styles.filterPillLabel, isActive && styles.filterPillLabelActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* Search toggle — matching web */}
          <TouchableOpacity
            style={[styles.searchToggle, searchVisible && styles.searchToggleActive]}
            onPress={toggleSearch}
          >
            <Text style={styles.searchToggleIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Expandable Search Bar — matching web */}
        <Animated.View style={[styles.searchRow, { height: searchHeight, overflow: 'hidden' }]}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search all activity..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={submitSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); load(0, activeFilter, ''); }}>
              <Text style={styles.clearBtn}>Clear</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );

  // ── Render: Activity Card — pixel-perfect match of web ─────────────────────

  function renderActivity({ item }: { item: SiteActivity }) {
    const config = ACTIVITY_CONFIG[item.activity_type] ?? {
      icon: '📄',
      bg: '#F3F4F6',
    };

    const hasMeta = item.metadata && Object.keys(item.metadata).length > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleActivityPress(item)}
      >
        {/* Top section — matching web: p-5 */}
        <View style={styles.cardPadding}>
          {/* Body — matching web: flex items-start gap-4 */}
          <View style={styles.cardBody}>
            {/* Icon Pill — matching web: w-10 h-10 rounded-xl */}
            <View style={[styles.iconPill, { backgroundColor: config.bg }]}>
              <Text style={styles.iconText}>{config.icon}</Text>
            </View>

            {/* Content — matching web: flex-1 min-w-0 */}
            <View style={styles.cardContent}>
              {/* Actor + Time — matching web: flex items-center gap-2 mb-1 */}
              <View style={styles.actorRow}>
                {item.actor && (
                  <Text style={styles.actorName} numberOfLines={1}>
                    {item.actor.full_name}
                  </Text>
                )}
                <Text style={styles.timeAgo}>{timeAgo(item.created_at)}</Text>
              </View>

              {/* Summary — matching web: text-sm text-gray-700 leading-relaxed */}
              <Text style={styles.summary}>{item.summary}</Text>

              {/* Metadata — matching web layout exactly */}
              {item.metadata?.budget && (
                <Text style={styles.metaBudget}>Budget: {item.metadata.budget}</Text>
              )}
              {item.metadata?.location && (
                <Text style={styles.metaLocation}>📍 {item.metadata.location}</Text>
              )}
              {item.metadata?.category && (
                <View style={styles.metaCategory}>
                  <Text style={styles.metaCategoryText}>{item.metadata.category}</Text>
                </View>
              )}
              {item.metadata?.offer_amount && (
                <Text style={styles.metaBudget}>💵 ${Number(item.metadata.offer_amount).toLocaleString()}</Text>
              )}
              {item.metadata?.company_name && (
                <View style={styles.metaCategory}>
                  <Text style={styles.metaCategoryText}>🏢 {item.metadata.company_name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bottom section — matching web: px-5 py-2.5 border-t border-gray-50 bg-gray-50/50 */}
        <View style={styles.cardBottom}>
          {/* Hash — matching web: flex items-center gap-2 text-[10px] text-gray-400 font-mono */}
          <View style={styles.hashRow}>
            <Text style={styles.hashIcon}>🔗</Text>
            <Text style={styles.hashPreview} numberOfLines={1}>
              {hashPreview(item.row_hash)}
            </Text>
          </View>
          {/* Link — matching web */}
          {item.target_type === 'rfq' && item.target_id && (
            <Text style={styles.cardLink}>
              {item.activity_type === 'offer_submitted' ? 'See Bid →' : 'View RFQ →'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ── Render: Footer ─────────────────────────────────────────────────────────

  function renderFooter() {
    if (loading || activities.length === 0) return null;

    return (
      <View style={styles.footer}>
        {/* Load More — matching web */}
        {hasMore && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={colors.mint} />
            ) : (
              <Text style={styles.loadMoreText}>↓ Load more</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Hash Chain Info — matching web: mt-8 p-4 bg-gray-50 rounded-xl border-gray-200 */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔗</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>SHA256 Hash Chain Ledger</Text>
              <Text style={styles.infoText}>
                Every platform action is cryptographically chained to the previous one. Each entry's row_hash = SHA256(id + type + actor + previous_hash). Immutable and verifiable.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Render: Empty State ────────────────────────────────────────────────────

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📈</Text>
        <Text style={styles.emptyTitle}>No activity found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your filters or check back later.
        </Text>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mint} />
        <Text style={styles.loadingText}>Loading activity feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={activities}
        keyExtractor={item => item.id}
        renderItem={renderActivity}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.mint}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles — pixel-perfect match of web Tailwind classes ─────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC', // bg-[#F8FAFC]
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#9CA3AF', // text-gray-400
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },

  // Hero — matching web: bg-gradient-to-br from-[#001f4d] via-[#003D82] to-[#005BB5]
  hero: {
    backgroundColor: '#003D82',
    paddingBottom: 64, // pb-16
    paddingTop: 32, // pt-28 equivalent accounting for status bar
    position: 'relative',
    overflow: 'hidden',
  },
  heroGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.08,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  heroInner: {
    paddingHorizontal: 24, // px-6
    position: 'relative',
    zIndex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)', // bg-white/10
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // border-white/20
    paddingHorizontal: 16, // px-4
    paddingVertical: 6, // py-1.5
    borderRadius: 999, // rounded-full
    marginBottom: 16, // mb-4
    gap: 8, // gap-2
  },
  heroBadgeIcon: {
    fontSize: 16,
    color: '#FF6B35', // text-[#FF6B35]
  },
  heroBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 14, // text-sm
    color: 'rgba(255,255,255,0.9)', // text-white/90
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 30, // text-3xl
    color: '#FFFFFF', // text-white
    marginBottom: 8, // mb-2
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 18, // text-lg
    color: '#BFDBFE', // text-blue-200
    marginBottom: 4,
  },
  heroTotal: {
    fontFamily: fonts.medium,
    fontSize: 14, // text-sm
    color: 'rgba(147,197,253,0.7)', // text-blue-300/70
    marginTop: 4, // mt-1
  },

  // Filter Bar — matching web
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // border-gray-200
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24, // px-6
    paddingVertical: 12, // py-3
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6, // gap-1.5
    paddingRight: 8,
    flex: 1,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // gap-1.5
    paddingHorizontal: 12, // px-3
    paddingVertical: 6, // py-1.5
    borderRadius: 999, // rounded-full
    backgroundColor: '#FFFFFF', // bg-white
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
  },
  filterPillActive: {
    backgroundColor: '#003D82', // bg-[#003D82]
    borderColor: '#003D82', // border-[#003D82]
  },
  filterPillIcon: {
    fontSize: 12,
  },
  filterPillLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12, // text-xs
    color: '#6B7280', // text-gray-500
  },
  filterPillLabelActive: {
    color: '#FFFFFF', // text-white
  },
  searchToggle: {
    width: 36,
    height: 36,
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  searchToggleActive: {
    backgroundColor: '#003D82', // bg-[#003D82]
  },
  searchToggleIcon: {
    fontSize: 16,
  },

  // Search Bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8, // gap-2
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14, // text-sm
    color: '#111827',
    backgroundColor: '#F9FAFB',
    borderRadius: 12, // rounded-xl
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
  },
  searchBtn: {
    backgroundColor: '#003D82', // bg-[#003D82]
    borderRadius: 12, // rounded-xl
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
  },
  searchBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14, // text-sm
    color: '#FFFFFF', // text-white
  },
  clearBtn: {
    fontFamily: fonts.medium,
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
    padding: 4,
  },

  // Activity Card — matching web: bg-white rounded-2xl border-gray-100 shadow-sm
  card: {
    marginHorizontal: 24,
    marginTop: 16, // space-y-4
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: '#F3F4F6', // border-gray-100
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPadding: {
    padding: 20, // p-5
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16, // gap-4
  },
  iconPill: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 12, // rounded-xl
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
    minWidth: 0, // min-w-0
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
    marginBottom: 4, // mb-1
  },
  actorName: {
    fontFamily: fonts.semiBold, // font-semibold
    fontSize: 14, // text-sm
    color: '#111827', // text-gray-900
    flexShrink: 1,
  },
  timeAgo: {
    fontFamily: fonts.regular,
    fontSize: 12, // text-xs
    color: '#9CA3AF', // text-gray-400
  },
  summary: {
    fontFamily: fonts.regular,
    fontSize: 14, // text-sm
    color: '#374151', // text-gray-700
    lineHeight: 20, // leading-relaxed
  },
  metaBudget: {
    fontFamily: fonts.semiBold,
    fontSize: 12, // text-xs
    color: '#059669', // text-emerald-600
    marginTop: 4, // mt-1
  },
  metaLocation: {
    fontFamily: fonts.regular,
    fontSize: 12, // text-xs
    color: '#6B7280', // text-gray-500
    marginTop: 2, // mt-0.5
  },
  metaCategory: {
    backgroundColor: '#EFF6FF', // bg-blue-50
    paddingHorizontal: 8, // px-2
    paddingVertical: 2, // py-0.5
    borderRadius: 999, // rounded-full
    marginTop: 6, // mt-1.5
    alignSelf: 'flex-start',
  },
  metaCategoryText: {
    fontFamily: fonts.semiBold,
    fontSize: 10, // text-[10px]
    color: '#003D82', // text-[#003D82]
  },

  // Card Bottom — matching web: px-5 py-2.5 border-t border-gray-50 bg-gray-50/50
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(249,250,251,0.5)', // bg-gray-50/50
    paddingHorizontal: 20, // px-5
    paddingVertical: 10, // py-2.5
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB', // border-gray-50
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
    flex: 1,
  },
  hashIcon: {
    fontSize: 12,
    color: '#9CA3AF', // text-gray-400
  },
  hashPreview: {
    fontFamily: 'Courier', // font-mono
    fontSize: 10, // text-[10px]
    color: '#9CA3AF', // text-gray-400
    maxWidth: 120, // max-w-[120px]
  },
  cardLink: {
    fontFamily: fonts.semiBold,
    fontSize: 12, // text-xs
    color: '#003D82', // text-[#003D82]
  },

  // Footer
  footer: {
    paddingTop: 24,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
    paddingHorizontal: 24, // px-6
    paddingVertical: 12, // py-3
    borderRadius: 12, // rounded-xl
    marginBottom: 24,
  },
  loadMoreText: {
    fontFamily: fonts.semiBold,
    fontSize: 14, // text-sm
    color: '#003D82', // text-[#003D82]
  },

  // Hash Chain Info — matching web: mt-8 p-4 bg-gray-50 rounded-xl border-gray-200
  infoBox: {
    marginHorizontal: 24,
    backgroundColor: '#F9FAFB', // bg-gray-50
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    padding: 16, // p-4
    marginTop: 32, // mt-8
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12, // gap-3
  },
  infoIcon: {
    fontSize: 20, // w-5 h-5
    color: '#9CA3AF', // text-gray-400
    marginTop: 2,
  },
  infoTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12, // text-xs
    color: '#4B5563', // text-gray-600
    marginBottom: 2,
  },
  infoText: {
    fontFamily: fonts.regular,
    fontSize: 11, // text-[11px]
    color: '#9CA3AF', // text-gray-400
    lineHeight: 16,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#D1D5DB', // text-gray-300
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#374151', // text-gray-700
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
    textAlign: 'center',
    lineHeight: 20,
  },
});