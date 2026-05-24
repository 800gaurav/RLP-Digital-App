import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePermissions } from '../hooks/usePermissions';

const BENEFITS = [
  'Download posters directly to your gallery',
  'Save generated images without extra popups later',
  'Store reels and videos locally for sharing',
  'Keep generated content ready for sharing anytime',
];

export default function PermissionScreen() {
  const { loading, requestAllPermissions } = usePermissions();
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      const snapshot = await requestAllPermissions();
      if (snapshot.granted) {
        router.replace('/(auth)/splash');
        return;
      }

      router.replace('/permissions/recovery');
    } catch (error: any) {
      Alert.alert(
        'Permission request failed',
        error?.message || 'We could not complete the permission setup. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>One-time setup</Text>
          <Text style={styles.title}>Allow media access once, then save without interruptions.</Text>
          <Text style={styles.subtitle}>
            We ask for gallery access during onboarding so poster downloads, image saves, and video saves work smoothly later.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What this enables</Text>
          {BENEFITS.map((item) => (
            <View key={item} style={styles.benefitRow}>
              <View style={styles.bullet} />
              <Text style={styles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Why now?</Text>
          <Text style={styles.noteText}>
            Asking once at startup prevents repeated permission popups while users are downloading posters, images, or videos.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={handleContinue}
          disabled={loading || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#112013" size="small" />
            : <Text style={styles.primaryButtonText}>Allow Media Access</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4FAF5',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 18,
  },
  heroCard: {
    backgroundColor: '#0A6B2C',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#0A6B2C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 6,
  },
  eyebrow: {
    color: '#FFE27A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D6E8D7',
    gap: 14,
  },
  sectionTitle: {
    color: '#162117',
    fontSize: 18,
    fontWeight: '700',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 9,
    height: 9,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: '#F6D21A',
  },
  benefitText: {
    flex: 1,
    color: '#334236',
    fontSize: 15,
    lineHeight: 22,
  },
  noteCard: {
    backgroundColor: '#FFF7D8',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0D46E',
  },
  noteTitle: {
    color: '#362900',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  noteText: {
    color: '#5B4B13',
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6D21A',
    paddingHorizontal: 18,
  },
  primaryButtonPressed: {
    opacity: 0.88,
  },
  primaryButtonText: {
    color: '#172118',
    fontSize: 16,
    fontWeight: '800',
  },
});
