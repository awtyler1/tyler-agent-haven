import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireAdmin, isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

interface SendSetupLinkRequest {
  profileId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("Email service not configured");
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Verify the requesting user is an admin
    await requireAdmin(req, supabaseAdmin);

    const { profileId }: SendSetupLinkRequest = await req.json();

    if (!profileId) {
      throw new Error("Profile ID is required");
    }

    // Get the target profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, email, full_name, onboarding_status, setup_link_sent_at")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (!profile.email) {
      throw new Error("Profile has no email address");
    }

    let userId = profile.user_id;

    // If no user_id, create the auth user first
    if (!userId) {
      // Generate a random password (user won't know this - they'll set their own via recovery link)
      const tempPassword = crypto.randomUUID();

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: profile.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: profile.full_name },
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = newUser.user.id;

      // Link the user_id to the existing profile
      const { error: linkError } = await supabaseAdmin
        .from("profiles")
        .update({ user_id: userId })
        .eq("id", profileId);

      if (linkError) {
        throw new Error(`Failed to link user to profile: ${linkError.message}`);
      }

      // Assign the agent role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: 'independent_agent' });

      if (roleError) {
        console.error("Failed to assign role:", roleError);
        // Don't throw - role can be assigned manually if needed
      }

      console.log(`Created auth user ${userId} and linked to profile ${profileId}`);
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

    // Email template for imported/existing agents (not new contracting agents)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding: 40px;">
                    <p style="font-size: 18px; line-height: 1.6; color: #333333; margin: 0 0 24px 0;">
                      Hi ${firstName},
                    </p>

                    <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
                      We've been working on something to make your life easier — a single place to see your carrier appointments, track your certifications, and reach the team when you need us.
                    </p>

                    <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
                      Your account is ready. Just set your password to get in.
                    </p>

                    <table border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                      <tr>
                        <td style="background-color: #A38529; border-radius: 6px;">
                          <a href="${setupLink}" style="display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 600;">
                            Set Your Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 24px 0;">
                      Questions? Just reply to this email.
                    </p>

                    <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0;">
                      <strong>The Tyler Insurance Group Team</strong><br>
                      <a href="mailto:caroline@tylerinsurancegroup.com" style="color: #A38529; text-decoration: none;">caroline@tylerinsurancegroup.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send the setup email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Caroline Horn <caroline@tylerinsurancegroup.com>",
        to: [profile.email],
        subject: "Your Agent Account Is Ready",
        html: emailHtml,
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
      .eq("id", profileId);

    if (trackError) {
      console.error("Failed to update setup_link_sent_at:", trackError);
    }

    console.log("Setup link sent successfully to", profile.email);

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
  } catch (error: unknown) {
    console.error("Error in send-setup-link:", error);
    const status = isAuthError(error) ? getErrorStatus(error) : 400;
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
      }
    );
  }
});
