import { API_BASE_URL } from './config';

const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');

function remapUploadUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.pathname?.startsWith('/uploads/')) {
      return `${apiOrigin}${parsedUrl.pathname}${parsedUrl.search || ''}`;
    }
    return url;
  } catch (_error) {
    return url;
  }
}

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl === 'null' || trimmedUrl === 'undefined') return '';
  if (trimmedUrl.startsWith('/uploads/')) return `${apiOrigin}${trimmedUrl}`;
  if (trimmedUrl.startsWith('uploads/')) return `${apiOrigin}/${trimmedUrl}`;
  const localhostRewritten = trimmedUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/i, apiOrigin);
  return remapUploadUrl(localhostRewritten);
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
