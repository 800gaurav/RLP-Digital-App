import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export const PERMISSION_ONBOARDING_KEY = 'permission_onboarding_completed';
export const DEFAULT_MEDIA_ALBUM = 'RLP Digital Connect';
export const POSTER_MEDIA_ALBUM = 'RLP Posters';

const WRITE_ONLY_ACCESS = true;
const ANDROID_MEDIA_PERMISSIONS: MediaLibrary.GranularPermission[] = ['photo', 'video'];

export type PermissionFlowStatus = 'granted' | 'needs_onboarding' | 'denied';

export type PermissionSnapshot = {
  accessPrivileges: MediaLibrary.PermissionResponse['accessPrivileges'] | null;
  canAskAgain: boolean;
  expires: MediaLibrary.PermissionResponse['expires'];
  granted: boolean;
  isMediaLibraryAvailable: boolean;
  onboardingCompleted: boolean;
  rawStatus: MediaLibrary.PermissionStatus | 'granted';
  status: PermissionFlowStatus;
};

export class PermissionManagerError extends Error {
  code: 'PERMISSION_REQUIRED' | 'MEDIA_LIBRARY_UNAVAILABLE';
  snapshot?: PermissionSnapshot;

  constructor(
    code: 'PERMISSION_REQUIRED' | 'MEDIA_LIBRARY_UNAVAILABLE',
    message: string,
    snapshot?: PermissionSnapshot,
  ) {
    super(message);
    this.name = 'PermissionManagerError';
    this.code = code;
    this.snapshot = snapshot;
  }
}

function buildSnapshot(
  permission: Pick<MediaLibrary.PermissionResponse, 'accessPrivileges' | 'canAskAgain' | 'expires' | 'granted' | 'status'>,
  onboardingCompleted: boolean,
  isMediaLibraryAvailable: boolean,
): PermissionSnapshot {
  if (permission.granted) {
    return {
      accessPrivileges: permission.accessPrivileges ?? null,
      canAskAgain: permission.canAskAgain,
      expires: permission.expires,
      granted: true,
      isMediaLibraryAvailable,
      onboardingCompleted,
      rawStatus: permission.status,
      status: 'granted',
    };
  }

  return {
    accessPrivileges: permission.accessPrivileges ?? null,
    canAskAgain: permission.canAskAgain,
    expires: permission.expires,
    granted: false,
    isMediaLibraryAvailable,
    onboardingCompleted,
    rawStatus: permission.status,
    status: onboardingCompleted ? 'denied' : 'needs_onboarding',
  };
}

async function getMediaPermission(
  mode: 'check' | 'request',
): Promise<MediaLibrary.PermissionResponse> {
  if (mode === 'request') {
    return MediaLibrary.requestPermissionsAsync(WRITE_ONLY_ACCESS, ANDROID_MEDIA_PERMISSIONS);
  }

  return MediaLibrary.getPermissionsAsync(WRITE_ONLY_ACCESS, ANDROID_MEDIA_PERMISSIONS);
}

export async function hasCompletedPermissionOnboarding(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const value = await AsyncStorage.getItem(PERMISSION_ONBOARDING_KEY);
  return value === 'true';
}

export async function markPermissionOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(PERMISSION_ONBOARDING_KEY, 'true');
}

export async function checkPermissions(): Promise<PermissionSnapshot> {
  if (Platform.OS === 'web') {
    return {
      accessPrivileges: 'all',
      canAskAgain: false,
      expires: 'never',
      granted: true,
      isMediaLibraryAvailable: true,
      onboardingCompleted: true,
      rawStatus: 'granted',
      status: 'granted',
    };
  }

  const onboardingCompleted = await hasCompletedPermissionOnboarding();
  const isMediaLibraryAvailable = await MediaLibrary.isAvailableAsync();

  if (!isMediaLibraryAvailable) {
    return {
      accessPrivileges: null,
      canAskAgain: false,
      expires: 'never',
      granted: false,
      isMediaLibraryAvailable: false,
      onboardingCompleted,
      rawStatus: MediaLibrary.PermissionStatus.UNDETERMINED,
      status: onboardingCompleted ? 'denied' : 'needs_onboarding',
    };
  }

  const permission = await getMediaPermission('check');
  return buildSnapshot(permission, onboardingCompleted, true);
}

export async function requestAllPermissions(): Promise<PermissionSnapshot> {
  if (Platform.OS === 'web') {
    return checkPermissions();
  }

  const isMediaLibraryAvailable = await MediaLibrary.isAvailableAsync();
  await markPermissionOnboardingCompleted();

  if (!isMediaLibraryAvailable) {
    return {
      accessPrivileges: null,
      canAskAgain: false,
      expires: 'never',
      granted: false,
      isMediaLibraryAvailable: false,
      onboardingCompleted: true,
      rawStatus: MediaLibrary.PermissionStatus.DENIED,
      status: 'denied',
    };
  }

  const permission = await getMediaPermission('request');
  return buildSnapshot(permission, true, true);
}

export async function ensureMediaSavePermission(): Promise<PermissionSnapshot> {
  const snapshot = await checkPermissions();

  if (!snapshot.isMediaLibraryAvailable) {
    throw new PermissionManagerError(
      'MEDIA_LIBRARY_UNAVAILABLE',
      'Media library is unavailable on this device.',
      snapshot,
    );
  }

  if (!snapshot.granted) {
    throw new PermissionManagerError(
      'PERMISSION_REQUIRED',
      'Media access is required to save content. Please enable it in Settings.',
      snapshot,
    );
  }

  return snapshot;
}

export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

export function isPermissionDeniedError(error: unknown): error is PermissionManagerError {
  return error instanceof PermissionManagerError && error.code === 'PERMISSION_REQUIRED';
}
