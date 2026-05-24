import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { login } from '../../services/auth.service';
import { setTokens } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

function BottleLogoSmall() {
  return (
    <View style={styles.logoCircle}>
      <View style={styles.miniNeck} />
      <View style={styles.miniBody}>
        <Ionicons name="checkmark" size={18} color={Colors.white} />
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsSubmitting(true);
    setLoading(true);
    try {
      const response = await login(email.trim().toLowerCase(), password);
      await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      queryClient.clear();
      queryClient.setQueryData(['me'], response.user);
      setUser(response.user);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error?.response?.data?.message ?? 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo header */}
          <View style={styles.header}>
            <BottleLogoSmall />
            <Text style={styles.title}>RLP Digital</Text>
            <Text style={styles.subtitle}>Rashtriya Loktantrik Party member app</Text>
          </View>

          {/* White card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Login</Text>
            <Text style={styles.cardSubtitle}>Apne account mein login karein</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={Colors.rlpGreen} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="member@example.com"
                  placeholderTextColor={Colors.outline}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.rlpGreen} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  placeholderTextColor={Colors.outline}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
                  secureTextEntry={!showPassword}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.outline} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity style={styles.forgotContainer} onPress={() => {}}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting
                ? <ActivityIndicator color={Colors.onSurface} size="small" />
                : <Text style={styles.loginButtonText}>Login</Text>}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
              <Text style={styles.registerText}>
                Naye member hain?{' '}
                <Text style={styles.registerTextBold}>Register karein</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Trust badges matching Figma */}
          <View style={styles.trustRow}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.rlpYellow} />
              <Text style={styles.trustText}>Secure Login</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="id-card" size={18} color={Colors.rlpYellow} />
              <Text style={styles.trustText}>Digital ID Ready</Text>
            </View>
          </View>

          <Text style={styles.footer}>Rashtriya Loktantrik Party</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.rlpGreen },
  blurOrb: { position: 'absolute', backgroundColor: 'rgba(255,212,0,0.1)' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  header: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.rlpYellow, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  miniNeck: { width: 16, height: 20, backgroundColor: Colors.rlpGreen, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginBottom: -1 },
  miniBody: { width: 32, height: 44, backgroundColor: Colors.rlpGreen, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  miniCheck: { color: Colors.white, fontSize: 16, fontWeight: '900' },
  title: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.white, marginBottom: 4 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(255,255,255,0.84)' },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(208,198,171,0.3)',
  },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: 20, color: Colors.onSurface, marginBottom: 4 },
  cardSubtitle: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: Colors.outlineVariant, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: Colors.surfaceContainerLow,
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface, padding: 0 },
  errorText: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.error, marginTop: 4 },
  forgotContainer: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.rlpGreen },
  loginButton: {
    backgroundColor: Colors.rlpYellow, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: '#FFD400', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  loginButtonText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.onSurface },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.outlineVariant },
  dividerText: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.outline, marginHorizontal: 12 },
  registerLink: { alignItems: 'center' },
  registerText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
  registerTextBold: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
  trustRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  trustBadge: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8,
    padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  trustText: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.white, flex: 1 },
  footer: { fontFamily: FontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.78)', textAlign: 'center', marginTop: 16 },
});
