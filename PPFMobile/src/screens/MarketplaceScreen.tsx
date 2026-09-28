/**
 * MarketplaceScreen — Modern Shop
 *
 * Instagram-style marketplace with:
 *  • Clean top bar with logo + post button
 *  • Full-width service cards with avatar, name, category, price, actions
 *  • Subtle horizontal filter pills
 *  • Inline search bar
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { radius, spacing, fonts, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchServices, formatServicePrice, type ServiceWithProvider } from '../services/servicesService';

const FILTER_TABS = [
  { label: 'All',           icon: '🌐' },
  { label: 'Civil',         icon: '🏗️' },
  { label: 'Mechanical',    icon: '⚙️' },
  { label: 'Electrical',    icon: '⚡' },
  { label: 'Controls',      icon: '🤖' },
  { label: 'Manufacturing', icon: '🏭' },
  { label: 'Construction',  icon: '🔨' },
  { label: 'Logistics',     icon: '🚚' },
];

type Props = { onNavigate: (screen: string) => void; onOpenService?: (service: ServiceWithProvider) => void };

export default function MarketplaceScreen({ onNavigate, onOpenService }: Props) {
  const { session, profile } = useAuth();
  const jwt = session?.access_token ?? '';
  const { colors, isDark } = useTheme();
  const s = createStyles(colors);

  const [search, setSearch]           = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [services, setServices]       = useState<ServiceWithProvider[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!jwt) return;
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const data = await fetchServices(jwt);
      setServices(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwt]);

  useEffect(() => { load(); }, [load]);

  const filtered = services.filter(s => {
    const matchSearch =
      search === '' ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      activeFilter === 'All' ||
      (s.category ?? '').toLowerCase().includes(activeFilter.toLowerCase()) ||
      (s.tags ?? []).some(t => t.toLowerCase().includes(activeFilter.toLowerCase()));
    return matchSearch && matchFilter;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>PPF</Text>
          </View>
          <Text style={s.topBarTitle}>Shop</Text>
        </View>
        <View style={s.topBarRight}>
          <TouchableOpacity style={s.postBtn} onPress={() => onNavigate('PostService')} activeOpacity={0.7}>
            <Text style={s.postBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search services..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter Pills ────────────────────────────────────────────────── */}
      <View style={s.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {FILTER_TABS.map((f, i) => {
            const isActive = activeFilter === f.label;
            return (
              <TouchableOpacity
                key={i}
                style={[s.filterPill, isActive && s.filterPillActive]}
                onPress={() => setActiveFilter(f.label)}
                activeOpacity={0.7}
              >
                <Text style={s.filterPillIcon}>{f.icon}</Text>
                <Text style={[s.filterPillLabel, isActive && s.filterPillLabelActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.mint} />
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.mint} />}
        >
          {/* Section header */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{activeFilter === 'All' ? 'All Services' : `${activeFilter}`}</Text>
            <Text style={s.sectionCount}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
              <Text style={s.emptyTitle}>No services found</Text>
              <Text style={s.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filtered.map((svc, i) => {
              const providerName = svc.provider?.full_name ?? 'Verified Supplier';
              const initial = providerName[0]?.toUpperCase() ?? '?';
              return (
                <TouchableOpacity
                  key={svc.id ?? i}
                  style={s.card}
                  activeOpacity={0.95}
                  onPress={() => onOpenService?.(svc)}
                >
                  {/* Card Header — avatar + name + price */}
                  <View style={s.cardHeader}>
                    <View style={s.cardAvatar}>
                      <Text style={s.cardAvatarText}>{initial}</Text>
                    </View>
                    <View style={s.cardHeaderText}>
                      <Text style={s.cardName} numberOfLines={1}>{svc.title}</Text>
                      {svc.category && <Text style={s.cardCategory}>{svc.category}</Text>}
                      <Text style={s.cardProvider}>👤 {providerName}</Text>
                    </View>
                    <View style={s.priceWrap}>
                      <Text style={s.priceText}>{formatServicePrice(svc.price)}</Text>
                      <Text style={s.priceLabel}>starting</Text>
                    </View>
                  </View>

                  {/* Service image */}
                  {svc.images && svc.images.length > 0 && svc.images[0] && (
                    <Image
                      source={{ uri: svc.images[0] }}
                      style={s.cardImage}
                      resizeMode="cover"
                    />
                  )}

                  {/* Description */}
                  {svc.description ? (
                    <Text style={s.description} numberOfLines={2}>{svc.description}</Text>
                  ) : null}

                  {/* Tags */}
                  {svc.tags && svc.tags.length > 0 && (
                    <View style={s.tagRow}>
                      {svc.tags.slice(0, 3).map((tag: string, j: number) => (
                        <View key={j} style={s.tag}>
                          <Text style={s.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={s.cardActions}>
                    <TouchableOpacity style={s.actionOutline} onPress={() => onNavigate('Messages')}>
                      <Text style={s.actionOutlineText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionPrimary} onPress={() => onNavigate('Messages')}>
                      <Text style={s.actionPrimaryText}>Request Quote</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* RFQ Banner */}
          <TouchableOpacity style={s.rfqBanner} onPress={() => onNavigate('RFQ')} activeOpacity={0.85}>
            <Text style={s.rfqTitle}>Need Multiple Quotes?</Text>
            <Text style={s.rfqSub}>Post an RFQ and get competitive bids from multiple suppliers</Text>
            <View style={s.rfqBtn}>
              <Text style={s.rfqBtnText}>Create RFQ →</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  // Top Bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: fonts.extraBold, fontSize: 11, color: colors.white, letterSpacing: 0.5 },
  topBarTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  postBtnText: { fontFamily: fonts.bold, fontSize: 20, color: colors.white, lineHeight: 22 },

  // Search
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.textPrimary },
  clearBtn: { fontSize: 14, color: colors.textMuted, paddingLeft: 8 },

  // Filter Pills
  filterWrap: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 },
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

  // Section header
  listContent: { paddingBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, marginBottom: 4,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary },
  sectionCount: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },

  // States
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: colors.mint, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 6 },
  emptySubtext: { fontSize: 14, fontFamily: fonts.regular, color: colors.textMuted },

  // Card — flat, edge-to-edge, divider-only (matches home feed)
  card: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', marginBottom: 8 },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  cardAvatarText: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.mint },
  cardHeaderText: { flex: 1 },
  cardName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 2 },
  cardCategory: { fontFamily: fonts.medium, fontSize: 12, color: colors.mint, marginBottom: 2 },
  cardProvider: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  priceWrap: { alignItems: 'flex-end' },
  priceText: { fontFamily: fonts.extraBold, fontSize: 17, color: colors.mint },
  priceLabel: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted, marginTop: 1 },

  cardImage: {
    width: '100%', height: 180, borderRadius: 10,
    marginTop: 8, marginBottom: 8,
    backgroundColor: colors.border,
  },

  description: {
    fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary,
    lineHeight: 19, marginBottom: 8,
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: {
    backgroundColor: colors.bg, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  tagText: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary },

  cardActions: { flexDirection: 'row', gap: 8, paddingTop: 8 },
  actionOutline: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
  },
  actionOutlineText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textPrimary },
  actionPrimary: {
    flex: 1, backgroundColor: colors.mint,
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
  },
  actionPrimaryText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },

  // RFQ Banner
  rfqBanner: {
    backgroundColor: colors.card, borderRadius: 16,
    padding: 20, alignItems: 'center',
    marginHorizontal: 16, marginTop: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  rfqTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary, marginBottom: 6 },
  rfqSub: {
    fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 18, marginBottom: 14,
  },
  rfqBtn: {
    backgroundColor: colors.mint, borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  rfqBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
});
