/**
 * Microsoft Send Email
 * 
 * Sends an email via Microsoft Graph API using the user's connected Outlook account.
 * Supports attachments and saves to the user's Sent folder.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "https://www.tigagenthub.com",
  "https://tigagenthub.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

interface Attachment {
  name: string;
  contentType: string;
  contentBytes: string; // Base64 encoded
}

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
  agentId?: string; // For logging purposes
  communicationType?: string; // 'initial_contracting' | 'resend_link' | 'other'
  carriersIncluded?: string[]; // For logging
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
  const tenantId = Deno.env.get("MICROSOFT_TENANT_ID");

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "openid profile email Mail.Send offline_access",
      }),
    }
  );

  if (!response.ok) {
    console.error("Failed to refresh token:", await response.text());
    return null;
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user with anon key
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const emailRequest: EmailRequest = await req.json();
    const { to, subject, body, attachments, agentId, communicationType, carriersIncluded } = emailRequest;

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Get user's Microsoft tokens using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("microsoft_oauth_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ 
          error: "Outlook not connected", 
          code: "OUTLOOK_NOT_CONNECTED",
          message: "Please connect your Outlook account first" 
        }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    let accessToken = tokenData.access_token_encrypted; // TODO: Decrypt

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow) {
      const newTokens = await refreshAccessToken(tokenData.refresh_token_encrypted);
      
      if (!newTokens) {
        return new Response(
          JSON.stringify({ 
            error: "Token refresh failed", 
            code: "TOKEN_REFRESH_FAILED",
            message: "Please reconnect your Outlook account" 
          }),
          { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Update tokens in database
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
      
      await supabaseAdmin
        .from("microsoft_oauth_tokens")
        .update({
          access_token_encrypted: newTokens.access_token,
          refresh_token_encrypted: newTokens.refresh_token,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      accessToken = newTokens.access_token;
    }

    // Build the email message for Microsoft Graph
    const graphMessage: any = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: true, // Save to Sent folder
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      graphMessage.message.attachments = attachments.map((att) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.contentBytes,
      }));
    }

    // Send email via Microsoft Graph
    const sendResponse = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphMessage),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("Microsoft Graph send failed:", sendResponse.status, errorText);
      
      // Check if it's an auth error
      if (sendResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: "Authentication failed", 
            code: "AUTH_FAILED",
            message: "Please reconnect your Outlook account" 
          }),
          { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Log the communication in our database
    if (agentId) {
      const { error: logError } = await supabaseAdmin
        .from("contracting_communications")
        .insert({
          agent_id: agentId,
          communication_type: communicationType || "other",
          recipient_email: to,
          subject: subject,
          body_html: body,
          carriers_included: carriersIncluded || [],
          attachments: attachments?.map(a => a.name) || [],
          sent_by: user.id,
          sent_at: new Date().toISOString(),
        });

      if (logError) {
        console.error("Failed to log communication");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        sentAt: new Date().toISOString()
      }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});

