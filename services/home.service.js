import { apiClient } from './api';
import { demoNotifications, demoOfficials, demoReels, demoTrainingVideos } from './mockData';
import { normalizeMediaItem } from './media';

export async function getHomeFeed() {
  try {
    const response = await apiClient.get('/home');
    const data = response.data.data || {};
    return {
      notifications: (data.notifications || []).map(normalizeMediaItem),
      officials: (data.officials || []).map(normalizeMediaItem),
      reels: (data.reels || []).map(normalizeMediaItem),
      trainings: (data.trainings || []).map(normalizeMediaItem),
    };
  } catch (error) {
    if (!error.response) {
      return {
        notifications: demoNotifications,
        officials: demoOfficials,
        reels: demoReels,
        trainings: demoTrainingVideos,
      };
    }
    throw error;
  }
}
