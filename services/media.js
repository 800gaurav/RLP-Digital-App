import { API_BASE_URL } from './config';

const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl === 'null' || trimmedUrl === 'undefined') return '';
  if (trimmedUrl.startsWith('/uploads/')) return `${apiOrigin}${trimmedUrl}`;
  if (trimmedUrl.startsWith('uploads/')) return `${apiOrigin}/${trimmedUrl}`;
  return trimmedUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/i, apiOrigin);
}

export function getUserProfilePhoto(user) {
  if (!user) return '';
  return resolveMediaUrl(
    user.profilePhoto
      || user.profilePhotoUrl
      || user.profileImage
      || user.profileImageUrl
      || user.avatar
      || user.avatarUrl
      || user.photo
      || user.photoUrl
      || user.imageUrl,
  );
}

export function normalizeUserMedia(user) {
  if (!user) return user;
  return { ...user, profilePhoto: getUserProfilePhoto(user) };
}

export function normalizeMediaItem(item) {
  if (!item) return item;
  return {
    ...item,
    profilePhoto: resolveMediaUrl(item.profilePhoto),
    photoUrl: resolveMediaUrl(item.photoUrl),
    mediaUrl: resolveMediaUrl(item.mediaUrl),
    thumbnailUrl: resolveMediaUrl(item.thumbnailUrl),
    videoUrl: resolveMediaUrl(item.videoUrl),
    imageUrl: resolveMediaUrl(item.imageUrl),
  };
}
