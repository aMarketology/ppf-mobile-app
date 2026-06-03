import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Star, MapPin, MessageCircle, DollarSign, Tag } from 'lucide-react-native';
import { supabase, type Service, type Profile } from '../../lib/supabase';
import { colors, spacing, radius, fonts, shadows } from '../../lib/theme';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string>('');

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);

    const { data: svc } = await supabase.from('services').select('*').eq('id', id).single();
    setService(svc);

    if (svc?.provider_id) {
      const { data: prov } = await supabase.from('profiles').select('*').eq('id', svc.provider_id).single();
      setProvider(prov);
    }
    setLoading(false);
  }

  async function handleContact() {
    if (!myId || !provider) return;

    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user_one: myId,
      p_user_two: provider.id,
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

  if (!service) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFloat}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.center}><Text>Service not found</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFloat}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        {service.image_url ? (
          <Image source={{ uri: service.image_url }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>{service.category}</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Title + price */}
          <View style={styles.titleRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{service.category}</Text>
            </View>
          </View>
          <Text style={styles.title}>{service.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.priceTag}>
              <DollarSign size={14} color={colors.primary} />
              <Text style={styles.price}>
                {service.price_type === 'fixed'
                  ? `$${service.price?.toLocaleString()}`
                  : service.price_type === 'hourly'
                    ? `$${service.price}/hr`
                    : 'Contact for quote'}
              </Text>
            </View>
            {service.location ? (
              <View style={styles.metaItem}>
                <MapPin size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{service.location}</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Service</Text>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsRow}>
                {service.tags.map((tag: string) => (
                  <View key={tag} style={styles.tag}>
                    <Tag size={11} color={colors.textSecondary} />
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Provider */}
          {provider && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Provider</Text>
              <TouchableOpacity
                style={styles.providerCard}
                onPress={() => router.push(`/engineer/${provider.id}` as any)}
              >
                {provider.avatar_url ? (
                  <Image source={{ uri: provider.avatar_url }} style={styles.providerAvatar} />
                ) : (
                  <View style={styles.providerAvatarFallback}>
                    <Text style={styles.providerInitial}>{provider.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                )}
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.full_name}</Text>
                  {provider.company_name ? <Text style={styles.providerCompany}>{provider.company_name}</Text> : null}
                  {(provider.rating ?? 0) > 0 && (
                    <View style={styles.ratingRow}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingText}>{provider.rating?.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Contact CTA */}
      {myId !== provider?.id && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <MessageCircle size={18} color={colors.white} />
            <Text style={styles.contactBtnText}>Contact Engineer</Text>
          </TouchableOpacity>
          <Text style={styles.tokenNote}>First message costs 5 tokens</Text>
        </View>
      )}
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
  heroImage: { width: '100%', height: 240 },
  heroPlaceholder: {
    width: '100%', height: 180, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  heroPlaceholderText: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.primary },
  content: { padding: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  categoryBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  categoryText: { fontFamily: fonts.medium, fontSize: 11, color: colors.primary },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginBottom: spacing.sm, lineHeight: 27 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  price: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  section: { marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text, marginBottom: spacing.sm },
  description: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
  tagText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  providerAvatar: { width: 48, height: 48, borderRadius: 24 },
  providerAvatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  providerInitial: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  providerInfo: { flex: 1, marginLeft: spacing.md },
  providerName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  providerCompany: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { fontFamily: fonts.medium, fontSize: 12, color: '#92400E' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center',
  },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, width: '100%', justifyContent: 'center',
  },
  contactBtnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  tokenNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
});
