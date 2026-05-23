import React, { useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTrainingVideos } from '../../services/videos.service';
import AppBottomNav from '../../components/navigation/AppBottomNav';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function TrainingVideosScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: videos = [], refetch } = useQuery({ queryKey: ['training-videos'], queryFn: getTrainingVideos });

  const handleRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const handleVideoPress = (video) => { router.push({ pathname: '/training-videos/[id]', params: { id: video.id } }); };

  const renderItem = ({ item }) => (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]} onPress={() => handleVideoPress(item)} accessibilityRole="button" accessibilityLabel={item.title}>
      <View style={styles.thumbContainer}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
            <Text style={styles.thumbPlaceholderIcon}>🎬</Text>
          </View>
        )}
        <View style={styles.playOverlay}>
          <View style={styles.playCircle}><Text style={styles.playIcon}>▶</Text></View>
        </View>
        {item.duration && (
          <View style={styles.durationBadge}><Text style={styles.durationText}>{item.duration}</Text></View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Training Videos</Text>
        <View style={{ width: 36 }} />
      </View>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.rlpGreen} colors={[Colors.rlpGreen]} />}
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>🎬</Text><Text style={styles.emptyText}>Koi training videos nahi hain abhi</Text></View>}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.onSurface },
  headerTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface, textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 28 },
  card: { backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  thumbContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.surfaceContainerHigh },
  thumbnail: { width: '100%', height: '100%' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerHighest },
  thumbPlaceholderIcon: { fontSize: 40 },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  playCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 20, color: Colors.rlpGreen },
  durationBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },
  durationText: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.white },
  cardContent: { padding: 12 },
  title: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurfaceVariant },
});
