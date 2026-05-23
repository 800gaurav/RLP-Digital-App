import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getAccessToken } from '../../services/api';

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

function BottleLogo() {
  return (
    <View style={styles.bottleContainer}>
      <View style={styles.bottleNeck} />
      <View style={styles.bottleBody}>
        <Text style={styles.verifiedIcon}>✓</Text>
      </View>
    </View>
  );
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
        const token = await getAccessToken();
        if (token) router.replace('/(tabs)');
        else router.replace('/(auth)/login');
      } catch {
        router.replace('/(auth)/login');
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
        <View style={styles.glassCard}>
          <BottleLogo />
        </View>
        <Text style={styles.appName}>RLP Digital</Text>
        <Text style={styles.tagline}>Jai Kisan, Jai Jawan.{'\n'}Together for a stronger Rajasthan.</Text>
      </Animated.View>

      <View style={styles.bottomSection}>
        <Text style={styles.poweredBy}>Powered by Onetap</Text>
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
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  bottleContainer: { alignItems: 'center' },
  bottleNeck: {
    width: 32, height: 40, backgroundColor: Colors.white,
    borderTopLeftRadius: 8, borderTopRightRadius: 8, marginBottom: -2,
  },
  bottleBody: {
    width: 64, height: 112, backgroundColor: Colors.white,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  verifiedIcon: { fontSize: 32, color: Colors.rlpGreen, fontWeight: '900' },
  appName: { fontSize: 32, fontWeight: '700', color: Colors.white, marginBottom: 12, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  bottomSection: { position: 'absolute', bottom: 48, alignItems: 'center' },
  poweredBy: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12, letterSpacing: 0.5 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },
});
