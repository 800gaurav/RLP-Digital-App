import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { apiClient } from './api';
import { demoReels } from './mockData';
import { normalizeMediaItem, resolveMediaUrl } from './media';
import { createUploadFile, uploadForm } from './upload';

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
  return normalizeMediaItem(response.data);
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
  return normalizeMediaItem(response.data);
}

export async function deleteReel(id) {
  const response = await apiClient.delete(`/reels/${id}`);
  return response.data;
}

export async function downloadReel(reel) {
  const mediaUrl = resolveMediaUrl(reel.mediaUrl);
  if (!mediaUrl) throw new Error('Media URL is missing');
  const extension = reel.mediaType === 'video' ? 'mp4' : 'jpg';
  let filename = (mediaUrl.split('/').pop()?.split('?')[0]) || `reel-${reel.id}.${extension}`;
  if (!filename.includes('.')) filename = `${filename}.${extension}`;
  const localUri = `${FileSystem.cacheDirectory}${filename}`;
  const downloadResult = await FileSystem.downloadAsync(mediaUrl, localUri);
  if (downloadResult.status !== 200) throw new Error(`Download failed: ${downloadResult.status}`);

  try {
    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);
    if (status !== 'granted') throw new Error('Media library permission not granted');
    const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
    const albumName = 'RLP Digital Connect';
    const album = await MediaLibrary.getAlbumAsync(albumName);
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      await MediaLibrary.createAlbumAsync(albumName, asset, false);
    }
    return { savedTo: 'gallery' };
  } catch (galleryError) {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) throw galleryError;
    await Sharing.shareAsync(downloadResult.uri, {
      mimeType: reel.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      dialogTitle: 'Save Status',
    });
    return { savedTo: 'share' };
  }
}
