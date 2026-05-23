import React, { useState } from 'react';
import {
  RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../store/auth.store';
import { getMe } from '../../services/user.service';
import { getReels, downloadReel } from '../../services/reels.service';
import { getPadadhikari } from '../../services/padadhikari.service';
import { apiClient } from '../../services/api';
import { demoNotifications } from '../../services/mockData';

import TopAppBar from '../../components/home/TopAppBar';
import AlertBanner from '../../components/home/AlertBanner';
import IDCardPreview from '../../components/home/IDCardPreview';
import ReelsRow from '../../components/home/ReelsRow';
import FeatureGrid from '../../components/home/FeatureGrid';
import ReelViewer from '../../components/home/ReelViewer';

import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function HomeScreen() {
  const { user: storeUser } = useAuthStore();
  const [selectedReel, setSelectedReel] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    initialData: storeUser ?? undefined,
  });

  const { data: reels = [], refetch: refetchReels } = useQuery({
    queryKey: ['reels'],
    queryFn: getReels,
  });

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications');
        return res.data.data;
      } catch (error) {
        // TODO: Replace notification fallback with backend broadcast notifications.
        if (!error.response) return demoNotifications;
        throw error;
      }
    },
  });

  // Padadhikari for home screen horizontal scroll (Figma requirement)
  const { data: officials = [] } = useQuery({
    queryKey: ['padadhikari-home'],
    queryFn: () => getPadadhikari(),
  });

  const priorityNotification = notifications.find((n) => n.priority) ?? notifications[0] ?? null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchReels(), refetchNotifications()]);
    setRefreshing(false);
  };

  const handleReelPress = (reel) => {
    setSelectedReel(reel);
    setViewerVisible(true);
  };

  const handleDownload = async (reel) => {
    try { await downloadReel(reel); } catch (_e) {}
  };

  const handleNotificationPress = () => {
    if (priorityNotification) {
      router.push({ pathname: '/notification-detail', params: { id: priorityNotification.id } });
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopAppBar
        user={user}
        onNotificationPress={handleNotificationPress}
        onDigitalIdPress={() => router.push('/digital-id')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.rlpGreen}
            colors={[Colors.rlpGreen]}
          />
        }
      >
        {/* Alert banner */}
        <AlertBanner notification={priorityNotification} onPress={handleNotificationPress} />

        {/* ID Card preview */}
        <IDCardPreview user={user} onDownloadPress={() => router.push('/digital-id')} />

        {/* Reels / Humaare Kaam */}
        <View style={styles.section}>
          <ReelsRow reels={reels} onReelPress={handleReelPress} onViewAllPress={() => router.push('/(tabs)/status')} />
        </View>

        {/* ── Padadhikari Section (from Figma) ── */}
        {officials.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Padadhikari</Text>
              <Pressable onPress={() => router.push('/padadhikari')} accessibilityRole="button">
                <Text style={styles.viewAll}>View Hierarchy</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.padadhikariScroll}
            >
              {officials.slice(0, 5).map((official) => (
                <Pressable
                  key={official.id}
                  style={({ pressed }) => [styles.officialCard, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push({ pathname: '/padadhikari/[id]', params: { id: official.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={official.fullName}
                >
                  {official.photoUrl ? (
                    <Image source={{ uri: official.photoUrl }} style={styles.officialPhoto} resizeMode="cover" />
                  ) : (
                    <View style={[styles.officialPhoto, styles.officialPhotoPlaceholder]}>
                      <Text style={styles.officialInitial}>{official.fullName.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.officialInfo}>
                    <Text style={styles.officialName} numberOfLines={1}>{official.fullName}</Text>
                    <Text style={styles.officialDesignation} numberOfLines={1}>{official.designation}</Text>
                    <View style={styles.officialActions}>
                      <Text style={styles.officialActionIcon}>✓</Text>
                      <Text style={styles.officialActionIcon}>↗</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Features grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <FeatureGrid
            user={user}
            onPadadhikariPress={() => router.push('/padadhikari')}
            onTrainingPress={() => router.push('/training-videos')}
            onPosterPress={() => router.push('/(tabs)/poster-maker')}
            onStampPadPress={() =>
              user.stampPadAccess
                ? router.push('/stamp-pad')
                : router.push('/stamp-pad/access-restricted')
            }
          />
        </View>

        {/* Training Videos preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Training Videos</Text>
            <Pressable onPress={() => router.push('/training-videos')} accessibilityRole="button">
              <Text style={styles.viewAll}>View More</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trainingScroll}>
            {reels.slice(0, 2).map((reel) => (
              <Pressable
                key={reel.id}
                style={({ pressed }) => [styles.trainingCard, pressed && { opacity: 0.85 }]}
                onPress={() => handleReelPress(reel)}
                accessibilityRole="button"
              >
                {reel.mediaUrl ? (
                  <Image source={{ uri: reel.mediaUrl }} style={styles.trainingThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.trainingThumb, styles.trainingThumbFallback]}>
                    <Text style={styles.trainingThumbText}>RLP</Text>
                  </View>
                )}
                {reel.mediaType === 'video' && (
                  <View style={styles.trainingPlayOverlay}>
                    <View style={styles.trainingPlayCircle}>
                      <Text style={styles.trainingPlayIcon}>▶</Text>
                    </View>
                  </View>
                )}
                <View style={styles.trainingInfo}>
                  <Text style={styles.trainingCaption} numberOfLines={1}>{reel.caption}</Text>
                  <Text style={styles.trainingMeta}>Hindi</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Poster CTA matching Figma */}
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
                <Text style={styles.posterCtaBtnText}>Start Designing  🎨</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>

      <ReelViewer
        reel={selectedReel}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        onDownload={handleDownload}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.rlpGreen },
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
  viewAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.rlpGreen },
  // Padadhikari section
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
  officialActionIcon: { fontSize: 14, color: '#9ca3af' },
  // Training
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
  trainingPlayIcon: { fontSize: 16, color: Colors.rlpGreen },
  trainingInfo: { padding: 10 },
  trainingCaption: { fontFamily: FontFamily.semiBold, fontSize: 12, color: '#1a1a1a', marginBottom: 2 },
  trainingMeta: { fontSize: 10, color: '#9ca3af' },
  // Poster CTA
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
});
