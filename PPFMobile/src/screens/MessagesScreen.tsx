import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

const CONVERSATIONS = [
  {
    id: '1',
    company: 'Bechtel Corporation',
    subject: 'Quote Request – Infrastructure Project',
    lastMessage: 'Thank you for your interest. We can provide a detailed quote within 48 hours.',
    time: '2m ago',
    unread: 2,
    avatar: 'B',
  },
  {
    id: '2',
    company: 'AECOM',
    subject: 'Re: Water Treatment Consultation',
    lastMessage: 'We have reviewed your project specifications and would like to schedule a call.',
    time: '1h ago',
    unread: 0,
    avatar: 'A',
  },
  {
    id: '3',
    company: 'Fluor Corporation',
    subject: 'Order #PPF-2024-0312 Update',
    lastMessage: 'Your order has been confirmed. Delivery timeline is 14 business days.',
    time: '3h ago',
    unread: 1,
    avatar: 'F',
  },
  {
    id: '4',
    company: 'Burns & McDonnell',
    subject: 'Power Delivery RFQ',
    lastMessage: 'Please find our technical proposal attached to this message.',
    time: 'Yesterday',
    unread: 0,
    avatar: 'B',
  },
  {
    id: '5',
    company: 'Jacobs Engineering',
    subject: 'Process Engineering Inquiry',
    lastMessage: 'We would be happy to discuss your requirements in more detail.',
    time: '2 days ago',
    unread: 0,
    avatar: 'J',
  },
];

type Props = { onNavigate: (screen: string) => void };

export default function MessagesScreen({ onNavigate }: Props) {
  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <Text style={styles.headerSub}>{totalUnread} unread messages</Text>
          )}
        </View>
        <TouchableOpacity style={styles.composeBtn}>
          <Text style={styles.composeBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Conversations */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {CONVERSATIONS.map((conv, i) => (
          <TouchableOpacity
            key={conv.id}
            style={[styles.row, i === 0 && styles.rowFirst]}
            activeOpacity={0.8}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, conv.unread > 0 && styles.avatarActive]}>
                <Text style={styles.avatarText}>{conv.avatar}</Text>
              </View>
              {conv.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{conv.unread}</Text>
                </View>
              )}
            </View>
            <View style={styles.content}>
              <View style={styles.rowTop}>
                <Text
                  style={[styles.company, conv.unread > 0 && styles.companyBold]}
                  numberOfLines={1}>
                  {conv.company}
                </Text>
                <Text style={styles.time}>{conv.time}</Text>
              </View>
              <Text
                style={[styles.subject, conv.unread > 0 && styles.subjectBold]}
                numberOfLines={1}>
                {conv.subject}
              </Text>
              <Text style={styles.preview} numberOfLines={1}>
                {conv.lastMessage}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 13, color: colors.mint, fontWeight: '600', marginTop: 2 },
  composeBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  composeBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowFirst: { marginTop: 8 },
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: { backgroundColor: colors.mintMid },
  avatarText: { fontSize: 20, fontWeight: '800', color: colors.mintDark },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
  content: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  company: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  companyBold: { fontWeight: '800' },
  time: { fontSize: 12, color: colors.textMuted },
  subject: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  subjectBold: { fontWeight: '700', color: colors.textPrimary },
  preview: { fontSize: 13, color: colors.textMuted },
});
