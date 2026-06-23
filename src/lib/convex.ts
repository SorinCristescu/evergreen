/** Single Convex client for the app. URL is injected at build time via EXPO_PUBLIC_CONVEX_URL. */
import { ConvexReactClient } from 'convex/react';

const url = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!url) {
  throw new Error(
    'Missing EXPO_PUBLIC_CONVEX_URL. Run `npx convex dev` and copy the deployment URL into .env.',
  );
}

export const convex = new ConvexReactClient(url, { unsavedChangesWarning: false });
