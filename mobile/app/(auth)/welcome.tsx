import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Zap, Briefcase, Shield, Globe, ArrowRight,
} from 'lucide-react-native';
import { colors, spacing, radius, fonts } from '../../lib/theme';
import Button from '../../components/Button';

const STATS = [
  { value: '10K+', label: 'Engineers' },
  { value: '50+',  label: 'Countries' },
  { value: '98%',  label: 'Satisfaction' },
  { value: '24/7', label: 'Support' },
];

const FEATURES = [
  {
    icon: <Briefcase size={24} color={colors.primary} />,
    title: 'Verified Engineers',
    desc: 'Every engineer is vetted and background-checked before joining the platform.',
  },
  {
    icon: <Zap size={24} color={colors.accent} />,
    title: 'Post RFQs Instantly',
    desc: 'Get competitive bids from top engineers within hours, not days.',
  },
  {
    icon: <Shield size={24} color={colors.primary} />,
    title: 'Secure Payments',
    desc: 'Milestone-based payments via Stripe ensure your project stays on track.',
  },
  {
    icon: <Globe size={24} color={colors.accent} />,
    title: 'Global Network',
    desc: 'Access talent across 50+ countries with local expertise.',
  },
];

export default function WelcomeScreen() {
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          style={styles.hero}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              <View style={styles.chip}>
                <Zap size={12} color={colors.accent} />
                <Text style={styles.chipText}>B2B Engineering Marketplace</Text>
              </View>

              <Text style={styles.headline}>
                The Platform{'\n'}Built for{'\n'}
                <Text style={styles.headlineHighlight}>Engineers</Text>
              </Text>

              <Text style={styles.heroSub}>
                Connect with verified professionals, post RFQs, and grow your engineering business — all in one place.
              </Text>

              <View style={styles.heroButtons}>
                <Button
                  title="Get Started"
                  onPress={() => router.push('/(auth)/signup')}
                  style={styles.primaryCta}
                  textStyle={styles.ctaText}
                />
                <TouchableOpacity
                  style={styles.outlineCta}
                  onPress={() => router.push('/(auth)/login')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineCtaText}>I already have an account</Text>
                  <ArrowRight size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Stats Strip ── */}
        <View style={styles.statsStrip}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Features ── */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionLabel}>WHY PRECISION PROJECT FLOW</Text>
          <Text style={styles.sectionTitle}>Everything you need{'\n'}to succeed</Text>

          {FEATURES.map((feat) => (
            <View key={feat.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>{feat.icon}</View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Bottom CTA ── */}
        <View style={styles.bottomCta}>
          <Text style={styles.bottomTitle}>Ready to get started?</Text>
          <Text style={styles.bottomSub}>
            Join thousands of engineers already growing on Precision Project Flow.
          </Text>
          <Button
            title="Create Free Account"
            onPress={() => router.push('/(auth)/signup')}
            style={styles.bottomBtn}
            textStyle={styles.bottomBtnText}
          />
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Hero ──
  hero: {
    paddingBottom: 56,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  heroInner: { paddingTop: 24, paddingHorizontal: spacing.xl },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.15)',
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, gap: 6, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  chipText: {
    fontFamily: fonts.semiBold, fontSize: 11, color: colors.accent, letterSpacing: 0.5,
  },
  headline: {
    fontFamily: fonts.extraBold, fontSize: 34, lineHeight: 42,
    color: colors.white, marginBottom: 14,
  },
  headlineHighlight: { color: colors.accent },
  heroSub: {
    fontFamily: fonts.regular, fontSize: 15, lineHeight: 23,
    color: 'rgba(255,255,255,0.7)', marginBottom: 28,
  },
  heroButtons: { gap: 12 },
  primaryCta: { backgroundColor: colors.accent, borderRadius: 14, height: 52 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: colors.gradientStart },
  outlineCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  outlineCtaText: { fontFamily: fonts.medium, fontSize: 15, color: colors.white },

  // ── Stats Strip ──
  statsStrip: {
    flexDirection: 'row', backgroundColor: colors.white,
    marginHorizontal: 16, marginTop: -28,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 20, color: colors.primary, marginBottom: 2 },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, letterSpacing: 0.3 },

  // ── Features ──
  featuresSection: { paddingHorizontal: spacing.xl, paddingTop: 36 },
  sectionLabel: {
    fontFamily: fonts.semiBold, fontSize: 11, color: colors.primary,
    letterSpacing: 1.5, marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: fonts.bold, fontSize: 24, lineHeight: 32,
    color: colors.text, marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row', backgroundColor: colors.background,
    borderRadius: 16, padding: 16, marginBottom: 10, gap: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  featureIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text, marginBottom: 4 },
  featureDesc: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },

  // ── Bottom CTA ──
  bottomCta: {
    marginHorizontal: spacing.xl, marginTop: 32,
    backgroundColor: colors.gradientStart, borderRadius: 24,
    padding: 28, alignItems: 'center',
  },
  bottomTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.white, marginBottom: 8 },
  bottomSub: {
    fontFamily: fonts.regular, fontSize: 14, lineHeight: 21,
    color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 20,
  },
  bottomBtn: { backgroundColor: colors.accent, borderRadius: 14, height: 48, paddingHorizontal: 28 },
  bottomBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.gradientStart },
  terms: {
    textAlign: 'center', fontFamily: fonts.regular, fontSize: 12,
    color: colors.textMuted, marginTop: 28, lineHeight: 18, paddingHorizontal: spacing.xl,
  },
  link: { color: colors.primary, fontFamily: fonts.medium },
});
