import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

const CATEGORIES = [
  { label: 'Civil Engineering', count: '2,847', icon: '🏗️' },
  { label: 'Mechanical', count: '3,421', icon: '⚙️' },
  { label: 'Electrical', count: '2,156', icon: '⚡' },
  { label: 'Controls & Automation', count: '1,893', icon: '🤖' },
  { label: 'Manufacturing', count: '4,102', icon: '🏭' },
  { label: 'Construction', count: '3,654', icon: '🔨' },
  { label: 'Material Handling', count: '1,567', icon: '📦' },
  { label: 'Logistics', count: '2,234', icon: '🚚' },
];

const FEATURED = [
  {
    name: 'Bechtel Corporation',
    category: 'Civil Engineering',
    location: 'Reston, VA',
    rating: '4.9',
    reviews: 127,
    tags: ['Infrastructure', 'Power Generation', 'Mining'],
  },
  {
    name: 'AECOM',
    category: 'Transportation',
    location: 'Dallas, TX',
    rating: '4.8',
    reviews: 203,
    tags: ['Urban Planning', 'Water Treatment', 'Environmental'],
  },
  {
    name: 'Fluor Corporation',
    category: 'Energy & Chemicals',
    location: 'Irving, TX',
    rating: '4.7',
    reviews: 156,
    tags: ['Oil & Gas', 'Petrochemicals', 'Refining'],
  },
];

type Props = { onNavigate: (screen: string) => void };

export default function HomeScreen({ onNavigate }: Props) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.headerTitle}>Find Suppliers</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>JD</Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        {[
          { value: '10k+', label: 'Verified Suppliers' },
          { value: '50+', label: 'Countries' },
          { value: '98%', label: 'Satisfaction' },
        ].map((s, i) => (
          <View key={i} style={[styles.statItem, i < 2 && styles.statBorder]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <TouchableOpacity
        style={styles.searchBox}
        onPress={() => onNavigate('Marketplace')}
        activeOpacity={0.8}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>
          Search suppliers, products, services...
        </Text>
      </TouchableOpacity>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.qaBtn, styles.qaBtnPrimary]}
          onPress={() => onNavigate('Marketplace')}
          activeOpacity={0.85}>
          <Text style={styles.qaBtnPrimaryText}>Browse Marketplace</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qaBtn}
          onPress={() => onNavigate('Messages')}
          activeOpacity={0.85}>
          <Text style={styles.qaBtnText}>My Messages</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}>
        {CATEGORIES.map((cat, i) => (
          <TouchableOpacity
            key={i}
            style={styles.catCard}
            onPress={() => onNavigate('Marketplace')}
            activeOpacity={0.8}>
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={styles.catLabel}>{cat.label}</Text>
            <Text style={styles.catCount}>{cat.count} suppliers</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Suppliers */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Suppliers</Text>
        <TouchableOpacity onPress={() => onNavigate('Marketplace')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      {FEATURED.map((s, i) => (
        <TouchableOpacity
          key={i}
          style={styles.supplierCard}
          onPress={() => onNavigate('Marketplace')}
          activeOpacity={0.85}>
          <View style={styles.supplierTop}>
            <View style={styles.supplierAvatar}>
              <Text style={styles.supplierAvatarText}>
                {s.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.supplierInfo}>
              <View style={styles.supplierNameRow}>
                <Text style={styles.supplierName}>{s.name}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              </View>
              <Text style={styles.supplierCat}>{s.category}</Text>
              <Text style={styles.supplierLoc}>📍 {s.location}</Text>
            </View>
          </View>
          <View style={styles.tagsRow}>
            {s.tags.map((tag, j) => (
              <View key={j} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.supplierFooter}>
            <Text style={styles.rating}>⭐ {s.rating}</Text>
            <Text style={styles.reviews}>({s.reviews} reviews)</Text>
            <TouchableOpacity style={styles.quoteBtn}>
              <Text style={styles.quoteBtnText}>Request Quote</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.white },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchPlaceholder: { fontSize: 15, color: colors.textMuted },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  qaBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  qaBtnPrimary: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  qaBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: colors.white },
  qaBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.md,
    marginTop: spacing.md,
  },
  seeAll: { fontSize: 14, color: colors.mint, fontWeight: '600' },
  catRow: { paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  catCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: 140,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catIcon: { fontSize: 28, marginBottom: 8 },
  catLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  catCount: { fontSize: 11, color: colors.textMuted },
  supplierCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  supplierTop: { flexDirection: 'row', marginBottom: 12 },
  supplierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supplierAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.mintDark,
  },
  supplierInfo: { flex: 1 },
  supplierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  supplierName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: colors.mintLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: { fontSize: 10, fontWeight: '700', color: colors.mintDark },
  supplierCat: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  supplierLoc: { fontSize: 12, color: colors.textMuted },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  supplierFooter: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  reviews: { fontSize: 12, color: colors.textMuted, marginLeft: 4, flex: 1 },
  quoteBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quoteBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
});
