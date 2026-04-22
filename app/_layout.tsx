import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  useFonts,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AxisColors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

const axisTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: AxisColors.background,
    card: AxisColors.surface,
    text: AxisColors.textPrimary,
    border: AxisColors.border,
    primary: AxisColors.primary,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

function RouteGate() {
  const { session, loading } = useSession();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const group = segments[0];
    const sub = segments[1];
    const inAuth = group === '(auth)';
    const onOnboarding = inAuth && sub === 'onboarding';

    if (!session && !inAuth) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuth && !onOnboarding) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[botId]" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SessionProvider>
      <ThemeProvider value={axisTheme}>
        <RouteGate />
        <StatusBar style="light" />
      </ThemeProvider>
    </SessionProvider>
  );
}
