import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import {
  buildDefaultPosterCustomization,
  loadPosterCustomization,
  normalizePosterCustomization,
  savePosterCustomization,
} from '../../services/poster-customization.storage';

const CAPTURE_WIDTH = 1080;
const CAPTURE_POSTER_HEIGHT = 1440;
const POSTER_PREVIEW_MAX_WIDTH = 360;
const ADDRESS_MAX_LENGTH = 44;
const ADDRESS_MAX_LENGTH_WITH_CONTACT = 20;
const LOCATION_LINE_MAX_LENGTH_WITH_CONTACT = 30;
const FALLBACK_RIBBON_CONTENT = {
  name: 'RLP party name',
  mobile: '987654320',
};

const FIELD_CONFIG = [
  { key: 'name', label: 'Name', placeholder: 'Enter full name', required: true, keyboardType: 'default' },
  { key: 'mobile', label: 'Mobile Number', placeholder: 'Enter mobile number', required: false, keyboardType: 'phone-pad', maxLength: 10 },
  { key: 'facebookInstagram', label: 'Facebook/Instagram', placeholder: 'Optional Facebook or Instagram handle', keyboardType: 'default' },
  { key: 'address', label: 'Address', placeholder: 'Enter address', required: false, keyboardType: 'default', maxLength: ADDRESS_MAX_LENGTH },
];

const RAJASTHAN_DISTRICTS = [
  'Ajmer', 'Alwar', 'Anupgarh', 'Balotra', 'Banswara', 'Baran', 'Barmer', 'Beawar', 'Bharatpur', 'Bhilwara',
  'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Deeg', 'Dholpur', 'Didwana-Kuchaman', 'Dudu', 'Dungarpur',
  'Ganganagar', 'Gangapur City', 'Hanumangarh', 'Jaipur', 'Jaipur Rural', 'Jaisalmer', 'Jalore', 'Jhalawar',
  'Jhunjhunu', 'Jodhpur', 'Jodhpur Rural', 'Karauli', 'Kekri', 'Khairthal-Tijara', 'Kota', 'Kotputli-Behror',
  'Nagaur', 'Neem Ka Thana', 'Pali', 'Phalodi', 'Pratapgarh', 'Rajsamand', 'Salumbar', 'Sanchore', 'Sawai Madhopur',
  'Shahpura', 'Sikar', 'Sirohi', 'Tonk', 'Udaipur',
];

function CustomizationField({ label, value, onChangeText, placeholder, keyboardType, required, maxLength }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.outline}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
}

function SearchableDistrictField({ value, onChangeText, onSelect }) {
  const [open, setOpen] = useState(false);
  const query = (value || '').trim().toLowerCase();
  const filteredOptions = query
    ? RAJASTHAN_DISTRICTS.filter((option) => option.toLowerCase().includes(query))
    : RAJASTHAN_DISTRICTS;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>District</Text>
      <View style={styles.selectControl}>
        <TextInput
          style={styles.selectSearchInput}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search and choose district"
          placeholderTextColor={Colors.outline}
        />
        <Pressable onPress={() => setOpen((current) => !current)} hitSlop={8}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.onSurfaceVariant} />
        </Pressable>
      </View>
      {open ? (
        <View style={styles.selectMenu}>
          <ScrollView nestedScrollEnabled style={styles.selectList} keyboardShouldPersistTaps="handled">
            {filteredOptions.length === 0 ? (
              <View style={styles.selectOption}>
                <Text style={styles.selectOptionText}>No district found</Text>
              </View>
            ) : filteredOptions.map((option) => {
              const active = option === value;
              return (
                <Pressable
                  key={option}
                  style={[styles.selectOption, active && styles.selectOptionActive]}
                  onPress={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>{option}</Text>
                  {active ? <Ionicons name="checkmark" size={16} color={Colors.rlpGreen} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function buildLocationLine(address, district, hasRightDetails) {
  const baseLine = [address, district].filter(Boolean).join(', ');
  if (!hasRightDetails || baseLine.length <= LOCATION_LINE_MAX_LENGTH_WITH_CONTACT) return baseLine;
  return `${baseLine.slice(0, LOCATION_LINE_MAX_LENGTH_WITH_CONTACT).trimEnd()}...`;
}

function PosterRibbon({ customization, user, compact }) {
  const name = customization.name.trim() || FALLBACK_RIBBON_CONTENT.name;
  const district = customization.district.trim() || user?.district?.trim?.() || user?.city?.trim?.() || '';
  const address = customization.address.trim();
  const mobile = customization.mobile.trim();
  const social = customization.facebookInstagram.trim();
  const hasRightDetails = Boolean(mobile || social);
  const locationLine = buildLocationLine(address, district, hasRightDetails);

  return (
    <View style={[styles.ribbon, compact && styles.ribbonCompact]}>
      <View style={[styles.ribbonGrid, !hasRightDetails && styles.ribbonGridCentered]}>
        <View style={[styles.ribbonColumnLeft, !hasRightDetails && styles.ribbonColumnCentered]}>
          <Text style={[styles.ribbonName, compact && styles.ribbonNameCompact, !hasRightDetails && styles.ribbonTextCentered]} numberOfLines={1}>
            {name}
          </Text>
          {locationLine ? (
            <Text
              style={[styles.ribbonMeta, compact && styles.ribbonMetaCompact, !hasRightDetails && styles.ribbonTextCentered]}
              numberOfLines={1}
            >
              {locationLine}
            </Text>
          ) : null}
        </View>
        <View style={[styles.ribbonColumnRight, !hasRightDetails && styles.ribbonColumnHidden]}>
          {mobile ? (
            <Text style={[styles.ribbonValue, compact && styles.ribbonValueCompact]} numberOfLines={1}>
              {mobile}
            </Text>
          ) : null}
          {social ? (
            <Text style={[styles.ribbonMeta, styles.ribbonMetaRight, compact && styles.ribbonMetaCompact]} numberOfLines={1}>
              {social}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function PosterEditor({ template, user, onClose, onRequestDownload, helperText }) {
  const viewShotRef = useRef(null);
  const { width: windowWidth } = useWindowDimensions();
  const [customization, setCustomization] = useState(() => buildDefaultPosterCustomization(user));
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState(CAPTURE_WIDTH / CAPTURE_POSTER_HEIGHT);

  useEffect(() => {
    let active = true;
    const defaults = buildDefaultPosterCustomization(user);
    setIsReady(false);
    loadPosterCustomization(template.id, defaults)
      .then((saved) => {
        if (!active) return;
        setCustomization(normalizePosterCustomization(saved, defaults));
        setIsReady(true);
      })
      .catch(() => {
        if (!active) return;
        setCustomization(normalizePosterCustomization(defaults, defaults));
        setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, [template.id, user]);

  useEffect(() => {
    if (!isReady) return;
    savePosterCustomization(template.id, customization).catch(() => {});
  }, [customization, isReady, template.id]);

  useEffect(() => {
    let active = true;
    if (!template?.imageUrl) {
      setImageAspectRatio(CAPTURE_WIDTH / CAPTURE_POSTER_HEIGHT);
      return () => {
        active = false;
      };
    }

    Image.getSize(
      template.imageUrl,
      (width, height) => {
        if (!active || !width || !height) return;
        setImageAspectRatio(width / height);
      },
      () => {
        if (!active) return;
        setImageAspectRatio(CAPTURE_WIDTH / CAPTURE_POSTER_HEIGHT);
      },
    );

    return () => {
      active = false;
    };
  }, [template?.imageUrl]);

  const handleChange = (key, value) => {
    const hasRightDetails = Boolean(customization.mobile.trim() || customization.facebookInstagram.trim());
    const addressLimit = hasRightDetails ? ADDRESS_MAX_LENGTH_WITH_CONTACT : ADDRESS_MAX_LENGTH;
    const nextValue = key === 'mobile'
      ? value.replace(/\D/g, '').slice(0, 10)
      : key === 'address'
        ? value.trimStart().slice(0, addressLimit)
        : value;
    setCustomization((current) => ({ ...current, [key]: nextValue }));
  };

  const validateRequiredFields = () => {
    if (!customization.name.trim()) {
      Alert.alert('Name required', 'Poster customize karne ke liye name jaruri hai.');
      return false;
    }
    return true;
  };

  const capturePoster = async (actionType) => {
    if (!validateRequiredFields()) return '';
    if (onRequestDownload) {
      const allowed = await onRequestDownload(template, actionType);
      if (!allowed) return '';
    }
    if (!viewShotRef.current?.capture) throw new Error('Poster preview is not ready yet.');
    return viewShotRef.current.capture();
  };

  const handleDownload = async () => {
    setActionLoading('download');
    try {
      const uri = await capturePoster('download');
      if (!uri) return;

      const permission = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      if (permission.status !== 'granted') {
        throw new Error('Gallery permission not granted');
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      const albumName = 'RLP Posters';
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album) await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      else await MediaLibrary.createAlbumAsync(albumName, asset, false);

      Alert.alert('Downloaded', 'Customized poster gallery me save ho gaya.');
    } catch (error) {
      Alert.alert('Download failed', error?.message || 'Poster download nahi ho paya.');
    } finally {
      setActionLoading('');
    }
  };

  const handleShare = async () => {
    setActionLoading('share');
    try {
      const uri = await capturePoster('share');
      if (!uri) return;
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error('Sharing is not available on this device');
      }

      const safeName = (template.name || 'rlp-poster').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const shareUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${safeName}-${Date.now()}.png`;
      await FileSystem.copyAsync({ from: uri, to: shareUri });

      await Sharing.shareAsync(shareUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Customized Poster',
        UTI: 'public.png',
      });
    } catch (error) {
      Alert.alert('Share failed', error?.message || 'Poster share nahi ho paya.');
    } finally {
      setActionLoading('');
    }
  };

  const previewWidth = Math.min(windowWidth - 40, POSTER_PREVIEW_MAX_WIDTH);
  const compactRibbon = previewWidth < 332;

  return (
    <View style={styles.container}>
      <ViewShot
        ref={viewShotRef}
        style={styles.captureShell}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
      >
        <View style={styles.captureCanvas}>
          <Image
            source={{ uri: template.imageUrl }}
            style={[styles.posterImage, { aspectRatio: imageAspectRatio }]}
            resizeMode="cover"
          />
          <PosterRibbon customization={customization} user={user} compact={compactRibbon} />
        </View>
      </ViewShot>

      <View style={styles.helperBox}>
        <Text style={styles.helperBoxTitle}>Poster Help</Text>
        <Text style={styles.helperBoxText}>
          Apni details jaise mobile aur name change karne ke liye `Edit Details` par click karein. Color theme
          badalne ke liye `Choose Theme` par click karein.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.82 }]} onPress={onClose}>
          <Text style={styles.secondaryText}>Choose Theme</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.customizeBtn, pressed && { opacity: 0.86 }]} onPress={() => setSheetVisible(true)}>
          <Text style={styles.customizeText}>Edit Details</Text>
        </Pressable>
      </View>

      <View style={styles.exportActions}>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, styles.downloadBtn, pressed && { opacity: 0.88 }]}
          onPress={handleDownload}
          disabled={actionLoading !== ''}
        >
          <Text style={styles.downloadText}>{actionLoading === 'download' ? 'Saving...' : 'Download'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, styles.shareBtn, pressed && { opacity: 0.88 }]}
          onPress={handleShare}
          disabled={actionLoading !== ''}
        >
          <Text style={styles.exportText}>{actionLoading === 'share' ? 'Sharing...' : 'Share'}</Text>
        </Pressable>
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetVisible(false)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Customize Poster</Text>
            <Text style={styles.sheetSubtitle}>Ye details poster ke bottom ribbon me directly attach hokar dikhenge.</Text>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {FIELD_CONFIG.filter((field) => field.key !== 'address').map((field) => (
                <CustomizationField
                  key={field.key}
                  label={field.label}
                  value={customization[field.key]}
                  onChangeText={(value) => handleChange(field.key, value)}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboardType}
                  required={field.required}
                  maxLength={field.maxLength}
                />
              ))}
              <SearchableDistrictField
                value={customization.district}
                onChangeText={(value) => handleChange('district', value)}
                onSelect={(value) => handleChange('district', value)}
              />
              <CustomizationField
                label="Address"
                value={customization.address}
                onChangeText={(value) => handleChange('address', value)}
                placeholder="Enter address"
                keyboardType="default"
                maxLength={(customization.mobile.trim() || customization.facebookInstagram.trim())
                  ? ADDRESS_MAX_LENGTH_WITH_CONTACT
                  : ADDRESS_MAX_LENGTH}
              />
            </ScrollView>
            <View style={styles.sheetActions}>
              <Pressable style={({ pressed }) => [styles.sheetSecondaryBtn, pressed && { opacity: 0.82 }]} onPress={() => setSheetVisible(false)}>
                <Text style={styles.sheetSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.sheetPrimaryBtn, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  if (!validateRequiredFields()) return;
                  setSheetVisible(false);
                }}
              >
                <Text style={styles.sheetPrimaryText}>Update Preview</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', padding: 20, paddingBottom: 28 },
  captureShell: {
    width: '100%',
    maxWidth: POSTER_PREVIEW_MAX_WIDTH,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  captureCanvas: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  posterImage: {
    width: '100%',
    backgroundColor: Colors.white,
  },
  ribbon: {
    width: '100%',
    minHeight: 52,
    maxHeight: 72,
    backgroundColor: '#B71C1C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  ribbonCompact: {
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ribbonGrid: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  ribbonGridCentered: { justifyContent: 'center' },
  ribbonColumnLeft: { flex: 1.2, justifyContent: 'center' },
  ribbonColumnRight: { flex: 0.95, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 1 },
  ribbonColumnCentered: { flex: 1, alignItems: 'center' },
  ribbonColumnHidden: { display: 'none' },
  ribbonName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 18,
    color: Colors.white,
    textAlign: 'left',
  },
  ribbonNameCompact: { fontSize: 14, lineHeight: 17 },
  ribbonMeta: {
    marginTop: 1,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 13,
    color: 'rgba(255,255,255,0.96)',
    textAlign: 'left',
  },
  ribbonMetaRight: { textAlign: 'right' },
  ribbonMetaCompact: { fontSize: 10, lineHeight: 12 },
  ribbonTextCentered: { textAlign: 'center' },
  ribbonValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    lineHeight: 16,
    color: Colors.white,
    textAlign: 'right',
  },
  ribbonValueCompact: { fontSize: 12, lineHeight: 14 },
  helperBox: {
    width: '100%',
    maxWidth: POSTER_PREVIEW_MAX_WIDTH,
    marginTop: 14,
    backgroundColor: '#FFF4D6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F2D27A',
  },
  helperBoxTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  helperBoxText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.onSurfaceVariant,
  },
  actions: { width: '100%', maxWidth: POSTER_PREVIEW_MAX_WIDTH, flexDirection: 'row', gap: 12, marginTop: 18 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  secondaryText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurfaceVariant },
  customizeBtn: {
    flex: 1.4,
    backgroundColor: Colors.rlpGreen,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  customizeText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.white },
  exportActions: { width: '100%', maxWidth: POSTER_PREVIEW_MAX_WIDTH, flexDirection: 'row', gap: 12, marginTop: 12 },
  exportBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  downloadBtn: { backgroundColor: Colors.rlpYellow },
  shareBtn: { backgroundColor: Colors.onPrimaryContainer },
  exportText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.white },
  downloadText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.onSurface },
  helperText: {
    width: '100%',
    maxWidth: POSTER_PREVIEW_MAX_WIDTH,
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  sheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '82%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.outlineVariant,
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.onSurface, textAlign: 'center' },
  sheetSubtitle: { marginTop: 6, fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 18 },
  sheetScroll: { marginTop: 16 },
  sheetContent: { paddingBottom: 8, gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurfaceVariant },
  requiredMark: { color: Colors.error },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLow,
  },
  selectControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  selectSearchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onSurface,
    paddingVertical: 11,
  },
  selectMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  selectList: { maxHeight: 180 },
  selectOption: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  selectOptionActive: { backgroundColor: Colors.primaryContainer },
  selectOptionText: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.onSurface },
  selectOptionTextActive: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  sheetSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  sheetSecondaryText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurfaceVariant },
  sheetPrimaryBtn: {
    flex: 1.4,
    backgroundColor: Colors.rlpGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetPrimaryText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.white },
});
