/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_createAccountAction from "../actions/createAccountAction.js";
import type * as actions_emailLoginAction from "../actions/emailLoginAction.js";
import type * as queries_getUserByEmail from "../queries/getUserByEmail.js";
import type * as services_emailService from "../services/emailService.js";
import type * as users_createAccount from "../users/createAccount.js";
import type * as utils_name from "../utils/name.js";
import type * as utils_validation from "../utils/validation.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/createAccountAction": typeof actions_createAccountAction;
  "actions/emailLoginAction": typeof actions_emailLoginAction;
  "queries/getUserByEmail": typeof queries_getUserByEmail;
  "services/emailService": typeof services_emailService;
  "users/createAccount": typeof users_createAccount;
  "utils/name": typeof utils_name;
  "utils/validation": typeof utils_validation;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
