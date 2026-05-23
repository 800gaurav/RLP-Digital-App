import React, { useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getReels, downloadReel } from '../../services/reels.service';
import ReelViewer from '../../components/home/ReelViewer';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function StatusScreen() {
  const [selectedReel, setSelectedReel] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: reels = [], refetch } = useQuery({ queryKey: ['reels'], queryFn: getReels });

  const handleRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const handleReelPress = (reel) => { setSelectedReel(reel); setViewerVisible(true); };
  const handleDownload = async (reel) => { try { await downloadReel(reel); } catch (_e) {} };
  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const renderItem = ({ item }) => (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} onPress={() => handleReelPress(item)} accessibilityRole="button" accessibilityLabel={item.caption}>
      <View style={styles.thumbContainer}>
        <Image source={{ uri: item.mediaUrl }} style={styles.thumbnail} resizeMode="cover" />
        {item.mediaType === 'video' && (
          <View style={styles.playOverlay}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          <Pressable style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.75 }]} onPress={() => handleDownload(item)} accessibilityRole="button" accessibilityLabel="Download">
            <Text style={styles.downloadBtnText}>⬇ Download</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>Party Updates</Text></View>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.rlpGreen} colors={[Colors.rlpGreen]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Koi updates nahi hain abhi</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <ReelViewer reel={selectedReel} visible={viewerVisible} onClose={() => setViewerVisible(false)} onDownload={handleDownload} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.onSurface },
  listContent: { padding: 16, paddingBottom: 130 },
  card: { backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  thumbContainer: { width: '100%', height: 200, backgroundColor: Colors.surfaceContainerHigh },
  thumbnail: { width: '100%', height: '100%' },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playIcon: { fontSize: 40, color: Colors.white },
  cardContent: { padding: 12 },
  caption: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant },
  downloadBtn: { backgroundColor: Colors.rlpYellow, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  downloadBtnText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurface },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurfaceVariant },
});
