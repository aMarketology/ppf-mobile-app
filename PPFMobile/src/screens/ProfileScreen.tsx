import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type Props = { onNavigate: (screen: string) => void };

export default function ProfileScreen({ onNavigate }: Props) {
  const { user, profile, signOut } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
  const accountType = profile?.user_type === 'engineer' ? 'Engineer Account' : 'Client Account';
  const tokenBalance = profile?.token_balance ?? 0;
  const version = 'Precision Project Flow v1.2';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const MENU_ITEMS = [
    { icon: '⚙️', label: 'Settings',         sub: 'Appearance, profile, security', screen: 'Settings' },
    { icon: '🏢', label: 'Company Profile', sub: 'Manage your company listing', screen: 'CompanyProfile' },
    { icon: '📋', label: 'My Orders',        sub: 'View order history',          screen: 'Orders' },
    { icon: '📰', label: 'Feed',             sub: 'Social feed & updates',       screen: 'Feed' },
    { icon: '💬', label: 'Messages',          sub: 'Inbox & conversations',       screen: 'Messages' },
    { icon: '🔔', label: 'Notifications',     sub: 'Manage alerts' },
    { icon: '🔒', label: 'Security',          sub: 'Password & 2FA',             screen: 'Settings' },
    { icon: '💳', label: 'Billing',           sub: 'Payment methods & invoices' },
    { icon: '❓', label: 'Help & Support',    sub: 'FAQs and contact us' },
    { icon: '🧾', label: 'Receipts',          sub: 'Scan & manage expense receipts', screen: 'Receipts' },
  ];

  if (!user) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyIcon}>👤</Text>
        <Text style={s.emptyText}>Sign in to view your profile</Text>
        <TouchableOpacity style={s.signInBtn} onPress={() => onNavigate('Auth')}>
          <Text style={s.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract job title and social links from profile
  const jobTitle = (profile as any)?.job_title ?? '';
  const socialLinks = [
    { key: 'linkedin',  url: (profile as any)?.linkedin_url,  icon: '🔗' },
    { key: 'twitter',   url: (profile as any)?.twitter_url,   icon: '𝕏' },
    { key: 'github',    url: (profile as any)?.github_url,    icon: '🐙' },
    { key: 'youtube',   url: (profile as any)?.youtube_url,   icon: '▶️' },
    { key: 'instagram', url: (profile as any)?.instagram_url, icon: '📷' },
    { key: 'website',   url: (profile as any)?.website_url,   icon: '🌐' },
  ].filter(link => !!link.url); // Only include links that are set

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.name}>{displayName}</Text>
        <Text style={s.email}>{email}</Text>
        <View style={s.typeBadge}>
          <Text style={s.typeText}>{accountType}</Text>
        </View>
        {jobTitle ? <Text style={s.jobTitle}>{jobTitle}</Text> : null}
        <TouchableOpacity style={s.editBtn} onPress={() => onNavigate('Settings')}>
          <Text style={s.editBtnText}>Edit Profile / Settings</Text>
        </TouchableOpacity>

        {/* Social links — tap to open */}
        {socialLinks.length > 0 && (
          <View style={s.socialRow}>
            {socialLinks.map(link => (
              <TouchableOpacity
                key={link.key}
                style={s.socialChip}
                onPress={() => Linking.openURL(link.url)}
                activeOpacity={0.7}>
                <Text style={s.socialChipIcon}>{link.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Token balance card */}
      <TouchableOpacity style={s.tokenCard} onPress={() => onNavigate('Tokens')} activeOpacity={0.85}>
        <View style={s.tokenLeft}>
          <Text style={s.tokenCoin}>🪙</Text>
          <View>
            <Text style={s.tokenBalance}>{tokenBalance} tokens</Text>
            <Text style={s.tokenSub}>Tap to buy more</Text>
          </View>
        </View>
        <View style={s.tokenBtn}>
          <Text style={s.tokenBtnTxt}>Buy Tokens</Text>
        </View>
      </TouchableOpacity>

      {/* Menu items */}
      <View style={s.menuCard}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[s.menuRow, index < MENU_ITEMS.length - 1 && s.menuRowBorder]}
            onPress={() => item.screen && onNavigate(item.screen)}
            activeOpacity={0.7}>
            <View style={s.menuIcon}>
              <Text style={s.menuIconText}>{item.icon}</Text>
            </View>
            <View style={s.menuText}>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuSub}>{item.sub}</Text>
            </View>
            <Text style={s.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={s.version}>{version}</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  signInBtn:     { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
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
  name:       { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 4 },
  email:      { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16,
  },
  typeText: { fontSize: 12, fontWeight: '700', color: colors.white },
  jobTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: -6,
    marginBottom: 12,
  },
  editBtn:     { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 10 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: colors.mint },
  // Token card
  tokenCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.mintMid,
  },
  tokenLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tokenCoin:    { fontSize: 28 },
  tokenBalance: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  tokenSub:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tokenBtn:     { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 8 },
  tokenBtnTxt:  { fontSize: 13, fontWeight: '700', color: colors.white },
  // Menu
  menuCard: {
    backgroundColor: colors.white, marginHorizontal: spacing.md,
    marginTop: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  menuRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuIconText: { fontSize: 18 },
  menuText:     { flex: 1 },
  menuLabel:    { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  menuSub:      { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  menuChevron:  { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  signOutBtn: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.lg, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.error, alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: colors.error },
  version: { textAlign: 'center', marginTop: 16, fontSize: 12, color: colors.textMuted },
  // Social chips
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  socialChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  socialChipIcon: { fontSize: 17 },
});
