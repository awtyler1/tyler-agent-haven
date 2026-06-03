/**
 * Shared CORS configuration for all edge functions.
 * Single source of truth for allowed origins and CORS headers.
 */

export const ALLOWED_ORIGINS = [
  "https://www.tigagenthub.com",
  "https://tigagenthub.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

/**
 * Generate CORS headers based on the request origin.
 * Returns headers that allow the request origin if it's in the allowed list,
 * otherwise defaults to the first allowed origin.
 */
export function getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin") || "";
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

/**
 * Handle CORS preflight OPTIONS requests.
 * Use this at the beginning of your edge function to handle OPTIONS.
 */
export function handleCorsOptions(req: Request): Response {
  return new Response(null, { headers: getCorsHeaders(req) });
}

/**
 * Create a JSON response with CORS headers.
 * Convenience function for returning JSON data with proper CORS.
 */
export function corsJsonResponse(
  req: Request,
  data: unknown,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(req),
    },
  });
}

/**
 * Create an error response with CORS headers.
 * Convenience function for returning errors with proper CORS.
 */
export function corsErrorResponse(
  req: Request,
  error: string,
  status: number = 400
): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(req),
    },
  });
}
