import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidRajasthanDistrict } from '../constants/rajasthanDistricts';

function sanitizeValue(value) {
  return typeof value === 'string' ? value : '';
}

function sanitizeDistrict(value) {
  const district = sanitizeValue(value).trim();
  return isValidRajasthanDistrict(district) ? district : '';
}

function sanitizeLayoutId(value) {
  const layoutId = sanitizeValue(value);
  if (!layoutId || layoutId === 'profile-bar' || layoutId === 'poster-sash') return 'circle-card';
  return layoutId;
}

function getPosterCustomizationUserKey(user) {
  return sanitizeValue(user?.id || user?._id || user?.voterId || user?.email).trim().toLowerCase() || 'guest';
}

export function getPosterCustomizationStorageKey(posterId, user) {
  return `poster_${posterId}_customization_${getPosterCustomizationUserKey(user)}`;
}

export function buildDefaultPosterCustomization(user) {
  return {
    name: user?.fullNameHindi || user?.hindiName || user?.nameHi || user?.fullName || '',
    mobile: user?.mobileNumber || user?.phone || user?.mobile || '',
    email: user?.email || '',
    designation: user?.designationHindi || user?.designationHi || user?.designation || '',
    district: sanitizeDistrict(user?.district || user?.city || ''),
    facebookInstagram: '',
    posterPhotoUri: user?.profilePhoto || user?.profilePhotoUrl || user?.photoUrl || user?.imageUrl || '',
    layoutId: 'circle-card',
    themeId: 'classic-red',
  };
}

export function normalizePosterCustomization(value, fallback = {}) {
  const mergedSocial = sanitizeValue(
    value?.facebookInstagram
    ?? value?.instagram
    ?? value?.facebook
    ?? fallback?.facebookInstagram
    ?? fallback?.instagram
    ?? fallback?.facebook,
  );

  return {
    name: sanitizeValue(value?.name ?? fallback?.name),
    mobile: sanitizeValue(value?.mobile ?? fallback?.mobile),
    email: sanitizeValue(value?.email ?? fallback?.email),
    designation: sanitizeValue(value?.designation ?? fallback?.designation),
    district: sanitizeDistrict(value?.district ?? fallback?.district),
    facebookInstagram: mergedSocial,
    posterPhotoUri: sanitizeValue(value?.posterPhotoUri ?? fallback?.posterPhotoUri),
    layoutId: sanitizeLayoutId(value?.layoutId ?? fallback?.layoutId),
    themeId: sanitizeValue(value?.themeId ?? fallback?.themeId) || 'classic-red',
  };
}

export async function loadPosterCustomization(posterId, user, fallback = {}) {
  try {
    const raw = await AsyncStorage.getItem(getPosterCustomizationStorageKey(posterId, user));
    if (!raw) return normalizePosterCustomization({}, fallback);
    return normalizePosterCustomization(JSON.parse(raw), fallback);
  } catch (_error) {
    return normalizePosterCustomization({}, fallback);
  }
}

export async function savePosterCustomization(posterId, user, customization) {
  const normalized = normalizePosterCustomization(customization);
  await AsyncStorage.setItem(getPosterCustomizationStorageKey(posterId, user), JSON.stringify(normalized));
  return normalized;
}
