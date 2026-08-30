/**
 * RFQOfferCard — In-chat RFQ offer proposal card.
 *
 * Renders inside the message list when message_type === 'rfq_offer'.
 * Three states:
 *   1. Bidder view — blue confirmation banner
 *   2. Client locked — amber "Unlock for 50 tokens"
 *   3. Client unlocked — full details + Send Contract / Schedule Meeting
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';

export interface RfqOfferData {
  rfqId: string;
  vendorId: string;
  ownerId: string;
  title: string;
  vendorName: string;
  amount: number;
  deliveryDays?: number;
  note?: string;
}

type Props = {
  data: RfqOfferData;
  currentUserId: string;
  isUnlocked: boolean;
  onUnlock: () => Promise<void>;
  onSendContract: () => void;
  onScheduleMeeting: () => void;
};

export default function RFQOfferCard({
  data,
  currentUserId,
  isUnlocked,
  onUnlock,
  onSendContract,
  onScheduleMeeting,
}: Props) {
  const [unlocking, setUnlocking] = useState(false);
  const isBidder = currentUserId === data.vendorId;
  const isOwner = currentUserId === data.ownerId;

  // ── Bidder view ──────────────────────────────────────────────────────────
  if (isBidder) {
    return (
      <View style={styles.card}>
        <View style={styles.bidderBanner}>
          <Text style={styles.bidderIcon}>📨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bidderTitle}>Application Sent</Text>
            <Text style={styles.bidderText}>
              Your offer of <Text style={styles.bold}>${data.amount.toLocaleString()}</Text> for{' '}
              <Text style={styles.bold}>{data.title}</Text> has been submitted.
              The RFQ owner can unlock and review it.
            </Text>
          </View>
        </View>
        {data.deliveryDays && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery</Text>
            <Text style={styles.detailValue}>{data.deliveryDays} days</Text>
          </View>
        )}
      </View>
    );
  }

  // ── Client locked view ───────────────────────────────────────────────────
  if (isOwner && !isUnlocked) {
    return (
      <View style={styles.card}>
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.lockedTitle}>RFQ Application Received</Text>
            <Text style={styles.lockedText}>
              <Text style={styles.bold}>{data.vendorName}</Text> submitted an offer of{' '}
              <Text style={styles.bold}>${data.amount.toLocaleString()}</Text> for{' '}
              <Text style={styles.bold}>{data.title}</Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.unlockBtn}
          onPress={async () => {
            setUnlocking(true);
            try { await onUnlock(); } catch (_) { /* handled by parent */ }
            finally { setUnlocking(false); }
          }}
          disabled={unlocking}
          activeOpacity={0.8}
        >
          {unlocking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.unlockBtnText}>Unlock for 50 Tokens</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ── Client unlocked view ─────────────────────────────────────────────────
  if (isOwner && isUnlocked) {
    return (
      <View style={styles.card}>
        <View style={styles.unlockedBanner}>
          <Text style={styles.unlockedIcon}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.unlockedTitle}>Application Unlocked</Text>
            <Text style={styles.unlockedText}>
              Offer from <Text style={styles.bold}>{data.vendorName}</Text>
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValueBold}>${data.amount.toLocaleString()}</Text>
          </View>
          {data.deliveryDays && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery</Text>
              <Text style={styles.detailValue}>{data.deliveryDays} days</Text>
            </View>
          )}
          {data.note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{data.note}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onSendContract}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>📄 Send Contract</Text>
            <Text style={styles.actionCost}>50 tokens</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={onScheduleMeeting}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnSecondaryText}>📅 Schedule Meeting</Text>
            <Text style={styles.actionCost}>50 tokens</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Other viewer (not bidder, not owner) ─────────────────────────────────
  return (
    <View style={styles.card}>
      <Text style={styles.genericText}>
        {data.vendorName} submitted an offer of ${data.amount.toLocaleString()} for {data.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginVertical: spacing.xs,
    maxWidth: 320,
  },

  // Bidder
  bidderBanner: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: spacing.sm + 4,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  bidderIcon: { fontSize: 20 },
  bidderTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 2,
  },
  bidderText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#3b82f6',
    lineHeight: 17,
  },

  // Locked
  lockedBanner: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: spacing.sm + 4,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  lockedIcon: { fontSize: 20 },
  lockedTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#92400e',
    marginBottom: 2,
  },
  lockedText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#d97706',
    lineHeight: 17,
  },
  unlockBtn: {
    backgroundColor: colors.mint,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unlockBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },

  // Unlocked
  unlockedBanner: {
    flexDirection: 'row',
    backgroundColor: colors.mintLight,
    padding: spacing.sm + 4,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.mintMid,
  },
  unlockedIcon: { fontSize: 20 },
  unlockedTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.mintDark,
    marginBottom: 2,
  },
  unlockedText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // Details
  details: {
    padding: spacing.sm + 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  detailValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  detailValueBold: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.mintDark,
  },
  noteBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm + 4,
    paddingTop: 0,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.white,
  },
  actionBtnSecondary: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnSecondaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  actionCost: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Generic
  genericText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    padding: spacing.sm + 4,
    lineHeight: 17,
  },

  bold: { fontFamily: fonts.semiBold },
});