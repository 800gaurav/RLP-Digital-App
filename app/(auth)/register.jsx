import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, Platform, Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { register } from '../../services/auth.service';
import apiClient, { getApiErrorMessage, logApiError, setTokens } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli',
  'Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
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

function StatePicker({ value, onSelect, error }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={[styles.inputWrapper, error ? styles.inputError : null]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[styles.textInput, !value ? { color: Colors.outline } : null]}>
          {value || 'Select state'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.outline} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator>
            {INDIAN_STATES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.dropdownItem, value === s ? styles.dropdownItemSelected : null]}
                onPress={() => { onSelect(s); setOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, value === s ? styles.dropdownItemTextSelected : null]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function RegisterScreen() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const defaultDob = new Date(2000, 0, 1);
  const maxDob = new Date();

  const [form, setForm] = useState({
    fullName: '', dob: '', gender: '', voterId: '', address: '',
    state: '', district: '', city: '', pincode: '', email: '',
    password: '', confirmPassword: '', profilePhoto: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) updateField('profilePhoto', result.assets[0].uri);
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.dob.trim()) e.dob = 'Date of birth is required';
    else if (!isValidDate(form.dob)) e.dob = 'Use format DD/MM/YYYY';
    if (!form.gender) e.gender = 'Please select a gender';
    if (!form.voterId.trim()) e.voterId = 'Voter ID is required';
    else if (!/^[A-Z0-9]{10}$/i.test(form.voterId.trim())) e.voterId = 'Voter ID must be 10 alphanumeric characters';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.state) e.state = 'Please select a state';
    if (!form.district.trim()) e.district = 'District is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.pincode.trim()) e.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Pincode must be 6 digits';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
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
        fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(),
        password: form.password, dob: isoDate, gender: form.gender,
        voterId: form.voterId.trim().toUpperCase(), address: form.address.trim(),
        state: form.state, district: form.district.trim(), city: form.city.trim(),
        pincode: form.pincode.trim(), profilePhoto: form.profilePhoto || undefined,
      });
      await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      queryClient.clear();
      queryClient.setQueryData(['me'], response.user);
      setUser(response.user);
      router.replace('/(tabs)');
    } catch (error) {
      logApiError(error, 'Register request failed');
      console.error('Register flow error', {
        apiBaseUrl: apiClient.defaults.baseURL,
        responseData: error?.response?.data,
        message: error?.message,
      });
      const isNetworkError = !error?.response;
      const message = isNetworkError
        ? `Server se connection nahi ho pa raha. API URL: ${apiClient.defaults.baseURL || 'not resolved'}`
        : getApiErrorMessage(error, 'Registration failed. Please try again.');
      Alert.alert('Registration Failed', message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
            <View style={styles.radioRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity key={g} style={[styles.radioButton, form.gender === g && styles.radioButtonSelected]} onPress={() => updateField('gender', g)}>
                  <View style={[styles.radioCircle, form.gender === g && styles.radioCircleSelected]} />
                  <Text style={[styles.radioLabel, form.gender === g && styles.radioLabelSelected]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
            <FieldLabel label="State" required />
            <StatePicker value={form.state} onSelect={(s) => updateField('state', s)} error={errors.state} />
            <FieldError message={errors.state} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="District" required />
            <StyledInput value={form.district} onChangeText={(v) => updateField('district', v)} placeholder="Enter your district" autoCapitalize="words" error={errors.district} />
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
            <FieldLabel label="Email" required />
            <StyledInput value={form.email} onChangeText={(v) => updateField('email', v)} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
            <FieldError message={errors.email} />
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
  card: { backgroundColor: Colors.white, borderRadius: 16, marginHorizontal: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  photoSection: { alignItems: 'center', marginBottom: 24 },
  photoCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.surfaceContainer, borderWidth: 2, borderColor: Colors.outlineVariant, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  photoImage: { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder: { alignItems: 'center' },
  cameraIcon: { fontSize: 28, marginBottom: 4 },
  photoHint: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.onSurfaceVariant },
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
  radioRow: { flexDirection: 'row', gap: 12 },
  radioButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLow, gap: 6 },
  radioButtonSelected: { borderColor: Colors.rlpGreen, backgroundColor: Colors.secondaryContainer },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.outline },
  radioCircleSelected: { borderColor: Colors.rlpGreen, backgroundColor: Colors.rlpGreen },
  radioLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
  radioLabelSelected: { fontFamily: FontFamily.medium, color: Colors.rlpGreen },
  dropdownArrow: { fontSize: 12, color: Colors.outline, marginLeft: 8 },
  dropdownList: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, backgroundColor: Colors.white, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, zIndex: 100 },
  dropdownScroll: { maxHeight: 200 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  dropdownItemSelected: { backgroundColor: Colors.secondaryContainer },
  dropdownItemText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface },
  dropdownItemTextSelected: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
  submitButton: { backgroundColor: Colors.rlpYellow, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 },
  buttonDisabled: { opacity: 0.7 },
  submitButtonText: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.onSurface },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
  loginLinkBold: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
});
