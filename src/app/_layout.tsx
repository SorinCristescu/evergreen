import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useConvexAuth, useMutation } from 'convex/react';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api } from '@/convex/_generated/api';
import { useAppFonts } from '@/constants/fonts';
import { SelectedLocationProvider } from '@/data';
import { convex } from '@/lib/convex';
import { ThemeProvider, useTheme, useThemeControls } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Provisions the Convex `users` row once Clerk auth lands (queries can't self-provision). */
function EnsureUser() {
  const { isAuthenticated } = useConvexAuth();
  const ensureUser = useMutation(api.users.ensureUser);
  const done = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !done.current) {
      done.current = true;
      void ensureUser({});
    }
    if (!isAuthenticated) done.current = false;
  }, [isAuthenticated, ensureUser]);
  return null;
}

/** Inner shell — consumes the active theme so the nav background, status bar and Stack
 *  content background all flip with the app theme. */
function AppShell() {
  const t = useTheme();
  const { name } = useThemeControls();

  const navTheme = {
    ...(name === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(name === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: t.canvas,
      card: t.canvas,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <BottomSheetModalProvider>
        <EnsureUser />
        <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
        <SelectedLocationProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.canvas } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </SelectedLocationProvider>
      </BottomSheetModalProvider>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (!clerkPublishableKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Create a Clerk app and copy the publishable key into .env.',
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ThemeProvider>
              <AppShell />
            </ThemeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
