import { apiClient } from './api';
import { demoUser } from './mockData';
import { normalizeUserMedia } from './media';
import { useAuthStore } from '../store/auth.store';
import { createUploadFile, uploadForm } from './upload';

export async function getMe() {
  try {
    const response = await apiClient.get('/users/me');
    return normalizeUserMedia(response.data.data);
  } catch (error) {
    // Offline fallback keeps the app shell inspectable when the API is unreachable.
    if (!error.response) return normalizeUserMedia(useAuthStore.getState().user) || demoUser;
    throw error;
  }
}

export async function updateMe(data) {
  const response = await apiClient.put('/users/me', data);
  return normalizeUserMedia(response.data.data);
}

export async function updatePhoto(uri) {
  const formData = new FormData();
  formData.append('photo', createUploadFile(uri, {
    kind: 'image',
    fallbackName: `profile-${Date.now()}.jpg`,
  }));
  const response = await uploadForm('/users/me/photo', formData, { method: 'PUT' });
  return normalizeUserMedia(response.data?.data || response.data || response);
}

export async function updateVoterIdPhoto(uri) {
  const formData = new FormData();
  formData.append('voterIdPhoto', createUploadFile(uri, {
    kind: 'image',
    fallbackName: `voter-id-${Date.now()}.jpg`,
  }));
  const response = await uploadForm('/users/me/voter-id-photo', formData, { method: 'PUT' });
  return normalizeUserMedia(response.data?.data || response.data || response);
}

export async function removePhoto() {
  try {
    const response = await apiClient.delete('/users/me/photo');
    return normalizeUserMedia(response.data.data);
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    const response = await apiClient.post('/users/me/photo/remove');
    return normalizeUserMedia(response.data.data);
  }
}

export async function saveFcmToken(token) {
  await apiClient.post('/users/me/fcm-token', { token });
}

export async function savePushToken(pushToken) {
  await apiClient.post('/users/push-token', { pushToken });
}
