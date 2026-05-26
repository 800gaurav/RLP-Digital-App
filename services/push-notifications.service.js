import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { savePushToken } from './user.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const screenRoutes = {
  Notifications: '/notifications',
  Status: '/(tabs)/status',
  TrainingVideos: '/training-videos',
  PosterTemplates: '/(tabs)/poster-maker',
};

const typeRoutes = {
  notification: screenRoutes.Notifications,
  status: screenRoutes.Status,
  training_video: screenRoutes.TrainingVideos,
  poster_template: screenRoutes.PosterTemplates,
};

function getProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
}

function getRouteFromNotificationData(data = {}) {
  return screenRoutes[data.screen] || typeRoutes[data.type] || null;
}

export function navigateFromNotificationData(data = {}) {
  const route = getRouteFromNotificationData(data);
  if (!route) return;
  router.push(route);
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    console.log('[push] Web platform par Expo push token skip kiya');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[push] Push token ke liye real Android/iOS device required hai');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD400',
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;
  if (existingPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] User ne notification permission allow nahi ki');
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.error('[push] Expo projectId missing hai. app.json me extra.eas.projectId check karein.');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  console.log('[push] Expo push token generated', { tokenTail: token.slice(-10) });
  return token;
}

export async function registerAndSavePushToken() {
  const token = await registerForPushNotificationsAsync();
  if (!token) return null;

  await savePushToken(token);
  console.log('[push] Expo push token backend par save ho gaya');
  return token;
}

export function setupNotificationListeners() {
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    const title = notification.request.content.title || 'RLP Digital';
    const body = notification.request.content.body || 'Naya update available hai.';
    console.log('[push] Foreground notification received', notification.request.content.data);
    Alert.alert(title, body);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    console.log('[push] Notification tapped', data);
    navigateFromNotificationData(data);
  });

  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data) navigateFromNotificationData(data);
    })
    .catch((error) => console.error('[push] Last notification response read failed', error));

  return () => {
    Notifications.removeNotificationSubscription(receivedSubscription);
    Notifications.removeNotificationSubscription(responseSubscription);
  };
}
