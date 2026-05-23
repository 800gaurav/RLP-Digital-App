import { apiClient } from './api';
import { demoTrainingVideos } from './mockData';

export async function getTrainingVideos() {
  try {
    const response = await apiClient.get('/training-videos');
    return response.data.data;
  } catch (error) {
    // TODO: Replace demo training cards with backend-managed YouTube/video metadata.
    if (!error.response) return demoTrainingVideos;
    throw error;
  }
}

export async function createTrainingVideo(data) {
  const formData = new FormData();
  ['title', 'description', 'duration', 'language', 'videoUrl', 'thumbnailUrl'].forEach((key) => {
    if (data[key]) formData.append(key, String(data[key]));
  });
  if (data.videoUri) {
    const filename = data.videoUri.split('/').pop() || 'training.mp4';
    const ext = filename.split('.').pop() || 'mp4';
    formData.append('video', { uri: data.videoUri, name: filename, type: `video/${ext}` });
  }
  if (data.thumbnailUri) {
    const filename = data.thumbnailUri.split('/').pop() || 'thumbnail.jpg';
    const ext = filename.split('.').pop() || 'jpg';
    formData.append('thumbnail', { uri: data.thumbnailUri, name: filename, type: `image/${ext}` });
  }
  const response = await apiClient.post('/training-videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}
