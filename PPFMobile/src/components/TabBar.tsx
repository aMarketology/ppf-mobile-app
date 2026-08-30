import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, FileText, Activity, MessageCircle, User } from 'lucide-react-native';
import { colors, radius, fonts } from '../theme';

const TABS = [
  { key: 'Activity', label: 'Feed', Icon: Activity },
  { key: 'Shop', label: 'Shop', Icon: ShoppingBag },
  { key: 'RFQ', label: 'RFQ', Icon: FileText },
  { key: 'Messages', label: 'Messages', Icon: MessageCircle },
  { key: 'Profile', label: 'Profile', Icon: User },
];

type Props = {
  activeTab: string;
  onTabPress: (tab: string) => void;
  unreadMessages?: number;
};

export default function TabBar({ activeTab, onTabPress, unreadMessages = 0 }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 6 }]}>
      {TABS.map(tab => {
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
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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
});
