import AsyncStorage from '@react-native-async-storage/async-storage';

function sanitizeValue(value) {
  return typeof value === 'string' ? value : '';
}

export function getPosterCustomizationStorageKey(posterId) {
  return `poster_${posterId}_customization`;
}

export function buildDefaultPosterCustomization(user) {
  return {
    name: user?.fullName || '',
    mobile: user?.phone || user?.mobile || '',
    district: user?.district || user?.city || '',
    address: user?.address || '',
    facebookInstagram: '',
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
    district: sanitizeValue(value?.district ?? fallback?.district),
    address: sanitizeValue(value?.address ?? fallback?.address),
    facebookInstagram: mergedSocial,
  };
}

export async function loadPosterCustomization(posterId, fallback = {}) {
  try {
    const raw = await AsyncStorage.getItem(getPosterCustomizationStorageKey(posterId));
    if (!raw) return normalizePosterCustomization({}, fallback);
    return normalizePosterCustomization(JSON.parse(raw), fallback);
  } catch (_error) {
    return normalizePosterCustomization({}, fallback);
  }
}

export async function savePosterCustomization(posterId, customization) {
  const normalized = normalizePosterCustomization(customization);
  await AsyncStorage.setItem(getPosterCustomizationStorageKey(posterId), JSON.stringify(normalized));
  return normalized;
}
