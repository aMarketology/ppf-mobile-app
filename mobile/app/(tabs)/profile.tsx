import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Settings, Coins, Star, Briefcase, FileText, Package, LogOut, ChevronRight } from 'lucide-react-native';
import { supabase, type Profile } from '../../lib/supabase';
import { colors, spacing, radius, fonts, shadows } from '../../lib/theme';

const TABS = ['Overview', 'Services', 'Orders', 'RFQs'];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState({ services: 0, orders: 0, rfqs: 0, rating: 0 });

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);

    // Load counts
    const [{ count: svcCount }, { count: orderCount }, { count: rfqCount }] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('provider_id', user.id),
      supabase.from('product_orders').select('*', { count: 'exact', head: true }).or(`client_id.eq.${user.id},provider_id.eq.${user.id}`),
      supabase.from('rfqs').select('*', { count: 'exact', head: true }).eq('client_id', user.id),
    ]);
    setStats({ services: svcCount ?? 0, orders: orderCount ?? 0, rfqs: rfqCount ?? 0, rating: data?.rating ?? 0 });
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, []);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/welcome');
        }
      },
    ]);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>

          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{profile?.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.full_name}</Text>
          {profile?.company_name ? <Text style={styles.company}>{profile.company_name}</Text> : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.badges}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {profile?.user_type === 'engineer' ? '⚙️ Engineer' : '🏢 Client'}
              </Text>
            </View>
            {(profile?.rating ?? 0) > 0 && (
              <View style={styles.ratingBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{profile?.rating?.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Token balance card */}
        <TouchableOpacity style={styles.tokenCard} onPress={() => router.push('/buy-tokens')}>
          <View style={styles.tokenLeft}>
            <Coins size={24} color={colors.accent} />
            <View>
              <Text style={styles.tokenBalance}>{profile?.token_balance ?? 0} tokens</Text>
              <Text style={styles.tokenSub}>Tap to buy more</Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.services}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.rfqs}</Text>
            <Text style={styles.statLabel}>RFQs</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {[
            { icon: Briefcase, label: 'My Services', desc: 'Manage your service listings', route: null },
            { icon: Package, label: 'My Orders', desc: 'Track your active orders', route: null },
            { icon: FileText, label: 'My RFQs', desc: 'Requests you\'ve posted', route: null },
            { icon: Settings, label: 'Edit Profile', desc: 'Update your info', route: '/settings' },
          ].map(({ icon: Icon, label, desc, route }) => (
            <TouchableOpacity
              key={label}
              style={styles.menuItem}
              onPress={() => route && router.push(route as any)}
            >
              <View style={styles.menuIcon}>
                <Icon size={18} color={colors.primary} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{label}</Text>
                <Text style={styles.menuDesc}>{desc}</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={18} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  profileHeader: { alignItems: 'center', padding: spacing.xl, paddingBottom: spacing.lg, position: 'relative' },
  settingsBtn: { position: 'absolute', top: spacing.lg, right: spacing.lg, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: spacing.md },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 34, color: colors.primary },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, marginBottom: 4 },
  company: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  bio: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  typeBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  typeBadgeText: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  ratingText: { fontFamily: fonts.semiBold, fontSize: 12, color: '#92400E' },
  tokenCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  tokenLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tokenBalance: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  tokenSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  statsRow: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statValue: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  menuIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  menuInfo: { flex: 1 },
  menuLabel: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.text },
  menuDesc: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, paddingVertical: spacing.lg },
  signOutText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.error },
});
