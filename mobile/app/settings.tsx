import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { supabase, type Profile } from '../lib/supabase';
import { colors, spacing, radius, fonts } from '../lib/theme';

export default function SettingsScreen() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      company_name: profile.company_name,
      bio: profile.bio,
      location: profile.location,
      phone: (profile as any).phone,
      website: (profile as any).website,
      specialty: (profile as any).specialty,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    // Also sync display name into Supabase auth metadata so the
    // session user.user_metadata.full_name stays in sync
    if (!error && profile.full_name) {
      await supabase.auth.updateUser({
        data: { full_name: profile.full_name },
      });
    }

    setSaving(false);
    if (error) {
      console.error('Profile save error:', JSON.stringify(error));
      Alert.alert('Error', `Failed to save: ${error.message}`);
    } else {
      Alert.alert('Saved!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveBtn}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar placeholder */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{profile.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Camera size={16} color={colors.primary} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {([
          { key: 'full_name', label: 'Full Name', placeholder: 'Your full name' },
          { key: 'company_name', label: 'Company', placeholder: 'Your company (optional)' },
          { key: 'specialty', label: 'Specialty', placeholder: 'e.g. Civil Engineering' },
          { key: 'location', label: 'Location', placeholder: 'e.g. Houston, TX' },
          { key: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000' },
          { key: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
        ] as { key: keyof Profile; label: string; placeholder: string }[]).map(field => (
          <View key={field.key} style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={(profile[field.key] as string) ?? ''}
              onChangeText={v => setProfile(prev => ({ ...prev, [field.key]: v }))}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        ))}

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={profile.bio ?? ''}
            onChangeText={v => setProfile(prev => ({ ...prev, bio: v }))}
            placeholder="Tell engineers and clients about yourself..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{(profile.bio ?? '').length}/500</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.semiBold, fontSize: 17, color: colors.text },
  saveBtn: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.primary },
  scroll: { padding: spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 30, color: colors.primary },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  changePhotoText: { fontFamily: fonts.medium, fontSize: 14, color: colors.primary },
  field: { marginBottom: spacing.lg },
  label: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 12,
    fontFamily: fonts.regular, fontSize: 14, color: colors.text,
  },
  multiline: { minHeight: 100, paddingTop: spacing.md },
  charCount: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
});
