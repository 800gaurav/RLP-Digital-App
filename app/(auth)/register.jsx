import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, Platform, Alert, Modal,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { brandLogo } from '../../constants/brandAssets';
import { FontFamily } from '../../constants/typography';
import SearchableDistrictSelect from '../../components/ui/SearchableDistrictSelect';
import { isValidRajasthanDistrict } from '../../constants/rajasthanDistricts';
import { register } from '../../services/auth.service';
import { getFriendlyApiErrorMessage, logApiError } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function parseDateString(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [dayText, monthText, yearText] = value.split('/');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime())
    || parsed.getDate() !== day
    || parsed.getMonth() !== month - 1
    || parsed.getFullYear() !== year
  ) {
    return null;
  }
  return parsed;
}

function isValidDate(date) { return Boolean(parseDateString(date)); }

function FieldLabel({ label, required }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}{required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

function StyledInput({ value, onChangeText, placeholder, keyboardType, secureTextEntry, multiline, maxLength, error, rightElement, autoCapitalize }) {
  return (
    <View style={[styles.inputWrapper, error ? styles.inputError : null, multiline ? styles.inputMultiline : null]}>
      <TextInput
        style={[styles.textInput, multiline ? styles.textInputMultiline : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.outline}
        keyboardType={keyboardType ?? 'default'}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
      {rightElement}
    </View>
  );
}

export default function RegisterScreen() {
  const queryClient = useQueryClient();
  const setLoading = useAuthStore((state) => state.setLoading);
  const defaultDob = new Date(2000, 0, 1);
  const maxDob = new Date();

  const [form, setForm] = useState({
    fullName: '', dob: '', gender: '', voterId: '', address: '',
    state: 'Rajasthan', district: '', city: '', pincode: '', mobileNumber: '',
    password: '', confirmPassword: '', profilePhoto: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(null);

  const selectedDob = parseDateString(form.dob) || defaultDob;

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleDobChange(_event, selectedDate) {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (!selectedDate) return;
    updateField('dob', formatDate(selectedDate));
  }

  async function pickPhoto() {
    setShowPhotoMenu((prev) => !prev);
  }

  async function pickPhotoFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Photo lene ke liye camera permission allow kijiye.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) updateField('profilePhoto', result.assets[0].uri);
    setShowPhotoMenu(false);
  }

  async function pickPhotoFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Photo choose karne ke liye gallery permission allow kijiye.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) updateField('profilePhoto', result.assets[0].uri);
    setShowPhotoMenu(false);
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name required hai';
    if (!form.dob.trim()) e.dob = 'Date of birth required hai';
    else if (!isValidDate(form.dob)) e.dob = 'Date DD/MM/YYYY format me daliye';
    if (!GENDER_OPTIONS.includes(form.gender)) e.gender = 'Gender list me se select kijiye';
    if (!form.voterId.trim()) e.voterId = 'Voter ID required hai';
    else if (!/^[A-Z0-9]{10}$/i.test(form.voterId.trim())) e.voterId = 'Voter ID 10 characters ka hona chahiye';
    if (!form.address.trim()) e.address = 'Address required hai';
    if (!form.district.trim()) e.district = 'District required hai';
    else if (!isValidRajasthanDistrict(form.district)) e.district = 'Please select a valid Rajasthan district';
    if (!form.city.trim()) e.city = 'City required hai';
    if (!form.pincode.trim()) e.pincode = 'Pincode required hai';
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Pincode 6 digits ka hona chahiye';
    if (!form.mobileNumber.trim()) e.mobileNumber = 'Mobile number required hai';
    else if (!/^\d{10}$/.test(form.mobileNumber.trim())) e.mobileNumber = 'Mobile number 10 digits ka hona chahiye';
    if (!form.password) e.password = 'Password required hai';
    else if (form.password.length < 8) e.password = 'Password kam se kam 8 characters ka hona chahiye';
    if (!form.confirmPassword) e.confirmPassword = 'Password confirm kijiye';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Dono password match nahi kar rahe';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsSubmitting(true);
    setLoading(true);
    const [day, month, year] = form.dob.split('/');
    const isoDate = `${year}-${month}-${day}`;
    try {
      const response = await register({
        fullName: form.fullName.trim(), mobileNumber: form.mobileNumber.trim(),
        password: form.password, dob: isoDate, gender: form.gender,
        voterId: form.voterId.trim().toUpperCase(), address: form.address.trim(),
        state: 'Rajasthan', district: form.district.trim(), city: form.city.trim(),
        pincode: form.pincode.trim(), profilePhoto: form.profilePhoto || undefined,
      });
      queryClient.clear();
      setCredentialsModal({
        userId: response.user.voterId || form.voterId.trim().toUpperCase(),
        mobileNumber: response.user.mobileNumber || form.mobileNumber.trim(),
        password: form.password,
      });
    } catch (error) {
      logApiError(error, 'Register request failed');
      Alert.alert(
        'Registration failed',
        getFriendlyApiErrorMessage(error, 'Registration complete nahi ho paaya. Kripya dobara try karein.'),
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setShowPhotoMenu(false)}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoCircle} onPress={pickPhoto} activeOpacity={0.8}>
              {form.profilePhoto ? (
                <Image source={{ uri: form.profilePhoto }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={28} color={Colors.rlpGreen} />
                  <Text style={styles.photoHint}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {showPhotoMenu ? (
              <View style={styles.photoMenu}>
                <TouchableOpacity style={styles.photoMenuItem} onPress={pickPhotoFromCamera} activeOpacity={0.82}>
                  <View style={styles.photoMenuIcon}>
                    <Ionicons name="camera-outline" size={19} color={Colors.rlpGreen} />
                  </View>
                  <Text style={styles.photoMenuText}>Open Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoMenuItem} onPress={pickPhotoFromGallery} activeOpacity={0.82}>
                  <View style={styles.photoMenuIcon}>
                    <Ionicons name="image-outline" size={19} color={Colors.rlpGreen} />
                  </View>
                  <Text style={styles.photoMenuText}>Choose Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoMenuItem, styles.photoMenuItemLast, !form.profilePhoto ? styles.photoMenuItemDisabled : null]}
                  onPress={() => {
                    updateField('profilePhoto', '');
                    setShowPhotoMenu(false);
                  }}
                  disabled={!form.profilePhoto}
                  activeOpacity={0.82}
                >
                  <View style={[styles.photoMenuIcon, styles.photoMenuIconDanger]}>
                    <Ionicons name="trash-outline" size={19} color={Colors.error} />
                  </View>
                  <Text style={[styles.photoMenuText, styles.photoMenuTextDanger]}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Full Name" required />
            <StyledInput value={form.fullName} onChangeText={(v) => updateField('fullName', v)} placeholder="Enter your full name" autoCapitalize="words" error={errors.fullName} />
            <FieldError message={errors.fullName} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Date of Birth" required />
            <TouchableOpacity
              style={[styles.inputWrapper, errors.dob ? styles.inputError : null]}
              onPress={() => setShowDobPicker((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={[styles.textInput, !form.dob ? styles.placeholderText : null]}>
                {form.dob || 'Select date of birth'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.outline} />
            </TouchableOpacity>
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
                  <TouchableOpacity
                    style={styles.datePickerDoneButton}
                    onPress={() => setShowDobPicker(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
            <FieldError message={errors.dob} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Gender" required />
            <TouchableOpacity
              style={[styles.inputWrapper, errors.gender ? styles.inputError : null]}
              onPress={() => setShowGenderPicker((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={[styles.textInput, !form.gender ? styles.placeholderText : null]}>
                {form.gender || 'Select gender'}
              </Text>
              <Ionicons name={showGenderPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.outline} />
            </TouchableOpacity>
            {showGenderPicker ? (
              <View style={styles.dropdownList}>
                {GENDER_OPTIONS.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[styles.dropdownItem, form.gender === gender ? styles.dropdownItemSelected : null]}
                    onPress={() => {
                      updateField('gender', gender);
                      setShowGenderPicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownItemText, form.gender === gender ? styles.dropdownItemTextSelected : null]}>{gender}</Text>
                    {form.gender === gender ? <Ionicons name="checkmark" size={18} color={Colors.rlpGreen} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <FieldError message={errors.gender} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Voter ID" required />
            <StyledInput value={form.voterId} onChangeText={(v) => updateField('voterId', v.toUpperCase())} placeholder="10-character Voter ID" maxLength={10} autoCapitalize="characters" error={errors.voterId} />
            <FieldError message={errors.voterId} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Address" required />
            <StyledInput value={form.address} onChangeText={(v) => updateField('address', v)} placeholder="Enter your full address" multiline error={errors.address} />
            <FieldError message={errors.address} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="District" required />
            <SearchableDistrictSelect value={form.district} onSelect={(value) => updateField('district', value)} error={Boolean(errors.district)} placeholder="Search and choose Rajasthan district" />
            <FieldError message={errors.district} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="City" required />
            <StyledInput value={form.city} onChangeText={(v) => updateField('city', v)} placeholder="Enter your city" autoCapitalize="words" error={errors.city} />
            <FieldError message={errors.city} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Pincode" required />
            <StyledInput value={form.pincode} onChangeText={(v) => updateField('pincode', v)} placeholder="6-digit pincode" keyboardType="numeric" maxLength={6} error={errors.pincode} />
            <FieldError message={errors.pincode} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Mobile Number" required />
            <StyledInput value={form.mobileNumber} onChangeText={(v) => updateField('mobileNumber', v.replace(/[^0-9]/g, ''))} placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} autoCapitalize="none" error={errors.mobileNumber} />
            <FieldError message={errors.mobileNumber} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Password" required />
            <StyledInput
              value={form.password} onChangeText={(v) => updateField('password', v)}
              placeholder="Min 8 characters" secureTextEntry={!showPassword} error={errors.password}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.outline} />
                </TouchableOpacity>
              }
            />
            <FieldError message={errors.password} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Confirm Password" required />
            <StyledInput
              value={form.confirmPassword} onChangeText={(v) => updateField('confirmPassword', v)}
              placeholder="Re-enter your password" secureTextEntry={!showConfirmPassword} error={errors.confirmPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={Colors.outline} />
                </TouchableOpacity>
              }
            />
            <FieldError message={errors.confirmPassword} />
          </View>

          <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} onPress={handleRegister} disabled={isSubmitting} activeOpacity={0.85}>
            {isSubmitting ? <ActivityIndicator color={Colors.onSurface} size="small" /> : <Text style={styles.submitButtonText}>Register & Generate ID Card</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={Boolean(credentialsModal)} transparent animationType="fade" onRequestClose={() => setCredentialsModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              <Image source={brandLogo} style={styles.modalLogo} resizeMode="contain" />
            </View>
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalSubtitle}>Aapka account successfully create ho gaya hai. In details se login karein.</Text>

            <View style={styles.credentialBox}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>User ID</Text>
                <Text style={styles.credentialValue}>{credentialsModal?.userId}</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Mobile</Text>
                <Text style={styles.credentialValue}>{credentialsModal?.mobileNumber}</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Password</Text>
                <Text style={styles.credentialValue}>{credentialsModal?.password}</Text>
              </View>
            </View>

            <Text style={styles.modalHint}>Login screen par mobile number ya voter ID dono me se kisi bhi ek se sign in kar sakte hain.</Text>

            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.85}
              onPress={() => {
                if (!credentialsModal) return;
                const nextCredentials = credentialsModal;
                setCredentialsModal(null);
                router.replace({
                  pathname: '/(auth)/login',
                  params: {
                    identifier: nextCredentials.mobileNumber,
                    password: nextCredentials.password,
                  },
                });
              }}
            >
              <Text style={styles.modalButtonText}>Login Karein</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.rlpGreen },
  scrollContent: { paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24, color: Colors.white },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  card: { backgroundColor: Colors.white, borderRadius: 16, marginHorizontal: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, zIndex: 2 },
  photoSection: { alignItems: 'center', marginBottom: 24, position: 'relative', zIndex: 3 },
  photoCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: Colors.surfaceContainer, borderWidth: 2, borderColor: Colors.outlineVariant, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  photoImage: { width: 112, height: 112, borderRadius: 56 },
  photoPlaceholder: { alignItems: 'center' },
  cameraIcon: { fontSize: 28, marginBottom: 4 },
  photoHint: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.onSurfaceVariant },
  photoMenu: { width: 220, alignSelf: 'flex-end', marginTop: -8, marginRight: 14, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 14, backgroundColor: Colors.white, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8, zIndex: 5 },
  photoMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  photoMenuItemLast: { borderBottomWidth: 0 },
  photoMenuItemDisabled: { opacity: 0.45 },
  photoMenuIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  photoMenuIconDanger: { backgroundColor: 'rgba(186, 26, 26, 0.08)' },
  photoMenuText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurface },
  photoMenuTextDanger: { color: Colors.error },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 6 },
  required: { color: Colors.error },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8, backgroundColor: Colors.surfaceContainerLow },
  inputError: { borderColor: Colors.error },
  inputMultiline: { alignItems: 'flex-start', paddingVertical: 10 },
  textInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface, padding: 0 },
  placeholderText: { color: Colors.outline },
  textInputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  errorText: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.error, marginTop: 4 },
  eyeIcon: { fontSize: 16, marginLeft: 8 },
  datePickerCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 8,
  },
  datePickerDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  datePickerDoneText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.rlpGreen,
  },
  dropdownList: { marginTop: 6, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, backgroundColor: Colors.white, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  dropdownItemSelected: { backgroundColor: Colors.secondaryContainer },
  dropdownItemText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface },
  dropdownItemTextSelected: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
  submitButton: { backgroundColor: Colors.rlpYellow, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 },
  buttonDisabled: { opacity: 0.7 },
  submitButtonText: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.onSurface },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
  loginLinkBold: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 28, 14, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 8,
  },
  modalBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.rlpYellowLight,
  },
  modalLogo: { width: 56, height: 56 },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  credentialBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  credentialRow: { gap: 4 },
  credentialLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.rlpGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credentialValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.onSurface,
  },
  modalHint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  modalButton: {
    backgroundColor: Colors.rlpYellow,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.onSurface,
  },
});
