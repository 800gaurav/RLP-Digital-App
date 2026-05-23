import { apiClient } from './api';
import { demoOfficials } from './mockData';
import { normalizeMediaItem } from './media';
import { createUploadFile, uploadForm } from './upload';

export async function getPadadhikari(params) {
  try {
    const response = await apiClient.get('/padadhikari', { params });
    return response.data.data.map(normalizeMediaItem);
  } catch (error) {
    // TODO: Remove fallback after /padadhikari supports search, rank, and contact visibility filters.
    if (!error.response) return demoOfficials;
    throw error;
  }
}

export async function createPadadhikari(data) {
  if (!data.photoUri) {
    const response = await apiClient.post('/padadhikari', {
      fullName: data.fullName,
      designation: data.designation,
      rank: data.rank,
      district: data.district,
      block: data.block,
      state: data.state,
      phone: data.phone,
      email: data.email,
      contactVisible: data.contactVisible,
    });
    return normalizeMediaItem(response.data.data);
  }

  const formData = new FormData();
  ['fullName', 'designation', 'rank', 'district', 'block', 'state', 'phone', 'email', 'contactVisible'].forEach((key) => {
    if (data[key] !== undefined && data[key] !== '') formData.append(key, String(data[key]));
  });
  if (data.photoUri) {
    formData.append('photo', createUploadFile(data.photoUri, {
      kind: 'image',
      fallbackName: 'official.jpg',
      fileName: data.photoUriName,
      mimeType: data.photoUriMimeType,
    }));
  }
  const response = await uploadForm('/padadhikari', formData);
  return normalizeMediaItem(response.data);
}

export async function updatePadadhikari(id, data) {
  if (!data.photoUri) {
    const response = await apiClient.put(`/padadhikari/${id}`, {
      fullName: data.fullName,
      designation: data.designation,
      rank: data.rank,
      district: data.district,
      block: data.block,
      state: data.state,
      phone: data.phone,
      email: data.email,
      contactVisible: data.contactVisible,
    });
    return normalizeMediaItem(response.data.data);
  }

  const formData = new FormData();
  ['fullName', 'designation', 'rank', 'district', 'block', 'state', 'phone', 'email', 'contactVisible'].forEach((key) => {
    if (data[key] !== undefined && data[key] !== '') formData.append(key, String(data[key]));
  });
  if (data.photoUri) {
    formData.append('photo', createUploadFile(data.photoUri, {
      kind: 'image',
      fallbackName: 'official.jpg',
      fileName: data.photoUriName,
      mimeType: data.photoUriMimeType,
    }));
  }
  const response = await uploadForm(`/padadhikari/${id}`, formData, { method: 'PUT' });
  return normalizeMediaItem(response.data);
}

export async function deletePadadhikari(id) {
  const response = await apiClient.delete(`/padadhikari/${id}`);
  return response.data;
}
