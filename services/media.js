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
  const thumbnailUrl = resolveMediaUrl(item.thumbnailUrl);
  const videoUrl = resolveMediaUrl(item.videoUrl);
  const imageUrl = resolveMediaUrl(item.imageUrl);
  const rawMediaUrl = resolveMediaUrl(item.mediaUrl);
  const mediaUrl = item.mediaType === 'video'
    ? (videoUrl || rawMediaUrl || thumbnailUrl)
    : (imageUrl || rawMediaUrl || thumbnailUrl);

  return {
    ...item,
    profilePhoto: resolveMediaUrl(item.profilePhoto),
    photoUrl: resolveMediaUrl(item.photoUrl),
    mediaUrl,
    thumbnailUrl,
    videoUrl,
    imageUrl,
  };
}
