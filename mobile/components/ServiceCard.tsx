import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Tag, Clock, MapPin, DollarSign } from 'lucide-react-native';
import { colors, spacing, radius, fonts } from '../lib/theme';
import type { Service } from '../lib/supabase';

interface ServiceCardProps {
  service: Service & { profiles?: { full_name: string | null; avatar_url: string | null; company_name: string | null } };
  onPress: () => void;
}

export default function ServiceCard({ service, onPress }: ServiceCardProps) {
  const provider = service.profiles;
  const firstImage = service.images?.[0];

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact';
    return `$${price.toLocaleString()}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      {firstImage ? (
        <Image source={{ uri: firstImage }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.imageFallback}>
          <Tag size={24} color={colors.primaryLight} />
        </View>
      )}

      {/* Body */}
      <View style={styles.body}>
        {/* Category pill */}
        {service.category ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{service.category}</Text>
          </View>
        ) : null}

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{service.title}</Text>

        {/* Provider */}
        {provider?.full_name ? (
          <View style={styles.providerRow}>
            {provider.avatar_url ? (
              <Image source={{ uri: provider.avatar_url }} style={styles.providerAvatar} />
            ) : (
              <View style={styles.providerAvatarFallback}>
                <Text style={styles.providerInitial}>{provider.full_name[0]}</Text>
              </View>
            )}
            <View style={styles.providerInfo}>
              <Text style={styles.providerName} numberOfLines={1}>
                {provider.full_name}
              </Text>
              {provider.company_name ? (
                <Text style={styles.providerCompany} numberOfLines={1}>
                  {provider.company_name}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Meta row */}
        <View style={styles.metaRow}>
          {/* Price */}
          <View style={styles.metaItem}>
            <DollarSign size={14} color={colors.primary} />
            <Text style={styles.price}>{formatPrice(service.price)}</Text>
          </View>

          {/* Delivery time */}
          {service.delivery_time ? (
            <View style={styles.metaItem}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={styles.meta}>{service.delivery_time}</Text>
            </View>
          ) : null}

          {/* Location */}
          {service.service_area ? (
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.textMuted} />
              <Text style={styles.meta} numberOfLines={1}>{service.service_area}</Text>
            </View>
          ) : null}
        </View>

        {/* Tags */}
        {service.tags && service.tags.length > 0 ? (
          <View style={styles.tags}>
            {service.tags.slice(0, 4).map(tag => (
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
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { width: '100%', height: 160 },
  imageFallback: {
    width: '100%', height: 100,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { padding: 16 },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  pillText: { fontFamily: fonts.semiBold, fontSize: 10, color: colors.primary, letterSpacing: 0.3 },

  title: {
    fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22,
    color: colors.text, marginBottom: 10,
  },

  // Provider
  providerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 12, paddingVertical: 10,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: colors.border,
  },
  providerAvatar: { width: 28, height: 28, borderRadius: 14 },
  providerAvatarFallback: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  providerInitial: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  providerInfo: { flex: 1 },
  providerName: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  providerCompany: {
    fontFamily: fonts.regular, fontSize: 11,
    color: colors.textMuted, marginTop: 1,
  },

  // Meta
  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primary },
  meta: {
    fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary,
    maxWidth: 100,
  },

  // Tags
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  tagText: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary },
});
