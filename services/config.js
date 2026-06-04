import { Platform } from 'react-native';

const PROD_API_URL = 'https://rlp.genzteck.com/api';
const PROD_VERIFY_URL = 'https://rlp.genzteck.com/api/verify';
// const PROD_API_URL = 'http://10.243.55.1:3000/api';
// const PROD_VERIFY_URL = 'http://10.243.55.1:3000/api/verify';
// const PROD_API_URL = 'https://m2rz2xvk-3000.inc1.devtunnels.ms/api';
// const PROD_VERIFY_URL = 'https://m2rz2xvk-3000.inc1.devtunnels.ms/api/verify';

function normalizeUrl(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/:(\d+)\.api\b/i, ':$1/api')
    .replace(/([^/])\/{2,}api\b/i, '$1/api');
}

function getApiBaseUrl() {
  const envUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_URL);
  return envUrl || PROD_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();
export const VERIFY_BASE_URL = normalizeUrl(process.env.EXPO_PUBLIC_VERIFY_URL) || PROD_VERIFY_URL;

if (__DEV__) {
  console.log('[config] API_BASE_URL resolved to:', API_BASE_URL, 'platform:', Platform.OS);
}
