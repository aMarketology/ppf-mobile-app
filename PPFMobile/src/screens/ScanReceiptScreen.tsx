/**
 * ScanReceiptScreen — Camera-based OCR receipt scanning.
 *
 * Uses the device camera to capture a receipt image, sends it to the
 * scan-receipt Edge Function for OCR processing, and displays results.
 */

import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ENV } from '../config/env';
import { spacing, radius, fonts, shadows } from '../theme';

type Props = {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  autoLaunch?: boolean;
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

// Convert a base64 data string to a Blob for Storage upload.
// React Native doesn't have atob/Blob natively, so we use a manual decode.
function base64ToBlob(base64: string): Blob {
  const clean = base64.replace(/^data:image\/\w+;base64,/, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean.charAt(i);
    if (c === '=') break;
    const idx = chars.indexOf(c);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  const byteArray = new Uint8Array(bytes);
  return new Blob([byteArray as any], { type: 'image/jpeg' } as any);
}

export default function ScanReceiptScreen({ onBack, onNavigate, autoLaunch = false }: Props) {
  const { session, profile } = useAuth();
  const { colors } = useTheme();
  const jwt = session?.access_token ?? '';
  const styles = createStyles(colors);
  const autoLaunched = useRef(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields for field verification & job costing
  const [vendorName, setVendorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [costCode, setCostCode] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-launch camera when opened from the + button
  useEffect(() => {
    if (autoLaunch && !autoLaunched.current) {
      autoLaunched.current = true;
      const t = setTimeout(() => { takePhoto(); }, 400);
      return () => clearTimeout(t);
    }
  }, [autoLaunch]);

  async function takePhoto() {
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
    await processReceipt(asset.base64);
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
    await processReceipt(asset.base64);
  }

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
      // Offline / fallback mode: allow manual entry even if edge function fails
      setError(e?.message || 'Could not auto-extract text. You can enter details manually.');
      setResult({
        vendor_name: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
    } finally {
      setScanning(false);
    }
  }

  async function handleSaveVerified() {
    if (!result?.id && !imageBase64) {
      onNavigate('Receipts');
      return;
    }

    setSaving(true);
    try {
      // ── Upload image to Storage (bulletproofing) ─────────────────────────
      let imageUrl: string | null = null;
      if (imageBase64) {
        try {
          const userId = (await (await fetch(`${ENV.SUPABASE_URL}/auth/v1/user`, {
            headers: { apikey: ENV.SUPABASE_ANON_KEY, Authorization: `Bearer ${jwt}` },
          })).json()).id;
          const fileName = `${userId}/${Date.now()}.jpg`;
          const uploadRes = await fetch(`${ENV.SUPABASE_URL}/storage/v1/object/receipts/${fileName}`, {
            method: 'POST',
            headers: {
              apikey: ENV.SUPABASE_ANON_KEY,
              Authorization: `Bearer ${jwt}`,
              'Content-Type': 'image/jpeg',
              'x-upsert': 'false',
            },
            body: base64ToBlob(imageBase64),
          });
          if (uploadRes.ok) {
            imageUrl = `${ENV.SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;
          }
        } catch (_) { /* non-fatal */ }
      }

      if (result?.id) {
        // Update existing receipt created by function
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
            category: category.trim() || null,
            company_id: profile?.company_id || null,
            notes: notes.trim() || null,
            image_url: imageUrl,
            status: 'processed',
            review_status: 'pending',
          }),
        });
      } else {
        // Insert directly via PostgREST fallback
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
            category: category.trim() || null,
            company_id: profile?.company_id || null,
            notes: notes.trim() || null,
            image_url: imageUrl,
            status: 'processed',
            review_status: 'pending',
          }),
        });
      }

      Alert.alert(
        '✅ Sent to Back Office',
        'Receipt saved and sent to your back office for review. They can approve it and allocate it to a job.',
        [
          { text: 'View Receipts', onPress: () => onNavigate('Receipts') },
          { text: 'Scan Another', onPress: () => { setResult(null); setImageUri(null); setImageBase64(null); } },
        ],
      );
    } catch (saveErr: any) {
      Alert.alert('Save Error', saveErr?.message || 'Could not save receipt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image preview */}
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
        )}

        {/* Action buttons */}
        {!scanning && !result && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto} activeOpacity={0.85}>
              <Text style={styles.cameraBtnIcon}>📷</Text>
              <Text style={styles.cameraBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery} activeOpacity={0.85}>
              <Text style={styles.galleryBtnIcon}>🖼️</Text>
              <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scanning indicator */}
        {scanning && (
          <View style={styles.scanningBox}>
            <ActivityIndicator size="large" color={colors.mint} />
            <Text style={styles.scanningText}>Processing receipt with OCR...</Text>
          </View>
        )}

        {/* Info or soft-error banner */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form to verify & allocate */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Verify & Allocate Expense</Text>

            <Text style={styles.fieldLabel}>Vendor / Merchant *</Text>
            <TextInput
              style={styles.input}
              value={vendorName}
              onChangeText={setVendorName}
              placeholder="e.g. Home Depot, Fastenal, Grainger"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.rowTwoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Total ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={transactionDate}
                  onChangeText={setTransactionDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Job / Project # (CSI Allocation)</Text>
            <TextInput
              style={styles.input}
              value={jobNumber}
              onChangeText={setJobNumber}
              placeholder="e.g. JOB-2041 or Austin Fab Line"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Cost Code (e.g. 06-100 Rough Carpentry)</Text>
            <TextInput
              style={styles.input}
              value={costCode}
              onChangeText={setCostCode}
              placeholder="e.g. 03-300 Concrete / Materials"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Travel, Meals, Supplies"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add memo or itemized notes..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <TouchableOpacity
              style={[styles.doneBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveVerified}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.doneBtnText}>Confirm & Save Expense</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Initial state instruction */}
        {!imageUri && !scanning && !result && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsIcon}>🧾</Text>
            <Text style={styles.instructionsTitle}>Field Receipt Capture</Text>
            <Text style={styles.instructionsText}>
              Snap a photo of your job-site receipt. We automatically extract vendor, total, and date, letting you assign job numbers and cost codes immediately.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  backBtnText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.mint },
  headerTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.textPrimary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  preview: { width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: colors.card },

  actionRow: { flexDirection: 'row', gap: spacing.sm },
  cameraBtn: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  cameraBtnIcon: { fontSize: 32, marginBottom: spacing.sm },
  cameraBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' },
  galleryBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  galleryBtnIcon: { fontSize: 32, marginBottom: spacing.sm },
  galleryBtnText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textPrimary },

  scanningBox: { alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  scanningText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },

  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, textAlign: 'center' },

  resultCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.md },

  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTwoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },

  doneBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.button,
  },
  doneBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#FFFFFF' },

  instructions: { alignItems: 'center', padding: spacing.xl },
  instructionsIcon: { fontSize: 48, marginBottom: spacing.md },
  instructionsTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary, marginBottom: spacing.sm },
  instructionsText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});