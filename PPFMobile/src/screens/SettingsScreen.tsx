/**
 * SettingsScreen — Account settings matching the web app's /settings page.
 *
 * Tabs: Profile, Security, Notifications, Privacy
 * Profile: full_name, company_name, bio, location, avatar_url
 * Security: password change
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { restPatch } from '../lib/restClient';
import { supabase } from '../lib/supabase';
import { colors, spacing, radius, fonts, shadows } from '../theme';

type TabId = 'profile' | 'security' | 'notifications' | 'privacy';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: '👤' },
  { id: 'security',      label: 'Security',      icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'privacy',       label: 'Privacy',       icon: '🛡️' },
];

type Props = {
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function SettingsScreen({ onBack, onNavigate }: Props) {
  const { session, user, profile, refreshProfile } = useAuth();
  const { mode, setMode } = useTheme();
  const jwt = session?.access_token ?? '';

  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Profile form
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  // Security form
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setBio(profile.bio ?? '');
      setLocation(profile.location ?? '');
    }
  }, [profile]);

  // ── Save Profile ──────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!user?.id || !jwt) return;
    setSaving(true);
    try {
      await restPatch(
        `profiles?id=eq.${user.id}`,
        {
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
        },
        jwt,
      );
      await refreshProfile();
      Alert.alert('Saved', 'Profile updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  // ── Change Password ───────────────────────────────────────────────────────

  async function handleChangePassword() {
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      Alert.alert('Success', 'Password updated!');
      setNewPw('');
      setConfirmPw('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to update password');
    } finally {
      setSavingPw(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
  const email = user?.email ?? '';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Hero card — matching web */}
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroEmail}>{email}</Text>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {profile?.user_type === 'engineer' ? 'Engineer' : 'Client'} Account
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="City, State"
              placeholderTextColor={colors.textMuted}
            />

            {/* ── Appearance ─────────────────────────────────────────────── */}
            <View style={styles.appearanceSection}>
              <Text style={styles.sectionTitle}>Appearance</Text>
              <View style={styles.appearanceRow}>
                <TouchableOpacity
                  style={[styles.themeOption, mode === 'light' && styles.themeOptionActive]}
                  onPress={() => setMode('light')}
                  activeOpacity={0.8}
                >
                  <View style={styles.themeSwatchLight}>
                    <Text style={styles.themeSwatchIcon}>☀️</Text>
                  </View>
                  <Text style={[styles.themeOptionLabel, mode === 'light' && styles.themeOptionLabelActive]}>
                    Light
                  </Text>
                  {mode === 'light' && <Text style={styles.themeCheck}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.themeOption, mode === 'dark' && styles.themeOptionActive]}
                  onPress={() => setMode('dark')}
                  activeOpacity={0.8}
                >
                  <View style={styles.themeSwatchDark}>
                    <Text style={styles.themeSwatchIcon}>🌙</Text>
                  </View>
                  <Text style={[styles.themeOptionLabel, mode === 'dark' && styles.themeOptionLabelActive]}>
                    Dark
                  </Text>
                  {mode === 'dark' && <Text style={styles.themeCheck}>✓</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Security Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Change Password</Text>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newPw}
                onChangeText={setNewPw}
                placeholder="Min 8 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity
                style={styles.pwToggle}
                onPress={() => setShowPw(!showPw)}
              >
                <Text style={styles.pwToggleText}>{showPw ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Re-enter password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPw}
            />

            <TouchableOpacity
              style={[styles.saveBtn, savingPw && styles.saveBtnDisabled]}
              onPress={handleChangePassword}
              disabled={savingPw}
              activeOpacity={0.85}
            >
              {savingPw ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Notifications Tab ────────────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
            <Text style={styles.placeholderText}>
              Notification settings coming soon. You'll be able to manage email and push notification preferences here.
            </Text>
          </View>
        )}

        {/* ── Privacy Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'privacy' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
            <Text style={styles.placeholderText}>
              Privacy controls coming soon. Manage your data sharing preferences and account visibility here.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  backBtnText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.mint },
  headerTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.textPrimary },

  // Hero
  hero: {
    backgroundColor: colors.mint,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontFamily: fonts.extraBold, fontSize: 24, color: colors.white },
  heroName: { fontFamily: fonts.bold, fontSize: 18, color: colors.white, marginBottom: 2 },
  heroEmail: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  heroBadgeText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.white },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.mint,
  },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  tabLabelActive: { color: colors.mint, fontFamily: fonts.semiBold },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: spacing.md },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Form
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },

  // Appearance / theme toggle
  appearanceSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeOptionActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintLight,
  },
  themeSwatchLight: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSwatchDark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSwatchIcon: { fontSize: 14 },
  themeOptionLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  themeOptionLabelActive: { color: colors.mint },
  themeCheck: { fontFamily: fonts.bold, fontSize: 15, color: colors.mint },

  // Password row
  pwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pwToggle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pwToggleText: { fontSize: 20 },

  // Save button
  saveBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.button,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },

  // Placeholder
  placeholderText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});