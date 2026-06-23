// Convex injects environment variables (set via `npx convex env set …`) at runtime in actions.
// Declared here so the Convex typechecker accepts `process.env.X` without pulling in @types/node.
declare const process: { readonly env: Record<string, string | undefined> };
