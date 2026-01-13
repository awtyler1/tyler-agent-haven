import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireAdmin, isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

interface CreateAdminRequest {
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  sendSetupEmail?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.tigagenthub.com";

    const supabaseAdmin = createSupabaseAdmin();

    // Verify the requesting user is an admin
    await requireAdmin(req, supabaseAdmin);

    const { 
      email, 
      fullName, 
      role,
      sendSetupEmail = true
    }: CreateAdminRequest = await req.json();

    if (!email || !fullName || !role) {
      throw new Error("Email, full name, and role are required");
    }

    // Generate a random password
    const tempPassword = crypto.randomUUID();

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    // Update profile - admins are always APPOINTED (no contracting needed)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        email: email,
        onboarding_status: 'APPOINTED',
      })
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Failed to update admin profile");
    }

    // Assign the role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role });

    if (roleError) {
      console.error("Failed to assign admin role");
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    // Send setup email
    let emailSent = false;
    if (sendSetupEmail && resendApiKey) {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${siteUrl}/auth/set-password`,
        }
      });

      if (linkError) {
        console.error("Failed to generate setup link");
        throw new Error(`Failed to generate setup link: ${linkError.message}`);
      }

      const setupLink = linkData.properties.action_link;
      const firstName = fullName.split(' ')[0] || 'there';

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Austin Tyler <austin@tylerinsurancegroup.com>",
          to: [email],
          subject: "Your TIG Admin Account",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8f7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                  <div style="text-align: center; margin-bottom: 32px;">
                    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 16px;">
                      <tr>
                        <td align="center" valign="middle" style="width: 60px; height: 60px; background-color: #D4A855; border-radius: 50%; text-align: center; vertical-align: middle;">
                          <span style="color: white; font-size: 18px; font-weight: bold; font-family: Arial, sans-serif;">TIG</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Hi ${firstName},</h1>
                  </div>
                  
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Your Tyler Insurance Group admin account is ready.</p>
                  
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Click below to set your password:</p>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${setupLink}" style="display: inline-block; background: linear-gradient(135deg, #a38529 0%, #c9a832 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Set Your Password
                    </a>
                  </div>
                  
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Once you set your password, you'll have access to the admin dashboard where you can manage agents and oversee operations.</p>
                  
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">If you have any questions, just reply to this email.</p>
                  
                  <div style="border-top: 1px solid #e5e2db; padding-top: 24px; margin-top: 32px;">
                    <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0;">Austin</p>
                    <p style="color: #6b6b6b; font-size: 14px; margin: 4px 0 0;">Tyler Insurance Group</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      if (emailResponse.ok) {
        emailSent = true;

        await supabaseAdmin
          .from("profiles")
          .update({ setup_link_sent_at: new Date().toISOString() })
          .eq("user_id", newUser.user.id);
      } else {
        console.error("Failed to send admin setup email");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        emailSent,
        message: emailSent ? "Admin created and setup email sent" : "Admin created successfully"
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } 
      }
    );
  } catch (error: unknown) {
    console.error("Create admin failed:", getErrorMessage(error));
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
