import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import SearchableDistrictSelect from '../ui/SearchableDistrictSelect';
import { Colors } from '../../constants/colors';
import { isValidRajasthanDistrict } from '../../constants/rajasthanDistricts';
import { FontFamily } from '../../constants/typography';
import { getFriendlyErrorMessage } from '../../services/api';
import { isPermissionDeniedError, showPermissionSettingsAlert } from '../../src/services/PermissionManager';
import { savePosterToGallery } from '../../src/utils/mediaSave';
import {
  buildDefaultPosterCustomization,
  loadPosterCustomization,
  normalizePosterCustomization,
  savePosterCustomization,
} from '../../services/poster-customization.storage';
import { getUserProfilePhoto } from '../../services/media';

const CAPTURE_WIDTH = 1080;
const CAPTURE_POSTER_HEIGHT = 1440;
const POSTER_PREVIEW_MAX_WIDTH = 360;
const ADDRESS_MAX_LENGTH = 44;
const ADDRESS_MAX_LENGTH_WITH_CONTACT = 20;
const LOCATION_LINE_MAX_LENGTH_WITH_CONTACT = 30;
const PHOTO_PICKER_QUALITY = 0.68;
const POSTER_PHOTO_DIRECTORY = `${FileSystem.documentDirectory || FileSystem.cacheDirectory || ''}poster-photos`;
const DEFAULT_LAYOUT_ID = 'profile-bar';
const DEFAULT_DESIGNATION = 'RLP Karyakarta';
const PARTY_NAME_HI = 'राष्ट्रीय लोकतांत्रिक पार्टी';
const FALLBACK_PROFILE_CONTENT = {
  name: 'RLP party name',
};

const THEME_OPTIONS = [
  {
    id: 'classic-red',
    label: 'Classic Red',
    barBackground: '#FFFFFF',
    leftBackground: '#FFF4EA',
    primaryText: '#B91C1C',
    secondaryText: '#1F2937',
    mutedText: '#4B5563',
    accent: '#F15A24',
    accentDark: '#B91C1C',
    stripeColors: ['#F97316', '#FFFFFF', '#F6D21A'],
    photoBackground: '#E5E7EB',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'saffron-gold',
    label: 'Saffron Gold',
    barBackground: '#FFF7D6',
    leftBackground: '#FFE889',
    primaryText: '#7A2E0E',
    secondaryText: '#3B2200',
    mutedText: '#6B4E16',
    accent: '#F4B400',
    accentDark: '#C65D00',
    stripeColors: ['#F97316', '#FFFFFF', '#F4B400'],
    photoBackground: '#FFE889',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'campaign-green',
    label: 'Campaign Green',
    barBackground: '#F7FFF9',
    leftBackground: '#DDF6E3',
    primaryText: '#087A33',
    secondaryText: '#113B24',
    mutedText: '#435046',
    accent: '#087A33',
    accentDark: '#045122',
    stripeColors: ['#F97316', '#FFFFFF', '#087A33'],
    photoBackground: '#DDF6E3',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'royal-navy',
    label: 'Royal Navy',
    barBackground: '#F8FAFC',
    leftBackground: '#E0E7FF',
    primaryText: '#17335C',
    secondaryText: '#111827',
    mutedText: '#475569',
    accent: '#F6D21A',
    accentDark: '#17335C',
    stripeColors: ['#F97316', '#FFFFFF', '#17335C'],
    photoBackground: '#E0E7FF',
    photoBorder: '#FFFFFF',
  },
];

const LAYOUT_OPTIONS = [
  {
    id: DEFAULT_LAYOUT_ID,
    label: 'Profile Bar',
    description: 'Rectangle photo, name and pad right',
    previewShape: 'portrait',
  },
  {
    id: 'circle-card',
    label: 'Circle Card',
    description: 'Circle photo with contact icons',
    previewShape: 'circle',
  },
  {
    id: 'square-gradient',
    label: 'Square Gradient',
    description: 'Square photo and gradient details',
    previewShape: 'square',
  },
  {
    id: 'angled-strip',
    label: 'Angled Strip',
    description: 'Dynamic diagonal accent strip',
    previewShape: 'rounded',
  },
  {
    id: 'social-badge',
    label: 'Social Badge',
    description: 'Photo badge with stacked social rows',
    previewShape: 'circle',
  },
];

const FIELD_CONFIG = [
  { key: 'name', label: 'Name', placeholder: 'Enter full name', required: true, keyboardType: 'default' },
  { key: 'designation', label: 'Pad / Designation', placeholder: 'Example: Booth Prabhari', required: false, keyboardType: 'default', maxLength: 38 },
  { key: 'mobile', label: 'Mobile Number', placeholder: 'Enter mobile number', required: false, keyboardType: 'phone-pad', maxLength: 10 },
  { key: 'email', label: 'Gmail / Email ID', placeholder: 'example@gmail.com', required: false, keyboardType: 'email-address', maxLength: 48, autoCapitalize: 'none' },
  { key: 'facebookInstagram', label: 'Facebook/Instagram', placeholder: 'Optional Facebook or Instagram handle', keyboardType: 'default', autoCapitalize: 'none' },
  { key: 'address', label: 'Address', placeholder: 'Enter address', required: false, keyboardType: 'default', maxLength: ADDRESS_MAX_LENGTH },
];

function CustomizationField({ label, value, onChangeText, placeholder, keyboardType, required, maxLength, autoCapitalize }) {
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
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function buildLocationLine(address, district, hasRightDetails) {
  const baseLine = [address, district].filter(Boolean).join(', ');
  if (!hasRightDetails || baseLine.length <= LOCATION_LINE_MAX_LENGTH_WITH_CONTACT) return baseLine;
  return `${baseLine.slice(0, LOCATION_LINE_MAX_LENGTH_WITH_CONTACT).trimEnd()}...`;
}

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'R';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isLocalPosterPhotoUri(uri) {
  return Boolean(uri && POSTER_PHOTO_DIRECTORY && uri.startsWith(`${POSTER_PHOTO_DIRECTORY}/`));
}

async function deleteLocalPosterPhoto(uri) {
  if (!isLocalPosterPhotoUri(uri)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}

async function persistPosterPhoto(sourceUri) {
  if (!sourceUri || !POSTER_PHOTO_DIRECTORY) return sourceUri || '';
  try {
    await FileSystem.makeDirectoryAsync(POSTER_PHOTO_DIRECTORY, { intermediates: true }).catch(() => {});
    const targetUri = `${POSTER_PHOTO_DIRECTORY}/poster-photo-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
    return targetUri;
  } catch (_error) {
    return sourceUri;
  }
}

function ThemePicker({ visible, selectedThemeId, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Choose Theme</Text>
          <Text style={styles.sheetSubtitle}>Bottom profile bar ke color aur text contrast yahan se change karein.</Text>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.themeList}
            showsVerticalScrollIndicator={false}
          >
            {THEME_OPTIONS.map((theme) => {
              const active = theme.id === selectedThemeId;
              return (
                <Pressable
                  key={theme.id}
                  style={[styles.themeCard, active && styles.themeCardActive]}
                  onPress={() => {
                    onSelect(theme.id);
                    onClose();
                  }}
                >
                  <View style={[styles.themePreview, { backgroundColor: theme.barBackground }]}>
                    <View style={[styles.themePreviewPhoto, { backgroundColor: theme.leftBackground }]} />
                    <View style={styles.themePreviewTextWrap}>
                      <Text style={[styles.themePreviewTitle, { color: theme.primaryText }]}>Name</Text>
                      <Text style={[styles.themePreviewMeta, { color: theme.secondaryText }]}>Pad | District</Text>
                    </View>
                    <View style={[styles.themePreviewAccent, { backgroundColor: theme.accent }]} />
                  </View>
                  <View style={styles.themeContent}>
                    <Text style={styles.themeLabel}>{theme.label}</Text>
                    <Text style={styles.themeHint}>Bottom profile bar colors</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={22} color={Colors.rlpGreen} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function LayoutPicker({ visible, selectedLayoutId, onSelect, onClose, theme }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Choose Layout</Text>
          <Text style={styles.sheetSubtitle}>Photo shape aur details placement yahan se change hoga.</Text>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.themeList}
            showsVerticalScrollIndicator={false}
          >
            {LAYOUT_OPTIONS.map((layout) => {
              const active = layout.id === selectedLayoutId;
              return (
                <Pressable
                  key={layout.id}
                  style={[styles.themeCard, active && styles.themeCardActive]}
                  onPress={() => {
                    onSelect(layout.id);
                    onClose();
                  }}
                >
                  <View style={[styles.layoutPreview, { backgroundColor: theme.barBackground }]}>
                    <View
                      style={[
                        styles.layoutPreviewPhoto,
                        layout.previewShape === 'circle' && styles.layoutPreviewPhotoCircle,
                        layout.previewShape === 'square' && styles.layoutPreviewPhotoSquare,
                        layout.previewShape === 'rounded' && styles.layoutPreviewPhotoRounded,
                        { backgroundColor: theme.leftBackground, borderColor: theme.accent },
                      ]}
                    />
                    <View style={styles.layoutPreviewLines}>
                      <View style={[styles.layoutPreviewLineStrong, { backgroundColor: theme.primaryText }]} />
                      <View style={[styles.layoutPreviewLine, { backgroundColor: theme.accent }]} />
                      <View style={[styles.layoutPreviewLineSmall, { backgroundColor: theme.mutedText }]} />
                    </View>
                  </View>
                  <View style={styles.themeContent}>
                    <Text style={styles.themeLabel}>{layout.label}</Text>
                    <Text style={styles.themeHint}>{layout.description}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={22} color={Colors.rlpGreen} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ToolButton({ icon, label, onPress, disabled }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.toolBtn,
        disabled && styles.toolBtnDisabled,
        pressed && !disabled && { opacity: 0.82 },
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={disabled ? Colors.outline : Colors.rlpGreen} />
      <Text style={[styles.toolText, disabled && styles.toolTextDisabled]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function buildPosterProfileData(customization, user) {
  const name = customization.name.trim() || FALLBACK_PROFILE_CONTENT.name;
  const designation = customization.designation.trim() || DEFAULT_DESIGNATION;
  const district = customization.district.trim() || user?.district?.trim?.() || user?.city?.trim?.() || '';
  const address = customization.address.trim();
  const mobile = customization.mobile.trim();
  const email = customization.email.trim();
  const social = customization.facebookInstagram.trim();
  const hasRightDetails = Boolean(mobile || email || social);
  const locationLine = buildLocationLine(address, district, hasRightDetails);
  const photoUri = customization.posterPhotoUri || getUserProfilePhoto(user);
  const contactItems = [
    mobile ? { key: 'mobile', icon: 'call-outline', text: mobile } : null,
    email ? { key: 'email', icon: 'mail-outline', text: email } : null,
    social ? { key: 'social', icon: social.toLowerCase().includes('fb') || social.toLowerCase().includes('facebook') ? 'logo-facebook' : 'logo-instagram', text: social } : null,
  ].filter(Boolean);

  return {
    name,
    designation,
    locationLine,
    photoUri,
    contactItems,
  };
}

function ProfilePhoto({ uri, name, compact, theme, variant = 'portrait', style }) {
  return (
    <View
      style={[
        styles.profilePhotoFrame,
        compact && styles.profilePhotoFrameCompact,
        variant === 'circle' && styles.profilePhotoCircle,
        variant === 'square' && styles.profilePhotoSquare,
        variant === 'rounded' && styles.profilePhotoRounded,
        { backgroundColor: theme.photoBackground, borderColor: theme.photoBorder },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.profilePhoto} resizeMode="cover" />
      ) : (
        <Text style={[styles.profileInitials, compact && styles.profileInitialsCompact, { color: theme.accentDark }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

function IconText({ icon, text, theme, style, textStyle, iconColor, iconSize = 11 }) {
  if (!text) return null;
  return (
    <View style={[styles.iconText, style]}>
      <Ionicons name={icon} size={iconSize} color={iconColor || theme.accentDark} />
      <Text style={[styles.iconTextLabel, { color: theme.secondaryText }, textStyle]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function ContactPill({ item, theme, style }) {
  if (!item?.text) return null;
  return (
    <View style={[styles.contactPill, { borderColor: theme.accent, backgroundColor: theme.barBackground }, style]}>
      <Ionicons name={item.icon} size={10} color={theme.accentDark} />
      <Text style={[styles.contactPillText, { color: theme.secondaryText }]} numberOfLines={1}>{item.text}</Text>
    </View>
  );
}

function PosterName({ name, compact, theme, style, centered = false }) {
  return (
    <Text
      style={[
        styles.profileName,
        compact && styles.profileNameCompact,
        centered && styles.profileTextCentered,
        { color: theme.primaryText },
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.68}
    >
      {name.toUpperCase()}
    </Text>
  );
}

function PosterProfileBar({ customization, user, compact, theme, layout }) {
  const data = buildPosterProfileData(customization, user);
  const layoutId = layout?.id || DEFAULT_LAYOUT_ID;

  if (layoutId === 'circle-card') {
    return (
      <View style={[styles.profileBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <LinearGradient
          colors={[theme.leftBackground, theme.barBackground, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.circleLayoutContent}
        >
          <View style={styles.circlePhotoColumn}>
            <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="circle" style={styles.circleLayoutPhoto} />
            <Text style={[styles.circlePartyBadge, { color: theme.accentDark }]} numberOfLines={1}>RLP</Text>
          </View>
          <View style={styles.circleDetails}>
            <PosterName name={data.name} compact={compact} theme={theme} />
            <View style={[styles.designationPill, { backgroundColor: theme.accent }]}>
              <Text style={[styles.designationPillText, { color: theme.barBackground }]} numberOfLines={1}>{data.designation}</Text>
            </View>
            <Text style={[styles.profileParty, compact && styles.profilePartyCompact, { color: theme.accentDark }]} numberOfLines={1}>
              {PARTY_NAME_HI}
            </Text>
            <IconText icon="location-outline" text={data.locationLine} theme={theme} />
            <View style={styles.contactWrap}>
              {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} />)}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (layoutId === 'square-gradient') {
    return (
      <LinearGradient
        colors={[theme.barBackground, theme.leftBackground, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileBar, styles.squareGradientBar, compact && styles.profileBarCompact]}
      >
        <View style={[styles.squareAccentRail, { backgroundColor: theme.accent }]} />
        <View style={styles.squarePhotoColumn}>
          <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="square" style={styles.squareLayoutPhoto} />
        </View>
        <View style={styles.squareDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} />
          <Text style={[styles.squareDesignation, { color: theme.secondaryText }]} numberOfLines={1}>{data.designation}</Text>
          <View style={styles.squareInfoGrid}>
            <IconText icon="location-outline" text={data.locationLine} theme={theme} style={styles.squareInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} style={styles.squareInfoLine} />
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (layoutId === 'angled-strip') {
    return (
      <View style={[styles.profileBar, styles.angledBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.angledShape, { backgroundColor: theme.accent }]} />
        <View style={[styles.angledShapeLight, { backgroundColor: theme.leftBackground }]} />
        <View style={styles.angledContent}>
          <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="rounded" style={styles.angledPhoto} />
          <View style={styles.angledDetails}>
            <PosterName name={data.name} compact={compact} theme={theme} />
            <View style={styles.angledDesignationRow}>
              <Text style={[styles.angledDesignation, { color: theme.secondaryText }]} numberOfLines={1}>{data.designation}</Text>
              <Text style={[styles.angledParty, { color: theme.accentDark }]} numberOfLines={1}>RLP</Text>
            </View>
            <IconText icon="location-outline" text={data.locationLine} theme={theme} style={styles.angledIconLine} />
            <View style={styles.angledContactRow}>
              {data.contactItems.slice(0, 2).map((item) => <ContactPill key={item.key} item={item} theme={theme} style={styles.angledContactPill} />)}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'social-badge') {
    return (
      <View style={[styles.profileBar, styles.socialBadgeBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.socialTopLine, { backgroundColor: theme.accent }]} />
        <View style={styles.socialBadgeContent}>
          <View style={styles.socialPhotoWrap}>
            <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="circle" style={styles.socialBadgePhoto} />
          </View>
          <View style={styles.socialDetails}>
            <PosterName name={data.name} compact={compact} theme={theme} />
            <Text style={[styles.socialDesignation, { color: theme.accentDark }]} numberOfLines={1}>{data.designation}</Text>
            <IconText icon="location-outline" text={data.locationLine} theme={theme} style={styles.socialInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} style={styles.socialInfoLine} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.profileBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
      <View style={styles.profileStripeRow}>
        {theme.stripeColors.map((color, index) => (
          <View key={`${color}-${index}`} style={[styles.profileStripe, { backgroundColor: color }]} />
        ))}
      </View>
      <View style={styles.profileBarContent}>
        <View style={[styles.profilePhotoPanel, { backgroundColor: theme.leftBackground }]}>
          <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} />
        </View>
        <LinearGradient
          colors={['rgba(255,255,255,0.94)', theme.barBackground]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileTextPanel}
        >
          <View style={[styles.profileAccentBlock, { backgroundColor: theme.accent }]} />
          <PosterName name={data.name} compact={compact} theme={theme} />
          <Text style={[styles.profileDesignation, compact && styles.profileDesignationCompact, { color: theme.secondaryText }]} numberOfLines={1}>
            {data.designation}
          </Text>
          <Text style={[styles.profileParty, compact && styles.profilePartyCompact, { color: theme.accentDark }]} numberOfLines={1}>
            {PARTY_NAME_HI}
          </Text>
          <IconText icon="location-outline" text={data.locationLine} theme={theme} style={styles.profileInfoLine} textStyle={styles.profileMetaCompact} />
          <View style={styles.profileContactWrap}>
            {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} />)}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

export default function PosterEditor({
  template,
  user,
  isSubscribed = false,
  onClose,
  onRequireSubscription,
  onRequestDownload,
  helperText,
}) {
  const viewShotRef = useRef(null);
  const { width: windowWidth } = useWindowDimensions();
  const [customization, setCustomization] = useState(() => buildDefaultPosterCustomization(user));
  const [sheetVisible, setSheetVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [layoutPickerVisible, setLayoutPickerVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(CAPTURE_WIDTH / CAPTURE_POSTER_HEIGHT);

  useEffect(() => {
    let active = true;
    const defaults = buildDefaultPosterCustomization(user);
    setIsReady(false);
    loadPosterCustomization(template.id, user, defaults)
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
    savePosterCustomization(template.id, user, customization).catch(() => {});
  }, [customization, isReady, template.id, user]);

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
    const hasRightDetails = Boolean(customization.mobile.trim() || customization.email.trim() || customization.facebookInstagram.trim());
    const addressLimit = hasRightDetails ? ADDRESS_MAX_LENGTH_WITH_CONTACT : ADDRESS_MAX_LENGTH;
    const nextValue = key === 'mobile'
      ? value.replace(/\D/g, '').slice(0, 10)
      : key === 'email'
        ? value.trim().toLowerCase().slice(0, 48)
      : key === 'address'
        ? value.trimStart().slice(0, addressLimit)
        : key === 'designation'
          ? value.trimStart().slice(0, 38)
        : value;
    setCustomization((current) => ({ ...current, [key]: nextValue }));
  };

  const handlePickPosterPhoto = async () => {
    if (!ensureCustomizationAccess()) return;
    setPickingPhoto(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Poster photo choose karne ke liye gallery permission allow kijiye.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: PHOTO_PICKER_QUALITY,
        exif: false,
        base64: false,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const nextUri = await persistPosterPhoto(result.assets[0].uri);
      await deleteLocalPosterPhoto(customization.posterPhotoUri);
      setCustomization((current) => ({ ...current, posterPhotoUri: nextUri }));
    } catch (error) {
      Alert.alert('Photo failed', getFriendlyErrorMessage(error, 'Poster photo select nahi ho paayi.'));
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleRemovePosterPhoto = () => {
    deleteLocalPosterPhoto(customization.posterPhotoUri);
    setCustomization((current) => ({ ...current, posterPhotoUri: '' }));
  };

  const validateRequiredFields = () => {
    if (!customization.name.trim()) {
      Alert.alert('Name required', 'Poster customize karne ke liye name jaruri hai.');
      return false;
    }
    if (customization.district && !isValidRajasthanDistrict(customization.district)) {
      Alert.alert('District required', 'District list me se valid Rajasthan district select kijiye.');
      return false;
    }
    if (customization.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customization.email.trim())) {
      Alert.alert('Email invalid', 'Valid Gmail ya email ID daliye.');
      return false;
    }
    return true;
  };

  const ensureCustomizationAccess = () => {
    if (isSubscribed) return true;
    Alert.alert(
      'Subscription Required',
      'Poster edit aur theme choose karne ke liye pehle subscription lena hoga.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            if (onRequireSubscription) onRequireSubscription();
          },
        },
      ],
    );
    return false;
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
      await savePosterToGallery(uri, {
        fileName: `${(template.name || 'rlp-poster').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${Date.now()}.png`,
      });

      Alert.alert('Downloaded', 'Customized poster gallery me save ho gaya.');
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        showPermissionSettingsAlert();
        return;
      }
      Alert.alert('Download failed', getFriendlyErrorMessage(error, 'Poster download nahi ho paya.'));
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
      Alert.alert('Share failed', getFriendlyErrorMessage(error, 'Poster share nahi ho paya.'));
    } finally {
      setActionLoading('');
    }
  };

  const previewWidth = Math.min(windowWidth - 40, POSTER_PREVIEW_MAX_WIDTH);
  const compactProfileBar = previewWidth < 332;
  const selectedTheme = THEME_OPTIONS.find((theme) => theme.id === customization.themeId) || THEME_OPTIONS[0];
  const selectedLayout = LAYOUT_OPTIONS.find((layout) => layout.id === customization.layoutId) || LAYOUT_OPTIONS[0];

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
          <PosterProfileBar customization={customization} user={user} compact={compactProfileBar} theme={selectedTheme} layout={selectedLayout} />
        </View>
      </ViewShot>

      <View style={styles.helperBox}>
        <Text style={styles.helperBoxTitle}>Poster Help</Text>
        <Text style={styles.helperBoxText}>
          Admin poster ke neeche selected layout fixed fit hoga. Photo left side aur details right side me export hongi.
        </Text>
      </View>

      <View style={styles.toolGrid}>
        <ToolButton icon="image-outline" label={pickingPhoto ? 'Selecting...' : 'Photo'} onPress={handlePickPosterPhoto} disabled={pickingPhoto} />
        <ToolButton
          icon="color-palette-outline"
          label="Theme"
          onPress={() => {
            if (!ensureCustomizationAccess()) return;
            setThemePickerVisible(true);
          }}
        />
        <ToolButton
          icon="albums-outline"
          label={selectedLayout.label}
          onPress={() => {
            if (!ensureCustomizationAccess()) return;
            setLayoutPickerVisible(true);
          }}
        />
        <ToolButton
          icon="create-outline"
          label="Details"
          onPress={() => {
            if (!ensureCustomizationAccess()) return;
            setSheetVisible(true);
          }}
        />
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

      <ThemePicker
        visible={themePickerVisible}
        selectedThemeId={selectedTheme.id}
        onSelect={(themeId) => handleChange('themeId', themeId)}
        onClose={() => setThemePickerVisible(false)}
      />

      <LayoutPicker
        visible={layoutPickerVisible}
        selectedLayoutId={selectedLayout.id}
        onSelect={(layoutId) => handleChange('layoutId', layoutId)}
        onClose={() => setLayoutPickerVisible(false)}
        theme={selectedTheme}
      />

      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetVisible(false)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Customize Poster</Text>
            <Text style={styles.sheetSubtitle}>Ye details poster ke bottom profile bar me directly attach hokar dikhenge.</Text>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.photoField}>
                <Text style={styles.fieldLabel}>Poster Photo</Text>
                <View style={styles.photoFieldRow}>
                  <View style={[styles.photoFieldPreview, { borderColor: selectedTheme.accent }]}>
                    {customization.posterPhotoUri || getUserProfilePhoto(user) ? (
                      <Image
                        source={{ uri: customization.posterPhotoUri || getUserProfilePhoto(user) }}
                        style={styles.photoFieldImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.photoFieldInitials}>{getInitials(customization.name)}</Text>
                    )}
                  </View>
                  <View style={styles.photoFieldActions}>
                    <Pressable
                      style={({ pressed }) => [styles.photoFieldBtn, pressed && { opacity: 0.82 }]}
                      onPress={handlePickPosterPhoto}
                      disabled={pickingPhoto}
                    >
                      {pickingPhoto ? (
                        <ActivityIndicator color={Colors.rlpGreen} size="small" />
                      ) : (
                        <Ionicons name="image-outline" size={18} color={Colors.rlpGreen} />
                      )}
                      <Text style={styles.photoFieldBtnText}>{pickingPhoto ? 'Selecting' : 'Choose Photo'}</Text>
                    </Pressable>
                    {customization.posterPhotoUri ? (
                      <Pressable
                        style={({ pressed }) => [styles.photoRemoveBtn, pressed && { opacity: 0.82 }]}
                        onPress={handleRemovePosterPhoto}
                      >
                        <Ionicons name="trash-outline" size={17} color={Colors.error} />
                        <Text style={styles.photoRemoveText}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
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
                  autoCapitalize={field.autoCapitalize}
                />
              ))}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>District</Text>
                <SearchableDistrictSelect
                  value={customization.district}
                  onSelect={(value) => handleChange('district', value)}
                  placeholder="Search and choose district"
                />
              </View>
              <CustomizationField
                label="Address"
                value={customization.address}
                onChangeText={(value) => handleChange('address', value)}
                placeholder="Enter address"
                keyboardType="default"
                maxLength={(customization.mobile.trim() || customization.email.trim() || customization.facebookInstagram.trim())
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
  profileBar: {
    width: '100%',
    minHeight: 148,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  profileBarCompact: {
    minHeight: 132,
  },
  profileStripeRow: {
    flexDirection: 'row',
    height: 10,
    width: '100%',
  },
  profileStripe: { flex: 1 },
  profileBarContent: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 138,
  },
  profilePhotoPanel: {
    width: '34%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 0,
  },
  profilePhotoFrame: {
    width: 104,
    height: 124,
    maxWidth: '100%',
    borderWidth: 3,
    borderBottomWidth: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhotoFrameCompact: {
    width: 92,
    height: 108,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  profilePhotoCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderBottomWidth: 3,
  },
  profilePhotoSquare: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderBottomWidth: 3,
  },
  profilePhotoRounded: {
    width: 98,
    height: 112,
    borderRadius: 18,
    borderBottomWidth: 3,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  profileInitials: {
    fontFamily: FontFamily.black,
    fontSize: 32,
    color: Colors.white,
  },
  profileInitialsCompact: { fontSize: 28 },
  profileTextPanel: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 12,
    paddingTop: 16,
    paddingBottom: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAccentBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 7,
    height: '100%',
  },
  profileName: {
    fontFamily: FontFamily.black,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0,
  },
  profileNameCompact: {
    fontSize: 17,
    lineHeight: 21,
  },
  profileDesignation: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    lineHeight: 17,
    marginTop: 4,
  },
  profileDesignationCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  profileParty: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    lineHeight: 23,
    marginTop: 4,
  },
  profilePartyCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  profileMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 5,
  },
  profileContact: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 3,
  },
  profileMetaCompact: { fontSize: 10, lineHeight: 13 },
  profileTextCentered: { textAlign: 'center' },
  profileInfoLine: { marginTop: 5 },
  profileContactWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 15,
  },
  iconTextLabel: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    lineHeight: 13,
  },
  contactPill: {
    maxWidth: '100%',
    minHeight: 17,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  contactPillText: {
    flexShrink: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 9,
    lineHeight: 12,
  },
  contactWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  designationPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  designationPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    lineHeight: 13,
  },
  circleLayoutContent: {
    flex: 1,
    minHeight: 148,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  circlePhotoColumn: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLayoutPhoto: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  circlePartyBadge: {
    marginTop: 5,
    fontFamily: FontFamily.black,
    fontSize: 16,
    lineHeight: 18,
  },
  circleDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  squareGradientBar: {
    minHeight: 148,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  squareAccentRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 10,
  },
  squarePhotoColumn: {
    width: '32%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareLayoutPhoto: {
    width: 94,
    height: 94,
    borderRadius: 14,
  },
  squareDetails: {
    flex: 1,
    paddingLeft: 9,
    paddingRight: 10,
  },
  squareDesignation: {
    marginTop: 4,
    fontFamily: FontFamily.bold,
    fontSize: 12,
    lineHeight: 15,
  },
  squareInfoGrid: {
    marginTop: 6,
    gap: 3,
  },
  squareInfoLine: { minHeight: 14 },
  angledBar: {
    minHeight: 148,
    overflow: 'hidden',
  },
  angledShape: {
    position: 'absolute',
    width: 164,
    height: 210,
    left: -78,
    top: -40,
    transform: [{ rotate: '15deg' }],
    opacity: 0.88,
  },
  angledShapeLight: {
    position: 'absolute',
    width: 210,
    height: 70,
    right: -40,
    bottom: -16,
    transform: [{ rotate: '-7deg' }],
  },
  angledContent: {
    flex: 1,
    minHeight: 148,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 11,
  },
  angledPhoto: {
    width: 90,
    height: 104,
    borderRadius: 18,
  },
  angledDetails: {
    flex: 1,
  },
  angledDesignationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  angledDesignation: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    lineHeight: 15,
  },
  angledParty: {
    fontFamily: FontFamily.black,
    fontSize: 13,
    lineHeight: 16,
  },
  angledIconLine: { marginTop: 6 },
  angledContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  angledContactPill: {
    maxWidth: '48%',
  },
  socialBadgeBar: {
    minHeight: 148,
    overflow: 'hidden',
  },
  socialTopLine: {
    height: 8,
    width: '100%',
  },
  socialBadgeContent: {
    flex: 1,
    minHeight: 140,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  socialPhotoWrap: {
    width: '32%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBadgePhoto: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  socialDetails: {
    flex: 1,
  },
  socialDesignation: {
    marginTop: 4,
    fontFamily: FontFamily.bold,
    fontSize: 12,
    lineHeight: 15,
  },
  socialInfoLine: {
    marginTop: 4,
  },
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
  themeList: { paddingBottom: 8, gap: 10 },
  themeCard: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
  },
  themeCardActive: {
    borderColor: Colors.rlpGreen,
    backgroundColor: Colors.primaryContainer,
  },
  themePreview: {
    width: 88,
    height: 54,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  themePreviewPhoto: {
    width: 28,
    height: '100%',
  },
  themePreviewTextWrap: {
    flex: 1,
    paddingHorizontal: 6,
  },
  themePreviewAccent: {
    width: 5,
    height: '100%',
  },
  themePreviewTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  themePreviewMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
  },
  themeContent: { flex: 1 },
  themeLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.onSurface,
    marginBottom: 2,
  },
  themeHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  layoutPreview: {
    width: 88,
    height: 54,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  layoutPreviewPhoto: {
    width: 30,
    height: '100%',
    borderWidth: 0,
  },
  layoutPreviewPhotoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewPhotoSquare: {
    width: 32,
    height: 32,
    borderRadius: 7,
    borderWidth: 2,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewPhotoRounded: {
    width: 30,
    height: 42,
    borderRadius: 9,
    borderWidth: 2,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewLines: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 5,
  },
  layoutPreviewLineStrong: { width: '84%', height: 8, borderRadius: 99 },
  layoutPreviewLine: { width: '64%', height: 6, borderRadius: 99 },
  layoutPreviewLineSmall: { width: '76%', height: 5, borderRadius: 99, opacity: 0.5 },
  toolGrid: {
    width: '100%',
    maxWidth: POSTER_PREVIEW_MAX_WIDTH,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  toolBtn: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 130,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    backgroundColor: Colors.white,
  },
  toolBtnDisabled: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  toolText: { flexShrink: 1, fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurface },
  toolTextDisabled: { color: Colors.outline },
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
  photoField: { gap: 8 },
  photoFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 10,
  },
  photoFieldPreview: {
    width: 70,
    height: 86,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.rlpGreen,
  },
  photoFieldImage: {
    width: '100%',
    height: '100%',
  },
  photoFieldInitials: {
    fontFamily: FontFamily.black,
    fontSize: 24,
    color: Colors.white,
  },
  photoFieldActions: { flex: 1, gap: 8 },
  photoFieldBtn: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  photoFieldBtnText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurface },
  photoRemoveBtn: {
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  photoRemoveText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.error },
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
