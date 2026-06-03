import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors, spacing, radius, fonts, shadows } from '../../lib/theme';
import { FileText, ChevronDown } from 'lucide-react-native';

const CATEGORIES = ['Civil', 'Mechanical', 'Electrical', 'Software', 'Chemical', 'Structural', 'Other'];
const BUDGETS = ['< $1,000', '$1,000 – $5,000', '$5,000 – $20,000', '$20,000 – $100,000', '> $100,000'];
const TIMELINES = ['ASAP', '1–2 weeks', '1 month', '3 months', '6+ months', 'Flexible'];

export default function RFQScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !category) {
      Alert.alert('Missing Fields', 'Please fill in title, description, and category.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await supabase.from('rfqs').insert({
      client_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      budget_range: budget,
      timeline,
      location: location.trim(),
      status: 'open',
    });

    setLoading(false);
    if (error) {
      Alert.alert('Error', 'Failed to post RFQ. Please try again.');
    } else {
      Alert.alert('RFQ Posted!', 'Engineers will be notified of your request.', [
        { text: 'View Feed', onPress: () => { router.replace('/(tabs)'); } },
      ]);
      setTitle(''); setDescription(''); setCategory(''); setBudget(''); setTimeline(''); setLocation('');
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Post an RFQ</Text>
        <Text style={styles.subtitle}>Request for Quote — find engineers for your project</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Project Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Structural assessment for commercial building"
            placeholderTextColor={colors.textMuted}
            maxLength={120}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your project, requirements, and expected deliverables..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/2000</Text>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.field}>
          <Text style={styles.label}>Budget Range</Text>
          <View style={styles.chipsWrap}>
            {BUDGETS.map(b => (
              <TouchableOpacity
                key={b}
                style={[styles.chip, budget === b && styles.chipActive]}
                onPress={() => setBudget(b)}
              >
                <Text style={[styles.chipText, budget === b && styles.chipTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.field}>
          <Text style={styles.label}>Timeline</Text>
          <View style={styles.chipsWrap}>
            {TIMELINES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, timeline === t && styles.chipActive]}
                onPress={() => setTimeline(t)}
              >
                <Text style={[styles.chipText, timeline === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.label}>Location (optional)</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Houston, TX or Remote"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <FileText size={18} color={colors.white} />
              <Text style={styles.submitText}>Post RFQ</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scroll: { padding: spacing.lg, paddingBottom: 60 },
  field: { marginBottom: spacing.xl },
  label: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontFamily: fonts.regular, fontSize: 14, color: colors.text,
  },
  multiline: { minHeight: 120, paddingTop: spacing.md },
  charCount: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, marginTop: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
