import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Users, MessageSquare, Star, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, fonts } from '../../lib/theme';
import Button from '../../components/Button';

const { width } = Dimensions.get('window');

const STATS = [
  { value: '10K+', label: 'Engineers' },
  { value: '50+',  label: 'Countries' },
  { value: '98%',  label: 'Satisfaction' },
  { value: '24/7', label: 'Support' },
];

const FEATURES = [
  {
    icon: <Users size={22} color={colors.primary} />,
    title: 'Find Verified Engineers',
    desc: 'Browse 10,000+ vetted engineering professionals across every discipline.',
  },
  {
    icon: <Zap size={22} color={colors.primary} />,
    title: 'Post RFQs Instantly',
    desc: 'Describe your project and receive competitive bids within hours.',
  },
  {
    icon: <MessageSquare size={22} color={colors.primary} />,
    title: 'Direct Messaging',
    desc: 'Communicate securely with engineers and clients on one platform.',
  },
  {
    icon: <Star size={22} color={colors.primary} />,
    title: 'Trusted Reviews',
    desc: 'Make informed decisions with verified ratings and project history.',
  },
];

export default function WelcomeScreen() {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Zap size={14} color={colors.accent} />
              <Text style={styles.badgeText}>B2B Engineering Marketplace</Text>
            </View>
            <Text style={styles.headline}>The Platform Built for Engineers</Text>
            <Text style={styles.sub}>
              Connect with verified professionals, post RFQs, and grow your engineering business.
            </Text>
            <View style={styles.statsRow}>
              {STATS.map(s => (
                <View key={s.label} style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {FEATURES.map(f => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>{f.icon}</View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.ctas}>
          <Button
            title="Get Started — It's Free"
            onPress={() => router.push('/(auth)/signup')}
            variant="primary"
            fullWidth
          />
          <Button
            title="I Already Have an Account"
            onPress={() => router.push('/(auth)/login')}
            variant="outline"
            fullWidth
            style={styles.loginBtn}
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
  root: { flex: 1, backgroundColor: colors.background },
  hero: { paddingBottom: spacing.xxxl },
  heroContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 12, color: colors.accent },
  headline: { fontFamily: fonts.extraBold, fontSize: 30, color: colors.white, marginBottom: spacing.md, lineHeight: 36 },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: spacing.xl, lineHeight: 22 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.white },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  body: { flex: 1 },
  bodyContent: { padding: spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl, gap: spacing.md },
  featureIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.text, marginBottom: 3 },
  featureDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  ctas: { marginTop: spacing.sm, gap: spacing.md },
  loginBtn: { marginTop: 0 },
  terms: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: spacing.xl, lineHeight: 18 },
  link: { color: colors.primary, fontFamily: fonts.medium },
});
