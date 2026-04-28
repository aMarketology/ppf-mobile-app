import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../context/AuthContext';
import {
  fetchTokenBalance, fetchPurchaseHistory, createPaymentIntent,
  TOKEN_PACKAGES,
  type TokenPurchase, type TokenPackage,
} from '../services/tokens';
import { colors, spacing, radius } from '../theme';

type Props = { onBack: () => void };

export default function TokenScreen({ onBack }: Props) {
  const { user, session } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const jwt = session?.access_token ?? '';

  const [balance,   setBalance]   = useState<number | null>(null);
  const [history,   setHistory]   = useState<TokenPurchase[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buying,    setBuying]    = useState<string | null>(null); // package id
  const [err,       setErr]       = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!user || !jwt) return;
    if (!quiet) setLoading(true);
    setErr(null);
    try {
      const [bal, hist] = await Promise.all([
        fetchTokenBalance(user.id, jwt),
        fetchPurchaseHistory(user.id, jwt),
      ]);
      setBalance(bal);
      setHistory(hist);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, jwt]);

  useEffect(() => { load(); }, [load]);

  async function handleBuy(pkg: TokenPackage) {
    if (buying || !user) return;
    setBuying(pkg.id);
    try {
      // 1. Create PaymentIntent via edge function
      const { clientSecret } = await createPaymentIntent(pkg.id, jwt);

      // 2. Initialize Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Precision Project Flow',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: { email: user.email },
        returnURL: 'ppfmobile://stripe-redirect',
      });
      if (initError) throw new Error(initError.message);

      // 3. Present Payment Sheet to user
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment failed', presentError.message);
        }
        return;
      }

      // 4. Payment succeeded — webhook credits tokens server-side.
      //    Reload balance after a short delay to let webhook process.
      Alert.alert('✅ Payment successful!', `${pkg.tokens} tokens are being added to your account.`);
      setTimeout(() => load(true), 2000);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Purchase failed');
    } finally {
      setBuying(null);
    }
  }

  const dollarStr = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const dateStr   = (iso: string)   =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Tokens</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.mint} />
          <Text style={s.muted}>Loading…</Text>
        </View>
      ) : err ? (
        <View style={s.center}>
          <Text style={s.errTxt}>{err}</Text>
          <TouchableOpacity style={s.mintBtn} onPress={() => load()}>
            <Text style={s.mintBtnTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={colors.mint}
            />
          }>

          {/* ── Balance card ─────────────────────────────────────────── */}
          <View style={s.balanceCard}>
            <Text style={s.balanceLabel}>Current Balance</Text>
            <View style={s.balanceRow}>
              <Text style={s.balanceCoin}>🪙</Text>
              <Text style={s.balanceNum}>{balance ?? 0}</Text>
            </View>
            <Text style={s.balanceSub}>tokens</Text>
          </View>

          {/* ── What are tokens? ─────────────────────────────────────── */}
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>What are tokens?</Text>
            <Text style={s.infoBody}>
              Tokens are used to unlock supplier contacts, request quotes, and send priority messages.
              Packages never expire.
            </Text>
          </View>

          {/* ── Purchase packages ────────────────────────────────────── */}
          <Text style={s.sectionTitle}>Buy Tokens</Text>
          <View style={s.packagesGrid}>
            {TOKEN_PACKAGES.map(pkg => {
              const isLoading = buying === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[s.pkgCard, pkg.popular && s.pkgCardPopular]}
                  onPress={() => handleBuy(pkg)}
                  disabled={!!buying}
                  activeOpacity={0.8}>
                  {pkg.popular && (
                    <View style={s.popularBadge}>
                      <Text style={s.popularBadgeTxt}>Most Popular</Text>
                    </View>
                  )}
                  <Text style={s.pkgTokens}>{pkg.tokens}</Text>
                  <Text style={s.pkgLabel}>tokens</Text>
                  <Text style={s.pkgPrice}>{dollarStr(pkg.price)}</Text>
                  <Text style={s.pkgPer}>${((pkg.price / 100) / pkg.tokens).toFixed(2)} each</Text>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.white} style={{ marginTop: 10 }} />
                  ) : (
                    <View style={[s.pkgBtn, pkg.popular && s.pkgBtnPopular]}>
                      <Text style={[s.pkgBtnTxt, pkg.popular && s.pkgBtnTxtPopular]}>Buy</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Purchase history ─────────────────────────────────────── */}
          <Text style={s.sectionTitle}>Purchase History</Text>
          {history.length === 0 ? (
            <View style={s.emptyHistory}>
              <Text style={s.muted}>No purchases yet</Text>
            </View>
          ) : (
            <View style={s.historyCard}>
              {history.map((item, i) => (
                <View
                  key={item.id}
                  style={[s.historyRow, i < history.length - 1 && s.historyRowBorder]}>
                  <View style={s.historyIcon}>
                    <Text style={{ fontSize: 18 }}>🪙</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.historyTokens}>+{item.tokens} tokens</Text>
                    <Text style={s.historyDate}>{dateStr(item.created_at)}</Text>
                  </View>
                  {item.stripe_payment_id && (
                    <Text style={s.historyId} numberOfLines={1}>
                      {item.stripe_payment_id.slice(0, 12)}…
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  title:      { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  backBtn:    { width: 60 },
  backTxt:    { fontSize: 16, color: colors.mint, fontWeight: '600' },
  muted:      { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  errTxt:     { fontSize: 13, color: colors.error, textAlign: 'center', marginBottom: 16 },
  mintBtn:    { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  mintBtnTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  // Balance card
  balanceCard: {
    margin: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.mintDark,
    paddingVertical: 32, alignItems: 'center',
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 8 },
  balanceRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceCoin:  { fontSize: 36 },
  balanceNum:   { fontSize: 64, fontWeight: '900', color: colors.white, lineHeight: 72 },
  balanceSub:   { fontSize: 16, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  // Info card
  infoCard: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.mintLight, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.mintMid,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: colors.mintDark, marginBottom: 4 },
  infoBody:  { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  // Packages grid
  packagesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: spacing.md,
  },
  pkgCard: {
    width: '47%', backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  pkgCardPopular: {
    borderColor: colors.mint, borderWidth: 2,
  },
  popularBadge: {
    backgroundColor: colors.mint, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8,
  },
  popularBadgeTxt: { fontSize: 10, fontWeight: '800', color: colors.white },
  pkgTokens:  { fontSize: 36, fontWeight: '900', color: colors.textPrimary },
  pkgLabel:   { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  pkgPrice:   { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  pkgPer:     { fontSize: 11, color: colors.textMuted, marginBottom: 12 },
  pkgBtn:     {
    borderWidth: 1.5, borderColor: colors.mint, borderRadius: radius.md,
    paddingHorizontal: 24, paddingVertical: 8, marginTop: 4,
  },
  pkgBtnPopular: { backgroundColor: colors.mint, borderColor: colors.mint },
  pkgBtnTxt:    { fontSize: 14, fontWeight: '700', color: colors.mint },
  pkgBtnTxtPopular: { color: colors.white },
  // History
  emptyHistory: {
    marginHorizontal: spacing.md, padding: spacing.lg,
    backgroundColor: colors.white, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  historyCard: {
    marginHorizontal: spacing.md, backgroundColor: colors.white,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  historyRow:       { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  historyIcon:      {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  historyTokens: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  historyDate:   { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  historyId:     { fontSize: 10, color: colors.textMuted, maxWidth: 80 },
});
