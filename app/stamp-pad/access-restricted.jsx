import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppBottomNav from '../../components/navigation/AppBottomNav';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function AccessRestrictedScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.message}>
          Aapko Stamp Pad access nahi hai.{'\n'}Admin se sampark karein.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.goBackBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </Pressable>
      </View>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.rlpGreen },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  lockIcon: { fontSize: 72, marginBottom: 8 },
  title: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white, textAlign: 'center' },
  message: { fontFamily: FontFamily.regular, fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  goBackBtn: { backgroundColor: Colors.rlpYellow, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  goBackText: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.onSurface },
});
