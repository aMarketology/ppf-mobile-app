/**
 * CameraScreen — Instagram-style camera with mode slider.
 *
 * Tapping the center + button opens this full-screen camera view.
 * A horizontal mode selector at the bottom switches between:
 *   • RECEIPT (default) — capture → OCR via scan-receipt → field review
 *   • PROJECT — capture → create a social feed post
 *
 * Gallery thumbnail (bottom-left) opens the photo library instead.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ENV } from '../config/env';
import { spacing, radius, fonts } from '../theme';

type Mode = 'receipt' | 'project';

type Props = {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onProjectImage?: (base64: string, uri: string) => void;
};

interface ParsedReceipt {
  id?: string;
  vendor_name?: string;
  transaction_date?: string;
  total_amount?: number;
  tax_amount?: number;
  subtotal?: number;
  job_number?: string;
  cost_code?: string;
  notes?: string;
  line_items?: Array<{ description: string; quantity: number; unit_price: number; total: number }>;
}

export default function CameraScreen({ onBack, onNavigate, onProjectImage }: Props) {
  const { session } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const jwt = session?.access_token ?? '';

  const [mode, setMode] = useState<Mode>('receipt');
  const [capturing, setCapturing] = useState(false);

  // Receipt state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable receipt fields
  const [vendorName, setVendorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [costCode, setCostCode] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Capture ────────────────────────────────────────────────────────────────

  async function capture() {
    const res = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 2048,
      maxHeight: 2048,
      includeBase64: true,
    });

    if (res.didCancel) return;
    if (res.errorCode) {
      Alert.alert('Camera Error', res.errorMessage || 'Could not open camera');
      return;
    }

    const asset = res.assets?.[0];
    if (!asset?.base64) {
      Alert.alert('Error', 'Could not read image data');
      return;
    }

    setImageUri(asset.uri ?? null);
    setImageBase64(asset.base64);

    if (mode === 'receipt') {
      await processReceipt(asset.base64);
    } else {
      // Project mode → hand off to feed post creation
      onProjectImage?.(asset.base64, asset.uri ?? '');
      onNavigate('Activity');
    }
  }

  async function pickFromGallery() {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 2048,
      maxHeight: 2048,
      includeBase64: true,
    });

    if (res.didCancel) return;
    if (res.errorCode) {
      Alert.alert('Error', res.errorMessage || 'Could not open gallery');
      return;
    }

    const asset = res.assets?.[0];
    if (!asset?.base64) {
      Alert.alert('Error', 'Could not read image data');
      return;
    }

    setImageUri(asset.uri ?? null);
    setImageBase64(asset.base64);

    if (mode === 'receipt') {
      await processReceipt(asset.base64);
    } else {
      onProjectImage?.(asset.base64, asset.uri ?? '');
      onNavigate('Activity');
    }
  }

  // ── Receipt OCR ────────────────────────────────────────────────────────────

  async function processReceipt(base64: string) {
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = `${ENV.SUPABASE_URL}/functions/v1/scan-receipt`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          image_base64: base64,
          job_number: jobNumber || undefined,
          cost_code: costCode || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OCR processing failed');
      }

      const receipt = data.receipt || data.parsed;
      setResult(receipt);
      setVendorName(receipt?.vendor_name || '');
      setTotalAmount(receipt?.total_amount != null ? String(receipt.total_amount) : '');
      setTransactionDate(receipt?.transaction_date || new Date().toISOString().split('T')[0]);
    } catch (e: any) {
      setError(e?.message || 'Could not auto-extract text. You can enter details manually.');
      setResult({
        vendor_name: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
    } finally {
      setScanning(false);
    }
  }

  // ── Save verified receipt ──────────────────────────────────────────────────

  async function handleSaveVerified() {
    if (!result?.id && !imageBase64) {
      onNavigate('Receipts');
      return;
    }

    setSaving(true);
    try {
      if (result?.id) {
        await fetch(`${ENV.SUPABASE_URL}/rest/v1/receipts?id=eq.${result.id}`, {
          method: 'PATCH',
          headers: {
            apikey: ENV.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendor_name: vendorName.trim() || 'Receipt Expense',
            total_amount: totalAmount ? parseFloat(totalAmount) : null,
            transaction_date: transactionDate || null,
            job_number: jobNumber.trim() || null,
            cost_code: costCode.trim() || null,
            notes: notes.trim() || null,
            status: 'processed',
          }),
        });
      } else {
        const userRes = await fetch(`${ENV.SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: ENV.SUPABASE_ANON_KEY, Authorization: `Bearer ${jwt}` },
        });
        const userData = await userRes.json();

        await fetch(`${ENV.SUPABASE_URL}/rest/v1/receipts`, {
          method: 'POST',
          headers: {
            apikey: ENV.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            user_id: userData.id,
            vendor_name: vendorName.trim() || 'Receipt Expense',
            total_amount: totalAmount ? parseFloat(totalAmount) : null,
            transaction_date: transactionDate || new Date().toISOString().split('T')[0],
            job_number: jobNumber.trim() || null,
            cost_code: costCode.trim() || null,
            notes: notes.trim() || null,
            status: 'processed',
          }),
        });
      }

      Alert.alert('Saved!', 'Receipt allocated and saved successfully.', [
        { text: 'View Receipts', onPress: () => onNavigate('Receipts') },
        { text: 'Done', onPress: onBack },
      ]);
    } catch (saveErr: any) {
      Alert.alert('Save Error', saveErr?.message || 'Could not save receipt.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render: Receipt review (after capture) ────────────────────────────────

  if (result || scanning) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setResult(null); setScanning(false); }} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Review</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
          )}

          {scanning && (
            <View style={styles.scanningBox}>
              <ActivityIndicator size="large" color={colors.mint} />
              <Text style={styles.scanningText}>Extracting receipt details…</Text>
            </View>
          )}

          {!scanning && result && (
            <>
              {error && <Text style={styles.errorText}>{error}</Text>}

              <Text style={styles.fieldLabel}>Vendor</Text>
              <TextInput style={styles.input} value={vendorName} onChangeText={setVendorName} placeholder="Vendor name" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Total Amount ($)</Text>
              <TextInput style={styles.input} value={totalAmount} onChangeText={setTotalAmount} placeholder="0.00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />

              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput style={styles.input} value={transactionDate} onChangeText={setTransactionDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Job #</Text>
              <TextInput style={styles.input} value={jobNumber} onChangeText={setJobNumber} placeholder="e.g. JOB-1042" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Cost Code</Text>
              <TextInput style={styles.input} value={costCode} onChangeText={setCostCode} placeholder="e.g. 100-200" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor={colors.textMuted} multiline />

              <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveVerified} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Receipt</Text>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Render: Camera viewport ───────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera area (dark viewport — native camera opens on shutter) */}
      <View style={styles.viewport}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>
            {mode === 'receipt' ? 'Scan Receipt' : 'New Project Post'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Viewport hint */}
        <View style={styles.viewportHint}>
          <Text style={styles.viewportHintIcon}>{mode === 'receipt' ? '🧾' : '📷'}</Text>
          <Text style={styles.viewportHintText}>
            {mode === 'receipt'
              ? 'Capture a receipt to extract vendor, total & date'
              : 'Capture a photo to share a project update'}
          </Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Mode slider */}
        <View style={styles.modeSlider}>
          <TouchableOpacity
            style={[styles.modePill, mode === 'project' && styles.modePillActive]}
            onPress={() => setMode('project')}
            activeOpacity={0.7}>
            <Text style={[styles.modePillText, mode === 'project' && styles.modePillTextActive]}>
              Project
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modePill, mode === 'receipt' && styles.modePillActive]}
            onPress={() => setMode('receipt')}
            activeOpacity={0.7}>
            <Text style={[styles.modePillText, mode === 'receipt' && styles.modePillTextActive]}>
              Receipt
            </Text>
          </TouchableOpacity>
        </View>

        {/* Shutter row */}
        <View style={styles.shutterRow}>
          {/* Gallery thumbnail */}
          <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery} activeOpacity={0.7}>
            <Text style={styles.galleryIcon}>🖼️</Text>
            <Text style={styles.galleryText}>Gallery</Text>
          </TouchableOpacity>

          {/* Shutter */}
          <TouchableOpacity style={styles.shutterOuter} onPress={capture} activeOpacity={0.85} disabled={capturing}>
            <View style={styles.shutterInner}>
              {capturing ? <ActivityIndicator size="small" color={colors.orange} /> : null}
            </View>
          </TouchableOpacity>

          {/* Spacer to balance */}
          <View style={{ width: 56 }} />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  backBtnText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.mint },
  headerTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.textPrimary },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  preview: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.bg, marginBottom: spacing.md },
  scanningBox: { alignItems: 'center', paddingVertical: 40 },
  scanningText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 12 },
  errorText: { fontFamily: fonts.regular, fontSize: 13, color: colors.error, marginBottom: spacing.sm },
  fieldLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.regular, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.sm,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },

  // Camera viewport
  viewport: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  topBarTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },
  viewportHint: { alignItems: 'center', gap: 12 },
  viewportHintIcon: { fontSize: 56 },
  viewportHintText: {
    fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', paddingHorizontal: 40, lineHeight: 20,
  },

  // Bottom controls
  controls: {
    backgroundColor: '#000',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modeSlider: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    marginBottom: spacing.lg,
  },
  modePill: {
    paddingHorizontal: 24, paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  modePillActive: {
    backgroundColor: colors.orange, borderColor: colors.orange,
  },
  modePillText: { fontFamily: fonts.semiBold, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  modePillTextActive: { color: '#fff' },
  shutterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  galleryBtn: { alignItems: 'center', width: 56 },
  galleryIcon: { fontSize: 24 },
  galleryText: { fontFamily: fonts.medium, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  shutterOuter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
});