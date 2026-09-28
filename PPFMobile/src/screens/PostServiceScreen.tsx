/**
 * PostServiceScreen — Create a new service listing for the Shop.
 *
 * Only accessible to signed-in users with an assigned company.
 * Posts to the `services` table via REST API.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { createService, uploadServiceImage } from '../services/servicesService';
import { companiesService } from '../services/companies';
import { colors, spacing, radius, fonts, shadows } from '../theme';

const CATEGORIES = [
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Controls & Automation',
  'Manufacturing',
  'Construction Services',
  'Material Handling',
  'Logistics & Supply Chain',
];

type Props = {
  onBack: () => void;
  onNavigate: (screen: string) => void;
};

export default function PostServiceScreen({ onBack, onNavigate }: Props) {
  const { session, user, profile } = useAuth();
  const jwt = session?.access_token ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [serviceArea, setServiceArea] = useState('remote');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [image, setImage] = useState<{ uri: string; base64: string | null } | null>(null);

  // Check if user has a company via company_profiles.owner_id
  useEffect(() => {
    if (!user?.id || !jwt) {
      setCheckingCompany(false);
      return;
    }
    companiesService.getByOwner(user.id, jwt)
      .then(c => {
        setHasCompany(!!c);
        setCheckingCompany(false);
      })
      .catch(() => {
        setHasCompany(false);
        setCheckingCompany(false);
      });
  }, [user?.id, jwt]);

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !price.trim() || !category) {
      setError('Please fill in all required fields (title, description, price, category).');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    if (!profile?.id) {
      setError('You must be signed in to post a service.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload image first (if selected) to get a public URL
      let imageUrls: string[] = [];
      if (image?.base64 && profile.id) {
        const url = await uploadServiceImage(jwt, profile.id, `data:image/jpeg;base64,${image.base64}`);
        if (url) imageUrls = [url];
      }

      // Create the service listing
      const service = await createService(jwt, {
        provider_id: profile.id,
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        delivery_time: deliveryTime.trim() || undefined,
        service_area: serviceArea.trim() || 'remote',
        images: imageUrls,
      });

      Alert.alert('Success', 'Your service has been posted to the Shop!', [
        { text: 'View Shop', onPress: () => onNavigate('Shop') },
      ]);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to post service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleImagePick = () => {
    launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      includeBase64: true,
    }, (response) => {
      const asset = response?.assets?.[0];
      if (asset?.uri) {
        setImage({ uri: asset.uri, base64: asset.base64 ?? null });
      }
    });
  };

  if (checkingCompany) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post New Service</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mint} />
        </View>
      </View>
    );
  }

  if (!hasCompany) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post New Service</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.lockIcon}>🏢</Text>
          <Text style={styles.lockTitle}>Company Required</Text>
          <Text style={styles.lockText}>
            You need to be assigned to a company before you can post services to the Shop.
          </Text>
          <TouchableOpacity
            style={styles.lockBtn}
            onPress={() => onNavigate('Profile')}
          >
            <Text style={styles.lockBtnText}>Go to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Post New Service</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Photo */}
        <Text style={styles.label}>Service Photo</Text>
        {image ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity
              style={styles.imageRemoveBtn}
              onPress={() => setImage(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.imageRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickRow}>
            <TouchableOpacity style={styles.imagePickBtn} onPress={handleImagePick}>
              <Text style={styles.imagePickBtnText}>🖼️ Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imagePickBtn}
              onPress={() => {
                launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 1200, maxHeight: 1200, includeBase64: true }, (response) => {
                  const asset = response?.assets?.[0];
                  if (asset?.uri) setImage({ uri: asset.uri, base64: asset.base64 ?? null });
                });
              }}
            >
              <Text style={styles.imagePickBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. CNC Machined Parts Assembly"
          placeholderTextColor={colors.textMuted}
          maxLength={200}
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your service, capabilities, and what you offer..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Price */}
        <Text style={styles.label}>Price (USD) *</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 2500.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setCategory(isSelected ? '' : cat)}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tags */}
        <Text style={styles.label}>Tags (comma-separated)</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="e.g. CNC, Machining, Metal"
          placeholderTextColor={colors.textMuted}
        />

        {/* Delivery Time */}
        <Text style={styles.label}>Delivery Time</Text>
        <TextInput
          style={styles.input}
          value={deliveryTime}
          onChangeText={setDeliveryTime}
          placeholder="e.g. 2-4 weeks"
          placeholderTextColor={colors.textMuted}
        />

        {/* Service Area */}
        <Text style={styles.label}>Service Area</Text>
        <TextInput
          style={styles.input}
          value={serviceArea}
          onChangeText={setServiceArea}
          placeholder="e.g. remote, on-site, nationwide"
          placeholderTextColor={colors.textMuted}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Post Service</Text>
          )}
        </TouchableOpacity>

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
  form: { flex: 1 },
  formContent: { padding: spacing.md, paddingBottom: spacing.xxl },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontFamily: fonts.medium, fontSize: 13, color: '#DC2626' },

  // Labels & Inputs
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
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  categoryChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },

  // Image Picker
  imagePicker: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    height: 200,
  },
  imagePickerText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  imagePreviewWrap: {
    position: 'relative',
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 200,
    marginTop: spacing.md,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: radius.full,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  imageRemoveText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#EF4444',
  },
  imagePickRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.md,
  },
  imagePickBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  imagePickBtnText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Submit
  submitBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.button,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },

  // No company state
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  lockIcon: { fontSize: 48, marginBottom: spacing.md },
  lockTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary, marginBottom: spacing.sm },
  lockText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  lockBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    ...shadows.button,
  },
  lockBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});