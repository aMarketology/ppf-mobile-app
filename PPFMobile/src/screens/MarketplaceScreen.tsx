import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

const ALL_SUPPLIERS = [
  {
    name: 'Bechtel Corporation',
    category: 'Civil Engineering',
    location: 'Reston, VA',
    rating: '4.9',
    reviews: 127,
    tags: ['Infrastructure', 'Power Generation', 'Mining'],
    isVerified: true,
    isPremium: true,
  },
  {
    name: 'AECOM',
    category: 'Transportation',
    location: 'Dallas, TX',
    rating: '4.8',
    reviews: 203,
    tags: ['Urban Planning', 'Water Treatment', 'Environmental'],
    isVerified: true,
    isPremium: true,
  },
  {
    name: 'Fluor Corporation',
    category: 'Energy & Chemicals',
    location: 'Irving, TX',
    rating: '4.7',
    reviews: 156,
    tags: ['Oil & Gas', 'Petrochemicals', 'Refining'],
    isVerified: true,
    isPremium: true,
  },
  {
    name: 'Jacobs Engineering',
    category: 'Mechanical Engineering',
    location: 'Dallas, TX',
    rating: '4.6',
    reviews: 89,
    tags: ['Process Engineering', 'Nuclear', 'Aerospace'],
    isVerified: true,
    isPremium: false,
  },
  {
    name: 'HDR Inc.',
    category: 'Environmental',
    location: 'Omaha, NE',
    rating: '4.5',
    reviews: 74,
    tags: ['Water Resources', 'Environmental', 'Architecture'],
    isVerified: true,
    isPremium: false,
  },
  {
    name: 'Burns & McDonnell',
    category: 'Electrical Engineering',
    location: 'Kansas City, MO',
    rating: '4.8',
    reviews: 112,
    tags: ['Power Delivery', 'Renewables', 'T&D'],
    isVerified: true,
    isPremium: false,
  },
];

const FILTER_TABS = ['All', 'Civil', 'Mechanical', 'Electrical', 'Energy'];

type Props = { onNavigate: (screen: string) => void };

export default function MarketplaceScreen({ onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = ALL_SUPPLIERS.filter(s => {
    const matchSearch =
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      activeFilter === 'All' ||
      s.category.toLowerCase().includes(activeFilter.toLowerCase());
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <Text style={styles.headerSub}>
          {ALL_SUPPLIERS.length.toLocaleString()} verified suppliers
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
            <Text
              style={[
                styles.filterTabText,
                activeFilter === f && styles.filterTabTextActive,
              ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        <Text style={styles.resultCount}>{filtered.length} results</Text>
        {filtered.map((s, i) => (
          <TouchableOpacity key={i} style={styles.card} activeOpacity={0.85}>
            {s.isPremium && (
              <View style={styles.premiumBanner}>
                <Text style={styles.premiumText}>⭐ Premium Verified</Text>
              </View>
            )}
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{s.name.charAt(0)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.category}>{s.category}</Text>
                <Text style={styles.location}>📍 {s.location}</Text>
              </View>
            </View>
            <View style={styles.tags}>
              {s.tags.map((tag, j) => (
                <View key={j} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.rating}>⭐ {s.rating}</Text>
              <Text style={styles.reviews}>({s.reviews})</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.profileBtn}>
                <Text style={styles.profileBtnText}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quoteBtn}>
                <Text style={styles.quoteBtnText}>Get Quote</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
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
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
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
  filterTabActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTabTextActive: { color: colors.white },
  list: { flex: 1, paddingHorizontal: spacing.md },
  resultCount: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
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
  cardTop: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: 8,
  },
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
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: spacing.md,
    marginBottom: 12,
  },
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
  rating: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  reviews: { fontSize: 12, color: colors.textMuted },
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
