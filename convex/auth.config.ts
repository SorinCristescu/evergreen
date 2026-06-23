/**
 * Convex auth — trusts Clerk-issued JWTs.
 * Requires a Clerk JWT template named "convex" (applicationID below must match its `aud`/name),
 * and the Convex deployment env var CLERK_JWT_ISSUER_DOMAIN = your Clerk Frontend API URL.
 */
// Convex provides `process.env` at runtime; declare it for the typecheck (no @types/node here).
declare const process: { env: Record<string, string | undefined> };

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
};
