import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search, Filter, Briefcase, Wrench, Zap, TrendingUp,
  Clock, Star, MapPin, ChevronRight,
} from 'lucide-react-native';
import { supabase, type Service, type Profile } from '../../lib/supabase';
import ServiceCard from '../../components/ServiceCard';
import { colors, spacing, radius, fonts } from '../../lib/theme';

const CATEGORIES = ['All', 'Engineering', 'Design', 'Consulting', 'Installation', 'Maintenance', 'Other'];

export default function FeedScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setMyProfile(data);
    }
    await fetchServices();
    setLoading(false);
  }

  async function fetchServices(cat?: string, q?: string) {
    let query = supabase.from('services').select('*').eq('is_active', true).order('created_at', { ascending: false });
    const category = cat ?? activeCategory;
    const searchQ = q ?? search;
    if (category !== 'All') query = query.eq('category', category);
    if (searchQ.trim()) query = query.ilike('title', `%${searchQ.trim()}%`);
    const { data } = await query.limit(30);
    setServices(data ?? []);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, [activeCategory, search]);

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    fetchServices(cat, search);
  }

  function handleSearch(q: string) {
    setSearch(q);
    fetchServices(activeCategory, q);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const firstName = myProfile?.full_name?.split(' ')[0] ?? 'there';

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
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
                <Text style={styles.subGreeting}>Discover engineering services</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.avatarBtn}>
                {myProfile?.avatar_url ? (
                  <Image source={{ uri: myProfile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {firstName[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Hero Banner ── */}
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientMid]}
              style={styles.heroBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>Find the right{'\n'}engineer today</Text>
                  <Text style={styles.heroSub}>Browse verified professionals and services</Text>
                </View>
                <View style={styles.heroIcon}>
                  <Zap size={28} color={colors.accent} />
                </View>
              </View>
              {/* Quick stats */}
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <TrendingUp size={14} color={colors.accent} />
                  <Text style={styles.heroStatText}>10K+ Engineers</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Star size={14} color={colors.accent} />
                  <Text style={styles.heroStatText}>98% Satisfaction</Text>
                </View>
              </View>
            </LinearGradient>

            {/* ── Search ── */}
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search services..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={handleSearch}
                />
              </View>
              <TouchableOpacity style={styles.filterBtn}>
                <Filter size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* ── Categories ── */}
            <View style={styles.categoriesHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, activeCategory === cat && styles.chipActive]}
                  onPress={() => handleCategoryChange(cat)}
                >
                  <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Results Header ── */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {activeCategory === 'All' ? 'All Services' : activeCategory}
              </Text>
              <Text style={styles.resultsCount}>{services.length} results</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Briefcase size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptyText}>Try a different search or category</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerLeft: {},
  greeting: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  subGreeting: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  avatarBtn: { width: 44, height: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },

  // ── Hero Banner ──
  heroBanner: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: 20, padding: 20, overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  heroText: { flex: 1 },
  heroTitle: {
    fontFamily: fonts.bold, fontSize: 20, lineHeight: 26,
    color: colors.white, marginBottom: 6,
  },
  heroSub: {
    fontFamily: fonts.regular, fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  heroIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroStats: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  heroStat: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  heroStatText: {
    fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.8)',
  },
  heroStatDivider: {
    width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16,
  },

  // ── Search ──
  searchRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: spacing.md,
    paddingVertical: 12, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  filterBtn: {
    width: 48, height: 48, backgroundColor: colors.surface, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },

  // ── Categories ──
  categoriesHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  categoryList: { paddingHorizontal: spacing.lg, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  // ── Results ──
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
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
