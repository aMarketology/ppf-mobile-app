import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search, Filter, Briefcase, Wrench } from 'lucide-react-native';
import { supabase, type Service, type Profile } from '../../lib/supabase';
import ServiceCard from '../../components/ServiceCard';
import { colors, spacing, radius, fonts } from '../../lib/theme';

const CATEGORIES = ['All', 'Engineering', 'Design', 'Consulting', 'Installation', 'Maintenance', 'Other'];
const SORT_OPTIONS = ['Newest', 'Price: Low', 'Price: High', 'Top Rated'];

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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {myProfile?.full_name?.split(' ')[0] ?? 'there'} 👋</Text>
          <Text style={styles.subGreeting}>Find engineering services</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.avatarBtn}>
          {myProfile?.avatar_url ? (
            <Image source={{ uri: myProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {myProfile?.full_name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
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

      {/* Category chips */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, activeCategory === item && styles.chipActive]}
            onPress={() => handleCategoryChange(item)}
          >
            <Text style={[styles.chipText, activeCategory === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Services list */}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  greeting: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  subGreeting: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  avatarBtn: { width: 40, height: 40 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  searchRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  filterBtn: {
    width: 44, height: 44, backgroundColor: colors.surface, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  categoryList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
});
