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
} from 'react-native';
import { colors, radius, spacing, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';
import { fetchServices, formatServicePrice, type ServiceWithProvider } from '../services/servicesService';

const FILTER_TABS = [
  { label: 'All'           },
  { label: 'Civil'         },
  { label: 'Mechanical'    },
  { label: 'Electrical'    },
  { label: 'Controls'      },
  { label: 'Manufacturing' },
  { label: 'Construction'  },
  { label: 'Logistics'     },
];

const STATS = [
  { value: '10K+', label: 'Verified\nSuppliers' },
  { value: '50+',  label: 'Countries\nServed' },
  { value: '98%',  label: 'Customer\nSatisfaction' },
];

type Props = { onNavigate: (screen: string) => void };

export default function MarketplaceScreen({ onNavigate }: Props) {
  const { session } = useAuth();
  const jwt = session?.access_token ?? '';

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
      setError(e.message ?? 'Failed to load services');
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

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <View style={s.hero}>
        <Text style={s.heroEyebrow}>PRECISION PROJECT FLOW</Text>
        <Text style={s.heroTitle}>Source Industrial{'\n'}Products & Services</Text>
        <Text style={s.heroSub}>
          Connect with verified engineering suppliers, manufacturers, and service providers
        </Text>
        {/* Stats row */}
        <View style={s.statsRow}>
          {STATS.map((st, i) => (
            <View key={i} style={[s.statItem, i < STATS.length - 1 && s.statBorder]}>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search suppliers, categories..."
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

      {/* ── Category Filter Tabs ──────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}>
        {FILTER_TABS.map((f, i) => (
          <TouchableOpacity
            key={i}
            style={[s.filterTab, activeFilter === f.label && s.filterTabActive]}
            onPress={() => setActiveFilter(f.label)}>
            <Text style={[s.filterTabText, activeFilter === f.label && s.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Results ──────────────────────────────────────────────────── */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.mint} />
          <Text style={s.loadingText}>Loading suppliers...</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.mint} />
          }>

          {/* Section label */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              {activeFilter === 'All' ? 'All Suppliers' : `${activeFilter} Suppliers`}
            </Text>
            <Text style={s.sectionCount}>{filtered.length} results</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
              <Text style={s.emptyTitle}>No suppliers found</Text>
              <Text style={s.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filtered.map((svc, i) => {
              const providerName = svc.provider?.full_name ?? 'Verified Supplier';
              const initial = providerName[0]?.toUpperCase() ?? '?';
              const isVerified = true; // all platform suppliers are verified
              return (
                <View key={svc.id ?? i} style={s.card}>
                  {/* Verified badge */}
                  {isVerified && (
                    <View style={s.verifiedBanner}>
                      <Text style={s.verifiedBannerText}>✓  Premium Verified Supplier</Text>
                    </View>
                  )}

                  <View style={s.cardBody}>
                    {/* Avatar + Info */}
                    <View style={s.cardTop}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>{initial}</Text>
                      </View>
                      <View style={s.info}>
                        <Text style={s.supplierName}>{svc.title}</Text>
                        {svc.category && (
                          <Text style={s.categoryText}>{svc.category}</Text>
                        )}
                        <Text style={s.providerText}>👤 {providerName}</Text>
                      </View>
                      <View style={s.priceWrap}>
                        <Text style={s.priceText}>{formatServicePrice(svc.price)}</Text>
                        <Text style={s.priceLabel}>starting</Text>
                      </View>
                    </View>

                    {/* Description */}
                    {svc.description ? (
                      <Text style={s.description} numberOfLines={2}>{svc.description}</Text>
                    ) : null}

                    {/* Tags */}
                    {svc.tags && svc.tags.length > 0 && (
                      <View style={s.tags}>
                        {svc.tags.slice(0, 3).map((tag: string, j: number) => (
                          <View key={j} style={s.tag}>
                            <Text style={s.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Actions */}
                    <View style={s.cardFooter}>
                      <TouchableOpacity style={s.profileBtn}>
                        <Text style={s.profileBtnText}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.quoteBtn}>
                        <Text style={s.quoteBtnText}>Request Quote</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* RFQ Banner */}
          <View style={s.rfqBanner}>
            <Text style={s.rfqTitle}>Need Multiple Quotes?</Text>
            <Text style={s.rfqSub}>
              Send RFQs to multiple suppliers simultaneously and compare side-by-side
            </Text>
            <TouchableOpacity style={s.rfqBtn}>
              <Text style={s.rfqBtnText}>Create RFQ</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Hero
  hero: {
    backgroundColor: colors.mintDark,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroEyebrow: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    color: colors.white,
    lineHeight: 30,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontSize: 20, fontFamily: fonts.extraBold, color: colors.white },
  statLabel: { fontSize: 10, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 },

  // Search
  searchWrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.textPrimary },
  clearBtn: { fontSize: 14, color: colors.textMuted, paddingLeft: 8 },

  // Filter
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: colors.white,
  },
  filterTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  filterTabText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary },
  filterTabTextActive: { color: colors.white },

  // Section header
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.textPrimary },
  sectionCount: { fontSize: 13, fontFamily: fonts.medium, color: colors.textMuted },

  // States
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, fontFamily: fonts.medium, color: colors.textMuted },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 6 },
  emptySubtext: { fontSize: 14, fontFamily: fonts.regular, color: colors.textMuted },

  // Supplier card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  verifiedBanner: {
    backgroundColor: colors.mintLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.mintMid,
  },
  verifiedBannerText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.mintDark,
    letterSpacing: 0.3,
  },
  cardBody: { padding: spacing.md },
  cardTop: { flexDirection: 'row', marginBottom: 10 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.mintMid,
  },
  avatarText: { fontSize: 22, fontFamily: fonts.extraBold, color: colors.mintDark },
  info: { flex: 1 },
  supplierName: { fontSize: 15, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 2 },
  categoryText: { fontSize: 12, fontFamily: fonts.medium, color: colors.mint, marginBottom: 2 },
  providerText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted },
  priceWrap: { alignItems: 'flex-end' },
  priceText: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.mint },
  priceLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textMuted, marginTop: 1 },
  description: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 11, fontFamily: fonts.medium, color: colors.textSecondary },
  cardFooter: { flexDirection: 'row', gap: 8 },
  profileBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  profileBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.textPrimary },
  quoteBtn: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  quoteBtnText: { fontSize: 13, fontFamily: fonts.bold, color: colors.white },

  // RFQ Banner
  rfqBanner: {
    backgroundColor: colors.mintDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  rfqTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.white, marginBottom: 6 },
  rfqSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  rfqBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  rfqBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.mintDark },
});
