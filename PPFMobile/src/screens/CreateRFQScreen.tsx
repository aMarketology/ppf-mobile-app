/**
 * CreateRFQScreen — Multi-step RFQ creation wizard.
 *
 * Steps: 1) Basic Info  2) Details  3) Line Items  4) Review & Submit
 * Posts to rfqs table via restPost.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { restPost } from '../lib/restClient';
import { colors, spacing, radius, fonts } from '../theme';

const CATEGORIES = [
  'CNC Machining', 'Industrial Parts & Replacement', 'Sheet Metal & Fabrication',
  '3D Printing / Additive Manufacturing', 'Injection Molding & Tooling',
  'Electrical & Controls', 'Welding & Assembly', 'Quality & Inspection',
  'Mechanical Engineering', 'Electrical Engineering', 'Structural Engineering',
  'Civil Engineering', 'HVAC Systems', 'Plumbing & Piping', 'Fire Protection',
  'Controls & Automation', 'Industrial Manufacturing', 'Material Handling', 'Other',
];

type Props = { onBack: () => void; onNavigate: (s: string) => void };

export default function CreateRFQScreen({ onBack, onNavigate }: Props) {
  const { session, profile } = useAuth();
  const jwt = session?.access_token ?? '';

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [rfqType, setRfqType] = useState<'product' | 'service'>('service');
  const [description, setDescription] = useState('');

  // Step 2: Details
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [material, setMaterial] = useState('');
  const [ndaRequired, setNdaRequired] = useState(false);
  const [isAsap, setIsAsap] = useState(false);

  // Step 3: Line Items
  const [lineItems, setLineItems] = useState<{ part: string; qty: string; material: string; tolerance: string; finish: string; notes: string }[]>([]);

  function addLineItem() {
    setLineItems(prev => [...prev, { part: '', qty: '', material: '', tolerance: '', finish: '', notes: '' }]);
  }

  function updateLineItem(index: number, field: string, value: string) {
    setLineItems(prev => prev.map((li, i) => i === index ? { ...li, [field]: value } : li));
  }

  function removeLineItem(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!title.trim() || !category || !description.trim()) {
      Alert.alert('Missing fields', 'Title, category, and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        client_id: session!.user.id,
        title: title.trim(),
        category,
        rfq_type: rfqType,
        description: description.trim(),
        budget: budget.trim() || null,
        timeline: timeline.trim() || null,
        location: location.trim() || null,
        quantity: quantity.trim() || null,
        material: material.trim() || null,
        nda_required: ndaRequired,
        is_asap: isAsap,
        line_items: lineItems.filter(li => li.part.trim()).map(li => ({
          part: li.part.trim(),
          qty: li.qty.trim(),
          material: li.material.trim(),
          tolerance: li.tolerance.trim(),
          finish: li.finish.trim(),
          notes: li.notes.trim(),
        })),
        status: 'open',
      };

      await restPost('rfqs', body, jwt);
      Alert.alert('✅ RFQ Posted!', 'Your RFQ is now live in the marketplace.', [
        { text: 'View Marketplace', onPress: () => onNavigate('Shop') },
        { text: 'Done', onPress: onBack },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create RFQ');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render: Step Indicator ────────────────────────────────────────────────

  function renderSteps() {
    const steps = ['Basic Info', 'Details', 'Line Items', 'Review'];
    return (
      <View style={styles.stepRow}>
        {steps.map((label, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <View key={num} style={styles.stepItem}>
              <View style={[styles.stepDot, isActive && styles.stepDotActive, isDone && styles.stepDotDone]}>
                <Text style={[styles.stepDotText, (isActive || isDone) && styles.stepDotTextActive]}>
                  {isDone ? '✓' : num}
                </Text>
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  // ── Render: Step 1 — Basic Info ───────────────────────────────────────────

  function renderStep1() {
    return (
      <View>
        <Text style={styles.sectionTitle}>What do you need?</Text>
        <Text style={styles.fieldLabel}>Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. CNC Machined Parts Assembly" placeholderTextColor={colors.textMuted} />
        <Text style={styles.fieldLabel}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={[styles.catPill, category === cat && styles.catPillActive]} onPress={() => setCategory(cat)}>
              <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.typeRow}>
          {(['service', 'product'] as const).map(t => (
            <TouchableOpacity key={t} style={[styles.typeBtn, rfqType === t && styles.typeBtnActive]} onPress={() => setRfqType(t)}>
              <Text style={[styles.typeBtnText, rfqType === t && styles.typeBtnTextActive]}>{t === 'service' ? '🔧 Service' : '📦 Product'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Description *</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe what you need in detail..." placeholderTextColor={colors.textMuted} multiline numberOfLines={5} textAlignVertical="top" />
      </View>
    );
  }

  // ── Render: Step 2 — Details ──────────────────────────────────────────────

  function renderStep2() {
    return (
      <View>
        <Text style={styles.sectionTitle}>Project Details</Text>
        <Text style={styles.fieldLabel}>Budget</Text>
        <TextInput style={styles.input} value={budget} onChangeText={setBudget} placeholder="e.g. $5,000 - $10,000" placeholderTextColor={colors.textMuted} />
        <Text style={styles.fieldLabel}>Timeline</Text>
        <TextInput style={styles.input} value={timeline} onChangeText={setTimeline} placeholder="e.g. 2-4 weeks, ASAP" placeholderTextColor={colors.textMuted} />
        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Austin, TX" placeholderTextColor={colors.textMuted} />
        <Text style={styles.fieldLabel}>Quantity</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="e.g. 250 units" placeholderTextColor={colors.textMuted} />
        <Text style={styles.fieldLabel}>Material</Text>
        <TextInput style={styles.input} value={material} onChangeText={setMaterial} placeholder="e.g. 6061 Aluminum" placeholderTextColor={colors.textMuted} />
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggle, ndaRequired && styles.toggleActive]} onPress={() => setNdaRequired(!ndaRequired)}>
            <Text style={[styles.toggleText, ndaRequired && styles.toggleTextActive]}>{ndaRequired ? '🔒 NDA Required' : '🔓 NDA Required'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggle, isAsap && styles.toggleActive]} onPress={() => setIsAsap(!isAsap)}>
            <Text style={[styles.toggleText, isAsap && styles.toggleTextActive]}>{isAsap ? '⚡ ASAP' : '⚡ ASAP'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render: Step 3 — Line Items ───────────────────────────────────────────

  function renderStep3() {
    return (
      <View>
        <Text style={styles.sectionTitle}>Line Items</Text>
        <Text style={styles.fieldHint}>Add individual parts or components needed.</Text>
        {lineItems.map((li, i) => (
          <View key={i} style={styles.lineItemCard}>
            <View style={styles.lineItemHeader}>
              <Text style={styles.lineItemTitle}>Item {i + 1}</Text>
              <TouchableOpacity onPress={() => removeLineItem(i)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.liInput} value={li.part} onChangeText={v => updateLineItem(i, 'part', v)} placeholder="Part name" placeholderTextColor={colors.textMuted} />
            <View style={styles.liRow}>
              <TextInput style={[styles.liInput, styles.liSmall]} value={li.qty} onChangeText={v => updateLineItem(i, 'qty', v)} placeholder="Qty" placeholderTextColor={colors.textMuted} />
              <TextInput style={[styles.liInput, styles.liSmall]} value={li.material} onChangeText={v => updateLineItem(i, 'material', v)} placeholder="Material" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.liRow}>
              <TextInput style={[styles.liInput, styles.liSmall]} value={li.tolerance} onChangeText={v => updateLineItem(i, 'tolerance', v)} placeholder="Tolerance" placeholderTextColor={colors.textMuted} />
              <TextInput style={[styles.liInput, styles.liSmall]} value={li.finish} onChangeText={v => updateLineItem(i, 'finish', v)} placeholder="Finish" placeholderTextColor={colors.textMuted} />
            </View>
            <TextInput style={styles.liInput} value={li.notes} onChangeText={v => updateLineItem(i, 'notes', v)} placeholder="Notes" placeholderTextColor={colors.textMuted} />
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addLineItem}>
          <Text style={styles.addBtnText}>+ Add Line Item</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: Step 4 — Review ───────────────────────────────────────────────

  function renderStep4() {
    return (
      <View>
        <Text style={styles.sectionTitle}>Review & Submit</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Title</Text>
          <Text style={styles.reviewValue}>{title || '—'}</Text>
          <Text style={styles.reviewLabel}>Category</Text>
          <Text style={styles.reviewValue}>{category || '—'}</Text>
          <Text style={styles.reviewLabel}>Type</Text>
          <Text style={styles.reviewValue}>{rfqType === 'service' ? '🔧 Service' : '📦 Product'}</Text>
          <Text style={styles.reviewLabel}>Description</Text>
          <Text style={styles.reviewValue}>{description || '—'}</Text>
          {budget ? <><Text style={styles.reviewLabel}>Budget</Text><Text style={styles.reviewValue}>{budget}</Text></> : null}
          {timeline ? <><Text style={styles.reviewLabel}>Timeline</Text><Text style={styles.reviewValue}>{timeline}</Text></> : null}
          {location ? <><Text style={styles.reviewLabel}>Location</Text><Text style={styles.reviewValue}>{location}</Text></> : null}
          {quantity ? <><Text style={styles.reviewLabel}>Quantity</Text><Text style={styles.reviewValue}>{quantity}</Text></> : null}
          {material ? <><Text style={styles.reviewLabel}>Material</Text><Text style={styles.reviewValue}>{material}</Text></> : null}
          {lineItems.filter(li => li.part.trim()).length > 0 && (
            <>
              <Text style={styles.reviewLabel}>Line Items ({lineItems.filter(li => li.part.trim()).length})</Text>
              {lineItems.filter(li => li.part.trim()).map((li, i) => (
                <Text key={i} style={styles.reviewValue}>• {li.part} {li.qty ? `(${li.qty})` : ''}</Text>
              ))}
            </>
          )}
        </View>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create RFQ</Text>
        <View style={{ width: 60 }} />
      </View>

      {renderSteps()}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.footerBtnOutline} onPress={() => setStep(step - 1)}>
            <Text style={styles.footerBtnOutlineText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 4 ? (
          <TouchableOpacity style={styles.footerBtn} onPress={() => setStep(step + 1)}>
            <Text style={styles.footerBtnText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.footerBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.footerBtnText}>Submit RFQ</Text>}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.mint },
  headerTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.textPrimary },
  stepRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.lg },
  stepItem: { alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: colors.mint, backgroundColor: colors.mintLight },
  stepDotDone: { backgroundColor: colors.mint, borderColor: colors.mint },
  stepDotText: { fontSize: 12, fontFamily: fonts.bold, color: colors.textMuted },
  stepDotTextActive: { color: colors.mint },
  stepLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textMuted, marginTop: 4 },
  stepLabelActive: { color: colors.mintDark },
  body: { flex: 1 },
  bodyContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary, marginBottom: spacing.md },
  fieldLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  fieldHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.sm + 2, fontFamily: fonts.regular, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.sm },
  textArea: { minHeight: 100, paddingTop: spacing.sm + 2 },
  categoryScroll: { marginBottom: spacing.sm },
  catPill: { paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs + 4, borderRadius: radius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs + 2, marginBottom: spacing.xs },
  catPillActive: { backgroundColor: colors.mintLight, borderColor: colors.mint },
  catPillText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  catPillTextActive: { color: colors.mintDark },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typeBtn: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: colors.mintLight, borderColor: colors.mint },
  typeBtnText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  typeBtnTextActive: { color: colors.mintDark },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  toggle: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.mintLight, borderColor: colors.mint },
  toggleText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  toggleTextActive: { color: colors.mintDark },
  lineItemCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm + 4, marginBottom: spacing.sm },
  lineItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  lineItemTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textPrimary },
  removeBtn: { fontSize: 16, color: colors.error, padding: 4 },
  liInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 4, fontFamily: fonts.regular, fontSize: 13, color: colors.textPrimary, marginBottom: spacing.xs + 2 },
  liRow: { flexDirection: 'row', gap: spacing.xs + 2 },
  liSmall: { flex: 1 },
  addBtn: { paddingVertical: spacing.sm + 2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.mint, borderStyle: 'dashed', alignItems: 'center', marginTop: spacing.sm },
  addBtnText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.mint },
  reviewCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  reviewLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewValue: { fontFamily: fonts.regular, fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  footer: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  footerBtnOutline: { flex: 1, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  footerBtnOutlineText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textSecondary },
  footerBtn: { flex: 2, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center' },
  footerBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});