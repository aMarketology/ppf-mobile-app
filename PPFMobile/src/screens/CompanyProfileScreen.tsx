/**
 * CompanyProfileScreen — View and manage your company profile.
 *
 * Shows company details if the user owns or is a member of a company.
 * Allows claiming a company if not yet associated.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { companiesService } from '../services/companies';
import { colors, spacing, radius, fonts, shadows } from '../theme';
import type { CompanyProfile } from '../lib/types';

type Props = {
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function CompanyProfileScreen({ onBack, onNavigate }: Props) {
  const { session, user } = useAuth();
  const jwt = session?.access_token ?? '';

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !jwt) {
      setLoading(false);
      return;
    }
    companiesService.getByOwner(user.id, jwt)
      .then(c => {
        setCompany(c);
        setLoading(false);
      })
      .catch(e => {
        setError(e?.message ?? 'Failed to load company');
        setLoading(false);
      });
  }, [user?.id, jwt]);

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Profile</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mint} />
        </View>
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Profile</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🏢</Text>
          <Text style={styles.emptyTitle}>No Company Yet</Text>
          <Text style={styles.emptyText}>
            You're not associated with a company. Create a new company profile or claim an existing one.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => onNavigate('CreateCompany')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Create Company</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const location = [company.city, company.state].filter(Boolean).join(', ') || 'Not specified';
  const initials = company.company_name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Company Card */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{company.company_name}</Text>
            <Text style={styles.location}>📍 {location}</Text>
            {company.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>

        {company.description && (
          <Text style={styles.description}>{company.description}</Text>
        )}

        {/* Details */}
        <View style={styles.detailsGrid}>
          {company.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{company.email}</Text>
            </View>
          )}
          {company.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{company.phone}</Text>
            </View>
          )}
          {company.website && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Website</Text>
              <Text style={styles.detailValue}>{company.website}</Text>
            </View>
          )}
          {company.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{company.address}</Text>
            </View>
          )}
        </View>

        {/* Specialties */}
        {company.specialties && company.specialties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.tagRow}>
              {company.specialties.map((s, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {company.certifications && company.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.tagRow}>
              {company.certifications.map((c, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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

  // Empty state
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  ctaBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    ...shadows.button,
  },
  ctaBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },

  // Company card
  card: {
    margin: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.mintMid,
  },
  avatarText: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.mint },
  companyName: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary, marginBottom: 4 },
  location: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: 6,
  },
  verifiedText: { fontFamily: fonts.semiBold, fontSize: 11, color: '#059669' },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  // Details
  detailsGrid: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  detailValue: { fontFamily: fonts.regular, fontSize: 13, color: colors.textPrimary },

  // Sections
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
});