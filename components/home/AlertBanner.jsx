import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function AlertBanner({ notification, onPress }) {
  if (!notification) return null;
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>📢</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notification.body || notification.message}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.secondaryContainer,
    borderWidth: 1, borderColor: 'rgba(0,110,46,0.2)',
    borderRadius: 12, margin: 16, padding: 16, gap: 12,
  },
  pressed: { opacity: 0.85 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconEmoji: { fontSize: 18 },
  content: { flex: 1 },
  title: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface, marginBottom: 2 },
  body: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 16 },
  chevron: { fontSize: 22, color: Colors.rlpGreen, fontFamily: FontFamily.bold, flexShrink: 0 },
});
