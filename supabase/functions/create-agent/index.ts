import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAgentRequest {
  email: string;
  fullName: string;
  managerId?: string | null;
  role?: 'super_admin' | 'contracting_admin' | 'broker_manager' | 'agent';
  sendSetupEmail?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://preview--tig-broker-hub.lovable.app";

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

    // Only super admins can create users
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin");

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized: Super admin role required");
    }

    const { email, fullName, managerId, role = 'agent', sendSetupEmail = false }: CreateAgentRequest = await req.json();

    if (!email || !fullName) {
      throw new Error("Email and full name are required");
    }

    // Generate a random password (user won't know this - they'll set their own)
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

    console.log(`User created: ${newUser.user.id} (${email})`);

    // Update the profile with manager if provided
    if (managerId) {
      await supabaseAdmin
        .from("profiles")
        .update({ manager_id: managerId })
        .eq("user_id", newUser.user.id);
    }

    // Assign the specified role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role });

    if (roleError) {
      console.error("Failed to assign role:", roleError);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    console.log(`Role assigned: ${role} for user ${newUser.user.id}`);

    // Send setup email with password reset link if requested
    let emailSent = false;
    if (sendSetupEmail && resendApiKey) {
      // Generate a password recovery link so user can set their own password
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${siteUrl}/auth/set-password`,
        }
      });

      if (linkError) {
        console.error("Failed to generate recovery link:", linkError);
        throw new Error(`Failed to generate setup link: ${linkError.message}`);
      }

      // The link contains the token - we need to construct the proper URL
      const setupLink = linkData.properties.action_link;
      console.log(`Generated setup link for ${email}`);

      const firstName = fullName.split(' ')[0] || 'there';

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Caroline Tyler <caroline@tylerinsurancegroup.com>",
          to: [email],
          subject: "Your Agent Account Is Ready",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; margin: 0; padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="padding: 40px;">
                          <!-- Content -->
                          <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 24px 0;">Hi ${firstName},</p>
                          
                          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 24px 0;">Your account is set up and ready for activation.</p>
                          
                          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 8px 0;"><strong>Start here:</strong></p>
                          
                          <!-- Button -->
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 16px 0 32px 0;">
                                <a href="${setupLink}" style="display: inline-block; background: #A38529; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Activate Your Account</a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 24px 0;">When you sign in for the first time, you will land on the <strong>Contracting</strong> page. That page guides you through everything you need to complete before your full agent tools unlock.</p>
                          
                          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 12px 0;"><strong>You'll be able to:</strong></p>
                          
                          <!-- Bullet List -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                            <tr>
                              <td style="font-size: 16px; color: #1a1a1a; padding: 4px 0 4px 20px;">• Download required forms</td>
                            </tr>
                            <tr>
                              <td style="font-size: 16px; color: #1a1a1a; padding: 4px 0 4px 20px;">• Upload your documents</td>
                            </tr>
                            <tr>
                              <td style="font-size: 16px; color: #1a1a1a; padding: 4px 0 4px 20px;">• Track what's complete and what still needs attention</td>
                            </tr>
                          </table>
                          
                          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 24px 0;">Once every item on that page is finished, the rest of your platform will open automatically.</p>
                          
                          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 32px 0;">If anything is unclear, reply to this email and our team will help.</p>
                          
                          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 24px 0;">Welcome aboard.</p>
                          
                          <!-- Signature -->
                          <p style="font-size: 16px; color: #1a1a1a; margin: 0;">
                            <strong>Caroline</strong><br/>
                            Head of Contracting<br/>
                            Tyler Insurance Group<br/>
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
          `,
        }),
      });

      if (emailResponse.ok) {
        emailSent = true;
        console.log(`Setup email sent to ${email}`);

        // Update the profile to track when setup link was sent
        await supabaseAdmin
          .from("profiles")
          .update({ setup_link_sent_at: new Date().toISOString() })
          .eq("user_id", newUser.user.id);
      } else {
        const errorText = await emailResponse.text();
        console.error("Failed to send setup email:", errorText);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        emailSent,
        message: emailSent ? "User created and setup email sent" : "User created successfully" 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in create-agent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
