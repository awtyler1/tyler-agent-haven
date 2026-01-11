import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

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

interface SendSetupLinkRequest {
  userId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("Email service not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the requesting user is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Only super admins can send setup links
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin");

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized: Super admin role required");
    }

    const { userId }: SendSetupLinkRequest = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Get the target user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, setup_link_sent_at")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("User not found");
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://www.tigagenthub.com";

    // Generate a password recovery link so user can set their own password
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      options: {
        redirectTo: `${siteUrl}/auth/set-password`,
      }
    });

    if (linkError) {
      console.error("Failed to generate recovery link:", linkError);
      throw new Error(`Failed to generate setup link: ${linkError.message}`);
    }

    const setupLink = linkData.properties.action_link;
    const firstName = profile.full_name?.split(' ')[0] || 'there';

    // Send the setup email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Caroline Tyler <caroline@tylerinsurancegroup.com>",
        to: [profile.email],
        subject: "Your Agent Account Is Ready",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); overflow: hidden;">

                    <!-- Header with TIG Logo -->
                    <tr>
                      <td align="center" style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #f1f5f9;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" valign="middle" style="width: 56px; height: 56px; background-color: #D4A855; border-radius: 50%; text-align: center; vertical-align: middle;">
                              <span style="color: #ffffff; font-size: 18px; font-weight: bold; font-family: Arial, sans-serif;">TIG</span>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-top: 12px;">
                              <span style="font-size: 14px; color: #64748b; font-weight: 500;">Tyler Insurance Group</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 32px 40px 40px 40px;">
                        <p style="font-size: 18px; color: #1e293b; margin: 0 0 20px 0;">Hi ${firstName},</p>

                        <p style="font-size: 16px; color: #475569; margin: 0 0 24px 0;">Your agent account is set up and ready for activation.</p>

                        <!-- Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 8px 0 32px 0;">
                              <!--[if mso]>
                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${setupLink}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" fillcolor="#F59E0B" stroke="f">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Activate Your Account</center>
                              </v:roundrect>
                              <![endif]-->
                              <!--[if !mso]><!-->
                              <a href="${setupLink}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);">Activate Your Account</a>
                              <!--<![endif]-->
                            </td>
                          </tr>
                        </table>

                        <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0;">When you sign in, you'll land on the <strong style="color: #1e293b;">Contracting</strong> page. This guides you through everything needed before your full agent tools unlock.</p>

                        <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px 0; font-weight: 600;">You'll be able to:</p>

                        <!-- Bullet List -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
                          <tr>
                            <td style="font-size: 15px; color: #475569; padding: 6px 0 6px 0;">
                              <span style="color: #F59E0B; margin-right: 8px;">●</span> Download required forms
                            </td>
                          </tr>
                          <tr>
                            <td style="font-size: 15px; color: #475569; padding: 6px 0 6px 0;">
                              <span style="color: #F59E0B; margin-right: 8px;">●</span> Upload your documents
                            </td>
                          </tr>
                          <tr>
                            <td style="font-size: 15px; color: #475569; padding: 6px 0 6px 0;">
                              <span style="color: #F59E0B; margin-right: 8px;">●</span> Track what's complete and what needs attention
                            </td>
                          </tr>
                        </table>

                        <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0;">Once everything is finished, the rest of your platform opens automatically.</p>

                        <p style="font-size: 15px; color: #475569; margin: 0 0 28px 0;">Questions? Just reply to this email.</p>

                        <!-- Divider -->
                        <div style="border-top: 1px solid #e2e8f0; margin: 0 0 24px 0;"></div>

                        <!-- Signature -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <p style="font-size: 15px; color: #1e293b; margin: 0 0 4px 0; font-weight: 600;">Caroline</p>
                              <p style="font-size: 14px; color: #64748b; margin: 0 0 2px 0;">Head of Contracting</p>
                              <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0;">Tyler Insurance Group</p>
                              <a href="mailto:caroline@tylerinsurancegroup.com" style="font-size: 14px; color: #F59E0B; text-decoration: none;">caroline@tylerinsurancegroup.com</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td align="center" style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                          © ${new Date().getFullYear()} Tyler Insurance Group. All rights reserved.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Failed to send setup email:", errorText);
      throw new Error("Failed to send setup email");
    }

    // Update the profile to track when setup link was sent
    const { error: trackError } = await supabaseAdmin
      .from("profiles")
      .update({ setup_link_sent_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (trackError) {
      console.error("Failed to update setup_link_sent_at:", trackError);
    }

    console.log("Setup link sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Setup link sent successfully" 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-setup-link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } 
      }
    );
  }
});
