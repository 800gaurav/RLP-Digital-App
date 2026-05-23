import { apiClient } from './api';
import { demoTrainingVideos } from './mockData';
import { normalizeMediaItem } from './media';
import { createUploadFile, uploadForm } from './upload';

export async function getTrainingVideos() {
  try {
    const response = await apiClient.get('/training-videos');
    return response.data.data.map(normalizeMediaItem);
  } catch (error) {
    // TODO: Replace demo training cards with backend-managed YouTube/video metadata.
    if (!error.response) return demoTrainingVideos;
    throw error;
  }
}

export async function getTrainingVideosPage({ page = 1, limit = 10 } = {}) {
  try {
    const response = await apiClient.get('/training-videos', { params: { page, limit } });
    const items = (response.data.data || []).map(normalizeMediaItem);
    const pagination = response.data.pagination;
    return {
      items,
      nextPage: pagination?.nextPage ?? null,
      hasNextPage: Boolean(pagination?.hasNextPage),
    };
  } catch (error) {
    if (!error.response) {
      const start = (page - 1) * limit;
      const items = demoTrainingVideos.slice(start, start + limit);
      const nextPage = start + limit < demoTrainingVideos.length ? page + 1 : null;
      return {
        items,
        nextPage,
        hasNextPage: Boolean(nextPage),
      };
    }
    throw error;
  }
}

export async function createTrainingVideo(data) {
  if (!data.videoUri && !data.thumbnailUri) {
    const response = await apiClient.post('/training-videos', {
      title: data.title,
      description: data.description,
      duration: data.duration,
      language: data.language,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
    });
    return normalizeMediaItem(response.data.data);
  }

  const formData = new FormData();
  ['title', 'description', 'duration', 'language', 'videoUrl', 'thumbnailUrl'].forEach((key) => {
    if (data[key]) formData.append(key, String(data[key]));
  });
  if (data.videoUri) {
    formData.append('video', createUploadFile(data.videoUri, {
      kind: 'video',
      fallbackName: 'training.mp4',
      fileName: data.videoUriName,
      mimeType: data.videoUriMimeType,
    }));
  }
  if (data.thumbnailUri) {
    formData.append('thumbnail', createUploadFile(data.thumbnailUri, {
      kind: 'image',
      fallbackName: 'thumbnail.jpg',
      fileName: data.thumbnailUriName,
      mimeType: data.thumbnailUriMimeType,
    }));
  }
  const response = await uploadForm('/training-videos', formData, { timeout: 300000 });
  return normalizeMediaItem(response.data);
}

export async function updateTrainingVideo(id, data) {
  if (!data.videoUri && !data.thumbnailUri) {
    const response = await apiClient.put(`/training-videos/${id}`, {
      title: data.title,
      description: data.description,
      duration: data.duration,
      language: data.language,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
    });
    return normalizeMediaItem(response.data.data);
  }

  const formData = new FormData();
  ['title', 'description', 'duration', 'language', 'videoUrl', 'thumbnailUrl'].forEach((key) => {
    if (data[key]) formData.append(key, String(data[key]));
  });
  if (data.videoUri) {
    formData.append('video', createUploadFile(data.videoUri, {
      kind: 'video',
      fallbackName: 'training.mp4',
      fileName: data.videoUriName,
      mimeType: data.videoUriMimeType,
    }));
  }
  if (data.thumbnailUri) {
    formData.append('thumbnail', createUploadFile(data.thumbnailUri, {
      kind: 'image',
      fallbackName: 'thumbnail.jpg',
      fileName: data.thumbnailUriName,
      mimeType: data.thumbnailUriMimeType,
    }));
  }
  const response = await uploadForm(`/training-videos/${id}`, formData, { method: 'PUT', timeout: 300000 });
  return normalizeMediaItem(response.data);
}

export async function deleteTrainingVideo(id) {
  const response = await apiClient.delete(`/training-videos/${id}`);
  return response.data;
}
