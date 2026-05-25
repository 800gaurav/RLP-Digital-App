import apiClient from './api';
import { normalizeUserMedia } from './media';
import { createUploadFile, uploadForm } from './upload';

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
    formData.append('profilePhoto', createUploadFile(data.profilePhoto, {
      kind: 'image',
      fallbackName: 'profile-photo.jpg',
    }));
  }
  const response = await uploadForm('/auth/register', formData, { method: 'POST', timeout: 180000 });
  return { ...response.data, user: normalizeUserMedia(response.data.user) };
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
