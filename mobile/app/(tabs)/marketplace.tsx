import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Users } from 'lucide-react-native';
import { supabase, type Profile } from '../../lib/supabase';
import EngineerCard from '../../components/EngineerCard';
import { colors, spacing, radius, fonts } from '../../lib/theme';

const SPECIALTIES = ['All', 'Civil', 'Mechanical', 'Electrical', 'Software', 'Chemical', 'Structural'];

export default function MarketplaceScreen() {
  const [engineers, setEngineers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');

  useEffect(() => { fetchEngineers(); }, []);

  async function fetchEngineers(q?: string, spec?: string) {
    const searchQ = q ?? search;
    const specFilter = spec ?? specialty;
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'engineer')
      .order('created_at', { ascending: false })
      .limit(40);
    if (searchQ.trim()) query = query.ilike('full_name', `%${searchQ.trim()}%`);
    if (specFilter !== 'All') query = query.eq('specialty', specFilter);
    const { data } = await query;
    setEngineers(data ?? []);
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEngineers();
    setRefreshing(false);
  }, [search, specialty]);

  function handleSearch(q: string) { setSearch(q); fetchEngineers(q, specialty); }
  function handleSpecialty(s: string) { setSpecialty(s); fetchEngineers(search, s); }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Find skilled engineers</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search engineers..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <SlidersHorizontal size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={SPECIALTIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={s => s}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, specialty === item && styles.chipActive]}
            onPress={() => handleSpecialty(item)}
          >
            <Text style={[styles.chipText, specialty === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={engineers}
        keyExtractor={e => e.id}
        renderItem={({ item }) => (
          <EngineerCard
            profile={item}
            onPress={() => router.push(`/engineer/${item.id}` as any)}
            onMessage={() => router.push(`/engineer/${item.id}` as any)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Users size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No engineers found</Text>
            <Text style={styles.emptyText}>Try adjusting your search</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
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
  chipList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
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
