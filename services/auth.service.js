import apiClient from './api';
import { normalizeUserMedia } from './media';

export async function register(data) {
  if (!data.profilePhoto) {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined && value !== ''),
    );
    const response = await apiClient.post('/auth/register', payload);
    return { ...response.data.data, user: normalizeUserMedia(response.data.data.user) };
  }

  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === 'profilePhoto') return;
    if (data[key] !== undefined) formData.append(key, String(data[key]));
  });
  if (data.profilePhoto) {
    const filename = data.profilePhoto.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('profilePhoto', { uri: data.profilePhoto, name: filename, type });
  }
  const response = await apiClient.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { ...response.data.data, user: normalizeUserMedia(response.data.data.user) };
}

export async function login(email, password) {
  const response = await apiClient.post('/auth/login', { email, password });
  return { ...response.data.data, user: normalizeUserMedia(response.data.data.user) };
}

export async function refreshToken(token) {
  const response = await apiClient.post('/auth/refresh', { refreshToken: token });
  return response.data;
}

export async function forgotPassword(email) {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
}

export async function verifyOtp(email, otp) {
  const response = await apiClient.post('/auth/verify-otp', { email, otp });
  return response.data;
}

export async function resetPassword(email, otp, newPassword) {
  const response = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
  return response.data;
}

export async function logout() {
  await apiClient.delete('/auth/logout');
}
