import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ViewShot from 'react-native-view-shot';
import { useAuthStore } from '../store/auth.store';
import { getFriendlyErrorMessage } from '../services/api';
import { getMe } from '../services/user.service';
import IDCard from '../components/digital-id/IDCard';
import AppBottomNav from '../components/navigation/AppBottomNav';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';
import { isPermissionDeniedError, showPermissionSettingsAlert } from '../src/services/PermissionManager';
import { saveImageToGallery } from '../src/utils/mediaSave';

export default function DigitalIdScreen() {
  const { action } = useLocalSearchParams();
  const { user: storeUser, setUser } = useAuthStore();
  const cardRef = useRef(null);
  const [working, setWorking] = useState('');
  const [routeActionHandled, setRouteActionHandled] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const currentUser = await getMe();
      setUser(currentUser);
      return currentUser;
    },
    initialData: storeUser ?? undefined,
  });

  if (!user) return null;

  async function captureCard() {
    if (!cardRef.current?.capture) throw new Error('ID card preview is not ready yet. Please try again.');

    // Capture the rendered card as a PNG image before share/download.
    return cardRef.current.capture();
  }

  async function persistCapturedCard() {
    const capturedUri = await captureCard();
    const targetUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}RLP-ID-${user.voterId || user.id}-${Date.now()}.png`;
    await FileSystem.copyAsync({ from: capturedUri, to: targetUri });
    return targetUri;
  }

  async function downloadCard() {
    setWorking('download');
    try {
      const uri = await persistCapturedCard();
      const filename = `RLP-ID-${user.voterId || user.id}-${Date.now()}`;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `${filename}.png`;
        link.click();
        return;
      }

      await saveImageToGallery(uri, { fileName: `${filename}.png` });
      Alert.alert('Downloaded', 'ID card image saved to gallery.');
    } catch (error) {
      console.error('ID card download failed', error);
      if (isPermissionDeniedError(error)) {
        showPermissionSettingsAlert();
        return;
      }
      Alert.alert('Download failed', getFriendlyErrorMessage(error, 'ID card download nahi ho paaya.'));
    } finally {
      setWorking('');
    }
  }

  async function shareCard() {
    setWorking('share');
    try {
      const uri = await persistCapturedCard();
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing unavailable', 'Is device par sharing abhi available nahi hai.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Digital ID Card',
        UTI: 'public.png',
      });
    } catch (error) {
      console.error('ID card share failed', error);
      Alert.alert('Share failed', getFriendlyErrorMessage(error, 'ID card share nahi ho paaya.'));
    } finally {
      setWorking('');
    }
  }

  useEffect(() => {
    if (!user || routeActionHandled || working) return;
    if (action !== 'download' && action !== 'share') return;

    const timer = setTimeout(() => {
      setRouteActionHandled(true);
      if (action === 'download') downloadCard();
      if (action === 'share') shareCard();
    }, 350);

    return () => clearTimeout(timer);
  }, [action, routeActionHandled, user, working]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Digital ID Card</Text>
        <Text style={styles.headerRight}>RLP Digital</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ViewShot
          ref={cardRef}
          style={styles.cardCapture}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        >
          <IDCard user={user} />
        </ViewShot>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.downloadButton, pressed && { opacity: 0.85 }]}
            onPress={downloadCard}
            disabled={!!working}
          >
            {working === 'download'
              ? <ActivityIndicator color={Colors.onSurface} size="small" />
              : <Text style={styles.actionButtonText}>Download</Text>}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.shareButton, pressed && { opacity: 0.85 }]}
            onPress={shareCard}
            disabled={!!working}
          >
            {working === 'share'
              ? <ActivityIndicator color={Colors.rlpGreen} size="small" />
              : <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share Card</Text>}
          </Pressable>
        </View>
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.rlpGreenDark, backgroundColor: Colors.background },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  headerTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.white, textAlign: 'center' },
  headerRight: { fontFamily: FontFamily.black, fontSize: 12, color: Colors.white, width: 78, textAlign: 'right' },
  scrollContent: { padding: 20, paddingBottom: 28, alignItems: 'center' },
  cardCapture: { width: '100%', maxWidth: 360, marginTop: 8, marginBottom: 30, backgroundColor: Colors.transparent },
  actions: { width: '100%', maxWidth: 360, flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  downloadButton: { backgroundColor: Colors.rlpYellow },
  shareButton: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.rlpGreen },
  actionButtonText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.onSurface, textAlign: 'center' },
  shareButtonText: { color: Colors.rlpGreen },
});
