import { Platform } from 'react-native';
import Constants from 'expo-constants';

const MANUAL_LAN_API_URL = 'http://10.213.228.1:3000/api';
const EMULATOR_API_URL = 'http://10.0.2.2:3000/api';
const WEB_API_URL = 'http://localhost:3000/api';

function normalizeUrl(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getLanApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')?.[0];
  return host ? `http://${host}:3000/api` : '';
}

function getDefaultApiUrl() {
  if (Platform.OS === 'web') return WEB_API_URL;

  const lanUrl = getLanApiUrl();

  // Prefer a known-working LAN IP over Expo host auto-detection on physical devices.
  // Update this when the development machine's Wi-Fi IPv4 changes.
  if (lanUrl && lanUrl !== EMULATOR_API_URL && lanUrl !== MANUAL_LAN_API_URL) {
    return MANUAL_LAN_API_URL;
  }

  return lanUrl || (Platform.OS === 'android' ? MANUAL_LAN_API_URL : WEB_API_URL);
}

function getApiBaseUrl() {
  const envUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_URL);
  const isLocalhost = envUrl?.includes('localhost') || envUrl?.includes('127.0.0.1');

  if (envUrl) {
    if (Platform.OS !== 'web' && isLocalhost) {
      return Platform.OS === 'android' ? EMULATOR_API_URL : WEB_API_URL;
    }
    return envUrl;
  }

  return getDefaultApiUrl();
}

export const API_BASE_URL = getApiBaseUrl();
export const VERIFY_BASE_URL = process.env.EXPO_PUBLIC_VERIFY_URL || 'https://rlpdigital.in/verify';

console.log('[config] API_BASE_URL resolved to:', API_BASE_URL);
