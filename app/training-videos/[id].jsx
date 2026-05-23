import React, { useRef } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Video, ResizeMode } from 'expo-av';
import { getTrainingVideos } from '../../services/videos.service';
import AppBottomNav from '../../components/navigation/AppBottomNav';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

function isYouTubeUrl(url = '') {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export default function TrainingVideoDetailScreen() {
  const { id } = useLocalSearchParams();
  const videoRef = useRef(null);
  const openingFullscreenRef = useRef(false);
  const fullscreenOpenedRef = useRef(false);
  const resettingFinishedVideoRef = useRef(false);
  const { data: videos = [] } = useQuery({ queryKey: ['training-videos'], queryFn: getTrainingVideos });
  const video = videos.find((v) => v.id === id);

  const handleOpenYouTube = async () => {
    if (!video) return;
    try {
      const supported = await Linking.canOpenURL(video.videoUrl);
      if (supported) await Linking.openURL(video.videoUrl);
      else Alert.alert('Error', 'Cannot open this URL.');
    } catch (_e) {
      Alert.alert('Error', 'Could not open video link.');
    }
  };

  const Header = ({ title }) => (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backIcon}>{'<'}</Text>
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );

  if (!video) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Video" />
        <View style={styles.notFound}><Text style={styles.notFoundText}>Video not found</Text></View>
        <AppBottomNav />
      </SafeAreaView>
    );
  }

  const isYT = isYouTubeUrl(video.videoUrl);

  const handlePlaybackStatusUpdate = async (status) => {
    if (!status.isLoaded || !videoRef.current) return;

    if (!fullscreenOpenedRef.current && !openingFullscreenRef.current) {
      openingFullscreenRef.current = true;
      try {
        await videoRef.current.presentFullscreenPlayer();
        fullscreenOpenedRef.current = true;
      } catch (_error) {
      } finally {
        openingFullscreenRef.current = false;
      }
    }

    if (status.didJustFinish && !resettingFinishedVideoRef.current) {
      resettingFinishedVideoRef.current = true;
      try {
        await videoRef.current.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
      } catch (_error) {
      } finally {
        resettingFinishedVideoRef.current = false;
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title={video.title} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.playerSection}>
          {isYT ? (
            <Pressable style={({ pressed }) => [styles.ytContainer, pressed && { opacity: 0.85 }]} onPress={handleOpenYouTube} accessibilityRole="button" accessibilityLabel="Open in YouTube">
              <View style={styles.ytPlaceholder}>
                <View style={styles.ytPlayButton}><Text style={styles.ytPlayIcon}>Play</Text></View>
                <Text style={styles.ytLabel}>Open in YouTube</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: video.videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.title}>{video.title}</Text>
          {video.duration ? <Text style={styles.duration}>{video.duration}</Text> : null}
          {video.description ? <Text style={styles.description}>{video.description}</Text> : null}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: Colors.onSurface },
  headerTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.onSurface, marginHorizontal: 4 },
  scrollContent: { flexGrow: 1, backgroundColor: '#F8F9FA', paddingBottom: 28 },
  playerSection: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 14 },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.black,
    borderRadius: 8,
  },
  video: { width: '100%', height: '100%' },
  ytContainer: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', backgroundColor: Colors.black, borderRadius: 8 },
  ytPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  ytPlayButton: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  ytPlayIcon: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.rlpGreen },
  ytLabel: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.white },
  details: { padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#ECEFF3' },
  title: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.onSurface, lineHeight: 26, marginBottom: 8 },
  duration: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 12 },
  description: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  notFoundText: { fontFamily: FontFamily.regular, fontSize: 16, color: Colors.onSurfaceVariant },
});
