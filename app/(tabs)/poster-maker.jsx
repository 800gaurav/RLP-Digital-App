import React, { useState } from 'react';
import { Alert, ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getTemplates, getSubscriptionStatus } from '../../services/poster.service';
import { useAuthStore } from '../../store/auth.store';
import PaywallModal from '../../components/poster/PaywallModal';
import TemplateGrid from '../../components/poster/TemplateGrid';
import PosterEditor from '../../components/poster/PosterEditor';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function PosterMakerScreen() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const { data: subscription, isLoading: loadingSubscription } = useQuery({ queryKey: ['subscription'], queryFn: getSubscriptionStatus });
  const { data: templates = [], isLoading: loadingTemplates, error: templatesError } = useQuery({
    queryKey: ['templates', selectedCategory],
    queryFn: () => getTemplates(selectedCategory === 'All' ? undefined : selectedCategory),
  });

  const isSubscribed = subscription?.active ?? false;

  const handleTemplatePress = (template) => {
    if (template.isPremium && !isSubscribed) {
      setPaywallVisible(true);
      return;
    }
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
        price={99}
        onSubscribe={() => { setPaywallVisible(false); Alert.alert('Subscribe', 'Razorpay subscription flow coming soon.'); }}
        onClose={() => setPaywallVisible(false)}
      />

      {loadingTemplates || loadingSubscription ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.rlpGreen} />
          <Text style={styles.loadingText}>Loading premium templates...</Text>
        </View>
      ) : templatesError ? (
        <View style={styles.loadingState}>
          <Text style={styles.errorTitle}>Templates unavailable</Text>
          <Text style={styles.loadingText}>Check your internet or backend connection.</Text>
        </View>
      ) : (
        <TemplateGrid
          templates={templates}
          isSubscribed={isSubscribed}
          onTemplatePress={handleTemplatePress}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
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
              <PosterEditor template={selectedTemplate} user={user} onClose={() => setEditorVisible(false)} />
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
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 10, textAlign: 'center' },
  errorTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.onSurface, marginBottom: 4 },
  editorSafeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  editorHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  editorCloseBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  editorCloseIcon: { fontSize: 18, color: Colors.onSurface },
  editorTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface, textAlign: 'center' },
  editorContent: { alignItems: 'center' },
});
