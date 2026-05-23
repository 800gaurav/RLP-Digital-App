import { apiClient } from './api';

export async function checkAccess() {
  const response = await apiClient.get('/stamp-pad/access');
  return response.data.data;
}

export async function getDrafts() {
  const response = await apiClient.get('/stamp-pad/drafts');
  return response.data.data;
}

export async function saveDraft(data) {
  const response = await apiClient.post('/stamp-pad/drafts', data);
  return response.data.data;
}

export async function updateDraft(id, data) {
  const response = await apiClient.put(`/stamp-pad/drafts/${id}`, data);
  return response.data.data;
}
