/**
 * UnlockModal — Token-gated DM unlock flow.
 *
 * Shown when a user tries to message someone they haven't unlocked yet.
 * Displays token cost and offers token pack purchase options.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';

type Props = {
  visible: boolean;
  partnerName: string;
  tokenBalance: number;
  unlockCost?: number;
  onUnlock: () => Promise<void>;
  onBuyTokens: () => void;
  onClose: () => void;
};

export default function UnlockModal({
  visible,
  partnerName,
  tokenBalance,
  unlockCost = 100,
  onUnlock,
  onBuyTokens,
  onClose,
}: Props) {
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasEnough = tokenBalance >= unlockCost;

  async function handleUnlock() {
    setUnlocking(true);
    setError(null);
    try {
      await onUnlock();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to unlock conversation');
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🔒</Text>
          </View>
          <Text style={styles.title}>Unlock Conversation</Text>
          <Text style={styles.subtitle}>
            Message <Text style={styles.bold}>{partnerName}</Text> directly
          </Text>

          {/* Token info */}
          <View style={styles.tokenRow}>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenLabel}>Cost to unlock</Text>
              <Text style={styles.tokenCost}>{unlockCost} tokens</Text>
            </View>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenLabel}>Your balance</Text>
              <Text style={[
                styles.tokenBalance,
                !hasEnough && styles.tokenBalanceLow,
              ]}>
                {tokenBalance} tokens
              </Text>
            </View>
          </View>

          {/* Error */}
          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          {/* Actions */}
          {hasEnough ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleUnlock}
              disabled={unlocking}
              activeOpacity={0.8}
            >
              {unlocking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  Unlock for {unlockCost} Tokens
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.insufficient}>
                You need {unlockCost - tokenBalance} more tokens
              </Text>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={onBuyTokens}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>Buy Tokens</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.btnSecondaryText}>Cancel</Text>
          </TouchableOpacity>

          {/* Info */}
          <Text style={styles.info}>
            Unlocking lets you send direct messages. Friends and company members message for free.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: { fontSize: 28 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  bold: { fontFamily: fonts.semiBold },
  tokenRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tokenInfo: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    alignItems: 'center',
  },
  tokenLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  tokenCost: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.mintDark,
  },
  tokenBalance: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  tokenBalanceLow: {
    color: colors.error,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  insufficient: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnPrimary: {
    backgroundColor: colors.mint,
  },
  btnPrimaryText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
  },
  btnSecondary: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.textSecondary,
  },
  info: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});