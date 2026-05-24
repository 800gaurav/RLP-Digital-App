import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

function getReelPreviewUrl(reel) {
  if (!reel) return '';
  if (reel.mediaType === 'video') return reel.thumbnailUrl || '';
  return reel.thumbnailUrl || reel.imageUrl || '';
}

export default function ReelsRow({ reels, onReelPress, onViewAllPress }) {
  useEffect(() => {
    reels.slice(0, 12).forEach((reel) => {
      const previewUrl = getReelPreviewUrl(reel);
      if (previewUrl) Image.prefetch(previewUrl);
    });
  }, [reels]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Pressable onPress={onViewAllPress} accessibilityRole="button" accessibilityLabel="View all status">
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>
      {reels.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Koi updates nahi hain</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {reels.map((reel, index) => (
            <Pressable
              key={reel.id}
              style={({ pressed }) => [styles.reelItem, pressed && styles.reelPressed]}
              onPress={() => onReelPress(reel, index)}
              accessibilityRole="button"
              accessibilityLabel={reel.caption || 'Status update'}
            >
              <View style={styles.ring}>
                {getReelPreviewUrl(reel) ? (
                  <Image source={{ uri: getReelPreviewUrl(reel) }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                    <Ionicons name="image-outline" size={24} color={Colors.rlpYellow} />
                  </View>
                )}
                {reel.mediaType === 'video' && (
                  <View style={styles.playOverlay}>
                    <Ionicons name="play" size={20} color={Colors.white} />
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
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.white },
  viewAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.rlpYellow },
  scrollContent: { paddingHorizontal: 16, gap: 16 },
  reelItem: { alignItems: 'center', width: 88 },
  reelPressed: { opacity: 0.8 },
  ring: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 3,
    borderColor: Colors.rlpYellow, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.rlpGreenDark,
  },
  thumbnail: { width: 78, height: 78, borderRadius: 39 },
  thumbnailFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.rlpGreenDark },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  caption: { fontFamily: FontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginTop: 6, lineHeight: 14 },
  emptyState: { paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(255,255,255,0.82)' },
});
