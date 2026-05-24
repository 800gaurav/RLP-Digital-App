import { useCallback, useEffect, useState } from 'react';
import {
  checkPermissions as checkPermissionsService,
  requestAllPermissions as requestAllPermissionsService,
  type PermissionSnapshot,
} from '../services/PermissionManager';

type UsePermissionsState = {
  loading: boolean;
  permissions: PermissionSnapshot | null;
};

export function usePermissions() {
  const [{ loading, permissions }, setState] = useState<UsePermissionsState>({
    loading: true,
    permissions: null,
  });

  const checkPermissions = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    try {
      const snapshot = await checkPermissionsService();
      setState({ loading: false, permissions: snapshot });
      return snapshot;
    } catch (error) {
      setState((current) => ({ ...current, loading: false }));
      throw error;
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    try {
      const snapshot = await requestAllPermissionsService();
      setState({ loading: false, permissions: snapshot });
      return snapshot;
    } catch (error) {
      setState((current) => ({ ...current, loading: false }));
      throw error;
    }
  }, []);

  useEffect(() => {
    checkPermissions().catch(() => {});
  }, [checkPermissions]);

  return {
    checkPermissions,
    loading,
    permissions,
    requestAllPermissions,
  };
}

export const checkPermissions = checkPermissionsService;
export const requestAllPermissions = requestAllPermissionsService;
