import { Stack } from 'expo-router';

/**
 * App stack: the (tabs) group hosts the four main tabs + custom tab bar; every other route
 * (capture, plant, messages, notifications, report, profile/*) pushes on top as a stack screen,
 * so the back button reliably returns to the previous screen.
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
