import React, { useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { demoNotifications } from '../services/mockData';
import { normalizeMediaItem } from '../services/media';
import AppBottomNav from '../components/navigation/AppBottomNav';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';

async function getNotifications() {
  try {
    const res = await apiClient.get('/notifications');
    return res.data.data.map(normalizeMediaItem);
  } catch (error) {
    if (!error.response) return demoNotifications;
    throw error;
  }
}

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: notifications = [], refetch } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.rlpGreen} colors={[Colors.rlpGreen]} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => router.push({ pathname: '/notification-detail', params: { id: item.id } })}
            accessibilityRole="button"
          >
            {item.thumbnailUrl || item.imageUrl || item.mediaUrl ? <Image source={{ uri: item.thumbnailUrl || item.imageUrl || item.mediaUrl }} style={styles.media} resizeMode="cover" /> : null}
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                {item.priority ? <View style={styles.priorityDot} /> : null}
              </View>
              <Text style={styles.body} numberOfLines={2}>{item.body || item.message}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.rlpGreen} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={44} color={Colors.outline} />
            <Text style={styles.emptyText}>Abhi koi notification nahi hai</Text>
          </View>
        }
      />
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface },
  listContent: { padding: 16, paddingBottom: 28, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, borderColor: Colors.outlineVariant },
  media: { width: 58, height: 58, borderRadius: 8, backgroundColor: Colors.surfaceContainerHigh },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface },
  priorityDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.rlpRed },
  body: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 17, marginTop: 3 },
  emptyState: { alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
});
