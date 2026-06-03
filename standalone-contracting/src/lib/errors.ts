/**
 * Error handling utilities for type-safe error management.
 * Use these functions to safely extract error information without `any` type.
 */

/**
 * Safely extract error message from unknown error type.
 * Handles Error objects, strings, and objects with message property.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    return typeof message === 'string' ? message : String(message);
  }
  return 'An unknown error occurred';
}

/**
 * Type guard to check if error is a Supabase-style error object.
 * Supabase errors typically have message and optional code properties.
 */
export function isSupabaseError(error: unknown): error is { message: string; code?: string; details?: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Check if error appears to be a network/connection error.
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('offline') ||
    message.includes('timeout')
  );
}

/**
 * Check if error appears to be an authentication error.
 */
export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('401') ||
    message.includes('unauthorized') ||
    message.includes('session') ||
    message.includes('not authenticated') ||
    message.includes('jwt')
  );
}

/**
 * Check if error appears to be a permission/authorization error.
 */
export function isPermissionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('403') ||
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('not allowed') ||
    message.includes('access denied')
  );
}

/**
 * Check if error appears to be a validation error.
 */
export function isValidationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('must be')
  );
}

/**
 * Check if error appears to be a rate limiting error.
 */
export function isRateLimitError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('throttle')
  );
}

/**
 * Get a user-friendly error message based on error type.
 * Maps technical errors to more helpful messages for users.
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
  if (isAuthError(error)) {
    return 'Your session has expired. Please refresh the page and log in again.';
  }
  if (isPermissionError(error)) {
    return 'You do not have permission to perform this action.';
  }
  if (isRateLimitError(error)) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (isValidationError(error)) {
    return getErrorMessage(error); // Validation errors are usually user-friendly
  }

  // For other errors, return the original message if it's reasonable
  const message = getErrorMessage(error);
  if (message.length < 100 && !message.includes('Error:')) {
    return message;
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Log error with context for debugging.
 * Use this instead of console.error for consistent logging.
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);

  // In development, log additional details
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error && error.stack) {
      console.error(`[${context}] Stack:`, error.stack);
    }
  }
}
