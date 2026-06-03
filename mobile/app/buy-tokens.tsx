import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Zap, Star, Building2, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors, spacing, radius, fonts, shadows } from '../lib/theme';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    tokens: 20,
    price: '$4.99',
    priceNote: '$0.25/token',
    icon: Zap,
    color: '#6366F1',
    popular: false,
    perks: ['20 tokens', 'Start 4 conversations', 'Never expires'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tokens: 50,
    price: '$9.99',
    priceNote: '$0.20/token',
    icon: Star,
    color: colors.primary,
    popular: true,
    perks: ['50 tokens', 'Start 10 conversations', 'Never expires', 'Best value'],
  },
  {
    id: 'business',
    name: 'Business',
    tokens: 150,
    price: '$24.99',
    priceNote: '$0.17/token',
    icon: Building2,
    color: '#F59E0B',
    popular: false,
    perks: ['150 tokens', 'Start 30 conversations', 'Never expires', 'Priority support'],
  },
];

export default function BuyTokensScreen() {
  const [selected, setSelected] = useState('pro');
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    const pkg = PACKAGES.find(p => p.id === selected);
    if (!pkg) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // In production this would call your Stripe payment intent edge function
    // For now we simulate the purchase
    try {
      const { error } = await supabase.rpc('add_tokens', {
        p_user_id: user.id,
        p_amount: pkg.tokens,
        p_description: `Purchased ${pkg.name} pack (${pkg.tokens} tokens)`,
        p_reference_id: `purchase_${Date.now()}`,
      });

      if (error) throw error;

      Alert.alert(
        '🎉 Purchase Successful!',
        `${pkg.tokens} tokens have been added to your account.`,
        [{ text: 'Great!', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Tokens</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Connect with Engineers</Text>
          <Text style={styles.heroSub}>
            Tokens unlock conversations. Each new conversation costs 5 tokens.
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How tokens work</Text>
          <View style={styles.howRow}>
            <View style={styles.howStep}><Text style={styles.howStepNum}>1</Text></View>
            <Text style={styles.howText}>Buy a token package below</Text>
          </View>
          <View style={styles.howRow}>
            <View style={styles.howStep}><Text style={styles.howStepNum}>2</Text></View>
            <Text style={styles.howText}>Start a conversation with any engineer (5 tokens)</Text>
          </View>
          <View style={styles.howRow}>
            <View style={styles.howStep}><Text style={styles.howStepNum}>3</Text></View>
            <Text style={styles.howText}>Reply freely — only the first message costs tokens</Text>
          </View>
        </View>

        {/* Packages */}
        <Text style={styles.sectionTitle}>Choose a Package</Text>
        {PACKAGES.map(pkg => {
          const Icon = pkg.icon;
          const isSelected = selected === pkg.id;
          return (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.pkgCard, isSelected && styles.pkgCardSelected, isSelected && { borderColor: pkg.color }]}
              onPress={() => setSelected(pkg.id)}
              activeOpacity={0.8}
            >
              {pkg.popular && (
                <View style={[styles.popularBadge, { backgroundColor: pkg.color }]}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <View style={styles.pkgTop}>
                <View style={[styles.pkgIconCircle, { backgroundColor: pkg.color + '20' }]}>
                  <Icon size={24} color={pkg.color} />
                </View>
                <View style={styles.pkgInfo}>
                  <Text style={styles.pkgName}>{pkg.name}</Text>
                  <Text style={styles.pkgTokens}>{pkg.tokens} tokens</Text>
                </View>
                <View style={styles.pkgPriceBlock}>
                  <Text style={styles.pkgPrice}>{pkg.price}</Text>
                  <Text style={styles.pkgPriceNote}>{pkg.priceNote}</Text>
                </View>
                <View style={[styles.radio, isSelected && { borderColor: pkg.color }]}>
                  {isSelected && <View style={[styles.radioDot, { backgroundColor: pkg.color }]} />}
                </View>
              </View>
              <View style={styles.pkgPerks}>
                {pkg.perks.map(perk => (
                  <View key={perk} style={styles.perkRow}>
                    <Check size={13} color={pkg.color} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.disclaimer}>
          Tokens are non-refundable. Prices in USD. Payment processed securely via Stripe.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseBtn, loading && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.purchaseBtnText}>
              Buy {PACKAGES.find(p => p.id === selected)?.tokens} Tokens — {PACKAGES.find(p => p.id === selected)?.price}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.semiBold, fontSize: 17, color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: 120 },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  heroSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  howCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  howTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text, marginBottom: spacing.md },
  howRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  howStep: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  howStepNum: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  howText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, flex: 1 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text, marginBottom: spacing.md },
  pkgCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 2, borderColor: colors.border, ...shadows.sm,
  },
  pkgCardSelected: { ...shadows.md },
  popularBadge: {
    alignSelf: 'flex-start', borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  popularText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.white },
  pkgTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pkgIconCircle: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  pkgInfo: { flex: 1 },
  pkgName: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  pkgTokens: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  pkgPriceBlock: { alignItems: 'flex-end' },
  pkgPrice: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  pkgPriceNote: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  pkgPerks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: spacing.sm },
  perkText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  disclaimer: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  purchaseBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center',
  },
  purchaseBtnDisabled: { opacity: 0.6 },
  purchaseBtnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
