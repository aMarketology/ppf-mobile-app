import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Tag, Clock, MapPin, DollarSign } from 'lucide-react-native';
import { colors, spacing, radius, fonts, shadows } from '../lib/theme';
import type { Service } from '../lib/supabase';

interface ServiceCardProps {
  service: Service & { profiles?: { full_name: string | null; avatar_url: string | null; company_name: string | null } };
  onPress: () => void;
}

export default function ServiceCard({ service, onPress }: ServiceCardProps) {
  const provider = service.profiles;
  const firstImage = service.images?.[0];

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact for price';
    return `$${price.toLocaleString()}`;
  };

  return (
    <TouchableOpacity style={[styles.card, shadows.md]} onPress={onPress} activeOpacity={0.85}>
      {firstImage ? (
        <Image source={{ uri: firstImage }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.imageFallback}>
          <Tag size={28} color={colors.primaryLight} />
        </View>
      )}
      <View style={styles.body}>
        {service.category ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{service.category}</Text>
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>{service.title}</Text>
        {provider?.full_name ? (
          <Text style={styles.provider} numberOfLines={1}>
            by {provider.full_name}{provider.company_name ? ` · ${provider.company_name}` : ''}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <DollarSign size={13} color={colors.primary} />
            <Text style={styles.price}>{formatPrice(service.price)}</Text>
          </View>
          {service.delivery_time ? (
            <View style={styles.metaRow}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={styles.meta}>{service.delivery_time}</Text>
            </View>
          ) : null}
          {service.service_area ? (
            <View style={styles.metaRow}>
              <MapPin size={13} color={colors.textMuted} />
              <Text style={styles.meta} numberOfLines={1}>{service.service_area}</Text>
            </View>
          ) : null}
        </View>
        {service.tags && service.tags.length > 0 ? (
          <View style={styles.tags}>
            {service.tags.slice(0, 3).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 160 },
  imageFallback: {
    width: '100%',
    height: 100,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 11, color: colors.primary },
  title: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text, marginBottom: 4 },
  provider: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  price: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primary },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary },
});
