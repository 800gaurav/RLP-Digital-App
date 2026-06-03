import apiClient from './api';
import { normalizeUserMedia } from './media';
import { createUploadFile, uploadForm } from './upload';

export async function register(data) {
  const hasUpload = Boolean(data.profilePhoto || data.voterIdPhoto);
  if (!hasUpload) {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined && value !== ''),
    );
    const response = await apiClient.post('/auth/register', payload, { skipGlobalErrorLog: true });
    return { ...response.data.data, user: normalizeUserMedia(response.data.data.user) };
  }

  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === 'profilePhoto' || key === 'voterIdPhoto') return;
    if (data[key] !== undefined) formData.append(key, String(data[key]));
  });
  if (data.profilePhoto) {
    formData.append('profilePhoto', createUploadFile(data.profilePhoto, {
      kind: 'image',
      fallbackName: 'profile-photo.jpg',
    }));
  }
  if (data.voterIdPhoto) {
    formData.append('voterIdPhoto', createUploadFile(data.voterIdPhoto, {
      kind: 'image',
      fallbackName: 'voter-id-photo.jpg',
    }));
  }
  const response = await uploadForm('/auth/register', formData, { method: 'POST', timeout: 180000 });
  const payload = response.data || response;
  return { ...payload, user: normalizeUserMedia(payload.user) };
}

export async function validateRegistration(data) {
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== ''),
  );
  const response = await apiClient.post('/auth/validate-registration', payload, { skipGlobalErrorLog: true });
  return response.data.data;
}

export async function login(identifier, password) {
  const response = await apiClient.post('/auth/login', { identifier, password });
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
