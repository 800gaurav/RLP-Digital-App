import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { consumePosterDownload, getTemplates, getSubscriptionStatus } from '../../services/poster.service';
import { useAuthStore } from '../../store/auth.store';
import PaywallModal from '../../components/poster/PaywallModal';
import TemplateGrid from '../../components/poster/TemplateGrid';
import PosterEditor from '../../components/poster/PosterEditor';
import { getApiErrorMessage, logApiError } from '../../services/api';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function PosterMakerScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: subscription, isLoading: loadingSubscription, refetch: refetchSubscription } = useQuery({ queryKey: ['subscription'], queryFn: getSubscriptionStatus });
  const { data: templates = [], isLoading: loadingTemplates, error: templatesError, refetch: refetchTemplates } = useQuery({
    queryKey: ['templates', selectedCategory],
    queryFn: () => getTemplates(selectedCategory === 'All' ? undefined : selectedCategory),
  });

  const isSubscribed = subscription?.active ?? false;
  const categories = subscription?.categories || [];

  useEffect(() => {
    if (!selectedCategory || selectedCategory === 'All') return;
    if (!categories.includes(selectedCategory)) setSelectedCategory('All');
  }, [categories, selectedCategory]);

  const handlePosterDownload = async (template) => {
    if (!isSubscribed) {
      setPaywallVisible(true);
      return false;
    }
    if ((subscription?.downloadsRemaining ?? 0) <= 0) {
      Alert.alert('Limit reached', 'Aapka monthly template download limit khatam ho gaya hai.');
      return false;
    }
    try {
      const usage = await consumePosterDownload(template.id);
      queryClient.setQueryData(['subscription'], (current) => current ? {
        ...current,
        downloadsUsed: usage.downloadsUsed,
        downloadsRemaining: usage.downloadsRemaining,
        monthlyDownloadLimit: usage.monthlyDownloadLimit,
      } : current);
      return true;
    } catch (error) {
      logApiError(error, 'Poster download consume failed');
      const code = error?.response?.data?.code;
      if (code === 'SUBSCRIPTION_REQUIRED') setPaywallVisible(true);
      else Alert.alert('Poster export blocked', getApiErrorMessage(error, 'Poster export abhi allow nahi hai.'));
      return false;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSubscription(), refetchTemplates()]);
    setRefreshing(false);
  };

  const handleTemplatePress = (template) => {
    setSelectedTemplate(template);
    setEditorVisible(true);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Poster Maker</Text>
      </View>

      <PaywallModal
        visible={paywallVisible}
        price={subscription?.price ?? 99}
        monthlyLimit={subscription?.monthlyDownloadLimit}
        onSubscribe={() => { setPaywallVisible(false); Alert.alert('Subscribe', 'Razorpay subscription flow coming soon.'); }}
        onClose={() => setPaywallVisible(false)}
      />

      {loadingTemplates || loadingSubscription ? (
        <ScrollView
          contentContainerStyle={styles.loadingState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.rlpGreen} colors={[Colors.rlpGreen]} />}
        >
          <ActivityIndicator color={Colors.rlpGreen} />
          <Text style={styles.loadingText}>Loading premium templates...</Text>
        </ScrollView>
      ) : templatesError ? (
        <ScrollView
          contentContainerStyle={styles.loadingState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.rlpGreen} colors={[Colors.rlpGreen]} />}
        >
          <Text style={styles.errorTitle}>Templates unavailable</Text>
          <Text style={styles.loadingText}>Check your internet or backend connection.</Text>
        </ScrollView>
      ) : (
        <TemplateGrid
          templates={templates}
          isSubscribed={isSubscribed}
          onTemplatePress={handleTemplatePress}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.rlpGreen} colors={[Colors.rlpGreen]} />}
        />
      )}

      {selectedTemplate && (
        <Modal visible={editorVisible} animationType="slide" onRequestClose={() => setEditorVisible(false)}>
          <SafeAreaView style={styles.editorSafeArea} edges={['top', 'bottom']}>
            <View style={styles.editorHeader}>
              <Pressable style={({ pressed }) => [styles.editorCloseBtn, pressed && { opacity: 0.6 }]} onPress={() => setEditorVisible(false)} accessibilityRole="button" accessibilityLabel="Close editor">
                <Text style={styles.editorCloseIcon}>✕</Text>
              </Pressable>
              <Text style={styles.editorTitle}>Edit Poster</Text>
              <View style={{ width: 36 }} />
            </View>
            <ScrollView contentContainerStyle={styles.editorContent} showsVerticalScrollIndicator={false}>
              <PosterEditor
                template={selectedTemplate}
                user={user}
                onClose={() => setEditorVisible(false)}
                onRequestDownload={handlePosterDownload}
                helperText={
                  isSubscribed
                    ? `${subscription?.downloadsRemaining ?? 0} of ${subscription?.monthlyDownloadLimit ?? 0} downloads remaining this month.`
                    : `Subscribe for ₹${subscription?.price ?? 99}/month to download or share posters.`
                }
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.onSurface },
  loadingState: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 10, textAlign: 'center' },
  errorTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.onSurface, marginBottom: 4 },
  editorSafeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  editorHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  editorCloseBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  editorCloseIcon: { fontSize: 18, color: Colors.onSurface },
  editorTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface, textAlign: 'center' },
  editorContent: { alignItems: 'center' },
});
