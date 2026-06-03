import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Star, MessageCircle, Building2 } from 'lucide-react-native';
import { colors, spacing, radius, fonts, shadows } from '../lib/theme';
import type { Profile } from '../lib/supabase';

interface EngineerCardProps {
  profile: Profile;
  onPress: () => void;
  onMessage?: () => void;
}

export default function EngineerCard({ profile, onPress, onMessage }: EngineerCardProps) {
  const initials = (profile.full_name ?? 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity style={[styles.card, shadows.md]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{profile.full_name ?? 'Unknown'}</Text>
          {profile.company_name ? (
            <View style={styles.metaRow}>
              <Building2 size={12} color={colors.textMuted} />
              <Text style={styles.meta} numberOfLines={1}>{profile.company_name}</Text>
            </View>
          ) : null}
          {profile.location ? (
            <View style={styles.metaRow}>
              <MapPin size={12} color={colors.textMuted} />
              <Text style={styles.meta} numberOfLines={1}>{profile.location}</Text>
            </View>
          ) : null}
          {profile.rating ? (
            <View style={styles.metaRow}>
              <Star size={12} color={colors.accent} fill={colors.accent} />
              <Text style={styles.meta}>
                {profile.rating.toFixed(1)} ({profile.review_count ?? 0})
              </Text>
            </View>
          ) : null}
        </View>
        {onMessage && (
          <TouchableOpacity style={styles.messageBtn} onPress={onMessage}>
            <MessageCircle size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {profile.bio ? (
        <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: spacing.md },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  initials: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  info: { flex: 1 },
  name: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text, marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  bio: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  messageBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
