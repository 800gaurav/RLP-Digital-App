import axios from 'axios';
import { API_BASE_URL } from './config';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './api';

const EXT_BY_TYPE = {
  image: 'jpg',
  video: 'mp4',
};

const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

function cleanName(value) {
  if (!value) return '';
  return String(value).split('?')[0].split('#')[0].split('/').pop() || '';
}

export function createUploadFile(uri, { fallbackName, kind = 'image', fileName, mimeType } = {}) {
  const rawName = cleanName(fileName) || cleanName(uri) || fallbackName || `upload.${EXT_BY_TYPE[kind] || 'jpg'}`;
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(rawName);
  const ext = extMatch?.[1]?.toLowerCase() || EXT_BY_TYPE[kind] || 'jpg';
  const safeName = extMatch ? rawName : `${rawName}.${ext}`;
  const inferredMime = MIME_BY_EXT[ext] || (kind === 'video' ? 'video/mp4' : 'image/jpeg');

  return {
    uri,
    name: safeName,
    type: mimeType || inferredMime,
  };
}

export function uploadConfig(timeout = 180000) {
  return { timeout };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { success: false, message: text };
  }
}

async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return '';

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const accessToken =
    response.data?.accessToken
    || response.data?.data?.accessToken
    || response.data?.data?.tokens?.accessToken;

  if (!accessToken) return '';
  await setTokens(accessToken, refreshToken);
  return accessToken;
}

async function sendForm(path, formData, { method, token, timeout }) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
    signal: controller?.signal,
  });

  if (timeoutId) clearTimeout(timeoutId);
  return { response, data: await parseResponse(response) };
}

export async function uploadForm(path, formData, { method = 'POST', timeout = 180000 } = {}) {
  try {
    let token = await getAccessToken();
    let result = await sendForm(path, formData, { method, token, timeout });

    if (result.response.status === 401) {
      token = await refreshAccessToken();
      if (token) result = await sendForm(path, formData, { method, token, timeout });
      else await clearTokens();
    }

    if (!result.response.ok) {
      const error = new Error(result.data.message || `Upload failed with ${result.response.status}`);
      error.response = { status: result.response.status, data: result.data };
      error.config = { method, baseURL: API_BASE_URL, url: path };
      throw error;
    }

    return result.data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Upload timeout. Please try again with a smaller file or better network.');
      timeoutError.config = { method, baseURL: API_BASE_URL, url: path };
      throw timeoutError;
    }
    error.config = error.config || { method, baseURL: API_BASE_URL, url: path };
    throw error;
  }
}
