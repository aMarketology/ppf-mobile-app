/**
 * SubmitOfferScreen — Token-gated RFQ bidding.
 *
 * Engineers pay 50 tokens to submit an offer on an RFQ.
 * Pre-checks: authenticated, not owner, not same company, RFQ open, ≥ 50 tokens.
 * Calls submit_rfq_offer RPC → deducts tokens → creates DM → posts offer message.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { restRpc, restPost } from '../lib/restClient';
import { colors, spacing, radius, fonts } from '../theme';
import type { Rfq } from '../lib/types';

type Props = {
  rfq: Rfq;
  onBack: () => void;
  onNavigate: (s: string) => void;
};

export default function SubmitOfferScreen({ rfq, onBack, onNavigate }: Props) {
  const { session, profile, refreshProfile } = useAuth();
  const jwt = session?.access_token ?? '';
  const tokenBalance = profile?.token_balance ?? 0;
  const OFFER_COST = 50;

  const [amount, setAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState(profile?.full_name ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasEnoughTokens = tokenBalance >= OFFER_COST;

  // ── Pre-checks ────────────────────────────────────────────────────────────

  function runPreChecks(): string | null {
    if (!session?.user) return 'You must be logged in.';
    if (session.user.id === rfq.client_id) return 'You cannot bid on your own RFQ.';
    if (rfq.status !== 'open') return 'This RFQ is no longer open for bids.';
    if (!hasEnoughTokens) return `Insufficient tokens. You need ${OFFER_COST} tokens (you have ${tokenBalance}).`;
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) return 'Please enter a valid offer amount.';
    return null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const error = runPreChecks();
    if (error) { Alert.alert('Cannot submit', error); return; }

    setSubmitting(true);
    try {
      // Build structured note (matches desktop format)
      const structuredNote = [
        companyName.trim() ? `Company: ${companyName.trim()}` : null,
        contactName.trim() ? `Contact: ${contactName.trim()}` : null,
        phoneNumber.trim() ? `Phone: ${phoneNumber.trim()}` : null,
        deliveryDays.trim() ? `Delivery: ${deliveryDays.trim()} days` : null,
        note.trim() ? `\nAdditional Notes:\n${note.trim()}` : null,
      ].filter(Boolean).join('\n');

      // Call submit_rfq_offer RPC (deducts 50 tokens, inserts rfq_offers row)
      const result = await restRpc<any>('submit_rfq_offer', {
        p_rfq_id: rfq.id,
        p_vendor_id: session!.user.id,
        p_amount: Number(amount),
        p_note: structuredNote || null,
        p_delivery_days: deliveryDays.trim() ? parseInt(deliveryDays.trim(), 10) : null,
      }, jwt);

      if (result?.error) {
        Alert.alert('Error', result.error);
        setSubmitting(false);
        return;
      }

      // Refresh token balance
      await refreshProfile();

      Alert.alert(
        '✅ Offer Submitted!',
        `Your offer of $${Number(amount).toLocaleString()} has been submitted.\n\n${OFFER_COST} tokens were deducted. The RFQ owner can now review your application.`,
        [
          { text: 'View Messages', onPress: () => onNavigate('Messages') },
          { text: 'Done', onPress: onBack },
        ],
      );
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Offer</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {/* RFQ Summary */}
        <View style={styles.rfqCard}>
          <Text style={styles.rfqTitle}>{rfq.title}</Text>
          <View style={styles.rfqMeta}>
            {rfq.budget && <Text style={styles.rfqMetaText}>💰 {rfq.budget}</Text>}
            {rfq.category && <Text style={styles.rfqMetaText}>🏷️ {rfq.category}</Text>}
            {rfq.location && <Text style={styles.rfqMetaText}>📍 {rfq.location}</Text>}
            {rfq.timeline && <Text style={styles.rfqMetaText}>⏱️ {rfq.timeline}</Text>}
          </View>
          {rfq.description && <Text style={styles.rfqDesc} numberOfLines={3}>{rfq.description}</Text>}
        </View>

        {/* Token cost banner */}
        <View style={[styles.tokenBanner, hasEnoughTokens ? styles.tokenBannerOk : styles.tokenBannerLow]}>
          <Text style={styles.tokenBannerText}>
            {hasEnoughTokens
              ? `🪙 Cost: ${OFFER_COST} tokens · Your balance: ${tokenBalance}`
              : `⚠️ Need ${OFFER_COST - tokenBalance} more tokens · Balance: ${tokenBalance}`}
          </Text>
          {!hasEnoughTokens && (
            <TouchableOpacity style={styles.buyBtn} onPress={() => onNavigate('Tokens')}>
              <Text style={styles.buyBtnText}>Buy Tokens</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Offer Form */}
        <Text style={styles.sectionTitle}>Your Offer</Text>

        <Text style={styles.fieldLabel}>Amount ($) *</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="e.g. 5000" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

        <Text style={styles.fieldLabel}>Delivery (days)</Text>
        <TextInput style={styles.input} value={deliveryDays} onChangeText={setDeliveryDays} placeholder="e.g. 14" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

        <Text style={styles.fieldLabel}>Company Name</Text>
        <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Your company" placeholderTextColor={colors.textMuted} />

        <Text style={styles.fieldLabel}>Contact Name</Text>
        <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Your name" placeholderTextColor={colors.textMuted} />

        <Text style={styles.fieldLabel}>Phone Number</Text>
        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="+1 (555) 123-4567" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />

        <Text style={styles.fieldLabel}>Additional Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} value={note} onChangeText={setNote} placeholder="Include material costs, lead time details, etc." placeholderTextColor={colors.textMuted} multiline numberOfLines={4} textAlignVertical="top" />
      </ScrollView>

      {/* Submit Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtnOutline} onPress={onBack}>
          <Text style={styles.footerBtnOutlineText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, (!hasEnoughTokens || submitting) && styles.footerBtnDisabled]} onPress={handleSubmit} disabled={!hasEnoughTokens || submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.footerBtnText}>Submit Offer ({OFFER_COST} 🪙)</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.mint },
  headerTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.textPrimary },
  body: { flex: 1 },
  bodyContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  rfqCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  rfqTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary, marginBottom: spacing.sm },
  rfqMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2, marginBottom: spacing.sm },
  rfqMetaText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  rfqDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  tokenBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm + 4, borderRadius: radius.md, marginBottom: spacing.md },
  tokenBannerOk: { backgroundColor: colors.mintLight },
  tokenBannerLow: { backgroundColor: '#FEF2F2' },
  tokenBannerText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textPrimary, flex: 1 },
  buyBtn: { backgroundColor: colors.mint, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 4, borderRadius: radius.full },
  buyBtnText: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.md },
  fieldLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.sm + 2, fontFamily: fonts.regular, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.sm },
  textArea: { minHeight: 80, paddingTop: spacing.sm + 2 },
  footer: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  footerBtnOutline: { flex: 1, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  footerBtnOutlineText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textSecondary },
  footerBtn: { flex: 2, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center' },
  footerBtnDisabled: { backgroundColor: colors.mintMid },
  footerBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});