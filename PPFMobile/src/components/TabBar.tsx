import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  onCameraPress?: () => void;
};

export default function TabBar({ activeTab, onTabPress, unreadMessages = 0, onCameraPress }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
  });

  return (
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

      {/* Center + button — opens camera directly */}
      <View style={styles.centerWrap}>
        <TouchableOpacity
          style={styles.centerBtn}
          onPress={onCameraPress}
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
  );
}
