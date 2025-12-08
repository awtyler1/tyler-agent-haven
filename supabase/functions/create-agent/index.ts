import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAgentRequest {
  email: string;
  fullName: string;
  managerId: string | null;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the requesting user is an admin
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

    // Check if user has admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin", "contracting_admin"]);

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized: Admin role required");
    }

    const { email, fullName, managerId }: CreateAgentRequest = await req.json();

    if (!email || !fullName) {
      throw new Error("Email and full name are required");
    }

    // Generate a random temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12);

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

    // Update the profile with manager if provided
    if (managerId) {
      await supabaseAdmin
        .from("profiles")
        .update({ manager_id: managerId })
        .eq("user_id", newUser.user.id);
    }

    // Assign agent role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "agent" });

    if (roleError) {
      console.error("Failed to assign role:", roleError);
    }

    // Send welcome email via Resend API
    if (resendApiKey) {
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
          subject: "Welcome to Tyler Insurance Group!",
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
                
                <p>You've been added to the Tyler Insurance Group agent platform. We're excited to have you on board!</p>
                
                <div class="credentials">
                  <h3>Your Login Credentials</h3>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                </div>
                
                <p>Please use these credentials to log in and complete your contracting process. You'll be prompted to set a new password after your first login.</p>
                
                <p style="text-align: center;">
                  <a href="${siteUrl}/auth" class="button">Log In Now</a>
                </p>
                
                <p>Once you've completed your contracting, you'll have full access to the platform including:</p>
                <ul>
                  <li>Carrier resources and training materials</li>
                  <li>Plan comparison tools</li>
                  <li>Sales support and documentation</li>
                </ul>
                
                <p>If you have any questions, please don't hesitate to reach out to your manager or our support team.</p>
                
                <div class="footer">
                  <p>Tyler Insurance Group</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Failed to send welcome email:", await emailResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: "Agent created successfully" 
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
