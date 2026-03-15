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
import { colors, radius, spacing } from '../theme';
import { companiesService } from '../services/companies';
import type { CompanyProfile } from '../lib/types';

const FILTER_TABS = ['All', 'Civil', 'Mechanical', 'Electrical', 'Energy'];

type Props = { onNavigate: (screen: string) => void };

export default function MarketplaceScreen({ onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const data = await companiesService.getAll({ verified: true });
      setCompanies(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load suppliers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = companies.filter(c => {
    const matchSearch =
      search === '' ||
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.specialties ?? []).some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      activeFilter === 'All' ||
      (c.specialties ?? []).some(s => s.toLowerCase().includes(activeFilter.toLowerCase()));
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <Text style={styles.headerSub}>
          {loading ? '...' : `${companies.length.toLocaleString()} verified suppliers`}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search suppliers, products..."
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {FILTER_TABS.map((f, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mint} />
          <Text style={styles.loadingText}>Loading suppliers...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.mint}
            />
          }>
          <Text style={styles.resultCount}>{filtered.length} results</Text>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No suppliers found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filtered.map((s, i) => (
              <TouchableOpacity key={s.id ?? i} style={styles.card} activeOpacity={0.85}>
                {s.is_verified && (
                  <View style={styles.premiumBanner}>
                    <Text style={styles.premiumText}>✓ Verified Supplier</Text>
                  </View>
                )}
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{s.company_name.charAt(0)}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{s.company_name}</Text>
                    {s.specialties && s.specialties.length > 0 && (
                      <Text style={styles.category}>{s.specialties[0]}</Text>
                    )}
                    {(s.city || s.state) && (
                      <Text style={styles.location}>
                        📍 {[s.city, s.state].filter(Boolean).join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
                {s.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {s.description}
                  </Text>
                )}
                {s.specialties && s.specialties.length > 0 && (
                  <View style={styles.tags}>
                    {s.specialties.slice(0, 3).map((tag, j) => (
                      <View key={j} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.profileBtn}>
                    <Text style={styles.profileBtnText}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quoteBtn}>
                    <Text style={styles.quoteBtnText}>Get Quote</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  searchRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  clearBtn: { fontSize: 14, color: colors.textMuted, paddingLeft: 8 },
  filterRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterTabActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTabTextActive: { color: colors.white },
  list: { flex: 1, paddingHorizontal: spacing.md },
  resultCount: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm, fontWeight: '500' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.white },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: colors.textMuted },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  premiumBanner: {
    backgroundColor: colors.mintLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.mintMid,
  },
  premiumText: { fontSize: 11, fontWeight: '700', color: colors.mintDark },
  cardTop: { flexDirection: 'row', padding: spacing.md, paddingBottom: 8 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: colors.mintDark },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  category: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  location: { fontSize: 12, color: colors.textMuted },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: 10,
    lineHeight: 19,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.md, marginBottom: 12 },
  tag: {
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 6,
  },
  profileBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  profileBtnText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  quoteBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quoteBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
});
