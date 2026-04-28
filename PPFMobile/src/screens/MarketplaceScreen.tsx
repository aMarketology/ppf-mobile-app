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
import { useAuth } from '../context/AuthContext';
import { fetchServices, formatServicePrice, type ServiceWithProvider } from '../services/servicesService';

const FILTER_TABS = ['All', 'Civil', 'Mechanical', 'Electrical', 'Energy'];

type Props = { onNavigate: (screen: string) => void };

export default function MarketplaceScreen({ onNavigate }: Props) {
  const { session } = useAuth();
  const jwt = session?.access_token ?? '';

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [services, setServices] = useState<ServiceWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <Text style={styles.headerSub}>
          {loading ? '...' : `${services.length.toLocaleString()} engineering services`}
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
            placeholder="Search services, categories..."
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
          <Text style={styles.loadingText}>Loading services...</Text>
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
              <Text style={styles.emptyText}>No services found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filtered.map((s, i) => {
              const providerName = s.provider?.full_name ?? 'Provider';
              const initial = providerName[0]?.toUpperCase() ?? '?';
              return (
                <TouchableOpacity key={s.id ?? i} style={styles.card} activeOpacity={0.85}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{s.title}</Text>
                      {s.category && (
                        <Text style={styles.category}>{s.category}</Text>
                      )}
                      <Text style={styles.location}>
                        � {providerName}
                      </Text>
                    </View>
                    <Text style={styles.priceTag}>{formatServicePrice(s.price)}</Text>
                  </View>
                  {s.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {s.description}
                    </Text>
                  )}
                  {s.tags && s.tags.length > 0 && (
                    <View style={styles.tags}>
                      {s.tags.slice(0, 3).map((tag: string, j: number) => (
                        <View key={j} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.cardFooter}>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.profileBtn}>
                      <Text style={styles.profileBtnText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quoteBtn}>
                      <Text style={styles.quoteBtnText}>Get Quote</Text>
                    </TouchableOpacity>
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
  priceTag: { fontSize: 16, fontWeight: '800', color: colors.mint, alignSelf: 'flex-start', marginLeft: 8 },
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
