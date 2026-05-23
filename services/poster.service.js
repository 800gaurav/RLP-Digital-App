import { apiClient } from './api';
import { demoSubscription, demoTemplates } from './mockData';

export async function getTemplates(category) {
  try {
    const response = await apiClient.get('/poster/templates', {
      params: category ? { category } : undefined,
    });
    return response.data.data;
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

export async function createPosterTemplate({ name, category, imageUri, isPremium = false }) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', category);
  formData.append('isPremium', String(isPremium));
  if (imageUri) {
    const filename = imageUri.split('/').pop() || 'template.jpg';
    const ext = filename.split('.').pop() || 'jpg';
    formData.append('image', { uri: imageUri, name: filename, type: `image/${ext}` });
  }
  const response = await apiClient.post('/poster/templates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}
