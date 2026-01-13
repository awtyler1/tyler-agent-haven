/**
 * Shared authentication utilities for edge functions.
 * Provides consistent auth patterns across all protected endpoints.
 */

import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.49.2";

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'independent_agent' | 'internal_tig_agent';

/**
 * Custom error class for authentication/authorization failures.
 * Includes HTTP status code for proper error responses.
 */
export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Create a Supabase admin client with service role key.
 * Use this for operations that require elevated permissions.
 */
export function createSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new AuthError("Missing Supabase configuration", 500);
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Extract and validate the authenticated user from request headers.
 * Throws AuthError if no valid authorization is present.
 */
export async function getAuthenticatedUser(req: Request, supabase: SupabaseClient): Promise<User> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthError("No authorization header", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("Unauthorized", 401);
  }

  return user;
}

/**
 * Verify user has one of the specified roles.
 * Throws AuthError if user doesn't have required role.
 */
export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  allowedRoles: AppRole[]
): Promise<AppRole> {
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", allowedRoles);

  if (error) {
    console.error("Error checking roles:", error);
    throw new AuthError("Failed to verify permissions", 500);
  }

  if (!roles || roles.length === 0) {
    throw new AuthError(`Required role: ${allowedRoles.join(' or ')}`, 403);
  }

  return roles[0].role as AppRole;
}

/**
 * Require admin or super_admin role.
 * Use for endpoints that any admin can access.
 */
export async function requireAdmin(req: Request, supabase: SupabaseClient): Promise<User> {
  const user = await getAuthenticatedUser(req, supabase);
  await requireRole(supabase, user.id, ['super_admin', 'admin']);
  return user;
}

/**
 * Require super_admin role only.
 * Use for sensitive operations like system configuration.
 */
export async function requireSuperAdmin(req: Request, supabase: SupabaseClient): Promise<User> {
  const user = await getAuthenticatedUser(req, supabase);
  await requireRole(supabase, user.id, ['super_admin']);
  return user;
}

/**
 * Require any authenticated user.
 * Use for endpoints that any logged-in user can access.
 */
export async function requireAuthenticated(req: Request, supabase: SupabaseClient): Promise<User> {
  return getAuthenticatedUser(req, supabase);
}

/**
 * Check if an error is an AuthError.
 * Useful for catch blocks to determine appropriate response.
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Get the appropriate HTTP status code for an error.
 * Returns AuthError's statusCode if applicable, otherwise 500.
 */
export function getErrorStatus(error: unknown): number {
  if (isAuthError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Get error message safely from unknown error type.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
