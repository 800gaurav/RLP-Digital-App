import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Colors } from '../constants/colors';
import { useAuthStore } from '../store/auth.store';
import { registerAndSavePushToken, setupNotificationListeners } from '../services/push-notifications.service';
import { setRootNavigationReady } from '../services/navigation';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
  },
});

function NotificationManager() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id || state.user?._id);

  useEffect(() => setupNotificationListeners(), []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    registerAndSavePushToken().catch((error) => console.error('[push] Token register/save failed', error));
  }, [isAuthenticated, userId]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    setRootNavigationReady(true);
    return () => setRootNavigationReady(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationManager />
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      />
    </QueryClientProvider>
  );
}
