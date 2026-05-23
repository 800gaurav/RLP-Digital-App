import { Platform } from 'react-native';
import Constants from 'expo-constants';

const fallbackHost = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

function getLanApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')?.[0];
  return host ? `http://${host}:3000/api` : fallbackHost;
}

function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const isLocalhost = envUrl?.includes('localhost') || envUrl?.includes('127.0.0.1');
  if (Platform.OS !== 'web' && isLocalhost) return getLanApiUrl();
  return envUrl || getLanApiUrl();
}

export const API_BASE_URL = getApiBaseUrl();
export const VERIFY_BASE_URL = process.env.EXPO_PUBLIC_VERIFY_URL || 'https://rlpdigital.in/verify';
