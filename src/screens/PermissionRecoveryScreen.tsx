import React, { useEffect, useState } from 'react';
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
import { openAppSettings } from '../services/PermissionManager';

export default function PermissionRecoveryScreen() {
  const { checkPermissions, loading, permissions } = usePermissions();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (permissions?.granted) {
      router.replace('/(auth)/splash');
    }
  }, [permissions]);

  const handleOpenSettings = async () => {
    try {
      await openAppSettings();
    } catch (error: any) {
      Alert.alert(
        'Unable to open settings',
        error?.message || 'Please open device settings manually and allow media access.',
      );
    }
  };

  const handleRecheck = async () => {
    setChecking(true);
    try {
      const snapshot = await checkPermissions();
      if (snapshot.granted) {
        router.replace('/(auth)/splash');
        return;
      }

      Alert.alert(
        'Permission still disabled',
        'Please enable Photos and Videos access from your device settings to continue saving content.',
      );
    } catch (error: any) {
      Alert.alert('Check failed', error?.message || 'Could not refresh the permission status.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Permission required</Text>
          <Text style={styles.title}>Media access was turned off.</Text>
          <Text style={styles.subtitle}>
            Downloads are paused until gallery permission is restored in device settings.
          </Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>To fix this</Text>
          <Text style={styles.instructionsText}>1. Open your device settings.</Text>
          <Text style={styles.instructionsText}>2. Find RLP Digital.</Text>
          <Text style={styles.instructionsText}>3. Allow Photos and Videos access.</Text>
          <Text style={styles.instructionsText}>4. Come back and tap Check Again.</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
          onPress={handleOpenSettings}
          disabled={loading}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
          onPress={handleRecheck}
          disabled={loading || checking}
        >
          {(loading || checking)
            ? <ActivityIndicator color="#0A6B2C" size="small" />
            : <Text style={styles.secondaryButtonText}>Check Again</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 18,
  },
  hero: {
    backgroundColor: '#8D1F1F',
    borderRadius: 28,
    padding: 24,
  },
  eyebrow: {
    color: '#FFD4D4',
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
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0D5D5',
    gap: 8,
  },
  instructionsTitle: {
    color: '#221515',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  instructionsText: {
    color: '#4B3737',
    fontSize: 15,
    lineHeight: 22,
  },
  settingsButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6D21A',
    paddingHorizontal: 18,
  },
  settingsButtonPressed: {
    opacity: 0.88,
  },
  settingsButtonText: {
    color: '#172118',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0A6B2C',
    paddingHorizontal: 18,
  },
  secondaryButtonPressed: {
    opacity: 0.88,
  },
  secondaryButtonText: {
    color: '#0A6B2C',
    fontSize: 16,
    fontWeight: '700',
  },
});
