import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchActivities } from '../services/activities';
import { companiesService } from '../services/companies';
import { colors, radius, spacing, fonts, shadows } from '../theme';
import type { SiteActivity, CompanyProfile } from '../lib/types';

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '10,000+', label: 'Verified Suppliers' },
  { value: '50+',     label: 'Countries Served' },
  { value: '98%',     label: 'Satisfaction' },
  { value: '24/7',    label: 'Secure Platform' },
];

const CATEGORIES = [
  { label: 'Civil Engineering',        count: '2,847', icon: '🏗️' },
  { label: 'Mechanical Engineering',   count: '3,421', icon: '⚙️' },
  { label: 'Electrical Engineering',   count: '2,156', icon: '⚡' },
  { label: 'Controls & Automation',    count: '1,893', icon: '🤖' },
  { label: 'Manufacturing',            count: '4,102', icon: '🏭' },
  { label: 'Construction Services',    count: '3,654', icon: '🔨' },
  { label: 'Material Handling',        count: '1,567', icon: '📦' },
  { label: 'Logistics & Supply Chain', count: '2,234', icon: '🚚' },
];

const FEATURED_FALLBACK = [
  {
    name: 'Bechtel Corporation',
    category: 'Civil Engineering',
    location: 'Reston, VA',
    rating: '4.9',
    reviews: 127,
    tags: ['Infrastructure', 'Power Generation', 'Mining'],
    initial: 'B',
  },
  {
    name: 'AECOM',
    category: 'Transportation',
    location: 'Dallas, TX',
    rating: '4.8',
    reviews: 203,
    tags: ['Urban Planning', 'Water Treatment', 'Environmental'],
    initial: 'A',
  },
  {
    name: 'Fluor Corporation',
    category: 'Energy & Chemicals',
    location: 'Irving, TX',
    rating: '4.7',
    reviews: 156,
    tags: ['Oil & Gas', 'Petrochemicals', 'Refining'],
    initial: 'F',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Search & Discover',
    desc: 'Find qualified suppliers by product, service, or company across 500,000+ industrial products',
  },
  {
    step: '2',
    title: 'Request Quotes',
    desc: 'Send RFQs to multiple suppliers simultaneously. Compare quotes and capabilities side-by-side',
  },
  {
    step: '3',
    title: 'Connect & Order',
    desc: 'Contact suppliers directly, negotiate terms, and complete transactions securely',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { onNavigate: (screen: string) => void };

export default function HomeScreen({ onNavigate }: Props) {
  const { session, profile } = useAuth();
  const jwt = session?.access_token ?? '';
  const tokenBalance = profile?.token_balance ?? 0;
  const [activities, setActivities] = useState<SiteActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [featuredCompanies, setFeaturedCompanies] = useState<CompanyProfile[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);

  useEffect(() => {
    if (!jwt) return;

    // Load activity mini-feed
    const loadActivities = async () => {
      setActivitiesLoading(true);
      try {
        const result = await fetchActivities(jwt, 0, 'all', '');
        setActivities(result.activities.slice(0, 4));
      } catch (_) {
        // silent — mini-feed is non-critical
      } finally {
        setActivitiesLoading(false);
      }
    };

    // Load featured companies from Supabase
    const loadFeatured = async () => {
      setFeaturedLoading(true);
      try {
        const companies = await companiesService.getFeatured(jwt, 3);
        setFeaturedCompanies(companies);
      } catch (_) {
        // fallback to hardcoded data
        setFeaturedCompanies([]);
      } finally {
        setFeaturedLoading(false);
      }
    };

    loadActivities();
    loadFeatured();
  }, [jwt]);

  // Use real data or fallback
  const featuredDisplay = featuredCompanies.length > 0
    ? featuredCompanies.map(c => ({
        name: c.company_name,
        category: (c.specialties?.[0] ?? 'Engineering'),
        location: [c.city, c.state].filter(Boolean).join(', ') || 'Remote',
        rating: '4.8',
        reviews: c.is_verified ? 50 : 10,
        tags: (c.specialties ?? []).slice(0, 3),
        initial: c.company_name[0]?.toUpperCase() ?? '?',
      }))
    : FEATURED_FALLBACK;

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <View style={s.hero}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.brandRow}>
            <View style={s.brandLogo}>
              <Text style={s.brandLogoTxt}>PPF</Text>
            </View>
            <Text style={s.brand}>Precision Project Flow</Text>
          </View>
          <View style={s.topBarRight}>
            <TouchableOpacity style={s.tokenPill} onPress={() => onNavigate('Tokens')} activeOpacity={0.7}>
              <Text style={s.tokenPillIcon}>🪙</Text>
              <Text style={s.tokenPillText}>{tokenBalance}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.loginBtn} onPress={() => onNavigate('Profile')}>
              <Text style={s.loginBtnTxt}>Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero text */}
        <View style={s.heroBody}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeTxt}>🏭  Industrial Marketplace</Text>
          </View>
          <Text style={s.heroTitle}>Source Industrial{'\n'}Products & Services</Text>
          <Text style={s.heroSub}>
            Connect with verified engineering suppliers, manufacturers, and service providers
          </Text>

          {/* CTA buttons */}
          <View style={s.heroCTAs}>
            <TouchableOpacity
              style={s.ctaPrimary}
              onPress={() => onNavigate('Shop')}
              activeOpacity={0.85}>
              <Text style={s.ctaPrimaryTxt}>Browse Marketplace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.ctaSecondary}
              onPress={() => onNavigate('Shop')}
              activeOpacity={0.85}>
              <Text style={s.ctaSecondaryTxt}>View Featured →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats ticker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.statsRow}>
          {STATS.map((st, i) => (
            <View key={i} style={s.statChip}>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionEyebrow}>EXPLORE</Text>
        <Text style={s.sectionTitle}>Browse by Engineering Category</Text>
        <Text style={s.sectionSub}>
          Explore thousands of verified suppliers across major industries
        </Text>

        <View style={s.catGrid}>
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity
              key={i}
              style={s.catCard}
              onPress={() => onNavigate('Shop')}
              activeOpacity={0.8}>
              <Text style={s.catIcon}>{cat.icon}</Text>
              <Text style={s.catLabel}>{cat.label}</Text>
              <Text style={s.catCount}>{cat.count} suppliers</Text>
              <Text style={s.catArrow}>Explore →</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── FEATURED SUPPLIERS ───────────────────────────────────────────── */}
      <View style={[s.section, s.sectionAlt]}>
        <Text style={s.sectionEyebrow}>TRUSTED PARTNERS</Text>
        <View style={s.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>Featured Suppliers</Text>
            <Text style={s.sectionSub}>Premium verified engineering companies you can trust</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('Shop')}>
            <Text style={s.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>

        {featuredLoading ? (
          <ActivityIndicator size="small" color={colors.mint} style={{ marginTop: 16 }} />
        ) : featuredDisplay.length === 0 ? (
          <Text style={s.noActivities}>No featured suppliers found.</Text>
        ) : (
          featuredDisplay.map((sup, i) => (
            <TouchableOpacity
              key={i}
              style={s.supplierCard}
              onPress={() => onNavigate('Shop')}
              activeOpacity={0.85}>
              <View style={s.premiumBadge}>
                <Text style={s.premiumBadgeTxt}>⭐ Premium Verified</Text>
              </View>

              <View style={s.supplierTop}>
                <View style={s.supplierLogo}>
                  <Text style={s.supplierLogoTxt}>{sup.initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.supplierName}>{sup.name}</Text>
                  <Text style={s.supplierCat}>{sup.category}</Text>
                  <Text style={s.supplierLoc}>📍 {sup.location}</Text>
                  <View style={s.ratingRow}>
                    <Text style={s.ratingStars}>⭐ {sup.rating}</Text>
                    <Text style={s.ratingCount}>({sup.reviews} reviews)</Text>
                  </View>
                </View>
              </View>

              <View style={s.tagsRow}>
                {sup.tags.map((tag, j) => (
                  <View key={j} style={s.tag}>
                    <Text style={s.tagTxt}>{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={s.supplierActions}>
                <TouchableOpacity style={s.quoteBtn} onPress={() => onNavigate('Messages')}>
                  <Text style={s.quoteBtnTxt}>Request Quote</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.profileBtn} onPress={() => onNavigate('Shop')}>
                  <Text style={s.profileBtnTxt}>View Profile</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionEyebrow}>THE PROCESS</Text>
        <Text style={s.sectionTitle}>How Precision Project Flow Works</Text>
        <Text style={s.sectionSub}>
          Streamlined sourcing connecting buyers with qualified engineering suppliers
        </Text>

        {HOW_IT_WORKS.map((step, i) => (
          <View key={i} style={s.stepCard}>
            <View style={s.stepNum}>
              <Text style={s.stepNumTxt}>{step.step}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[s.ctaAccent, { marginTop: spacing.md }]}
          onPress={() => onNavigate('Shop')}
          activeOpacity={0.85}>
          <Text style={s.ctaAccentTxt}>Get Started Free →</Text>
        </TouchableOpacity>
      </View>

      {/* ── SUPPLIER CTA ─────────────────────────────────────────────────── */}
      <View style={[s.section, s.sectionAlt]}>
        <Text style={s.sectionEyebrow}>FOR SUPPLIERS</Text>
        <Text style={s.sectionTitle}>Are You a Supplier?</Text>
        <Text style={s.sectionSub}>
          Join thousands of verified suppliers connecting with qualified buyers. Grow your business.
        </Text>

        <View style={s.supplierCTACard}>
          {[
            '✓  Free company profile',
            '✓  Receive qualified RFQs',
            '✓  Showcase your capabilities',
            '✓  Connect with decision makers',
          ].map((item, i) => (
            <Text key={i} style={s.checkItem}>{item}</Text>
          ))}

          <TouchableOpacity
            style={s.ctaAccentFull}
            onPress={() => onNavigate('Profile')}
            activeOpacity={0.85}>
            <Text style={s.ctaAccentTxt}>Register as Supplier</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── ACTIVITY MINI-FEED ─────────────────────────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={s.eyebrowRow}>
              <Text style={s.eyebrowIcon}>🔗</Text>
              <Text style={s.sectionEyebrow}>BLOCKCHAIN LEDGER</Text>
            </View>
            <Text style={s.sectionTitle}>Live Activity Feed</Text>
            <Text style={s.sectionSub}>Real-time platform activity — cryptographically chained</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('Activity')}>
            <Text style={s.viewAll}>View Full →</Text>
          </TouchableOpacity>
        </View>

        {activitiesLoading ? (
          <ActivityIndicator size="small" color={colors.mint} style={{ marginTop: 16 }} />
        ) : activities.length === 0 ? (
          <View style={s.emptyActivity}>
            <Text style={s.emptyActivityIcon}>🔗</Text>
            <Text style={s.emptyActivityTitle}>No activity yet</Text>
            <Text style={s.emptyActivityText}>Activity will appear as vendors post RFQs, submit offers, and complete orders.</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={s.activityCard}
              onPress={() => onNavigate('Activity')}
              activeOpacity={0.7}
            >
              <View style={s.activityRow}>
                <View style={s.activityContent}>
                  <Text style={s.activitySummary} numberOfLines={2}>
                    {activity.summary}
                  </Text>
                  <Text style={s.activityTime}>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={s.activityArrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={[s.ctaOutline, { marginTop: spacing.md }]}
          onPress={() => onNavigate('Activity')}
          activeOpacity={0.85}>
          <Text style={s.ctaOutlineTxt}>View Full Activity Feed →</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Hero
  hero: { backgroundColor: colors.bg, paddingBottom: spacing.md },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.logo,
  },
  brandLogoTxt: { fontFamily: fonts.extraBold, fontSize: 12, color: colors.white, letterSpacing: 0.5 },
  brand: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.textPrimary },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenPillIcon: { fontSize: 14, marginRight: 4 },
  tokenPillText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textPrimary },
  loginBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    ...shadows.button,
  },
  loginBtnTxt: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.white },
  heroBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mintLight,
    borderWidth: 1,
    borderColor: colors.mintMid,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  heroBadgeTxt: { fontFamily: fonts.medium, fontSize: 12, color: colors.mintDark },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    color: colors.textPrimary,
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  heroCTAs: { flexDirection: 'row', gap: spacing.sm },
  ctaPrimary: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...shadows.button,
  },
  ctaPrimaryTxt: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  ctaSecondary: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  ctaSecondaryTxt: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary },
  ctaAccent: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...shadows.button,
  },
  ctaAccentTxt: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  ctaOutline: {
    borderWidth: 1.5,
    borderColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  ctaOutlineTxt: { fontFamily: fonts.bold, fontSize: 15, color: colors.mint },
  statsRow: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingTop: spacing.xs },
  statChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 110,
    ...shadows.card,
  },
  statValue: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.mint, marginBottom: 2 },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, textAlign: 'center' },

  // Sections
  section: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },
  sectionAlt: { backgroundColor: colors.bg },
  sectionEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.mint,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 30,
    marginBottom: spacing.sm,
  },
  sectionSub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  viewAll: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.mint, marginTop: 4 },

  // Category grid (2-col)
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catCard: {
    width: '47.5%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catIcon: { fontSize: 28, marginBottom: 8 },
  catLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.textPrimary, marginBottom: 4, lineHeight: 18 },
  catCount: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginBottom: 8 },
  catArrow: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.mint },

  // Supplier cards
  supplierCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mintLight,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.mintMid,
  },
  premiumBadgeTxt: { fontFamily: fonts.bold, fontSize: 10, color: colors.mintDark },
  supplierTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  supplierLogo: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.mintMid,
  },
  supplierLogoTxt: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.mintDark },
  supplierName: { fontFamily: fonts.bold, fontSize: 15, color: colors.textPrimary, marginBottom: 2 },
  supplierCat: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  supplierLoc: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingStars: { fontFamily: fonts.bold, fontSize: 12, color: colors.textPrimary },
  ratingCount: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagTxt: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary },
  supplierActions: { flexDirection: 'row', gap: spacing.sm },
  quoteBtn: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quoteBtnTxt: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  profileBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  profileBtnTxt: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textPrimary },

  // How it works
  stepCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumTxt: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.white },
  stepTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  stepDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 19 },

  // Supplier CTA
  supplierCTASection: { backgroundColor: colors.textPrimary },
  supplierCTACard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkItem: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 10,
    lineHeight: 20,
  },
  ctaWhite: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  ctaWhiteTxt: { fontFamily: fonts.bold, fontSize: 15, color: colors.textPrimary },
  ctaAccentFull: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.button,
  },

  // Activity feed
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  activitySummary: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  activityTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  activityArrow: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.mint,
  },
  activityDate: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  activityText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  activityDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  noActivities: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  emptyActivityIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyActivityTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyActivityText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  eyebrowIcon: {
    fontSize: 12,
  },
});
