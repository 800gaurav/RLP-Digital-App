import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import Button from '../components/ui/Button';
import AppBottomNav from '../components/navigation/AppBottomNav';
import { normalizeMediaItem } from '../services/media';
import { demoNotifications } from '../services/mockData';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications');
        return res.data.data.map(normalizeMediaItem);
      } catch (error) {
        if (!error.response) return demoNotifications;
        throw error;
      }
    },
  });

  const notification = notifications.find((n) => String(n.id) === String(id));
  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const Header = () => (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backIcon}>←</Text>
      </Pressable>
      <Text style={styles.headerTitle}>Notification</Text>
      <View style={{ width: 36 }} />
    </View>
  );

  if (!notification) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header />
        <View style={styles.notFound}><Text style={styles.notFoundText}>Notification not found</Text></View>
        <AppBottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notification.priority && (
          <View style={styles.priorityBadge}><Text style={styles.priorityText}>📢 Priority Alert</Text></View>
        )}
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.date}>{formatDate(notification.createdAt)}</Text>
        {notification.mediaUrl && (
          <Image source={{ uri: notification.mediaUrl }} style={styles.media} resizeMode="cover" accessibilityLabel="Notification image" />
        )}
        <Text style={styles.body}>{notification.body || notification.message}</Text>
        <View style={styles.backHomeContainer}>
          <Button variant="primary" title="Back to Home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.onSurface },
  headerTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface, textAlign: 'center' },
  scrollContent: { padding: 20, paddingBottom: 28 },
  priorityBadge: { alignSelf: 'flex-start', backgroundColor: Colors.secondaryContainer, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 14 },
  priorityText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.rlpGreen },
  title: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.onSurface, lineHeight: 30, marginBottom: 8 },
  date: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 20 },
  media: { width: '100%', height: 220, borderRadius: 12, marginBottom: 20 },
  body: { fontFamily: FontFamily.regular, fontSize: 16, color: Colors.onSurface, lineHeight: 26, marginBottom: 32 },
  backHomeContainer: { marginTop: 8 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: FontFamily.regular, fontSize: 16, color: Colors.onSurfaceVariant },
});
