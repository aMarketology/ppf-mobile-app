/**
 * ServiceDetailScreen — Full detail view for a marketplace service listing.
 *
 * Opens when a service card is tapped on the Shop tab.
 *  • Provider card (avatar + name)
 *  • Title, category badge, description
 *  • Price / delivery / service area stat row
 *  • Tags
 *  • Orange "Request Quote" CTA → 75-token DM flow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createConversation } from '../services/messages';
import { radius, spacing, fonts, shadows } from '../theme';
import type { ServiceWithProvider } from '../services/servicesService';

const DM_COST = 75;

type Props = {
  service: ServiceWithProvider;
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function ServiceDetailScreen({ service, onBack, onNavigate }: Props) {
  const { session, user, profile, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const jwt = session?.access_token ?? '';
  const [busy, setBusy] = useState(false);

  const provider = service.provider;
  const providerName = provider?.full_name ?? 'Verified Provider';
  const initial = providerName[0]?.toUpperCase() ?? '?';
  const balance = profile?.token_balance ?? 0;

  async function requestQuote() {
    if (!jwt || !user) return;
    if (!provider?.id) {
      Alert.alert('Unavailable', 'This provider has no linked account to message.');
      return;
    }
    if (provider.id === user.id) {
      Alert.alert('Your Listing', 'You cannot message yourself about your own service.');
      return;
    }

    Alert.alert(
      'Start a Conversation',
      `Opening a direct line of communication costs ${DM_COST} tokens.\n\nYour balance: ${balance} tokens.\n\nThis will be deducted from your account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              setBusy(true);
              const res = await createConversation(jwt, provider.id);
              if (res.charged) {
                await refreshProfile();
              }
              onNavigate('Messages');
            } catch (e: any) {
              const msg = e?.message ?? '';
              if (msg.toLowerCase().includes('insufficient')) {
                Alert.alert('Not Enough Tokens', `You need ${DM_COST} tokens to start a new conversation. Visit the Token Store to buy more.`);
              } else {
                Alert.alert('Error', msg || 'Could not open conversation. Please try again.');
              }
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Provider Card */}
        <View style={styles.providerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.providerName} numberOfLines={1}>{providerName}</Text>
            <Text style={styles.providerLabel}>Service Provider</Text>
          </View>
        </View>

        {/* Title + Category */}
        <View style={styles.card}>
          <Text style={styles.title}>{service.title}</Text>
          {!!service.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{service.category}</Text>
            </View>
          )}
          {!!service.description && (
            <Text style={styles.description}>{service.description}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Starting Price</Text>
              <Text style={styles.statValue}>
                ${Number(service.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Delivery</Text>
              <Text style={styles.statValueSmall}>{service.delivery_time || 'Contact provider'}</Text>
            </View>
          </View>
          {!!service.service_area && (
            <View style={styles.areaRow}>
              <Text style={styles.areaLabel}>Service Area</Text>
              <Text style={styles.areaValue}>{service.service_area}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {!!service.tags && service.tags.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagWrap}>
              {service.tags.map((t, i) => (
                <View key={`${t}-${i}`} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.cta, busy && styles.ctaDisabled]}
          onPress={requestQuote}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>Request Quote · {DM_COST} tokens</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.ctaHint}>Balance: {balance} tokens</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.border,
  },
  backIcon: { fontSize: 18, color: colors.mint, fontFamily: fonts.semiBold },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary,
  },
  headerSpacer: { width: 36 },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },

  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, ...shadows.card,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.mintLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 20, color: colors.mint },
  providerName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary },
  providerLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, ...shadows.card,
  },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary, marginBottom: 10 },
  categoryPill: {
    alignSelf: 'flex-start', backgroundColor: colors.mintLight,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 12,
  },
  categoryText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.mint },
  description: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },

  statRow: { flexDirection: 'row', alignItems: 'center' },
  statCell: { flex: 1 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border, marginHorizontal: 12 },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.mint },
  statValueSmall: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary },
  areaRow: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  areaLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  areaValue: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },

  sectionLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: '#FF6B35', borderRadius: radius.lg,
    paddingVertical: 15, alignItems: 'center', ...shadows.button,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { fontFamily: fonts.bold, fontSize: 15, color: '#FFFFFF' },
  ctaHint: {
    textAlign: 'center', fontFamily: fonts.regular,
    fontSize: 12, color: colors.textMuted, marginTop: 8,
  },
});