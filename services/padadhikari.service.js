import { apiClient } from './api';
import { demoOfficials } from './mockData';

export async function getPadadhikari(params) {
  try {
    const response = await apiClient.get('/padadhikari', { params });
    return response.data.data;
  } catch (error) {
    // TODO: Remove fallback after /padadhikari supports search, rank, and contact visibility filters.
    if (!error.response) return demoOfficials;
    throw error;
  }
}

export async function createPadadhikari(data) {
  const formData = new FormData();
  ['fullName', 'designation', 'rank', 'district', 'state', 'phone', 'email', 'contactVisible'].forEach((key) => {
    if (data[key] !== undefined && data[key] !== '') formData.append(key, String(data[key]));
  });
  if (data.photoUri) {
    const filename = data.photoUri.split('/').pop() || 'official.jpg';
    const ext = filename.split('.').pop() || 'jpg';
    formData.append('photo', { uri: data.photoUri, name: filename, type: `image/${ext}` });
  }
  const response = await apiClient.post('/padadhikari', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}
