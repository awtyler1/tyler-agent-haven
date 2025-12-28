import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAgentRequest {
  email: string;
  fullName: string;
  hierarchyType: 'team' | 'downline';
  hierarchyEntityId?: string | null;
  uplineUserId?: string | null;
  isExistingAgent: boolean;
  sendSetupEmail?: boolean;
  isTest?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  console.log("=== create-agent function called ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting request processing...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://preview--tig-broker-hub.lovable.app";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    console.log("Auth header length:", authHeader?.length || 0);
    
    if (!authHeader) {
      console.error("No authorization header found");
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token extracted, length:", token.length);
    console.log("Token prefix:", token.substring(0, 20) + "...");

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError) {
      console.error("Auth error:", authError.message, authError.status);
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    if (!user) {
      console.error("No user returned from auth.getUser");
      throw new Error("Unauthorized: User not found");
    }

    console.log("User authenticated:", user.id, user.email);

    // Check for admin or super_admin role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin", "admin"]);

    if (rolesError) {
      console.error("Error checking roles:", rolesError.message);
      throw new Error(`Failed to check roles: ${rolesError.message}`);
    }

    console.log("User roles found:", roles?.map(r => r.role) || []);

    if (!roles || roles.length === 0) {
      console.error("User does not have admin or super_admin role");
      throw new Error("Unauthorized: Admin role required");
    }

    // Parse and log request body
    let requestBody: CreateAgentRequest;
    try {
      requestBody = await req.json();
      console.log("Received request body:", JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      throw new Error("Invalid request body: " + (parseError instanceof Error ? parseError.message : "Unknown error"));
    }

    const { 
      email, 
      fullName, 
      hierarchyType,
      hierarchyEntityId,
      uplineUserId,
      isExistingAgent,
      sendSetupEmail = true, 
      isTest = false 
    } = requestBody;

    if (!email || !fullName) {
      throw new Error("Email and full name are required");
    }

    if (!hierarchyType) {
      throw new Error("Hierarchy type is required");
    }

    // Validate hierarchy-specific requirements
    if (hierarchyType === 'team' && !hierarchyEntityId) {
      throw new Error("hierarchyEntityId is required when hierarchyType is 'team'");
    }
    if (hierarchyType === 'downline' && !uplineUserId) {
      throw new Error("uplineUserId is required when hierarchyType is 'downline'");
    }

    console.log(`Creating agent: ${email}, hierarchy: ${hierarchyType}, existing: ${isExistingAgent}, isTest: ${isTest}`);

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

    // Determine onboarding status based on agent type
    const onboardingStatus = isExistingAgent ? 'APPOINTED' : 'CONTRACTING_REQUIRED';

    // Insert a new profile row for the newly created user
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email: email,
        full_name: fullName,
        hierarchy_type: hierarchyType,
        hierarchy_entity_id: hierarchyType === 'team' ? hierarchyEntityId : null,
        upline_user_id: uplineUserId || null,
        onboarding_status: onboardingStatus,
        is_active: true,
        is_test: isTest || false,
      });

    if (profileError) {
      console.error("Failed to insert profile:", profileError);
      throw new Error(`Failed to insert profile: ${profileError.message}`);
    }

    console.log(`Profile inserted with hierarchy_type: ${hierarchyType}, status: ${onboardingStatus}`);

    // Assign the agent role
    const agentRole = 'independent_agent';
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: agentRole });

    if (roleError) {
      console.error("Failed to assign role:", roleError);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    console.log(`Role assigned: ${agentRole} for user ${newUser.user.id}`);

    // Send setup email with password reset link if requested
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
        console.error("Failed to generate recovery link:", linkError);
        throw new Error(`Failed to generate setup link: ${linkError.message}`);
      }

      const setupLink = linkData.properties.action_link;
      console.log(`Generated setup link for ${email}`);

      const firstName = fullName.split(' ')[0] || 'there';

      // Different email content based on agent type
      const emailContent = isExistingAgent 
        ? `
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            Your Tyler Insurance Group agent account is ready.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 10px 0;">
            <strong>Start here:</strong>
          </p>
          
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
            <tr>
              <td style="background-color: #A38529; border-radius: 6px;">
                <a href="${setupLink}" style="display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 600;">
                  Set Your Password
                </a>
              </td>
            </tr>
          </table>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            Once you set your password, you'll have full access to the agent portal where you can access carrier resources, training materials, and more.
          </p>
        `
        : `
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            Your account is set up and ready for activation.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 10px 0;">
            <strong>Start here:</strong>
          </p>
          
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
            <tr>
              <td style="background-color: #A38529; border-radius: 6px;">
                <a href="${setupLink}" style="display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 600;">
                  Activate Your Account
                </a>
              </td>
            </tr>
          </table>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            When you sign in for the first time, you will land on the Contracting page. That page guides you through everything you need to complete before your full agent tools unlock.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 10px 0;">
            <strong>You'll be able to:</strong>
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8; color: #333333; margin: 0 0 20px 0; padding-left: 20px;">
            <li>Download required forms</li>
            <li>Upload your documents</li>
            <li>Track what's complete and what still needs attention</li>
          </ul>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
            Once every item on that page is finished, the rest of your platform will open automatically.
          </p>
        `;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Caroline Tyler <caroline@tylerinsurancegroup.com>",
          to: [email],
          subject: isExistingAgent ? "Your Agent Account Is Ready" : "Welcome to Tyler Insurance Group",
          html: `
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
                          
                          ${emailContent}
                          
                          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
                            If anything is unclear, reply to this email and our team will help.
                          </p>
                          
                          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 24px 0;">
                            Welcome aboard.
                          </p>
                          
                          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0;">
                            <strong>Caroline</strong><br>
                            Head of Contracting<br>
                            Tyler Insurance Group<br>
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
        isExistingAgent,
        isTest,
        message: emailSent 
          ? `Agent created and setup email sent` 
          : `Agent created successfully` 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error in create-agent:", errorMessage);
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }
    
    // Determine appropriate status code
    let statusCode = 400;
    if (errorMessage.includes("Unauthorized") || errorMessage.includes("No authorization")) {
      statusCode = 401;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack ? undefined : errorMessage 
      }),
      { 
        status: statusCode, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
