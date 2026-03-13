import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props = { onNavigate: (screen: string) => void };

export default function ProfileScreen({ onNavigate }: Props) {
  const MENU_ITEMS = [
    { icon: '🏢', label: 'Company Profile', sub: 'Manage your company listing' },
    { icon: '📋', label: 'My Orders', sub: 'View order history', screen: 'Orders' },
    { icon: '💬', label: 'Messages', sub: 'Inbox & conversations', screen: 'Messages' },
    { icon: '⭐', label: 'Saved Suppliers', sub: '12 suppliers saved' },
    { icon: '🔔', label: 'Notifications', sub: 'Manage alerts' },
    { icon: '🔒', label: 'Security', sub: 'Password & 2FA' },
    { icon: '💳', label: 'Billing', sub: 'Payment methods & invoices' },
    { icon: '❓', label: 'Help & Support', sub: 'FAQs and contact us' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JD</Text>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@company.com</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>Client Account</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { value: '4', label: 'Orders' },
          { value: '3', label: 'Active RFQs' },
          { value: '12', label: 'Saved' },
        ].map((s, i) => (
          <View key={i} style={[styles.stat, i < 2 && styles.statBorder]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Supplier CTA */}
      <TouchableOpacity style={styles.supplierCta} activeOpacity={0.85}>
        <View>
          <Text style={styles.ctaTitle}>Are you a supplier?</Text>
          <Text style={styles.ctaSub}>
            Register your company and start receiving qualified RFQs
          </Text>
        </View>
        <Text style={styles.ctaArrow}>→</Text>
      </TouchableOpacity>

      {/* Menu */}
      <View style={styles.menu}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuRow, i < MENU_ITEMS.length - 1 && styles.menuBorder]}
            activeOpacity={0.7}
            onPress={() => item.screen && onNavigate(item.screen)}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Precision Project Flow v1.0.0</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  profileCard: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: colors.white },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  email: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  typeBadge: {
    backgroundColor: colors.mintLight,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  typeText: { fontSize: 12, fontWeight: '700', color: colors.mintDark },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  editBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  supplierCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mintDark,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', maxWidth: 250 },
  ctaArrow: { fontSize: 24, color: colors.white, marginLeft: 'auto' },
  menu: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { fontSize: 20, width: 36 },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  menuArrow: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  signOutBtn: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#fee2e2',
    marginBottom: spacing.sm,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: colors.error },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
});
