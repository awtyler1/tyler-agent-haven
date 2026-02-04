import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireAdmin, getAuthenticatedUser, isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

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

    // CRITICAL: Permission escalation check
    // Only super_admin can create super_admin accounts
    if (role === 'super_admin') {
      const requestingUser = await getAuthenticatedUser(req, supabaseAdmin);
      const { data: callerRoles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', requestingUser.id);

      const isSuperAdmin = callerRoles?.some(r => r.role === 'super_admin');

      if (!isSuperAdmin) {
        return new Response(
          JSON.stringify({
            error: 'Permission denied: Only super admins can create super admin accounts'
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
          }
        );
      }
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
    // The handle_new_user trigger creates a profile with CONTRACTING_REQUIRED,
    // so we need to update it to APPOINTED with the correct full_name
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        email: email,
        onboarding_status: 'APPOINTED',
      })
      .eq("user_id", newUser.user.id)
      .select()
      .single();

    if (profileError) {
      console.error("Failed to update admin profile:", profileError.message);
      // Try upsert as fallback if update failed (profile might not exist yet due to timing)
      const { error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          user_id: newUser.user.id,
          full_name: fullName,
          email: email,
          onboarding_status: 'APPOINTED',
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error("Failed to upsert admin profile:", upsertError.message);
        throw new Error(`Failed to create profile: ${upsertError.message}`);
      }
    } else {
      console.log("Admin profile updated successfully:", updatedProfile?.id);
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
                  <div style="text-align: center; margin-bottom: 24px;">
                    <img src="https://mgczpsrtkdkkjzmztpyd.supabase.co/storage/v1/object/public/Assets/Sheild%20Logo.PNG"
                         alt="Tyler Insurance Group"
                         width="60"
                         style="display: block; margin: 0 auto;" />
                  </div>

                  <h1 style="margin: 0 0 24px; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">Hi ${firstName},</h1>

                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Your Tyler Insurance Group admin account is ready.</p>

                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Click below to set your password:</p>

                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${setupLink}" style="display: inline-block; background-color: #9a7b4f; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                      Set Your Password
                    </a>
                  </div>

                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Once you're in, you'll be able to manage agents, track contracting, and keep everything running smoothly.</p>

                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">If you have any questions, just reply to this email.</p>

                  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />

                  <p style="color: #1a1a1a; font-size: 16px; margin: 0;"><strong>Austin</strong><br/>Tyler Insurance Group</p>
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
