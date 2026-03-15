import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

type Props = { onNavigate: (screen: string) => void };

export default function ProfileScreen({ onNavigate }: Props) {
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
  const accountType = profile?.user_type === 'engineer' ? 'Engineer Account' : 'Client Account';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const MENU_ITEMS = [
    { icon: '🏢', label: 'Company Profile', sub: 'Manage your company listing' },
    { icon: '📋', label: 'My Orders', sub: 'View order history', screen: 'Orders' },
    { icon: '💬', label: 'Messages', sub: 'Inbox & conversations', screen: 'Messages' },
    { icon: '⭐', label: 'Saved Suppliers', sub: 'Bookmarked suppliers' },
    { icon: '🔔', label: 'Notifications', sub: 'Manage alerts' },
    { icon: '🔒', label: 'Security', sub: 'Password & 2FA' },
    { icon: '💳', label: 'Billing', sub: 'Payment methods & invoices' },
    { icon: '❓', label: 'Help & Support', sub: 'FAQs and contact us' },
  ];

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>👤</Text>
        <Text style={styles.emptyText}>Sign in to view your profile</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => onNavigate('Auth')}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{accountType}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Menu items */}
      <View style={styles.menuCard}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuRow, index < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
            onPress={() => item.screen && onNavigate(item.screen)}
            activeOpacity={0.7}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>{item.icon}</Text>
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Precision Project Flow v1.0</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  signInBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  signInBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  profileCard: {
    backgroundColor: colors.mint, alignItems: 'center',
    paddingTop: 36, paddingBottom: 28, paddingHorizontal: spacing.lg,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 3, borderColor: colors.white,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.white },
  name: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16,
  },
  typeText: { fontSize: 12, fontWeight: '700', color: colors.white },
  editBtn: {
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: colors.mint },
  menuCard: {
    backgroundColor: colors.white, marginHorizontal: spacing.md,
    marginTop: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  menuIconText: { fontSize: 18 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  menuChevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  signOutBtn: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.lg, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.error, alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: colors.error },
  version: { textAlign: 'center', marginTop: 16, fontSize: 12, color: colors.textMuted },
});
