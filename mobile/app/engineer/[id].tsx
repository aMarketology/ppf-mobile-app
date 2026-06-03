import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Star, MapPin, MessageCircle, Globe, Phone } from 'lucide-react-native';
import { supabase, type Profile, type Service } from '../../lib/supabase';
import ServiceCard from '../../components/ServiceCard';
import { colors, spacing, radius, fonts, shadows } from '../../lib/theme';

export default function EngineerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [engineer, setEngineer] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string>('');

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);

    const [{ data: eng }, { data: svcs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('services').select('*').eq('provider_id', id).eq('is_active', true),
    ]);
    setEngineer(eng);
    setServices(svcs ?? []);
    setLoading(false);
  }

  async function handleMessage() {
    if (!myId || !engineer) return;

    // Get or create conversation
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user_one: myId,
      p_user_two: engineer.id,
    });

    if (error || !data) {
      Alert.alert('Error', 'Could not start conversation.');
      return;
    }
    router.push(`/messages/${data}` as any);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (!engineer) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFloat}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.center}><Text>Engineer not found</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFloat}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {engineer.avatar_url ? (
            <Image source={{ uri: engineer.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{engineer.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <Text style={styles.name}>{engineer.full_name}</Text>
          {engineer.company_name ? <Text style={styles.company}>{engineer.company_name}</Text> : null}
          {engineer.specialty ? (
            <View style={styles.specialtyBadge}>
              <Text style={styles.specialtyText}>{engineer.specialty}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            {engineer.location ? (
              <View style={styles.metaItem}>
                <MapPin size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{engineer.location}</Text>
              </View>
            ) : null}
            {(engineer.rating ?? 0) > 0 ? (
              <View style={styles.metaItem}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.metaText}>{engineer.rating?.toFixed(1)} ({engineer.review_count ?? 0})</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Message CTA */}
        {myId !== engineer.id && (
          <View style={styles.ctaSection}>
            <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
              <MessageCircle size={18} color={colors.white} />
              <Text style={styles.messageBtnText}>Send Message</Text>
            </TouchableOpacity>
            <Text style={styles.tokenNote}>First message costs 5 tokens</Text>
          </View>
        )}

        {/* Bio */}
        {engineer.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{engineer.bio}</Text>
          </View>
        ) : null}

        {/* Contact links */}
        {(engineer.website || engineer.phone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            {engineer.website ? (
              <View style={styles.contactRow}>
                <Globe size={15} color={colors.primary} />
                <Text style={styles.contactText}>{engineer.website}</Text>
              </View>
            ) : null}
            {engineer.phone ? (
              <View style={styles.contactRow}>
                <Phone size={15} color={colors.primary} />
                <Text style={styles.contactText}>{engineer.phone}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Services */}
        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services ({services.length})</Text>
            {services.map(svc => (
              <ServiceCard
                key={svc.id}
                service={svc}
                onPress={() => router.push(`/service/${svc.id}` as any)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtnFloat: {
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadows.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  hero: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: spacing.md },
  avatarFallback: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 38, color: colors.primary },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, marginBottom: 4 },
  company: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  specialtyBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4, marginBottom: spacing.sm },
  specialtyText: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  ctaSection: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl, width: '100%', justifyContent: 'center',
  },
  messageBtnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  tokenNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  section: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text, marginBottom: spacing.md },
  bioText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  contactText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
});
