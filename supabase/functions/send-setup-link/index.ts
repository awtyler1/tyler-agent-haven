import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSetupLinkRequest {
  userId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const siteUrl = Deno.env.get("SITE_URL") || "https://app.tylerinsurancegroup.com";

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
        from: "Tyler Insurance Group <caroline@tylerinsurancegroup.com>",
        to: [profile.email],
        subject: "Your Agent Account Is Ready",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1a1a1a; background-color: #f9fafb; margin: 0; padding: 0; }
              .wrapper { background-color: #f9fafb; padding: 40px 20px; }
              .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .greeting { font-size: 18px; margin-bottom: 24px; }
              .body-text { font-size: 16px; color: #374151; margin-bottom: 20px; }
              .button { display: inline-block; background: #1a1a1a; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
              .button:hover { background: #333333; }
              .note { font-size: 15px; color: #6b7280; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
              .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
              .signature { font-weight: 600; color: #1a1a1a; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div style="text-align: center; margin-bottom: 32px;">
                  <img src="${siteUrl}/tyler-logo.png" alt="Tyler Insurance Group" style="max-width: 180px; height: auto;" />
                </div>
                <p class="greeting">Hi ${firstName},</p>
                
                <p class="body-text">Welcome. We set up your account and you're ready for the first step.</p>
                
                <p class="body-text">Use the link below to activate your profile and create your password.</p>
                
                <p style="text-align: center;">
                  <a href="${setupLink}" class="button">Activate Your Account</a>
                </p>
                
                <p class="body-text">When you log in, you'll see one page: <strong>Contracting.</strong></p>
                
                <p class="body-text">Complete this section, and the rest of your tools will open automatically.</p>
                
                <p class="note">If you have a question at any point, reply to this message. You'll hear from a real person who knows how to help.</p>
                
                <div class="footer">
                  <p>Glad to have you with us. You're building something important, and we're here to make sure you have the support to do it well.</p>
                  <p class="signature">Tyler Insurance Group<br/>Agent Support Team</p>
                </div>
              </div>
            </div>
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

    console.log(`Setup link sent to ${profile.email} for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Setup link sent successfully" 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-setup-link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
