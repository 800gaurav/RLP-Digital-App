import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearTokens } from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: user !== null }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: async () => {
        set({ user: null, isAuthenticated: false, isLoading: false });
        await clearTokens();
      },
    }),
    {
      name: 'rlp-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
