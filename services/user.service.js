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
  try {
    const response = await apiClient.put('/users/me', data);
    return normalizeUserMedia(response.data.data);
  } catch (error) {
    // TODO: Wire profile updates to the production backend and remove local merge fallback.
    if (!error.response) return { ...demoUser, ...data };
    throw error;
  }
}

export async function updatePhoto(uri) {
  const formData = new FormData();
  formData.append('photo', createUploadFile(uri, {
    kind: 'image',
    fallbackName: `profile-${Date.now()}.jpg`,
  }));
  try {
    const response = await uploadForm('/users/me/photo', formData, { method: 'PUT' });
    return normalizeUserMedia(response.data);
  } catch (error) {
    if (!error.response) {
      const currentUser = useAuthStore.getState().user || demoUser;
      return normalizeUserMedia({ ...currentUser, profilePhoto: uri });
    }
    throw error;
  }
}

export async function saveFcmToken(token) {
  await apiClient.post('/users/me/fcm-token', { token });
}
