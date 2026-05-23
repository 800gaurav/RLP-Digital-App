import { apiClient } from './api';
import { demoUser } from './mockData';

export async function getMe() {
  try {
    const response = await apiClient.get('/users/me');
    return response.data.data;
  } catch (error) {
    // Offline fallback keeps the app shell inspectable when the API is unreachable.
    if (!error.response) return demoUser;
    throw error;
  }
}

export async function updateMe(data) {
  try {
    const response = await apiClient.put('/users/me', data);
    return response.data.data;
  } catch (error) {
    // TODO: Wire profile updates to the production backend and remove local merge fallback.
    if (!error.response) return { ...demoUser, ...data };
    throw error;
  }
}

export async function updatePhoto(uri) {
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  const formData = new FormData();
  formData.append('photo', { uri, name: filename, type });
  try {
    const response = await apiClient.put('/users/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  } catch (error) {
    // TODO: Replace with uploaded CDN URL from backend.
    if (!error.response) return { ...demoUser, profilePhoto: uri };
    throw error;
  }
}

export async function saveFcmToken(token) {
  await apiClient.post('/users/me/fcm-token', { token });
}
