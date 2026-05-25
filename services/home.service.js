import { apiClient } from './api';
import { normalizeMediaItem } from './media';

export async function getHomeFeed() {
  const response = await apiClient.get('/home');
  const data = response.data.data || {};
  return {
    notifications: (data.notifications || []).map(normalizeMediaItem),
    officials: (data.officials || []).map(normalizeMediaItem),
    reels: (data.reels || []).map(normalizeMediaItem),
    trainings: (data.trainings || []).map(normalizeMediaItem),
  };
}
