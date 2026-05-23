import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '../ui/Badge';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

function FeatureCard({ icon, title, subtitle, onPress, badge, locked }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}`}
    >
      {badge && <View style={styles.badgeContainer}>{badge}</View>}
      {locked && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={28} color={Colors.rlpGreen} />
        </View>
      )}
      <Ionicons name={icon} size={30} color={Colors.rlpGreen} style={styles.cardIcon} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function FeatureGrid({ onPadadhikariPress, onTrainingPress, onPosterPress, onStatusPress }) {
  return (
    <View style={styles.grid}>
      <FeatureCard icon="people" title="Padadhikari" subtitle="Leaders" onPress={onPadadhikariPress} />
      <FeatureCard icon="school" title="Training" subtitle="Videos" onPress={onTrainingPress} />
      <FeatureCard icon="play-circle" title="Status" subtitle="Party Updates" onPress={onStatusPress} />
      <FeatureCard
        icon="color-palette"
        title="Poster Maker"
        subtitle="Create Posters"
        onPress={onPosterPress}
        badge={<Badge label="Premium" variant="yellow" size="sm" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  card: {
    width: '47%', backgroundColor: Colors.white, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
    minHeight: 110, justifyContent: 'flex-end', overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  badgeContainer: { position: 'absolute', top: 10, right: 10 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center', justifyContent: 'center', borderRadius: 12, zIndex: 1,
  },
  cardIcon: { marginBottom: 8 },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface, lineHeight: 18 },
  cardSubtitle: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2, lineHeight: 16 },
});
