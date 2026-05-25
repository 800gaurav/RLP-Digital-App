import React, { useRef, useState } from 'react';
import {
  Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import ViewShot from 'react-native-view-shot';

import { useAuthStore } from '../../store/auth.store';
import { getMe } from '../../services/user.service';
import { downloadReel } from '../../services/reels.service';
import { getHomeFeed } from '../../services/home.service';

import TopAppBar from '../../components/home/TopAppBar';
import AlertBanner from '../../components/home/AlertBanner';
import IDCardPreview from '../../components/home/IDCardPreview';
import ReelsRow from '../../components/home/ReelsRow';
import FeatureGrid from '../../components/home/FeatureGrid';
import ReelViewer from '../../components/home/ReelViewer';
import IDCard from '../../components/digital-id/IDCard';

import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { isPermissionDeniedError } from '../../src/services/PermissionManager';
import { saveImageToGallery } from '../../src/utils/mediaSave';

export default function HomeScreen() {
  const { user: storeUser, setUser } = useAuthStore();
  const idCardCaptureRef = useRef(null);
  const [selectedReel, setSelectedReel] = useState(null);
  const [selectedReelIndex, setSelectedReelIndex] = useState(-1);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const currentUser = await getMe();
      setUser(currentUser);
      return currentUser;
    },
    initialData: storeUser ?? undefined,
  });

  const { data: homeFeed, refetch: refetchHomeFeed } = useQuery({
    queryKey: ['home-feed'],
    queryFn: getHomeFeed,
  });

  const reels = homeFeed?.reels || [];
  const notifications = homeFeed?.notifications || [];
  const officials = homeFeed?.officials || [];
  const trainings = homeFeed?.trainings || [];
  const homeStatusReels = reels.slice(0, 10);
  const latestUpdates = notifications.slice(0, 4);
  const priorityNotification = notifications.find((item) => item.priority) ?? notifications[0] ?? null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchHomeFeed()]);
    setRefreshing(false);
  };

  const handleReelPress = (reel, index) => {
    setSelectedReel(reel);
    setSelectedReelIndex(index);
    setViewerVisible(true);
  };

  const handleDownload = async (reel) => {
    try {
      await downloadReel(reel);
      Alert.alert('Downloaded', 'Status gallery me save ho gaya.');
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        router.push('/permissions/recovery');
        return;
      }
      Alert.alert('Download failed', error?.message || 'Status download nahi ho paya.');
    }
  };

  const handlePreviousReel = () => {
    if (selectedReelIndex <= 0) return;
    const nextIndex = selectedReelIndex - 1;
    setSelectedReelIndex(nextIndex);
    setSelectedReel(homeStatusReels[nextIndex]);
  };

  const handleNextReel = () => {
    if (selectedReelIndex >= homeStatusReels.length - 1) return;
    const nextIndex = selectedReelIndex + 1;
    setSelectedReelIndex(nextIndex);
    setSelectedReel(homeStatusReels[nextIndex]);
  };

  const handleNotificationPress = () => {
    if (priorityNotification) {
      router.push({ pathname: '/notification-detail', params: { id: priorityNotification.id } });
    }
  };

  const openDigitalId = (action) => {
    router.push(action ? { pathname: '/digital-id', params: { action } } : '/digital-id');
  };

  const captureIdCard = async () => {
    if (!idCardCaptureRef.current?.capture) throw new Error('ID card preview is not ready yet. Please try again.');
    return idCardCaptureRef.current.capture();
  };

  const persistIdCard = async () => {
    const capturedUri = await captureIdCard();
    const targetUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}RLP-ID-${user.voterId || user.id}-${Date.now()}.png`;
    await FileSystem.copyAsync({ from: capturedUri, to: targetUri });
    return targetUri;
  };

  const handleIdCardDownload = async () => {
    try {
      const uri = await persistIdCard();
      await saveImageToGallery(uri, {
        fileName: `RLP-ID-${user.voterId || user.id}-${Date.now()}.png`,
      });
      Alert.alert('Downloaded', 'ID card image saved to gallery.');
    } catch (error) {
      console.error('Home ID card download failed', error);
      if (isPermissionDeniedError(error)) {
        router.push('/permissions/recovery');
        return;
      }
      Alert.alert('Download failed', error?.message || 'Could not generate the ID card image.');
    }
  };

  const handleIdCardShare = async () => {
    openDigitalId('share');
  };

  const openStampPad = () => {
    if (user.stampPadAccess) router.push('/stamp-pad');
    else router.push('/stamp-pad/access-restricted');
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopAppBar
        user={user}
        onNotificationPress={() => router.push('/notifications')}
        onDigitalIdPress={() => router.push('/digital-id')}
        onProfilePress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.rlpGreen}
            colors={[Colors.rlpGreen]}
          />
        )}
      >
        <AlertBanner notification={priorityNotification} onPress={handleNotificationPress} />

        <IDCardPreview
          user={user}
          onViewPress={() => openDigitalId()}
          onDownloadPress={handleIdCardDownload}
          onSharePress={handleIdCardShare}
        />

        {notifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>Latest Updates</Text>
              <Pressable onPress={() => router.push('/notifications')} accessibilityRole="button">
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            <View style={styles.updateList}>
              {latestUpdates.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.updateCard, pressed && { opacity: 0.88 }]}
                  onPress={() => router.push({ pathname: '/notification-detail', params: { id: item.id } })}
                  accessibilityRole="button"
                >
                  <Text style={styles.updateTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.updateBody} numberOfLines={1}>{item.body || item.message}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <ReelsRow reels={homeStatusReels} onReelPress={handleReelPress} onViewAllPress={() => router.push('/(tabs)/status')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Party Tools</Text>
          <FeatureGrid
            onPadadhikariPress={() => router.push('/padadhikari')}
            onTrainingPress={() => router.push('/training-videos')}
            onStatusPress={() => router.push('/(tabs)/status')}
            onPosterPress={() => router.push('/(tabs)/poster-maker')}
          />
        </View>

        {/* <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.stampPadCta, pressed && { opacity: 0.88 }]}
            onPress={openStampPad}
            accessibilityRole="button"
            accessibilityLabel="Open Stamp Pad"
          >
            <View style={styles.stampIconWrap}>
              <Ionicons name="document-text" size={30} color={Colors.rlpGreen} />
            </View>
            <View style={styles.stampContent}>
              <Text style={styles.stampTitle}>Stamp Pad</Text>
              <Text style={styles.stampSubtitle}>Draft letters with official RLP stamp format.</Text>
            </View>
            <View style={styles.stampAction}>
              <Text style={styles.stampActionText}>Open</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.white} />
            </View>
          </Pressable>
        </View> */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Padadhikari (Leaders)</Text>
            <Pressable onPress={() => router.push('/padadhikari')} accessibilityRole="button">
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>
          {officials.length === 0 ? (
            <View style={styles.emptySectionState}>
              <Text style={styles.emptySectionText}>Abhi koi padadhikari nahi hain</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.padadhikariScroll}
            >
              {officials.slice(0, 10).map((official) => {
                const photoUri = official.imageUrl || official.photoUrl || official.thumbnailUrl;
                return (
                  <Pressable
                    key={official.id}
                    style={({ pressed }) => [styles.officialCard, pressed && { opacity: 0.85 }]}
                    onPress={() => router.push({ pathname: '/padadhikari/[id]', params: { id: official.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={official.fullName}
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.officialPhoto} resizeMode="cover" />
                    ) : (
                      <View style={[styles.officialPhoto, styles.officialPhotoPlaceholder]}>
                        <Text style={styles.officialInitial}>{official.fullName?.charAt(0) || 'R'}</Text>
                      </View>
                    )}
                    <View style={styles.officialInfo}>
                      <Text style={styles.officialName} numberOfLines={1}>{official.fullName}</Text>
                      <Text style={styles.officialDesignation} numberOfLines={1}>{official.designation}</Text>
                      <View style={styles.officialActions}>
                        <Text style={styles.officialActionIcon}>Verified</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Training Videos</Text>
            <Pressable onPress={() => router.push('/training-videos')} accessibilityRole="button">
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>
          {trainings.length === 0 ? (
            <View style={styles.emptySectionState}>
              <Text style={styles.emptySectionText}>Abhi koi training videos nahi hain</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trainingScroll}>
              {trainings.slice(0, 8).map((video) => (
                <Pressable
                  key={video.id}
                  style={({ pressed }) => [styles.trainingCard, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push({ pathname: '/training-videos/[id]', params: { id: video.id } })}
                  accessibilityRole="button"
                >
                  {video.thumbnailUrl ? (
                    <Image source={{ uri: video.thumbnailUrl }} style={styles.trainingThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.trainingThumb, styles.trainingThumbFallback]}>
                      <Text style={styles.trainingThumbText}>RLP</Text>
                    </View>
                  )}
                  <View style={styles.trainingPlayOverlay}>
                    <View style={styles.trainingPlayCircle}>
                      <Ionicons name="play" size={16} color={Colors.rlpGreen} />
                    </View>
                  </View>
                  <View style={styles.trainingInfo}>
                    <Text style={styles.trainingCaption} numberOfLines={1}>{video.title}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.posterCta}>
            <View style={styles.posterCtaContent}>
              <Text style={styles.posterCtaTitle}>Create Your Poster</Text>
              <Text style={styles.posterCtaSubtitle}>
                Share your support with personalized RLP posters in one click.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.posterCtaBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.push('/(tabs)/poster-maker')}
                accessibilityRole="button"
              >
                <Text style={styles.posterCtaBtnText}>Start Designing</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <ReelViewer
        reel={selectedReel}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        onDownload={handleDownload}
        hasPrevious={selectedReelIndex > 0}
        hasNext={selectedReelIndex >= 0 && selectedReelIndex < homeStatusReels.length - 1}
        currentIndex={selectedReelIndex}
        totalCount={homeStatusReels.length}
        onPrevious={handlePreviousReel}
        onNext={handleNextReel}
      />

      <ViewShot
        ref={idCardCaptureRef}
        style={styles.hiddenIdCardCapture}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
      >
        <IDCard user={user} />
      </ViewShot>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.rlpGreen },
  hiddenIdCardCapture: {
    position: 'absolute',
    left: -10000,
    top: 0,
    width: 360,
    opacity: 0.01,
    backgroundColor: Colors.transparent,
  },
  scroll: { flex: 1, backgroundColor: Colors.rlpGreen },
  scrollContent: { paddingTop: 8 },
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.white,
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.white,
  },
  viewAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.rlpYellow },
  updateList: { paddingHorizontal: 16, gap: 12 },
  updateCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    height: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  updateTitle: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface, marginBottom: 4 },
  updateBody: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 18, color: Colors.onSurfaceVariant },
  emptySectionState: { paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' },
  emptySectionText: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(255,255,255,0.82)' },
  padadhikariScroll: { paddingHorizontal: 16, gap: 12 },
  officialCard: {
    width: 240, backgroundColor: Colors.white, padding: 16, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  officialPhoto: { width: 56, height: 56, borderRadius: 28, flexShrink: 0 },
  officialPhotoPlaceholder: { backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center' },
  officialInitial: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  officialInfo: { flex: 1 },
  officialName: { fontFamily: FontFamily.semiBold, fontSize: 14, color: '#1a1a1a', marginBottom: 2 },
  officialDesignation: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.rlpGreen, marginBottom: 6 },
  officialActions: { flexDirection: 'row', gap: 8 },
  officialActionIcon: { fontSize: 12, color: '#9ca3af' },
  trainingScroll: { paddingHorizontal: 16, gap: 12 },
  trainingCard: {
    width: 180, borderRadius: 12, overflow: 'hidden',
    backgroundColor: Colors.white, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  trainingThumb: { width: 180, height: 112 },
  trainingThumbFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.rlpGreen },
  trainingThumbText: { fontFamily: FontFamily.black, fontSize: 28, color: Colors.rlpYellow },
  trainingPlayOverlay: {
    position: 'absolute', top: 0, left: 0, width: 180, height: 112,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)',
  },
  trainingPlayCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  trainingInfo: { padding: 10 },
  trainingCaption: { fontFamily: FontFamily.semiBold, fontSize: 12, color: '#1a1a1a' },
  posterCta: {
    marginHorizontal: 16, backgroundColor: Colors.rlpYellow,
    borderRadius: 16, padding: 24, overflow: 'hidden',
    shadowColor: '#FFD400', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  posterCtaContent: { width: '70%' },
  posterCtaTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.onSurface, marginBottom: 6 },
  posterCtaSubtitle: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 16, lineHeight: 18 },
  posterCtaBtn: {
    backgroundColor: Colors.onPrimaryContainer, borderRadius: 999,
    paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  posterCtaBtnText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.white },
  stampPadCta: {
    marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: Colors.rlpYellow,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 7, elevation: 3,
  },
  stampIconWrap: {
    width: 58, height: 58, borderRadius: 16, backgroundColor: Colors.rlpYellow,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stampContent: { flex: 1 },
  stampTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.onSurface, marginBottom: 4 },
  stampSubtitle: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 17, color: Colors.onSurfaceVariant },
  stampAction: {
    backgroundColor: Colors.rlpGreen, borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  stampActionText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.white },
});
