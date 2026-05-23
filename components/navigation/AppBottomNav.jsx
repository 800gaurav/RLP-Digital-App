import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const ITEMS = [
  { key: 'home', label: 'Home', route: '/(tabs)', icon: 'home', outline: 'home-outline' },
  { key: 'poster', label: 'Poster', route: '/(tabs)/poster-maker', icon: 'color-palette', outline: 'color-palette-outline' },
  { key: 'status', label: 'Status', route: '/(tabs)/status', icon: 'play-circle', outline: 'play-circle-outline' },
  { key: 'profile', label: 'Profile', route: '/(tabs)/profile', icon: 'person', outline: 'person-outline' },
];

function getActiveKey(pathname) {
  if (pathname.includes('poster-maker')) return 'poster';
  if (pathname.includes('status')) return 'status';
  if (pathname.includes('profile')) return 'profile';
  return 'home';
}

export default function AppBottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeKey = getActiveKey(pathname);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8) }]}>
      {ITEMS.map((item) => {
        const focused = activeKey === item.key;
        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.item, focused && styles.itemActive, pressed && { opacity: 0.78 }]}
            onPress={() => router.push(item.route)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Ionicons name={focused ? item.icon : item.outline} size={22} color={focused ? Colors.rlpGreen : Colors.onSurfaceVariant} />
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 74,
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  item: {
    height: 48,
    minWidth: 54,
    maxWidth: 76,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 6,
    gap: 2,
  },
  itemActive: { backgroundColor: Colors.primaryContainer },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    lineHeight: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelActive: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
});
