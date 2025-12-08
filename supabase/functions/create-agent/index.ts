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

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Tyler Insurance Group <onboarding@resend.dev>",
          to: [email],
          subject: "Welcome to Tyler Insurance Group - Set Up Your Account",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #1a1a1a; margin-bottom: 10px; }
                .button { display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 600; }
                .button:hover { background: #1d4ed8; }
                .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
                .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
                .highlight { color: #2563eb; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to Tyler Insurance Group!</h1>
                </div>
                
                <p>Hi ${fullName},</p>
                
                <p>Great news! Your account has been created on the Tyler Insurance Group platform. You're just one step away from getting started.</p>
                
                <div class="info-box">
                  <p style="margin: 0;"><strong>Your login email:</strong> <span class="highlight">${email}</span></p>
                </div>
                
                <p>Click the button below to set your password and activate your account:</p>
                
                <p style="text-align: center;">
                  <a href="${setupLink}" class="button">Set My Password</a>
                </p>
                
                <p style="font-size: 14px; color: #666;">This link will expire in 24 hours. If you need a new link, contact your administrator.</p>
                
                <p>Once you've set your password, you'll have access to:</p>
                <ul>
                  <li>Carrier resources and training materials</li>
                  <li>Plan comparison tools</li>
                  <li>Sales support and documentation</li>
                  <li>And much more!</li>
                </ul>
                
                <div class="footer">
                  <p><strong>Tyler Insurance Group</strong></p>
                  <p>If you didn't expect this email, you can safely ignore it.</p>
                </div>
              </div>
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
