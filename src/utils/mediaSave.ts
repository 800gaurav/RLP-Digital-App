import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import {
  DEFAULT_MEDIA_ALBUM,
  POSTER_MEDIA_ALBUM,
  ensureMediaSavePermission,
} from '../services/PermissionManager';

type SaveOptions = {
  albumName?: string;
  fileName?: string;
};

function buildCacheUri(fileName: string) {
  const cacheRoot = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!cacheRoot) {
    throw new Error('No writable cache directory is available.');
  }

  return `${cacheRoot}${fileName}`;
}

function isRemoteUri(uri: string) {
  return /^https?:\/\//i.test(uri);
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-z0-9._-]/gi, '-');
}

async function ensureLocalFile(sourceUri: string, fileName: string) {
  if (!sourceUri) {
    throw new Error('A media file URI is required.');
  }

  if (Platform.OS === 'web') return sourceUri;
  if (!isRemoteUri(sourceUri)) return sourceUri;

  const targetUri = buildCacheUri(sanitizeFileName(fileName));
  const downloadResult = await FileSystem.downloadAsync(sourceUri, targetUri);
  if (downloadResult.status !== 200) {
    throw new Error(`Download failed with status ${downloadResult.status}.`);
  }

  return downloadResult.uri;
}

async function saveAssetToAlbum(localUri: string, albumName: string) {
  const existingAlbum = await MediaLibrary.getAlbumAsync(albumName);

  if (existingAlbum) {
    return MediaLibrary.createAssetAsync(localUri, existingAlbum);
  }

  return MediaLibrary.createAlbumAsync(albumName, undefined, false, localUri);
}

export async function downloadFileToCache(sourceUri: string, fileName: string) {
  return ensureLocalFile(sourceUri, fileName);
}

export async function saveImageToGallery(sourceUri: string, options: SaveOptions = {}) {
  await ensureMediaSavePermission();
  const localUri = await ensureLocalFile(
    sourceUri,
    options.fileName || `rlp-image-${Date.now()}.jpg`,
  );

  return saveAssetToAlbum(localUri, options.albumName || DEFAULT_MEDIA_ALBUM);
}

export async function saveVideoToGallery(sourceUri: string, options: SaveOptions = {}) {
  await ensureMediaSavePermission();
  const localUri = await ensureLocalFile(
    sourceUri,
    options.fileName || `rlp-video-${Date.now()}.mp4`,
  );

  return saveAssetToAlbum(localUri, options.albumName || DEFAULT_MEDIA_ALBUM);
}

export async function savePosterToGallery(sourceUri: string, options: SaveOptions = {}) {
  return saveImageToGallery(sourceUri, {
    albumName: options.albumName || POSTER_MEDIA_ALBUM,
    fileName: options.fileName || `rlp-poster-${Date.now()}.png`,
  });
}
