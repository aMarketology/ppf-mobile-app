import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, FileText, Activity, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, fonts } from '../theme';

const TABS = [
  { key: 'Activity', label: 'Feed', Icon: Activity },
  { key: 'Shop', label: 'Shop', Icon: ShoppingBag },
  { key: 'RFQ', label: 'RFQ', Icon: FileText },
  { key: 'Messages', label: 'Messages', Icon: MessageCircle },
];

type Props = {
  activeTab: string;
  onTabPress: (tab: string) => void;
  unreadMessages?: number;
  onCreatePress?: () => void;
};

export default function TabBar({ activeTab, onTabPress, unreadMessages = 0, onCreatePress }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 8,
    },
    tab: { flex: 1, alignItems: 'center' },
    iconWrap: {
      width: 44,
      height: 30,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 3,
      position: 'relative',
    },
    iconWrapActive: { backgroundColor: colors.mintLight },
    label: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: fonts.medium,
      letterSpacing: 0.2,
    },
    labelActive: { color: colors.mint, fontFamily: fonts.bold },
    badge: {
      position: 'absolute',
      top: -3,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.white,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.white,
      fontFamily: fonts.bold,
    },
    // Center + button
    centerWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    centerBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -26,
      borderWidth: 3,
      borderColor: colors.white,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    centerBtnText: {
      color: colors.white,
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 28,
    },
    centerLabel: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: fonts.medium,
      letterSpacing: 0.2,
      marginTop: 3,
    },
    // Bottom sheet
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.white,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: insets.bottom + 16,
      paddingTop: 12,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetTitle: {
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 4,
    },
    sheetSub: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 16,
    },
    optionRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      marginHorizontal: 16,
    },
    primaryOption: {
      backgroundColor: colors.orangeLight,
      borderColor: colors.orange,
    },
    disabledOption: {
      backgroundColor: colors.bg,
      borderColor: colors.border,
    },
    optionIcon: {
      fontSize: 28,
      marginRight: 14,
    },
    optionTextContainer: {
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    optionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      color: colors.textPrimary,
    },
    disabledText: {
      color: colors.textMuted,
    },
    optionDescription: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textSecondary,
    },
    activeBadge: {
      backgroundColor: colors.orange,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    activeBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontFamily: fonts.bold,
    },
    comingSoonBadge: {
      backgroundColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    comingSoonBadgeText: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: fonts.bold,
    },
    sheetCancel: {
      alignItems: 'center',
      paddingVertical: 14,
      marginTop: 8,
    },
    sheetCancelText: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      color: colors.textMuted,
    },
  });

  const handleCreate = () => {
    setShowCreate(false);
    onCreatePress?.();
  };

  const handleProjectPress = () => {
    setShowCreate(false);
    Alert.alert(
      'Coming Soon',
      'Project posting is currently under development and will be available in an upcoming update.',
      [{ text: 'OK' }],
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingBottom: insets.bottom + 6 }]}>
        {TABS.slice(0, 2).map(tab => {
          const isActive = activeTab === tab.key;
          const { Icon } = tab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}>
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 2}
                  color={isActive ? colors.mint : colors.textMuted}
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Center + button — opens camera */}
        <View style={styles.centerWrap}>
          <TouchableOpacity
            style={styles.centerBtn}
            onPress={() => setShowCreate(true)}
            activeOpacity={0.85}>
            <Text style={styles.centerBtnText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.centerLabel}>Post</Text>
        </View>

        {TABS.slice(2).map(tab => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'Messages' && unreadMessages > 0;
          const { Icon } = tab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}>
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 2}
                  color={isActive ? colors.mint : colors.textMuted}
                />
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Create action sheet — Scan Receipt (active) / Project (coming soon) */}
      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreate(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Create New Entry</Text>
            <Text style={styles.sheetSub}>Select what you would like to upload</Text>

            {/* Primary action — Scan Receipt (active) */}
            <TouchableOpacity
              style={[styles.optionCard, styles.primaryOption]}
              onPress={handleCreate}
              activeOpacity={0.85}>
              <Text style={styles.optionIcon}>🧾</Text>
              <View style={styles.optionTextContainer}>
                <View style={styles.badgeRow}>
                  <Text style={styles.optionTitle}>Scan Receipt</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>READY</Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  Snap receipt, extract OCR totals, and assign Job # & Cost Code
                </Text>
              </View>
            </TouchableOpacity>

            {/* Secondary action — Project post (coming soon) */}
            <TouchableOpacity
              style={[styles.optionCard, styles.disabledOption]}
              onPress={handleProjectPress}
              activeOpacity={0.85}>
              <Text style={styles.optionIcon}>🏗️</Text>
              <View style={styles.optionTextContainer}>
                <View style={styles.badgeRow}>
                  <Text style={[styles.optionTitle, styles.disabledText]}>
                    New Project Post
                  </Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
                  </View>
                </View>
                <Text style={[styles.optionDescription, styles.disabledText]}>
                  Share job-site updates and photos directly to the company feed
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowCreate(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
