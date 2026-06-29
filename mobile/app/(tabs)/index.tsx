import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search, Briefcase, Coins, FileText, MessageSquare, Package,
} from 'lucide-react-native';
import { supabase, type Service, type Profile } from '../../lib/supabase';
import ServiceCard from '../../components/ServiceCard';
import { colors, spacing, radius, fonts } from '../../lib/theme';

const CATEGORIES_GRID = [
  { label: 'Civil Engineering', icon: '🏗️', cat: 'Engineering'  },
  { label: 'Mechanical',        icon: '⚙️',  cat: 'Engineering'  },
  { label: 'Electrical',        icon: '⚡',  cat: 'Electrical'   },
  { label: 'Consulting',        icon: '💼',  cat: 'Consulting'   },
  { label: 'Installation',      icon: '🔧',  cat: 'Installation' },
  { label: 'Maintenance',       icon: '🔨',  cat: 'Maintenance'  },
  { label: 'Design',            icon: '✏️',  cat: 'Design'       },
  { label: 'Other',             icon: '📦',  cat: 'Other'        },
];

const QUICK_ACTIONS = [
  { icon: Package,       label: 'Marketplace', color: '#16A34A', route: '/(tabs)/marketplace' as any },
  { icon: FileText,      label: 'Post RFQ',    color: '#3B82F6', route: '/(tabs)/rfq' as any },
  { icon: Coins,         label: 'Buy Tokens',  color: '#F59E0B', route: '/buy-tokens' as any },
  { icon: MessageSquare, label: 'Messages',    color: '#8B5CF6', route: '/(tabs)/messages' as any },
];

interface DashStats { orders: number; services: number; rfqs: number; }

export default function FeedScreen() {
  const [services, setServices] = useState<(Service & { profiles?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [dashStats, setDashStats] = useState<DashStats>({ orders: 0, services: 0, rfqs: 0 });
  const insets = useSafeAreaInsets();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      setMyProfile(profileData);

      const [
        { count: orderCount },
        { count: svcCount },
        { count: rfqCount },
      ] = await Promise.all([
        supabase.from('orders')
          .select('*', { count: 'exact', head: true })
          .or(`client_id.eq.${user.id},engineer_id.eq.${user.id}`),
        supabase.from('services')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', user.id),
        supabase.from('rfqs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open'),
      ]);
      setDashStats({ orders: orderCount ?? 0, services: svcCount ?? 0, rfqs: rfqCount ?? 0 });
    }
    await fetchServices();
    setLoading(false);
  }

  async function fetchServices(cat?: string, q?: string) {
    const category = cat ?? activeCategory;
    const searchQ = q ?? search;
    let query = supabase
      .from('services')
      .select('*, profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (category !== 'All') query = query.eq('category', category);
    if (searchQ.trim()) query = query.ilike('title', `%${searchQ.trim()}%`);
    const { data } = await query.limit(30);
    setServices(data ?? []);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [activeCategory, search]);

  function handleCategoryTap(cat: string) {
    const next = activeCategory === cat ? 'All' : cat;
    setActiveCategory(next);
    fetchServices(next, search);
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
  const tokenBalance = myProfile?.token_balance ?? 0;

  const STAT_CARDS = [
    { label: 'Tokens',    value: String(tokenBalance),        icon: Coins,         color: colors.accent },
    { label: 'Services',  value: String(dashStats.services),  icon: Package,       color: '#60A5FA'     },
    { label: 'Orders',    value: String(dashStats.orders),    icon: Briefcase,     color: '#34D399'     },
    { label: 'Open RFQs', value: String(dashStats.rfqs),      icon: FileText,      color: '#F472B6'     },
  ];

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            {/* ── Dashboard Header ── */}
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientMid]}
              style={styles.dashHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Greeting row */}
              <View style={styles.greetRow}>
                <View>
                  <Text style={styles.greetSmall}>Welcome back,</Text>
                  <Text style={styles.greetName}>{firstName} 👋</Text>
                  <Text style={styles.greetSub}>Here's what's happening today</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.avatarWrap}>
                  {myProfile?.avatar_url ? (
                    <Image source={{ uri: myProfile.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{firstName[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Stat cards */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statScroll}
              >
                {STAT_CARDS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <View key={i} style={styles.statCard}>
                      <View style={[styles.statIconBg, { backgroundColor: s.color + '28' }]}>
                        <Icon size={15} color={s.color} />
                      </View>
                      <Text style={styles.statValue}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </LinearGradient>

            {/* ── Quick Actions ── */}
            <View style={styles.quickSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickGrid}>
                {QUICK_ACTIONS.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.quickBtn}
                      onPress={() => router.push(a.route)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.quickIconBg, { backgroundColor: a.color + '18' }]}>
                        <Icon size={22} color={a.color} />
                      </View>
                      <Text style={styles.quickLabel}>{a.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Category Grid ── */}
            <View style={styles.catSection}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Browse by Category</Text>
                <Text style={styles.eyebrow}>EXPLORE</Text>
              </View>
              <View style={styles.catGrid}>
                {CATEGORIES_GRID.map((cat, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.catCard, activeCategory === cat.cat && styles.catCardActive]}
                    onPress={() => handleCategoryTap(cat.cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <Text style={[styles.catLabel, activeCategory === cat.cat && styles.catLabelActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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
            </View>

            {/* ── Results Header ── */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {activeCategory === 'All' ? 'Latest Services' : activeCategory}
              </Text>
              <View style={styles.resultsRight}>
                {activeCategory !== 'All' && (
                  <TouchableOpacity onPress={() => handleCategoryTap(activeCategory)}>
                    <Text style={styles.clearBtn}>Clear ×</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.resultsCount}>{services.length} results</Text>
              </View>
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

  // ── Dashboard Header ──
  dashHeader: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  greetRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, marginBottom: spacing.lg,
  },
  greetSmall: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  greetName: { fontFamily: fonts.bold, fontSize: 26, color: colors.white, marginBottom: 2 },
  greetSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  avatarWrap: { marginTop: 4 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 20, color: colors.white },

  // ── Stat Cards ──
  statScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.lg, paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, minWidth: 110, gap: 4,
  },
  statIconBg: {
    width: 30, height: 30, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  statValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.white },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.6)' },

  // ── Quick Actions ──
  quickSection: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md,
  },
  quickGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickBtn: {
    flex: 1, alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  quickIconBg: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary, textAlign: 'center',
  },

  // ── Category Grid ──
  catSection: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, color: colors.primary, letterSpacing: 1.5 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catCard: {
    width: '47.5%', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  catCardActive: { borderColor: colors.primary, backgroundColor: '#DCFCE7' },
  catIcon: { fontSize: 26, marginBottom: 8 },
  catLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.text, lineHeight: 17 },
  catLabelActive: { color: colors.primary },

  // ── Search ──
  searchRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: spacing.md,
    paddingVertical: 12, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },

  // ── Results ──
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  resultsTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  resultsRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clearBtn: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary },
  resultsCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },

  // ── List ──
  list: { paddingHorizontal: spacing.lg, paddingBottom: 20, gap: spacing.md },

  // ── Empty ──
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
});
