import { apiClient } from './api';
import { demoSubscription, demoTemplates } from './mockData';
import { normalizeMediaItem } from './media';
import { createUploadFile, uploadForm } from './upload';

export async function getTemplates(category) {
  try {
    const response = await apiClient.get('/poster/templates', {
      params: category ? { category } : undefined,
    });
    return response.data.data.map(normalizeMediaItem);
  } catch (error) {
    // Offline fallback keeps template browsing usable when the API is unreachable.
    if (!error.response) {
      return category ? demoTemplates.filter((item) => item.category === category) : demoTemplates;
    }
    throw error;
  }
}

export async function getSubscriptionStatus() {
  try {
    const response = await apiClient.get('/poster/subscription');
    return response.data.data;
  } catch (error) {
    // Offline fallback only applies when the API is unreachable.
    if (!error.response) return demoSubscription;
    throw error;
  }
}

export async function consumePosterDownload(templateId) {
  const response = await apiClient.post(`/poster/templates/${templateId}/consume-download`);
  return response.data.data;
}

export async function createPosterTemplate({ name, category, imageUri, imageUriName, imageUriMimeType, isPremium = false }) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', category);
  formData.append('isPremium', String(isPremium));
  if (imageUri) {
    formData.append('image', createUploadFile(imageUri, {
      kind: 'image',
      fallbackName: 'template.jpg',
      fileName: imageUriName,
      mimeType: imageUriMimeType,
    }));
  }
  const response = await uploadForm('/poster/templates', formData, { timeout: 300000 });
  return normalizeMediaItem(response.data);
}

export async function updatePosterTemplate(id, { name, category, imageUri, imageUriName, imageUriMimeType, isPremium }) {
  const formData = new FormData();
  if (name !== undefined) formData.append('name', name);
  if (category !== undefined) formData.append('category', category);
  if (isPremium !== undefined) formData.append('isPremium', String(isPremium));
  if (imageUri) {
    formData.append('image', createUploadFile(imageUri, {
      kind: 'image',
      fallbackName: 'template.jpg',
      fileName: imageUriName,
      mimeType: imageUriMimeType,
    }));
  }
  const response = await uploadForm(`/poster/templates/${id}`, formData, { method: 'PUT', timeout: 300000 });
  return normalizeMediaItem(response.data);
}

export async function deletePosterTemplate(id) {
  const response = await apiClient.delete(`/poster/templates/${id}`);
  return response.data;
}
