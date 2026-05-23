import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/auth.store';
import { updateMe, updatePhoto } from '../../services/user.service';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Please allow photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      try { const updated = await updatePhoto(result.assets[0].uri); setUser(updated); }
      catch (_e) { Alert.alert('Error', 'Could not update photo. Please try again.'); }
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Name cannot be empty.'); return; }
    setSavingProfile(true);
    try { const updated = await updateMe({ fullName: name, email }); setUser(updated); Alert.alert('Saved', 'Profile updated successfully.'); }
    catch (_e) { Alert.alert('Error', 'Could not update profile. Please try again.'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('Validation', 'Please fill all password fields.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Validation', 'New passwords do not match.'); return; }
    if (newPassword.length < 8) { Alert.alert('Validation', 'Password must be at least 8 characters.'); return; }
    setSavingPassword(true);
    try { await updateMe({ password: newPassword }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); Alert.alert('Success', 'Password changed successfully.'); }
    catch (_e) { Alert.alert('Error', 'Could not change password. Please try again.'); }
    finally { setSavingPassword(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { setLoggingOut(true); await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const isSubscribed = user.subscriptionStatus === 'active' || user.subscription?.active;
  const canAccessAdmin = user.role === 'admin' || user.isAdmin || user.email?.endsWith('@rlpdigital.in');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>Profile</Text></View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <Pressable style={({ pressed }) => [styles.avatarWrapper, pressed && { opacity: 0.8 }]} onPress={handlePickPhoto} accessibilityRole="button" accessibilityLabel="Change profile photo">
            {user.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{user.fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.editPhotoOverlay}><Text style={styles.editPhotoIcon}>+</Text></View>
          </Pressable>
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={[styles.subBadge, isSubscribed ? styles.subBadgeActive : styles.subBadgeInactive]}>
            <Text style={[styles.subBadgeText, isSubscribed ? styles.subBadgeTextActive : styles.subBadgeTextInactive]}>
              {isSubscribed ? 'Active Subscription' : 'No Subscription'}
            </Text>
          </View>
        </View>

        {canAccessAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin</Text>
            <Pressable style={({ pressed }) => [styles.adminCard, pressed && { opacity: 0.85 }]} onPress={() => router.push('/admin')} accessibilityRole="button">
              <View>
                <Text style={styles.adminTitle}>Open Mobile Admin Panel</Text>
                <Text style={styles.adminSubtitle}>Users, permissions, broadcasts, uploads, officials, and pricing</Text>
              </View>
              <Text style={styles.adminArrow}>›</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <View style={styles.card}>
            {[{ label: 'Full Name', value: name, onChange: setName, placeholder: 'Enter your name' },
              { label: 'Email', value: email, onChange: setEmail, placeholder: 'Enter your email', keyboardType: 'email-address', autoCapitalize: 'none' }
            ].map(({ label, value, onChange, ...props }) => (
              <View key={label} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput style={styles.input} value={value} onChangeText={onChange} placeholderTextColor={Colors.onSurfaceVariant} accessibilityLabel={label} {...props} />
              </View>
            ))}
            <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]} onPress={handleSaveProfile} disabled={savingProfile} accessibilityRole="button">
              {savingProfile ? <ActivityIndicator color={Colors.onSurface} size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <View style={styles.card}>
            {[{ label: 'Current Password', value: currentPassword, onChange: setCurrentPassword },
              { label: 'New Password', value: newPassword, onChange: setNewPassword },
              { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword }
            ].map(({ label, value, onChange }) => (
              <View key={label} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor={Colors.onSurfaceVariant} secureTextEntry accessibilityLabel={label} />
              </View>
            ))}
            <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]} onPress={handleChangePassword} disabled={savingPassword} accessibilityRole="button">
              {savingPassword ? <ActivityIndicator color={Colors.onSurface} size="small" /> : <Text style={styles.saveBtnText}>Change Password</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]} onPress={handleLogout} disabled={loggingOut} accessibilityRole="button" accessibilityLabel="Logout">
            {loggingOut ? <ActivityIndicator color={Colors.error} size="small" /> : <Text style={styles.logoutBtnText}>Logout</Text>}
          </Pressable>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.rlpGreen },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.rlpGreenDark, backgroundColor: Colors.rlpGreen },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  scrollContent: { paddingBottom: 120 },
  avatarSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.rlpYellow },
  avatarPlaceholder: { backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.bold, fontSize: 32, color: Colors.white },
  editPhotoOverlay: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.rlpYellow, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  editPhotoIcon: { fontSize: 12 },
  userName: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.onSurface, marginBottom: 4 },
  userEmail: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: 12 },
  subBadge: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 14 },
  subBadgeActive: { backgroundColor: Colors.secondaryContainer },
  subBadgeInactive: { backgroundColor: Colors.surfaceContainerHigh },
  subBadgeText: { fontFamily: FontFamily.semiBold, fontSize: 12 },
  subBadgeTextActive: { color: Colors.rlpGreen },
  subBadgeTextInactive: { color: Colors.onSurfaceVariant },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.white, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.onSurfaceVariant },
  input: { backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface },
  saveBtn: { backgroundColor: Colors.rlpYellow, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.onSurface },
  logoutBtn: { borderWidth: 1.5, borderColor: Colors.error, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.error },
  adminCard: { backgroundColor: Colors.rlpGreen, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adminTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.white, marginBottom: 4 },
  adminSubtitle: { fontFamily: FontFamily.regular, fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 17, maxWidth: 260 },
  adminArrow: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.rlpYellow },
});
