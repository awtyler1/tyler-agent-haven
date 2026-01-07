/**
 * Microsoft OAuth Callback
 * 
 * Handles the redirect from Microsoft after user authorizes.
 * Exchanges the authorization code for access/refresh tokens.
 * Stores tokens in the database for later use.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Get environment variables
    const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
    const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    const tenantId = Deno.env.get("MICROSOFT_TENANT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Your frontend URL for redirecting after OAuth
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://tyler-agent-haven.vercel.app";

    // Handle errors from Microsoft
    if (error) {
      console.error("Microsoft OAuth error:", error, errorDescription);
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent(errorDescription || error)}`,
        302
      );
    }

    if (!code || !state) {
      console.error("Missing code or state");
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Missing authorization code")}`,
        302
      );
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error("Invalid state:", e);
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Invalid state parameter")}`,
        302
      );
    }

    const { userId, timestamp } = stateData;

    // Check state isn't too old (10 minutes max)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Authorization expired, please try again")}`,
        302
      );
    }

    // Exchange code for tokens
    const redirectUri = `${supabaseUrl}/functions/v1/microsoft-oauth-callback`;
    
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          code: code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          scope: "openid profile email Mail.Send offline_access",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Failed to get access token")}`,
        302
      );
    }

    const tokens = await tokenResponse.json();
    console.log("Token exchange successful, got access token and refresh token");

    // Get user info from Microsoft to store their email
    const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    let microsoftEmail = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      microsoftEmail = userInfo.mail || userInfo.userPrincipalName;
      console.log("Connected Microsoft account:", microsoftEmail);
    }

    // Store tokens in database using service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert tokens (insert or update if exists)
    const { error: upsertError } = await supabaseAdmin
      .from("microsoft_oauth_tokens")
      .upsert({
        user_id: userId,
        access_token_encrypted: tokens.access_token, // TODO: Add encryption
        refresh_token_encrypted: tokens.refresh_token, // TODO: Add encryption
        expires_at: expiresAt,
        scope: tokens.scope,
        microsoft_email: microsoftEmail,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Failed to store tokens:", upsertError);
      return Response.redirect(
        `${frontendUrl}/admin/settings?error=${encodeURIComponent("Failed to save authorization")}`,
        302
      );
    }

    console.log("Tokens stored successfully for user:", userId);

    // Redirect back to frontend with success
    return Response.redirect(
      `${frontendUrl}/admin/settings?outlook_connected=true`,
      302
    );

  } catch (error) {
    console.error("OAuth callback error:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://tyler-agent-haven.vercel.app";
    return Response.redirect(
      `${frontendUrl}/admin/settings?error=${encodeURIComponent("An unexpected error occurred")}`,
      302
    );
  }
});

