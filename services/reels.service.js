import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { apiClient } from './api';
import { demoReels } from './mockData';

export async function getReels() {
  try {
    const response = await apiClient.get('/reels');
    return response.data.data;
  } catch (error) {
    // TODO: Replace demo reels with admin-uploaded media from /reels.
    if (!error.response) return demoReels;
    throw error;
  }
}

export async function createReel({ caption, mediaUri, mediaType }) {
  const formData = new FormData();
  formData.append('caption', caption);
  if (mediaType) formData.append('mediaType', mediaType);
  if (mediaUri) {
    const filename = mediaUri.split('/').pop() || 'rlp-status.jpg';
    const ext = filename.split('.').pop() || 'jpg';
    const type = mediaType === 'video' ? `video/${ext}` : `image/${ext}`;
    formData.append('media', { uri: mediaUri, name: filename, type });
  }
  const response = await apiClient.post('/reels', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function downloadReel(reel) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Media library permission not granted');
  const filename = reel.mediaUrl.split('/').pop() ?? `reel-${reel.id}`;
  const localUri = `${FileSystem.cacheDirectory}${filename}`;
  const downloadResult = await FileSystem.downloadAsync(reel.mediaUrl, localUri);
  if (downloadResult.status !== 200) throw new Error(`Download failed: ${downloadResult.status}`);
  const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
  const albumName = 'RLP Digital Connect';
  const album = await MediaLibrary.getAlbumAsync(albumName);
  if (album) {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  } else {
    await MediaLibrary.createAlbumAsync(albumName, asset, false);
  }
}
