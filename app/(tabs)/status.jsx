import React, { useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getReels, downloadReel } from '../../services/reels.service';
import ReelViewer from '../../components/home/ReelViewer';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function StatusScreen() {
  const [selectedReel, setSelectedReel] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: reels = [], refetch } = useQuery({ queryKey: ['reels'], queryFn: getReels });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleReelPress = (reel, index) => {
    setSelectedReel(reel);
    setSelectedIndex(index);
    setViewerVisible(true);
  };

  const handlePrevious = () => {
    if (selectedIndex <= 0) return;
    const nextIndex = selectedIndex - 1;
    setSelectedIndex(nextIndex);
    setSelectedReel(reels[nextIndex]);
  };

  const handleNext = () => {
    if (selectedIndex >= reels.length - 1) return;
    const nextIndex = selectedIndex + 1;
    setSelectedIndex(nextIndex);
    setSelectedReel(reels[nextIndex]);
  };

  const handleDownload = async (reel) => {
    try {
      const result = await downloadReel(reel);
      if (result?.savedTo === 'share') {
        Alert.alert('Save Status', 'Expo Go me direct gallery save restricted hai. Share sheet se Save/Download choose kar sakte hain.');
        return;
      }
      Alert.alert('Downloaded', 'Status gallery me save ho gaya.');
    } catch (error) {
      Alert.alert('Download failed', error?.message || 'Status download nahi ho paya.');
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const renderItem = ({ item, index }) => (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} onPress={() => handleReelPress(item, index)} accessibilityRole="button" accessibilityLabel={item.caption}>
      <View style={styles.thumbContainer}>
        <Image source={{ uri: item.mediaUrl }} style={styles.thumbnail} resizeMode="cover" />
        {item.mediaType === 'video' && (
          <View style={styles.playOverlay}>
            <Text style={styles.playIcon}>Play</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          <Pressable
            style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.75 }]}
            onPress={(event) => {
              event.stopPropagation();
              handleDownload(item);
            }}
            accessibilityRole="button"
            accessibilityLabel="Download"
          >
            <Text style={styles.downloadBtnText}>Download</Text>
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
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>Status</Text>
            <Text style={styles.emptyText}>Koi updates nahi hain abhi</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <ReelViewer
        reel={selectedReel}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        onDownload={handleDownload}
        hasPrevious={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < reels.length - 1}
        currentIndex={selectedIndex}
        totalCount={reels.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
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
  playIcon: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.white },
  cardContent: { padding: 12 },
  caption: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant },
  downloadBtn: { backgroundColor: Colors.rlpYellow, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  downloadBtnText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurface },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.rlpGreen },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurfaceVariant },
});
