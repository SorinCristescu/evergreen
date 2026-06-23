/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as careTasks from "../careTasks.js";
import type * as community from "../community.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_care from "../lib/care.js";
import type * as lib_mappers from "../lib/mappers.js";
import type * as locations from "../locations.js";
import type * as plants from "../plants.js";
import type * as seed from "../seed.js";
import type * as spaces from "../spaces.js";
import type * as treatments from "../treatments.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  careTasks: typeof careTasks;
  community: typeof community;
  "lib/access": typeof lib_access;
  "lib/auth": typeof lib_auth;
  "lib/care": typeof lib_care;
  "lib/mappers": typeof lib_mappers;
  locations: typeof locations;
  plants: typeof plants;
  seed: typeof seed;
  spaces: typeof spaces;
  treatments: typeof treatments;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
