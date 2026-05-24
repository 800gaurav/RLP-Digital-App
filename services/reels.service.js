import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from './api';
import { demoReels } from './mockData';
import { normalizeMediaItem, resolveMediaUrl } from './media';
import { createUploadFile, uploadForm } from './upload';
import { saveImageToGallery, saveVideoToGallery } from '../src/utils/mediaSave';

export async function getReels() {
  try {
    const response = await apiClient.get('/reels');
    return response.data.data.map(normalizeMediaItem);
  } catch (error) {
    // TODO: Replace demo reels with admin-uploaded media from /reels.
    if (!error.response) return demoReels;
    throw error;
  }
}

export async function getReelsPage({ page = 1, limit = 10 } = {}) {
  try {
    const response = await apiClient.get('/reels', { params: { page, limit } });
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
      const items = demoReels.slice(start, start + limit);
      const nextPage = start + limit < demoReels.length ? page + 1 : null;
      return {
        items,
        nextPage,
        hasNextPage: Boolean(nextPage),
      };
    }
    throw error;
  }
}

export async function createReel({ caption, mediaUri, mediaType, mediaUriName, mediaUriMimeType }) {
  if (!mediaUri) {
    const response = await apiClient.post('/reels', { caption: caption || '', mediaType });
    return normalizeMediaItem(response.data.data);
  }

  const formData = new FormData();
  formData.append('caption', caption || '');
  if (mediaType) formData.append('mediaType', mediaType);
  if (mediaUri) {
    formData.append('media', createUploadFile(mediaUri, {
      kind: mediaType === 'video' ? 'video' : 'image',
      fallbackName: mediaType === 'video' ? 'rlp-status.mp4' : 'rlp-status.jpg',
      fileName: mediaUriName,
      mimeType: mediaUriMimeType,
    }));
  }
  const response = await uploadForm('/reels', formData, { timeout: 300000 });
  return normalizeMediaItem(response.data.data);
}

export async function updateReel(id, { caption, mediaUri, mediaType, mediaUriName, mediaUriMimeType }) {
  if (!mediaUri) {
    const response = await apiClient.put(`/reels/${id}`, { caption: caption || '', mediaType });
    return normalizeMediaItem(response.data.data);
  }

  const formData = new FormData();
  formData.append('caption', caption || '');
  if (mediaType) formData.append('mediaType', mediaType);
  if (mediaUri) {
    formData.append('media', createUploadFile(mediaUri, {
      kind: mediaType === 'video' ? 'video' : 'image',
      fallbackName: mediaType === 'video' ? 'rlp-status.mp4' : 'rlp-status.jpg',
      fileName: mediaUriName,
      mimeType: mediaUriMimeType,
    }));
  }
  const response = await uploadForm(`/reels/${id}`, formData, { method: 'PUT', timeout: 300000 });
  return normalizeMediaItem(response.data.data);
}

export async function deleteReel(id) {
  const response = await apiClient.delete(`/reels/${id}`);
  return response.data;
}

export async function downloadReel(reel) {
  const mediaUrl = resolveMediaUrl(reel.videoUrl || reel.imageUrl || reel.mediaUrl);
  if (!mediaUrl) throw new Error('Media URL is missing');
  const extension = reel.mediaType === 'video' ? 'mp4' : 'webp';
  let filename = (mediaUrl.split('/').pop()?.split('?')[0]) || `reel-${reel.id}.${extension}`;
  if (!filename.includes('.')) filename = `${filename}.${extension}`;
  const localUri = `${FileSystem.cacheDirectory}${filename}`;
  const downloadResult = await FileSystem.downloadAsync(mediaUrl, localUri);
  if (downloadResult.status !== 200) throw new Error(`Download failed: ${downloadResult.status}`);

  if (reel.mediaType === 'video') {
    await saveVideoToGallery(downloadResult.uri, { fileName: filename });
  } else {
    await saveImageToGallery(downloadResult.uri, { fileName: filename });
  }

  return { savedTo: 'gallery' };
}
