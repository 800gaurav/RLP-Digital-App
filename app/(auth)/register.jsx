import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, Platform, Alert, Modal, Pressable, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import SearchableDistrictSelect from '../../components/ui/SearchableDistrictSelect';
import SearchableVidhansabhaSelect from '../../components/ui/SearchableVidhansabhaSelect';
import { isValidRajasthanDistrict } from '../../constants/rajasthanDistricts';
import { setPendingRegistration } from '../../services/pendingRegistration';
import { validateRegistration } from '../../services/auth.service';
import { getFriendlyApiErrorMessage, logApiError } from '../../services/api';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'Other'];

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

function getFieldErrorFromApi(error) {
  const message = String(error?.response?.data?.message || '');
  if (/mobile/i.test(message)) return { field: 'mobileNumber', message: 'Ye mobile number pehle se registered hai.' };
  if (/voter/i.test(message)) return { field: 'voterId', message: 'Ye Voter ID pehle se registered hai.' };
  if (/fullname|fullName/i.test(message)) return { field: 'fullName', message: 'Full name kam se kam 2 characters ka hona chahiye.' };
  if (/password/i.test(message)) return { field: 'password', message: 'Password kam se kam 8 characters ka hona chahiye.' };
  if (/dob|date/i.test(message)) return { field: 'dob', message: 'Date of birth sahi format me daliye.' };
  if (/gender/i.test(message)) return { field: 'gender', message: 'Gender list me se select kijiye.' };
  if (/category/i.test(message)) return { field: 'category', message: 'Category list me se select kijiye.' };
  if (/district/i.test(message)) return { field: 'district', message: 'District required hai.' };
  if (/vidhansabha/i.test(message)) return { field: 'vidhansabha', message: 'Vidhansabha required hai.' };
  return null;
}

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
  const defaultDob = new Date(2000, 0, 1);
  const maxDob = new Date();

  const [form, setForm] = useState({
    fullName: '', dob: '', gender: '', category: '', voterId: '',
    state: 'Rajasthan', district: '', vidhansabha: '', mobileNumber: '',
    password: '', confirmPassword: '', profilePhoto: '', voterIdPhoto: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState('');
  const [isOtherVidhansabha, setIsOtherVidhansabha] = useState(false);
  const [activeSelect, setActiveSelect] = useState('');

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

  function toggleGenderPicker() {
    const next = !showGenderPicker;
    setShowGenderPicker(next);
    setShowCategoryPicker(false);
    setShowDobPicker(false);
    setActiveSelect(next ? 'gender' : '');
  }

  function toggleCategoryPicker() {
    const next = !showCategoryPicker;
    setShowCategoryPicker(next);
    setShowGenderPicker(false);
    setShowDobPicker(false);
    setActiveSelect(next ? 'category' : '');
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

  async function pickVoterIdFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Voter ID photo lene ke liye camera permission allow kijiye.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) updateField('voterIdPhoto', result.assets[0].uri);
  }

  async function pickVoterIdFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Voter ID photo choose karne ke liye gallery permission allow kijiye.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) updateField('voterIdPhoto', result.assets[0].uri);
  }

  function pickVoterIdPhoto() {
    Alert.alert('Upload Voter ID Photo', 'Photo source select kijiye.', [
      { text: 'Open Camera', onPress: pickVoterIdFromCamera },
      { text: 'Choose Gallery', onPress: pickVoterIdFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name required hai';
    if (!form.dob.trim()) e.dob = 'Date of birth required hai';
    else if (!isValidDate(form.dob)) e.dob = 'Date DD/MM/YYYY format me daliye';
    if (!GENDER_OPTIONS.includes(form.gender)) e.gender = 'Gender list me se select kijiye';
    if (!CATEGORY_OPTIONS.includes(form.category)) e.category = 'Category list me se select kijiye';
    if (!form.voterId.trim()) e.voterId = 'Voter ID required hai';
    else if (!/^[A-Z0-9]{10}$/i.test(form.voterId.trim())) e.voterId = 'Voter ID 10 characters ka hona chahiye';
    if (!form.district.trim()) e.district = 'District required hai';
    else if (!isValidRajasthanDistrict(form.district)) e.district = 'Please select a valid Rajasthan district';
    if (!form.vidhansabha.trim()) e.vidhansabha = isOtherVidhansabha
      ? 'Other select kiya hai to apni Vidhansabha enter karni hogi'
      : 'Vidhansabha required hai';
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
    const [day, month, year] = form.dob.split('/');
    const isoDate = `${year}-${month}-${day}`;
    const payload = {
        fullName: form.fullName.trim(), mobileNumber: form.mobileNumber.trim(),
        password: form.password, dob: isoDate, gender: form.gender,
        category: form.category, voterId: form.voterId.trim().toUpperCase(),
        state: 'Rajasthan', district: form.district.trim(), vidhansabha: form.vidhansabha.trim(),
        profilePhoto: form.profilePhoto || undefined, voterIdPhoto: form.voterIdPhoto || undefined,
      };
    try {
      await validateRegistration(payload);
      setPendingRegistration({
        payload,
        credentials: {
        userId: form.voterId.trim().toUpperCase(),
        mobileNumber: form.mobileNumber.trim(),
        password: form.password,
        },
      });
      router.push('/(auth)/register-payment');
    } catch (error) {
      if (!error?.response) logApiError(error, 'Registration precheck failed');
      const fieldError = getFieldErrorFromApi(error);
      if (fieldError) setErrors((prev) => ({ ...prev, [fieldError.field]: fieldError.message }));
      Alert.alert(
        'Details check failed',
        fieldError?.message || getFriendlyApiErrorMessage(error, 'Registration details check nahi ho paayi. Form details check karein.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
              <>
                <Pressable style={styles.photoDismissArea} onPress={() => setShowPhotoMenu(false)} />
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
              </View>
              </>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Full Name" required />
            <StyledInput value={form.fullName} onChangeText={(v) => updateField('fullName', v)} placeholder="Enter your full name" autoCapitalize="words" error={errors.fullName} />
            <FieldError message={errors.fullName} />
          </View>


          <View style={styles.fieldGroup}>
            <FieldLabel label="Mobile Number" required />
            <StyledInput value={form.mobileNumber} onChangeText={(v) => updateField('mobileNumber', v.replace(/[^0-9]/g, ''))} placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} autoCapitalize="none" error={errors.mobileNumber} />
            <FieldError message={errors.mobileNumber} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Voter ID" required />
            <View style={styles.inlineFieldRow}>
              <View style={styles.inlineFieldInput}>
                <StyledInput value={form.voterId} onChangeText={(v) => updateField('voterId', v.toUpperCase())} placeholder="10-character Voter ID" maxLength={10} autoCapitalize="characters" error={errors.voterId} />
              </View>
              <TouchableOpacity style={styles.uploadButton} onPress={pickVoterIdPhoto} activeOpacity={0.85}>
                <Ionicons name="cloud-upload-outline" size={18} color={Colors.onSurface} />
                <Text style={styles.uploadButtonText}>{form.voterIdPhoto ? 'Change' : 'Upload'}</Text>
              </TouchableOpacity>
            </View>
            <FieldError message={errors.voterId} />
            {form.voterIdPhoto ? (
              <Pressable style={styles.voterIdPreviewCard} onPress={() => setPreviewImageUri(form.voterIdPhoto)}>
                <Image source={{ uri: form.voterIdPhoto }} style={styles.voterIdPreviewImage} resizeMode="cover" />
                <Text style={styles.voterIdPreviewText}>Tap to enlarge</Text>
              </Pressable>
            ) : null}
          </View>

           <View style={styles.fieldGroup}>
            <FieldLabel label="Date of Birth" required />
            <TouchableOpacity
              style={[styles.inputWrapper, errors.dob ? styles.inputError : null]}
              onPress={() => {
                const next = !showDobPicker;
                setShowDobPicker(next);
                setShowGenderPicker(false);
                setShowCategoryPicker(false);
                setActiveSelect('');
              }}
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
              onPress={toggleGenderPicker}
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
                      setActiveSelect('');
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
            <FieldLabel label="Category" required />
            <TouchableOpacity
              style={[styles.inputWrapper, errors.category ? styles.inputError : null]}
              onPress={toggleCategoryPicker}
              activeOpacity={0.8}
            >
              <Text style={[styles.textInput, !form.category ? styles.placeholderText : null]}>
                {form.category || 'Select category'}
              </Text>
              <Ionicons name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.outline} />
            </TouchableOpacity>
            {showCategoryPicker ? (
              <View style={styles.dropdownList}>
                {CATEGORY_OPTIONS.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.dropdownItem, form.category === category ? styles.dropdownItemSelected : null]}
                    onPress={() => {
                      updateField('category', category);
                      setShowCategoryPicker(false);
                      setActiveSelect('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownItemText, form.category === category ? styles.dropdownItemTextSelected : null]}>{category}</Text>
                    {form.category === category ? <Ionicons name="checkmark" size={18} color={Colors.rlpGreen} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <FieldError message={errors.category} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="District" required />
            <SearchableDistrictSelect
              value={form.district}
              onSelect={(value) => updateField('district', value)}
              error={Boolean(errors.district)}
              placeholder="Search or Choose district"
              open={activeSelect === 'district'}
              onOpenChange={(open) => {
                if (open) {
                  setActiveSelect('district');
                  setShowGenderPicker(false);
                  setShowCategoryPicker(false);
                  setShowDobPicker(false);
                } else if (activeSelect === 'district') {
                  setActiveSelect('');
                }
              }}
            />
            <FieldError message={errors.district} />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Vidhansabha" required />
            <SearchableVidhansabhaSelect
              district={form.district}
              value={form.vidhansabha}
              onSelect={(value) => updateField('vidhansabha', value)}
              error={Boolean(errors.vidhansabha)}
              onOtherModeChange={setIsOtherVidhansabha}
              open={activeSelect === 'vidhansabha'}
              onOpenChange={(open) => {
                if (open) {
                  setActiveSelect('vidhansabha');
                  setShowGenderPicker(false);
                  setShowCategoryPicker(false);
                  setShowDobPicker(false);
                } else if (activeSelect === 'vidhansabha') {
                  setActiveSelect('');
                }
              }}
            />
            <FieldError message={errors.vidhansabha} />
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
            {isSubmitting ? <ActivityIndicator color={Colors.onSurface} size="small" /> : <Text style={styles.submitButtonText}>Continue to Payment</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={Boolean(previewImageUri)} transparent animationType="fade" onRequestClose={() => setPreviewImageUri('')}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewImageUri('')}>
          <View style={styles.previewCard}>
            <TouchableOpacity style={styles.previewCloseButton} onPress={() => setPreviewImageUri('')} activeOpacity={0.85}>
              <Ionicons name="close" size={20} color={Colors.white} />
            </TouchableOpacity>
            {previewImageUri ? <Image source={{ uri: previewImageUri }} style={styles.previewImageLarge} resizeMode="contain" /> : null}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.rlpGreen },
  scrollContent: { paddingBottom: 28, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24, color: Colors.white },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  card: { backgroundColor: Colors.white, borderRadius: 16, marginHorizontal: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, zIndex: 2 },
  photoDismissArea: { ...StyleSheet.absoluteFillObject, zIndex: 3 },
  photoSection: { alignItems: 'center', marginBottom: 24, position: 'relative', zIndex: 3 },
  photoCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: Colors.surfaceContainer, borderWidth: 2, borderColor: Colors.outlineVariant, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  photoImage: { width: 112, height: 112, borderRadius: 56 },
  photoPlaceholder: { alignItems: 'center' },
  cameraIcon: { fontSize: 28, marginBottom: 4 },
  photoHint: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.onSurfaceVariant },
  photoMenu: { width: 220, alignSelf: 'flex-end', marginTop: -8, marginRight: 14, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 14, backgroundColor: Colors.white, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8, zIndex: 5 },
  photoMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  photoMenuIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  photoMenuText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurface },
  fieldGroup: { marginBottom: 16 },
  inlineFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inlineFieldInput: { flex: 1 },
  uploadButton: { minWidth: 92, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.rlpYellow, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13 },
  uploadButtonText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurface },
  voterIdPreviewCard: { marginTop: 10, width: '100%', borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow, padding: 8, alignItems: 'center', gap: 6 },
  voterIdPreviewImage: { width: '100%', height: 60, borderRadius: 8, backgroundColor: Colors.surfaceContainer },
  voterIdPreviewText: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.onSurfaceVariant },
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
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  previewCard: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 18,
    backgroundColor: Colors.white,
    padding: 12,
  },
  previewImageLarge: { width: '100%', height: 420, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow },
  previewCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
