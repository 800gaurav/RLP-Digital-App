import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

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
  const message = error?.response?.data?.message || error?.message;
  return message || fallbackMessage;
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
    if (status && status !== 401) {
      logApiError(error, 'HTTP request failed');
    }
    if (!originalRequest || status !== 401 || originalRequest._retry) {
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
      if (!refreshToken) throw new Error('No refresh token');
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
      router.replace('/(auth)/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
