import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { ordersService } from '../services/orders';
import { productsService } from '../services/products';
import { useAuth } from '../context/AuthContext';
import type { ProductOrder, OrderStatus } from '../lib/types';

const STATUS_STYLE: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  completed: { bg: colors.mintLight, text: colors.mintDark, label: '✓ Completed' },
  pending:   { bg: '#fef3c7', text: '#b45309', label: '⏳ Pending' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c', label: '✕ Cancelled' },
  refunded:  { bg: '#ede9fe', text: '#6d28d9', label: '↩ Refunded' },
};

type Props = { onNavigate: (screen: string) => void };

export default function OrdersScreen({ onNavigate }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalSpentCents: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const [orderData, statsData] = await Promise.all([
        ordersService.getMyOrders(user.id),
        ordersService.getStats(user.id),
      ]);
      setOrders(orderData);
      setStats(statsData);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mint} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>Sign in to view your orders</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => onNavigate('Auth')}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSub}>{stats.total} total orders</Text>
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {productsService.formatPrice(stats.totalSpentCents)}
          </Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.completed}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.pending}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.mint} />
          }>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubtext}>Browse the marketplace to get started</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => onNavigate('Marketplace')}>
                <Text style={styles.browseBtnText}>Browse Suppliers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((order) => {
              const s = STATUS_STYLE[order.status as OrderStatus] ?? STATUS_STYLE.pending;
              return (
                <TouchableOpacity key={order.id} style={styles.card} activeOpacity={0.85}>
                  <View style={styles.cardTop}>
                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.productName}>{order.product_name}</Text>
                  {order.company && (
                    <Text style={styles.companyName}>{order.company.company_name}</Text>
                  )}
                  <View style={styles.cardFooter}>
                    <Text style={styles.date}>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.amount}>
                      {productsService.formatPrice(order.total_amount)}
                    </Text>
                  </View>
                  {order.status === 'completed' && (
                    <TouchableOpacity style={styles.reorderBtn}>
                      <Text style={styles.reorderText}>Reorder</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.mint,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    paddingVertical: 20,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: colors.white },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontWeight: '500' },
  list: { flex: 1, paddingHorizontal: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.white },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  browseBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  signInBtn: { backgroundColor: colors.mint, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  signInBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumber: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  productName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  companyName: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: colors.textMuted },
  amount: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  reorderBtn: { marginTop: 12, borderWidth: 1.5, borderColor: colors.mint, borderRadius: radius.md, paddingVertical: 8, alignItems: 'center' },
  reorderText: { fontSize: 13, fontWeight: '700', color: colors.mint },
});
