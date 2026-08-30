/**
 * MarketplaceScreen — Combined B2B marketplace.
 *
 * Tabs: Services (live data), Companies (live data), RFQs (coming soon).
 * Features: search, category filter, pull-to-refresh.
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
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchServices, formatServicePrice, type ServiceWithProvider } from '../services/servicesService';
import { companiesService } from '../services/companies';
import { fetchRfqs, type Rfq } from '../services/rfq';
import { colors, spacing, radius, fonts } from '../theme';
import type { CompanyProfile } from '../lib/types';

type TabKey = 'services' | 'companies' | 'rfqs';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'services',  label: 'Services',  icon: '🔧' },
  { key: 'companies', label: 'Companies', icon: '🏢' },
  { key: 'rfqs',      label: 'RFQs',      icon: '📋' },
];

type Props = {
  onNavigate: (screen: string) => void;
  onSelectRfq?: (rfq: Rfq) => void;
};

export default function MarketplaceScreen({ onNavigate, onSelectRfq }: Props) {
  const { session } = useAuth();
  const jwt = session?.access_token ?? '';

  const [activeTab, setActiveTab] = useState<TabKey>('services');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Services
  const [services, setServices] = useState<ServiceWithProvider[]>([]);
  // Companies
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  // RFQs
  const [rfqs, setRfqs] = useState<Rfq[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    if (!jwt) return;
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      if (activeTab === 'services') {
        const data = await fetchServices(jwt, { search: search || undefined });
        setServices(data);
      } else if (activeTab === 'companies') {
        const data = await companiesService.getAll(jwt, { search: search || undefined, verified: true });
        setCompanies(data);
      } else if (activeTab === 'rfqs') {
        const result = await fetchRfqs(jwt, { search: search || undefined });
        setRfqs(result.rfqs);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwt, activeTab, search]);

  useEffect(() => { load(); }, [load]);

  function changeTab(tab: TabKey) {
    setActiveTab(tab);
    setSearch('');
  }

  // ── Render: Service Card ──────────────────────────────────────────────────

  function renderService({ item }: { item: ServiceWithProvider }) {
    const providerName = item.provider?.full_name ?? 'Verified Provider';
    const initial = providerName[0]?.toUpperCase() ?? '?';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => onNavigate('Messages')}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.category && <Text style={styles.cardCategory}>{item.category}</Text>}
            <Text style={styles.cardProvider}>👤 {providerName}</Text>
          </View>
          <View style={styles.priceWrap}>
            <Text style={styles.price}>{formatServicePrice(item.price)}</Text>
            <Text style={styles.priceLabel}>starting</Text>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 4).map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => onNavigate('Messages')}>
            <Text style={styles.outlineBtnText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate('Messages')}>
            <Text style={styles.primaryBtnText}>Request Quote</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Render: Company Card ──────────────────────────────────────────────────

  function renderCompany({ item }: { item: CompanyProfile }) {
    const initial = item.company_name[0]?.toUpperCase() ?? '?';
    const location = [item.city, item.state].filter(Boolean).join(', ') || 'Remote';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => onNavigate('Messages')}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, styles.companyAvatar]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.company_name}</Text>
              {item.is_verified && <Text style={styles.verifiedBadge}>✓</Text>}
            </View>
            <Text style={styles.cardCategory}>📍 {location}</Text>
            {item.specialties && item.specialties.length > 0 && (
              <Text style={styles.cardProvider} numberOfLines={1}>
                {item.specialties.slice(0, 3).join(' · ')}
              </Text>
            )}
          </View>
        </View>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => onNavigate('Messages')}>
            <Text style={styles.outlineBtnText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate('Messages')}>
            <Text style={styles.primaryBtnText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Render: RFQ Card ───────────────────────────────────────────────────────

  function renderRFQ({ item }: { item: Rfq }) {
    const clientName = item.client?.full_name ?? 'Unknown Client';
    const clientInitial = clientName[0]?.toUpperCase() ?? '?';
    const companyName = item.client?.company_name;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => onNavigate('RFQ')}>
        {/* Header */}
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{clientInitial}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardCategory}>
              {clientName}{companyName ? ` · ${companyName}` : ''}
            </Text>
            {item.category && <Text style={styles.cardProvider}>🏷️ {item.category}</Text>}
          </View>
          <View style={[styles.statusPill, { backgroundColor: item.status === 'open' ? '#D1FAE5' : '#FEF3C7' }]}>
            <Text style={[styles.statusText, { color: item.status === 'open' ? '#065F46' : '#92400E' }]}>
              {item.status === 'open' ? 'Open' : item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
        {/* Meta */}
        <View style={styles.tagRow}>
          {item.location && <View style={styles.tag}><Text style={styles.tagText}>📍 {item.location}</Text></View>}
          {item.budget && <View style={styles.tag}><Text style={styles.tagText}>💰 {item.budget}</Text></View>}
          {item.timeline && <View style={styles.tag}><Text style={styles.tagText}>⏱️ {item.timeline}</Text></View>}
        </View>
        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.offersCount}>
              {item.offers_count} offer{item.offers_count !== 1 ? 's' : ''}
            </Text>
            {item.lowest_offer != null && (
              <Text style={styles.lowestOffer}>
                · Lowest: ${item.lowest_offer.toLocaleString()}
              </Text>
            )}
          </View>
          <View style={styles.footerRight}>
            {item.status === 'open' && (
              <TouchableOpacity
                style={styles.bidBtn}
                onPress={() => {
                  onSelectRfq?.(item);
                  onNavigate('SubmitOffer');
                }}
              >
                <Text style={styles.bidBtnText}>Bid</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => onNavigate('RFQ')}
            >
              <Text style={styles.detailsBtnText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Render: Header ────────────────────────────────────────────────────────

  function renderHeader() {
    return (
      <View>
        {/* Hero */}
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Industrial Marketplace</Text>
            <Text style={styles.heroSub}>
              {activeTab === 'services'
                ? `${services.length} service${services.length !== 1 ? 's' : ''} available`
                : activeTab === 'companies'
                ? `${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'} listed`
                : `${rfqs.length} active RFQ${rfqs.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.postRfqBtn}
            onPress={() => onNavigate('CreateRFQ')}
          >
            <Text style={styles.postRfqBtnText}>+ Post RFQ</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => load()}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => changeTab(tab.key)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // ── Render: Empty ─────────────────────────────────────────────────────────

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>{activeTab === 'rfqs' ? '📋' : '🔍'}</Text>
        <Text style={styles.emptyTitle}>
          {activeTab === 'rfqs' ? 'No RFQs yet' : 'No results found'}
        </Text>
        <Text style={styles.emptyText}>
          {activeTab === 'rfqs'
            ? 'RFQ marketplace is coming soon. Check back later!'
            : 'Try adjusting your search or filters.'}
        </Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  const data = activeTab === 'services' ? services : activeTab === 'companies' ? companies : rfqs;
  const renderFn = activeTab === 'services' ? renderService : activeTab === 'rfqs' ? renderRFQ : renderCompany;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mint} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={data as any[]}
        keyExtractor={(item: any) => item.id}
        renderItem={renderFn as any}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.mint} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  listContent: { paddingBottom: spacing.xxl },

  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary },
  heroSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  postRfqBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  postRfqBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.white,
  },

  // Search
  searchWrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg, borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + 4, height: 42,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: spacing.xs + 2 },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.textPrimary },
  clearBtn: { fontSize: 16, color: colors.textMuted, padding: 4 },

  // Tabs
  tabRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  tabActive: { backgroundColor: colors.mintLight },
  tabIcon: { fontSize: 16, marginRight: spacing.xs },
  tabLabel: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textPrimary },
  tabLabelActive: { color: colors.mintDark },

  // Empty
  empty: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  // Service Card
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm + 4,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.mintLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 16, color: colors.mintDark },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.textPrimary },
  cardCategory: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardProvider: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  priceWrap: { alignItems: 'flex-end' },
  price: { fontFamily: fonts.extraBold, fontSize: 17, color: colors.mintDark },
  priceLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted },

  description: {
    fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary,
    lineHeight: 18, marginBottom: spacing.sm,
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  tag: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  tagText: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary },

  cardActions: {
    flexDirection: 'row', gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  outlineBtnText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textPrimary },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.mint,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },

  // Company
  companyAvatar: {
    backgroundColor: colors.accentLight,
  },
  verifiedBadge: {
    fontSize: 12, color: colors.success, fontWeight: '700',
  },

  // RFQ
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  footerLeft: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm,
  },
  budget: {
    fontFamily: fonts.bold, fontSize: 15, color: colors.mintDark,
  },
  offersCount: {
    fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted,
  },
  lowestOffer: {
    fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted,
  },
  footerRight: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm,
  },
  bidBtn: {
    backgroundColor: colors.mint,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  bidBtnText: {
    fontFamily: fonts.bold, fontSize: 13, color: colors.white,
  },
  detailsBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  detailsBtnText: {
    fontFamily: fonts.semiBold, fontSize: 13, color: colors.textPrimary,
  },

  // Status Pill
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: fonts.semiBold, fontSize: 12,
  },
});