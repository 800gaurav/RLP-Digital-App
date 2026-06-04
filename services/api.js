import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';
import { safeReplace } from './navigation';

const BASE_URL = API_BASE_URL;
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const tokenStorage = {
  async setItem(key, value) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async getItem(key) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async deleteItem(key) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export async function setTokens(accessToken, refreshToken) {
  await Promise.all([
    tokenStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    tokenStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    tokenStorage.deleteItem(ACCESS_TOKEN_KEY),
    tokenStorage.deleteItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem('rlp-auth-storage'),
  ]);
}

export async function getAccessToken() {
  return tokenStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return tokenStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getApiErrorMessage(error, fallbackMessage = 'Something went wrong') {
  const message =
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.response?.data?.details?.[0]?.message
    || error?.response?.data?.errors?.[0]?.message
    || error?.message;
  return message || fallbackMessage;
}

export function getFriendlyApiErrorMessage(error, fallbackMessage = 'Kuch galat ho gaya. Kripya dobara koshish karein.') {
  const status = error?.response?.status;
  const message = getApiErrorMessage(error, fallbackMessage);
  const code = error?.code;
  const method = error?.config?.method?.toUpperCase?.() || '';
  const url = String(error?.config?.url || '');

  if (!error?.response) {
    if (code === 'ECONNABORTED' || /timeout/i.test(message)) {
      return 'Request time out ho gayi. Internet slow ho sakta hai, thodi der baad dobara try karein.';
    }
    if (/network error|network request failed/i.test(message)) {
      return 'Internet ya server connection me problem hai. Network check karke dobara try karein.';
    }
    return 'Server se connection nahi ho pa raha. Internet ya backend server check karke dobara try karein.';
  }

  if (status === 401) {
    if (url.includes('/auth/login')) {
      return 'Login Credentials: ID or password sahi nahi hai. Please Shi Id or Password Enter kare.';
    }
    if (message.toLowerCase().includes('expired')) {
      return 'Session expire ho gaya hai. Please dobara login karein.';
    }
    return 'Aapka session valid nahi hai. Please dobara login karein.';
  }

  if (status === 403) {
    if (error?.response?.data?.code === 'ACCOUNT_SUSPENDED') {
      return 'Aapka account admin ne suspend kiya hai. Kripya support/admin se contact karein.';
    }
    if (error?.response?.data?.code === 'PAYMENT_UNDER_REVIEW') {
      return 'Aapka payment pending hai. Payment success ke baad login hoga.';
    }
    if (error?.response?.data?.code === 'PAYMENT_REJECTED') {
      return 'Aapka payment failed hai. Kripya payment dobara complete karein ya support se contact karein.';
    }
    return 'Is action ke liye permission nahi hai.';
  }

  if (status === 404) {
    return 'Jo data chahiye tha vo nahi mila. Screen refresh karke dobara try karein.';
  }

  if (status === 409) {
    if (/mobile/i.test(message)) return 'Ye mobile number pehle se registered hai.';
    if (/voter/i.test(message)) return 'Ye Voter ID pehle se registered hai.';
    if (/email/i.test(message)) return 'Ye email pehle se registered hai.';
    return 'Ye details pehle se registered hain.';
  }

  if (status === 400 || status === 422) {
    if (/^fullName:/i.test(message)) return 'Full name kam se kam 2 characters ka hona chahiye.';
    if (/^mobileNumber:/i.test(message)) return 'Mobile number 10 digits ka hona chahiye.';
    if (/^password:/i.test(message)) return 'Password kam se kam 8 characters ka hona chahiye.';
    if (/^dob:/i.test(message)) return 'Date of birth sahi format me daliye.';
    if (/^gender:/i.test(message)) return 'Gender list me se select kijiye.';
    if (/^category:/i.test(message)) return 'Category list me se select kijiye.';
    if (/^voterId:/i.test(message)) return 'Voter ID sahi format me daliye.';
    if (/^district:/i.test(message)) return 'District required hai.';
    if (/^vidhansabha:/i.test(message)) return 'Vidhansabha required hai.';
    if (/required/i.test(message)) return 'Required details missing hain. Form check karke dobara submit karein.';
    if (/email/i.test(message)) return 'Email format sahi nahi hai.';
    if (/password/i.test(message)) return 'Password details sahi nahi hain. Minimum 8 characters rakhein.';
    if (/mobile|phone/i.test(message)) return 'Mobile number sahi nahi hai. 10 digit number daliye.';
    if (/voter/i.test(message)) return 'Voter ID sahi format me nahi hai.';
    if (/district/i.test(message)) return 'District list me se valid Rajasthan district select kijiye.';
    return message && message !== fallbackMessage ? message : 'Form ki details check karke dobara submit karein.';
  }

  if (status === 413) {
    return 'File bahut badi hai. Chhoti file upload karke try karein.';
  }

  if (status === 429) {
    return 'Bahut zyada requests ho gayi hain. Thodi der baad dobara try karein.';
  }

  if (status >= 500) {
    const action = method === 'GET' ? 'data load' : 'request';
    return `Server me issue aa raha hai, ${action} complete nahi ho paayi. Thodi der baad dobara try karein.`;
  }

  return message || fallbackMessage;
}

const TECHNICAL_ERROR_PATTERNS = [
  /call to function/i,
  /has been rejected/i,
  /native/i,
  /expo/i,
  /network error/i,
  /network request failed/i,
  /aborterror/i,
  /undefined is not/i,
  /cannot read/i,
  /permissionmanagererror/i,
  /download failed with status/i,
  /upload failed with/i,
  /internal server error/i,
];

export function getFriendlyErrorMessage(error, fallbackMessage = 'Kuch galat ho gaya. Kripya dobara koshish karein.') {
  if (!error) return fallbackMessage;

  if (error?.response) {
    return getFriendlyApiErrorMessage(error, fallbackMessage);
  }

  const rawMessage = typeof error?.message === 'string' ? error.message.trim() : '';
  if (!rawMessage) return fallbackMessage;

  const looksTechnical = TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(rawMessage));
  return looksTechnical ? fallbackMessage : rawMessage;
}

export function logApiError(error, context = 'API request failed') {
  const method = error?.config?.method?.toUpperCase?.() || 'UNKNOWN';
  const url = error?.config?.baseURL
    ? `${error.config.baseURL}${error.config.url || ''}`
    : error?.config?.url;
  const status = error?.response?.status;
  console.error(context, {
    method,
    url,
    status,
    response: error?.response?.data,
    message: error?.message,
  });
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const requestUrl = String(originalRequest?.url || '');
    const isAuthRoute = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/refresh')
      || requestUrl.includes('/auth/forgot-password')
      || requestUrl.includes('/auth/verify-otp')
      || requestUrl.includes('/auth/reset-password');
    if (status && status !== 401 && !originalRequest?.skipGlobalErrorLog) {
      logApiError(error, 'HTTP request failed');
    }
    if (!originalRequest || status !== 401 || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }
    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = await tokenStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        await clearTokens();
        safeReplace('/(auth)/login');
        return Promise.reject(error);
      }
      const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newAccessToken =
        response.data?.accessToken
        || response.data?.data?.accessToken
        || response.data?.data?.tokens?.accessToken;
      if (!newAccessToken) throw new Error('Refresh response did not include an access token');
      await tokenStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      safeReplace('/(auth)/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
