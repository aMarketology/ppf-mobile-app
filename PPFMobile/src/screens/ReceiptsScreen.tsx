/**
 * ReceiptsScreen — List of scanned expense receipts.
 *
 * Shows all receipts for the current user with status, vendor, amount, and date.
 * Tap a receipt to view details. Tap "Scan Receipt" to capture a new one.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { restGet } from '../lib/restClient';
import { spacing, radius, fonts, shadows } from '../theme';

interface Receipt {
  id: string;
  vendor_name: string | null;
  transaction_date: string | null;
  total_amount: number | null;
  status: string;
  job_number: string | null;
  cost_code: string | null;
  cost_code_desc: string | null;
  notes: string | null;
  created_at: string;
}

type Props = {
  onNavigate: (screen: string) => void;
};

export default function ReceiptsScreen({ onNavigate }: Props) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const jwt = session?.access_token ?? '';
  const styles = createStyles(colors);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!jwt) return;
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await restGet<Receipt[]>(
        `receipts?select=id,vendor_name,transaction_date,total_amount,status,job_number,cost_code,cost_code_desc,notes,created_at&order=created_at.desc`,
        jwt,
      );
      setReceipts(data || []);
    } catch (_) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwt]);

  useEffect(() => { load(); }, [load]);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatAmount(amount: number | null): string {
    if (amount == null) return '—';
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  function statusColor(status: string): string {
    switch (status) {
      case 'processed': return '#059669';
      case 'pending': return '#D97706';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mint} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Receipts & Expenses</Text>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => onNavigate('ScanReceipt')}
          activeOpacity={0.85}
        >
          <Text style={styles.scanBtnText}>+ Scan Receipt</Text>
        </TouchableOpacity>
      </View>

      {receipts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>No Receipts Yet</Text>
          <Text style={styles.emptyText}>
            Capture field receipts on the fly to automate job costing and tracking for your CNC & manufacturing jobs.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => onNavigate('ScanReceipt')}
          >
            <Text style={styles.emptyBtnText}>Scan First Receipt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.mint} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.vendorName} numberOfLines={1}>
                    {item.vendor_name || 'Receipt Expense'}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.transaction_date)}</Text>
                  {item.job_number && (
                    <Text style={styles.project}>⚙️ Job: {item.job_number}</Text>
                  )}
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.amount}>{formatAmount(item.total_amount)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
              {(item.cost_code || item.notes) && (
                <View style={styles.cardBottom}>
                  {item.cost_code && <Text style={styles.costCode}>📋 Code: {item.cost_code}</Text>}
                  {item.notes && <Text style={styles.notesText} numberOfLines={2}>📝 {item.notes}</Text>}
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary },
  scanBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    ...shadows.button,
  },
  scanBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft: { flex: 1, marginRight: spacing.md },
  vendorName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  date: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  project: { fontFamily: fonts.medium, fontSize: 12, color: colors.mint },
  cardRight: { alignItems: 'flex-end' },
  amount: { fontFamily: fonts.bold, fontSize: 17, color: colors.textPrimary, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  statusText: { fontFamily: fonts.semiBold, fontSize: 11 },
  cardBottom: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 },
  costCode: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  notesText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  emptyBtn: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.md, ...shadows.button },
  emptyBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' },
});