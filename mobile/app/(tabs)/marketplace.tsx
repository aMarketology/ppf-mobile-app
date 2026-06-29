import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ShoppingBag } from 'lucide-react-native';
import { supabase, type Service } from '../../lib/supabase';
import ServiceCard from '../../components/ServiceCard';
import { colors, spacing, radius, fonts } from '../../lib/theme';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<(Service & { profiles?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchServices(); }, []);

  async function fetchServices(q?: string) {
    const searchQ = q ?? search;
    let query = supabase
      .from('services')
      .select('*, profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);
    if (searchQ.trim()) query = query.ilike('title', `%${searchQ.trim()}%`);
    const { data } = await query;
    setServices(data ?? []);
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, [search]);

  function handleSearch(q: string) {
    setSearch(q);
    fetchServices(q);
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
      <FlatList
        data={services}
        keyExtractor={s => s.id}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onPress={() => router.push(`/service/${item.id}` as any)}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: 80 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            {/* ── Hero ── */}
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientMid]}
              style={styles.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroEyebrow}>🏭  INDUSTRIAL MARKETPLACE</Text>
              <Text style={styles.heroTitle}>Source Engineering{'\n'}Services</Text>
              <Text style={styles.heroSub}>
                Connect with certified professionals across 50+ engineering disciplines
              </Text>
              <View style={styles.heroStats}>
                {[
                  { v: '10K+', l: 'Engineers' },
                  { v: '50+',  l: 'Countries' },
                  { v: '98%',  l: 'Satisfaction' },
                ].map((s, i) => (
                  <View key={i} style={styles.heroStat}>
                    <Text style={styles.heroStatVal}>{s.v}</Text>
                    <Text style={styles.heroStatLbl}>{s.l}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* ── Search ── */}
            <View style={styles.searchWrap}>
              <View style={styles.searchBox}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search services, specialties..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={handleSearch}
                />
              </View>
            </View>

            {/* ── Results header ── */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>All Services</Text>
              <Text style={styles.resultsCount}>{services.length} available</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <ShoppingBag size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptyText}>Try a different search or check back soon</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  // ── Hero ──
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heroEyebrow: {
    fontFamily: fonts.bold, fontSize: 10, color: colors.accent,
    letterSpacing: 1.5, marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: fonts.bold, fontSize: 30, lineHeight: 36,
    color: colors.white, marginBottom: spacing.sm,
  },
  heroSub: {
    fontFamily: fonts.regular, fontSize: 13,
    color: 'rgba(255,255,255,0.65)', lineHeight: 19, marginBottom: spacing.xl,
  },
  heroStats: { flexDirection: 'row', gap: spacing.sm },
  heroStat: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md, paddingVertical: 10, alignItems: 'center',
  },
  heroStatVal: { fontFamily: fonts.bold, fontSize: 16, color: colors.accent, marginBottom: 2 },
  heroStatLbl: {
    fontFamily: fonts.regular, fontSize: 10,
    color: 'rgba(255,255,255,0.6)', textAlign: 'center',
  },

  // ── Search ──
  searchWrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: spacing.md,
    paddingVertical: 14, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },

  // ── Results ──
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  resultsTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  resultsCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },

  // ── List ──
  list: { paddingHorizontal: spacing.lg, paddingBottom: 20, gap: spacing.md },

  // ── Empty ──
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
});
