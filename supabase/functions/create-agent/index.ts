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

    // Generate a random temporary password
    const tempPassword = crypto.randomUUID().slice(0, 16);

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

    // Send setup email if requested
    let emailSent = false;
    if (sendSetupEmail && resendApiKey) {
      const siteUrl = Deno.env.get("SITE_URL") || "https://app.tylerinsurancegroup.com";

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Tyler Insurance Group <onboarding@resend.dev>",
          to: [email],
          subject: "Your Tyler Insurance Group Account Setup",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .credentials { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to Tyler Insurance Group!</h1>
                </div>
                
                <p>Hi ${fullName},</p>
                
                <p>Your account has been created on the Tyler Insurance Group platform. Use the credentials below to log in and get started.</p>
                
                <div class="credentials">
                  <h3>Your Login Credentials</h3>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                </div>
                
                <p><strong>Important:</strong> Please change your password after your first login for security.</p>
                
                <p style="text-align: center;">
                  <a href="${siteUrl}/auth" class="button">Log In Now</a>
                </p>
                
                <p>Once logged in, you'll be guided through the onboarding process to complete your setup.</p>
                
                <div class="footer">
                  <p>Tyler Insurance Group</p>
                  <p>If you didn't expect this email, please contact your administrator.</p>
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
        console.error("Failed to send setup email:", await emailResponse.text());
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
