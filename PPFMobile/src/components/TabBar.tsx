import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

const TABS = [
  { key: 'Home', label: 'Home', icon: '🏠' },
  { key: 'Marketplace', label: 'Suppliers', icon: '🔍' },
  { key: 'Feed', label: 'Feed', icon: '�' },
  { key: 'Messages', label: 'Messages', icon: '💬' },
  { key: 'Profile', label: 'Profile', icon: '👤' },
];

type Props = {
  activeTab: string;
  onTabPress: (tab: string) => void;
  unreadMessages?: number;
};

export default function TabBar({ activeTab, onTabPress, unreadMessages = 0 }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        const showBadge = tab.key === 'Messages' && unreadMessages > 0;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}>
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Text style={styles.icon}>{tab.icon}</Text>
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadMessages}</Text>
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
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  iconWrapActive: { backgroundColor: colors.mintLight },
  icon: { fontSize: 18 },
  label: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  labelActive: { color: colors.mintDark, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: colors.white },
});
