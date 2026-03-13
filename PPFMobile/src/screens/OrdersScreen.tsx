import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

const ORDERS = [
  {
    orderNumber: 'PPF-2024-0312',
    product: 'Structural Engineering Consultation',
    company: 'Bechtel Corporation',
    amount: '$4,590.00',
    status: 'completed',
    date: 'Mar 10, 2026',
  },
  {
    orderNumber: 'PPF-2024-0298',
    product: 'Environmental Impact Assessment',
    company: 'AECOM',
    amount: '$2,200.00',
    status: 'pending',
    date: 'Mar 8, 2026',
  },
  {
    orderNumber: 'PPF-2024-0271',
    product: 'Power Delivery Engineering Services',
    company: 'Burns & McDonnell',
    amount: '$8,750.00',
    status: 'completed',
    date: 'Feb 28, 2026',
  },
  {
    orderNumber: 'PPF-2024-0245',
    product: 'Process Engineering Review',
    company: 'Jacobs Engineering',
    amount: '$1,850.00',
    status: 'cancelled',
    date: 'Feb 15, 2026',
  },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: colors.mintLight, text: colors.mintDark, label: '✓ Completed' },
  pending: { bg: '#fef3c7', text: '#b45309', label: '⏳ Pending' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c', label: '✕ Cancelled' },
  refunded: { bg: '#ede9fe', text: '#6d28d9', label: '↩ Refunded' },
};

type Props = { onNavigate: (screen: string) => void };

export default function OrdersScreen({ onNavigate }: Props) {
  const totalSpent = ORDERS.filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + parseFloat(o.amount.replace(/[$,]/g, '')), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSub}>{ORDERS.length} total orders</Text>
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>${totalSpent.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {ORDERS.filter(o => o.status === 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {ORDERS.filter(o => o.status === 'pending').length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {ORDERS.map((order, i) => {
          const s = STATUS_STYLE[order.status];
          return (
            <TouchableOpacity key={i} style={styles.card} activeOpacity={0.85}>
              <View style={styles.cardTop}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                </View>
              </View>
              <Text style={styles.productName}>{order.product}</Text>
              <Text style={styles.companyName}>{order.company}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.date}>{order.date}</Text>
                <Text style={styles.amount}>{order.amount}</Text>
              </View>
              {order.status === 'completed' && (
                <TouchableOpacity style={styles.reorderBtn}>
                  <Text style={styles.reorderText}>Reorder</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
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
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: colors.white },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 3,
    fontWeight: '500',
  },
  list: { flex: 1, paddingHorizontal: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  companyName: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: 12, color: colors.textMuted },
  amount: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  reorderBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  reorderText: { fontSize: 13, fontWeight: '700', color: colors.mint },
});
