import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.rlpGreen },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" options={{ animation: 'none' }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-payment" />
    </Stack>
  );
}
