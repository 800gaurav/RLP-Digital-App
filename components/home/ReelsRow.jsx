import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function ReelsRow({ reels, onReelPress, onViewAllPress }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Humaare Kaam</Text>
        <Pressable onPress={onViewAllPress} accessibilityRole="button" accessibilityLabel="View all reels">
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>
      {reels.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Koi updates nahi hain</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {reels.map((reel) => (
            <Pressable
              key={reel.id}
              style={({ pressed }) => [styles.reelItem, pressed && styles.reelPressed]}
              onPress={() => onReelPress(reel)}
              accessibilityRole="button"
              accessibilityLabel={reel.caption}
            >
              <View style={styles.ring}>
                <Image source={{ uri: reel.mediaUrl }} style={styles.thumbnail} resizeMode="cover" />
                {reel.mediaType === 'video' && (
                  <View style={styles.playOverlay}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                )}
              </View>
              <Text style={styles.caption} numberOfLines={2}>{reel.caption}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: 18, color: '#1a1a1a' },
  viewAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.rlpGreen },
  scrollContent: { paddingHorizontal: 16, gap: 16 },
  reelItem: { alignItems: 'center', width: 88 },
  reelPressed: { opacity: 0.8 },
  ring: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 3,
    borderColor: Colors.rlpYellow, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  thumbnail: { width: 78, height: 78, borderRadius: 39 },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playIcon: { fontSize: 20, color: Colors.white },
  caption: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.onSurfaceVariant, textAlign: 'center', marginTop: 6, lineHeight: 14 },
  emptyState: { paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
});
