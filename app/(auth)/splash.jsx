import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { brandSplash } from '../../constants/brandAssets';
import { Colors } from '../../constants/colors';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../../services/api';
import { refreshToken as refreshSession } from '../../services/auth.service';
import { safeReplace } from '../../services/navigation';
import {
  checkPermissions,
  requestAllPermissions,
  showPermissionSettingsAlert,
} from '../../src/services/PermissionManager';

const { width, height } = Dimensions.get('window');

function BouncingDot({ delay }) {
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, { toValue: -8, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(400),
      ]),
    );
    bounce.start();
    return () => bounce.stop();
  }, [delay, translateY]);
  return <Animated.View style={[styles.dot, { transform: [{ translateY }] }]} />;
}

async function requestNotificationPermissionIfNeeded() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || !settings.canAskAgain && settings.status !== 'undetermined') {
    return settings;
  }

  if (settings.status === 'undetermined' || settings.canAskAgain) {
    return Notifications.requestPermissionsAsync();
  }

  return settings;
}

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      try {
        await requestNotificationPermissionIfNeeded();

        let permissionSnapshot = await checkPermissions();
        if (permissionSnapshot.status === 'needs_onboarding') {
          permissionSnapshot = await requestAllPermissions();
        }
        if (permissionSnapshot.status === 'denied') {
          showPermissionSettingsAlert();
        }

        const token = await getAccessToken();
        if (token) {
          safeReplace('/(tabs)');
          return;
        }

        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          try {
            const refreshResponse = await refreshSession(refreshToken);
            const newAccessToken =
              refreshResponse?.accessToken
              || refreshResponse?.data?.accessToken
              || refreshResponse?.data?.tokens?.accessToken;
            const nextRefreshToken =
              refreshResponse?.data?.tokens?.refreshToken
              || refreshToken;

            if (newAccessToken) {
              await setTokens(newAccessToken, nextRefreshToken);
              safeReplace('/(tabs)');
              return;
            }
          } catch (_error) {
            await clearTokens();
          }
        }

        safeReplace('/(auth)/login');
      } catch {
        safeReplace('/(auth)/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim]);

  return (
    <LinearGradient
      colors={['#FFD400', '#18833C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image source={brandSplash} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.appName}>RLP Digital</Text>
        <Text style={styles.tagline}>Jai Kisan, Jai Jawan.{'\n'}Together for a stronger Rajasthan.</Text>
      </Animated.View>

      <View style={styles.bottomSection}>
        <Text style={styles.poweredBy}>Powered by GenzTeck Solutions</Text>
        <View style={styles.dotsRow}>
          <BouncingDot delay={0} />
          <BouncingDot delay={150} />
          <BouncingDot delay={300} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 32 },
  logoImage: {
    width: Math.min(width * 0.7, 280),
    height: Math.min(height * 0.28, 220),
    marginBottom: 24,
  },
  appName: { fontSize: 32, fontWeight: '700', color: Colors.white, marginBottom: 12, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  bottomSection: { position: 'absolute', bottom: 48, alignItems: 'center' },
  poweredBy: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12, letterSpacing: 0.5 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },
});
