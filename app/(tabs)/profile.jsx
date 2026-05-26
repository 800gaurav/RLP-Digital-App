import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { removePhoto, updateMe, updatePhoto } from '../../services/user.service';
import { getFriendlyApiErrorMessage } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import SearchableDistrictSelect from '../../components/ui/SearchableDistrictSelect';
import { Colors } from '../../constants/colors';
import { isValidRajasthanDistrict } from '../../constants/rajasthanDistricts';
import { FontFamily } from '../../constants/typography';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

function formatIsoDate(date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime())
    || parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName ?? '',
    mobileNumber: user?.mobileNumber ?? '',
    voterId: user?.voterId ?? '',
    dob: user?.dob ? String(user.dob).slice(0, 10) : '',
    gender: user?.gender ?? '',
    address: user?.address ?? '',
    state: 'Rajasthan',
    district: user?.district ?? '',
    city: user?.city ?? '',
    pincode: user?.pincode ?? '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  if (!user) return null;

  const selectedDob = parseIsoDate(profileForm.dob) || new Date(2000, 0, 1);
  const maxDob = new Date();

  const handlePickPhoto = async () => {
    setShowPhotoMenu((prev) => !prev);
  };

  const saveProfilePhoto = async (uri) => {
    setSavingPhoto(true);
    try {
      const updated = await updatePhoto(uri);
      setUser(updated);
      queryClient.setQueryData(['me'], updated);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      setShowPhotoMenu(false);
    }
    catch (error) { Alert.alert('Photo update failed', getFriendlyApiErrorMessage(error, 'Photo update nahi ho paayi. Internet check karke dobara try karein.')); }
    finally { setSavingPhoto(false); }
  };

  const updatePhotoFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Photo lene ke liye camera permission allow kijiye.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) await saveProfilePhoto(result.assets[0].uri);
  };

  const updatePhotoFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Photo choose karne ke liye gallery permission allow kijiye.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) await saveProfilePhoto(result.assets[0].uri);
  };

  const handleRemovePhoto = async () => {
    if (!user.profilePhoto) return;
    setSavingPhoto(true);
    try {
      const updated = await removePhoto();
      setUser(updated);
      queryClient.setQueryData(['me'], updated);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      setShowPhotoMenu(false);
    }
    catch (error) { Alert.alert('Photo remove failed', getFriendlyApiErrorMessage(error, 'Photo remove nahi ho paayi. Internet check karke dobara try karein.')); }
    finally { setSavingPhoto(false); }
  };

  const updateProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDobChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (!selectedDate) return;
    updateProfileField('dob', formatIsoDate(selectedDate));
  };

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim()) { Alert.alert('Validation', 'Name blank nahi ho sakta.'); return; }
    if (!profileForm.mobileNumber.trim()) { Alert.alert('Validation', 'Mobile number required hai.'); return; }
    if (!/^\d{10}$/.test(profileForm.mobileNumber.trim())) { Alert.alert('Validation', 'Mobile number 10 digits ka hona chahiye.'); return; }
    if (profileForm.dob && !parseIsoDate(profileForm.dob)) { Alert.alert('Validation', 'Date of birth calendar se select kijiye.'); return; }
    if (profileForm.gender && !GENDER_OPTIONS.includes(profileForm.gender)) { Alert.alert('Validation', 'Gender list me se select kijiye.'); return; }
    if (!isValidRajasthanDistrict(profileForm.district)) { Alert.alert('Validation', 'District list me se valid Rajasthan district select kijiye.'); return; }
    if (profileForm.pincode && !/^\d{6}$/.test(profileForm.pincode.trim())) { Alert.alert('Validation', 'Pincode 6 digits ka hona chahiye.'); return; }
    setSavingProfile(true);
    try {
      const updated = await updateMe({
        fullName: profileForm.fullName.trim(),
        mobileNumber: profileForm.mobileNumber.trim(),
        dob: profileForm.dob || undefined,
        gender: profileForm.gender.trim() || undefined,
        address: profileForm.address.trim(),
        state: 'Rajasthan',
        district: profileForm.district.trim(),
        city: profileForm.city.trim(),
        pincode: profileForm.pincode.trim(),
      });
      setUser(updated);
      queryClient.setQueryData(['me'], updated);
      setProfileForm({
        fullName: updated?.fullName ?? '',
        mobileNumber: updated?.mobileNumber ?? '',
        voterId: updated?.voterId ?? profileForm.voterId,
        dob: updated?.dob ? String(updated.dob).slice(0, 10) : '',
        gender: updated?.gender ?? '',
        address: updated?.address ?? '',
        state: 'Rajasthan',
        district: updated?.district ?? '',
        city: updated?.city ?? '',
        pincode: updated?.pincode ?? '',
      });
      Alert.alert('Saved', 'Profile update ho gaya.');
    }
    catch (error) { Alert.alert('Profile update failed', getFriendlyApiErrorMessage(error, 'Profile update nahi ho paaya. Details check karke dobara try karein.')); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('Validation', 'Saare password fields fill kijiye.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Validation', 'New password aur confirm password match nahi kar rahe.'); return; }
    if (newPassword.length < 8) { Alert.alert('Validation', 'Password kam se kam 8 characters ka hona chahiye.'); return; }
    setSavingPassword(true);
    try { await updateMe({ password: newPassword }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); Alert.alert('Success', 'Password change ho gaya.'); }
    catch (error) { Alert.alert('Password change failed', getFriendlyApiErrorMessage(error, 'Password change nahi ho paaya. Details check karke dobara try karein.')); }
    finally { setSavingPassword(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { setLoggingOut(true); await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const canAccessAdmin =
    user.role === 'admin'
    || user.isAdmin
    || user.email === 'admin@rlp.com';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>Profile</Text></View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowPhotoMenu(false)}
      >
        <View style={styles.avatarSection}>
          {showPhotoMenu ? (
            <Pressable style={styles.photoDismissArea} onPress={() => setShowPhotoMenu(false)} />
          ) : null}
          <Pressable style={({ pressed }) => [styles.avatarWrapper, pressed && { opacity: 0.8 }]} onPress={handlePickPhoto} accessibilityRole="button" accessibilityLabel="Change profile photo">
            <Avatar uri={user.profilePhoto} name={user.fullName} size={80} borderColor={Colors.rlpYellow} />
            <View style={styles.editPhotoOverlay}><Text style={styles.editPhotoIcon}>+</Text></View>
            {savingPhoto ? (
              <View style={styles.photoLoadingOverlay}>
                <ActivityIndicator color={Colors.rlpGreen} size="small" />
              </View>
            ) : null}
          </Pressable>
          {showPhotoMenu ? (
            <View style={styles.photoMenu}>
              <Pressable style={({ pressed }) => [styles.photoMenuItem, pressed && { opacity: 0.82 }]} onPress={updatePhotoFromCamera} disabled={savingPhoto}>
                <View style={styles.photoMenuIcon}>
                  <Ionicons name="camera-outline" size={19} color={Colors.rlpGreen} />
                </View>
                <Text style={styles.photoMenuText}>Open Camera</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.photoMenuItem, pressed && { opacity: 0.82 }]} onPress={updatePhotoFromGallery} disabled={savingPhoto}>
                <View style={styles.photoMenuIcon}>
                  <Ionicons name="image-outline" size={19} color={Colors.rlpGreen} />
                </View>
                <Text style={styles.photoMenuText}>Choose Gallery</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.photoMenuItem,
                  styles.photoMenuItemLast,
                  !user.profilePhoto && styles.photoMenuItemDisabled,
                  pressed && user.profilePhoto && { opacity: 0.82 },
                ]}
                onPress={handleRemovePhoto}
                disabled={!user.profilePhoto || savingPhoto}
              >
                <View style={[styles.photoMenuIcon, styles.photoMenuIconDanger]}>
                  <Ionicons name="trash-outline" size={19} color={Colors.error} />
                </View>
                <Text style={[styles.photoMenuText, styles.photoMenuTextDanger]}>Remove Photo</Text>
              </Pressable>
            </View>
          ) : null}
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userEmail}>{user.mobileNumber || 'Mobile number not added'}</Text>
          <View style={styles.userMetaRow}>
            <View style={styles.userMetaPill}>
              <Text style={styles.userMetaLabel}>User ID</Text>
              <Text style={styles.userMetaValue}>{user.voterId}</Text>
            </View>
            {!!user.city && (
              <View style={styles.userMetaPill}>
                <Text style={styles.userMetaLabel}>City</Text>
                <Text style={styles.userMetaValue}>{user.city}</Text>
              </View>
            )}
          </View>
        </View>

        {canAccessAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin</Text>
            <Pressable style={({ pressed }) => [styles.adminCard, pressed && { opacity: 0.85 }]} onPress={() => router.push('/admin')} accessibilityRole="button">
              <View>
                <Text style={styles.adminTitle}>Open Admin Panel</Text>
                <Text style={styles.adminSubtitle}>Users, permissions, broadcasts, uploads, officials, and pricing</Text>
              </View>
              <Text style={styles.adminArrow}>›</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.card}>
            {[
              { label: 'Full Name', value: profileForm.fullName, onChange: (value) => updateProfileField('fullName', value), placeholder: 'Enter your full name' },
              { label: 'Mobile Number', value: profileForm.mobileNumber, onChange: (value) => updateProfileField('mobileNumber', value.replace(/[^0-9]/g, '')), placeholder: '10-digit mobile number', keyboardType: 'phone-pad' },
              { label: 'User ID (Voter ID)', value: profileForm.voterId, onChange: () => {}, placeholder: 'Voter ID', editable: false },
              { label: 'Address', value: profileForm.address, onChange: (value) => updateProfileField('address', value), placeholder: 'Enter your address', multiline: true },
              { label: 'City', value: profileForm.city, onChange: (value) => updateProfileField('city', value), placeholder: 'Enter your city' },
              { label: 'Pincode', value: profileForm.pincode, onChange: (value) => updateProfileField('pincode', value.replace(/[^0-9]/g, '')), placeholder: '6-digit pincode', keyboardType: 'number-pad' },
            ].map(({ label, value, onChange, multiline, editable = true, ...props }) => (
              <View key={label} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
                  value={value}
                  onChangeText={onChange}
                  multiline={multiline}
                  editable={editable}
                  placeholderTextColor={Colors.onSurfaceVariant}
                  accessibilityLabel={label}
                  {...props}
                />
              </View>
            ))}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <Pressable
                style={({ pressed }) => [styles.selectInput, pressed && { opacity: 0.85 }]}
                onPress={() => setShowDobPicker((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Select date of birth"
              >
                <Text style={[styles.selectInputText, !profileForm.dob && styles.placeholderText]}>
                  {profileForm.dob || 'Select date of birth'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.onSurfaceVariant} />
              </Pressable>
              {showDobPicker ? (
                <View style={styles.datePickerCard}>
                  <DateTimePicker
                    value={selectedDob}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={maxDob}
                    onChange={handleDobChange}
                  />
                  {Platform.OS === 'ios' ? (
                    <Pressable style={styles.datePickerDoneButton} onPress={() => setShowDobPicker(false)}>
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <Pressable
                style={({ pressed }) => [styles.selectInput, pressed && { opacity: 0.85 }]}
                onPress={() => setShowGenderPicker((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Select gender"
              >
                <Text style={[styles.selectInputText, !profileForm.gender && styles.placeholderText]}>
                  {profileForm.gender || 'Select gender'}
                </Text>
                <Ionicons name={showGenderPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.onSurfaceVariant} />
              </Pressable>
              {showGenderPicker ? (
                <View style={styles.dropdownList}>
                  {GENDER_OPTIONS.map((gender) => (
                    <Pressable
                      key={gender}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        profileForm.gender === gender && styles.dropdownItemSelected,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => {
                        updateProfileField('gender', gender);
                        setShowGenderPicker(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, profileForm.gender === gender && styles.dropdownItemTextSelected]}>{gender}</Text>
                      {profileForm.gender === gender ? <Ionicons name="checkmark" size={18} color={Colors.rlpGreen} /> : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>State</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profileForm.state}
                editable={false}
                placeholderTextColor={Colors.onSurfaceVariant}
                accessibilityLabel="State"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>District</Text>
              <SearchableDistrictSelect
                value={profileForm.district}
                onSelect={(value) => updateProfileField('district', value)}
                placeholder="Search and choose Rajasthan district"
              />
            </View>
            <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]} onPress={handleSaveProfile} disabled={savingProfile} accessibilityRole="button">
              {savingProfile ? <ActivityIndicator color={Colors.onSurface} size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <View style={styles.card}>
            {[{ label: 'Current Password', value: currentPassword, onChange: setCurrentPassword, visible: showCurrentPassword, toggle: () => setShowCurrentPassword((prev) => !prev) },
              { label: 'New Password', value: newPassword, onChange: setNewPassword, visible: showNewPassword, toggle: () => setShowNewPassword((prev) => !prev) },
              { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword, visible: showConfirmPassword, toggle: () => setShowConfirmPassword((prev) => !prev) }
            ].map(({ label, value, onChange, visible, toggle }) => (
              <View key={label} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={styles.passwordInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    placeholderTextColor={Colors.onSurfaceVariant}
                    secureTextEntry={!visible}
                    accessibilityLabel={label}
                  />
                  <Pressable onPress={toggle} hitSlop={10} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}>
                    <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.onSurfaceVariant} />
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]} onPress={handleChangePassword} disabled={savingPassword} accessibilityRole="button">
              {savingPassword ? <ActivityIndicator color={Colors.onSurface} size="small" /> : <Text style={styles.saveBtnText}>Change Password</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]} onPress={handleLogout} disabled={loggingOut} accessibilityRole="button" accessibilityLabel="Logout">
            {loggingOut ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.logoutBtnText}>Logout</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.rlpGreen },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.rlpGreenDark, backgroundColor: Colors.rlpGreen },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  scrollContent: { paddingBottom: 28 },
  avatarSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, position: 'relative', zIndex: 2 },
  photoDismissArea: { ...StyleSheet.absoluteFillObject, zIndex: 3 },
  avatarWrapper: { position: 'relative', marginBottom: 18, transform: [{ scale: 1.28 }] },
  editPhotoOverlay: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.rlpYellow, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  editPhotoIcon: { fontSize: 12 },
  photoLoadingOverlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  photoMenu: { position: 'absolute', top: 104, right: 18, width: 190, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 13, backgroundColor: Colors.white, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8, zIndex: 6 },
  photoMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  photoMenuItemLast: { borderBottomWidth: 0 },
  photoMenuItemDisabled: { opacity: 0.45 },
  photoMenuIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  photoMenuIconDanger: { backgroundColor: 'rgba(186, 26, 26, 0.08)' },
  photoMenuText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurface },
  photoMenuTextDanger: { color: Colors.error },
  userName: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.onSurface, marginBottom: 4 },
  userEmail: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
  userMetaRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  userMetaPill: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  userMetaLabel: { fontFamily: FontFamily.medium, fontSize: 10, color: Colors.rlpGreen, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  userMetaValue: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurface },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.white, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.onSurfaceVariant },
  input: { backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top' },
  inputDisabled: { color: Colors.onSurfaceVariant, backgroundColor: Colors.surfaceContainer, opacity: 0.9 },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  selectInputText: { flex: 1, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface },
  placeholderText: { color: Colors.onSurfaceVariant },
  datePickerCard: { marginTop: 6, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow, padding: 8 },
  datePickerDoneButton: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8 },
  datePickerDoneText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.rlpGreen },
  dropdownList: { marginTop: 6, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, backgroundColor: Colors.white, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  dropdownItemSelected: { backgroundColor: Colors.secondaryContainer },
  dropdownItemText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface },
  dropdownItemTextSelected: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
  passwordInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingLeft: 14, paddingRight: 10 },
  passwordInput: { flex: 1, paddingVertical: 11, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface },
  eyeButton: { paddingVertical: 10, paddingLeft: 12 },
  saveBtn: { backgroundColor: Colors.rlpYellow, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.onSurface },
  logoutBtn: { backgroundColor: Colors.error, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: Colors.error, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2 },
  logoutBtnText: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.white },
  adminCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.rlpYellow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  adminTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.onSurface, marginBottom: 4 },
  adminSubtitle: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 17, maxWidth: 260 },
  adminArrow: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.rlpGreen },
});
