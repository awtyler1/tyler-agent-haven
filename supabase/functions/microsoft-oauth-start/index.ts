/**
 * Microsoft OAuth Start
 * 
 * Redirects the user to Microsoft's login page to authorize the app.
 * After login, Microsoft redirects back to microsoft-oauth-callback.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Get environment variables
    const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
    const tenantId = Deno.env.get("MICROSOFT_TENANT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    
    if (!clientId || !tenantId) {
      throw new Error("Missing Microsoft OAuth configuration");
    }

    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Build the redirect URI
    const redirectUri = `${supabaseUrl}/functions/v1/microsoft-oauth-callback`;
    
    // Build state parameter (includes user ID for security)
    const state = btoa(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      nonce: crypto.randomUUID()
    }));

    // Build Microsoft OAuth URL
    const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("scope", "openid profile email Mail.Send offline_access");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "consent"); // Always show consent to ensure refresh token

    console.log("Redirecting to Microsoft OAuth:", authUrl.toString());

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { 
        status: 200, 
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("OAuth start error:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
