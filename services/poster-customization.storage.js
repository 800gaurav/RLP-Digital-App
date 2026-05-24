import AsyncStorage from '@react-native-async-storage/async-storage';

function sanitizeValue(value) {
  return typeof value === 'string' ? value : '';
}

function getPosterCustomizationUserKey(user) {
  return sanitizeValue(user?.id || user?._id || user?.voterId || user?.email).trim().toLowerCase() || 'guest';
}

export function getPosterCustomizationStorageKey(posterId, user) {
  return `poster_${posterId}_customization_${getPosterCustomizationUserKey(user)}`;
}

export function buildDefaultPosterCustomization(user) {
  return {
    name: user?.fullName || '',
    mobile: user?.phone || user?.mobile || '',
    district: user?.district || user?.city || '',
    address: user?.address || '',
    facebookInstagram: '',
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
    district: sanitizeValue(value?.district ?? fallback?.district),
    address: sanitizeValue(value?.address ?? fallback?.address),
    facebookInstagram: mergedSocial,
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
