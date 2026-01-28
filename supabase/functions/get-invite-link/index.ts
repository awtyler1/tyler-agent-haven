import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireAdmin, isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

interface GetInviteLinkRequest {
  profileId: string;
}

serve(async (req: Request): Promise<Response> => {
  console.log("=== get-invite-link function called ===");
  console.log("Method:", req.method);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();
    console.log("Supabase admin client created");

    // Verify the requesting user is an admin
    console.log("Auth header present:", !!req.headers.get("Authorization"));
    const adminUser = await requireAdmin(req, supabaseAdmin);
    console.log("Admin user authenticated:", adminUser.id);

    const { profileId }: GetInviteLinkRequest = await req.json();

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

    const inviteLink = linkData.properties.action_link;

    // Update the profile to track when invite link was generated
    const { error: trackError } = await supabaseAdmin
      .from("profiles")
      .update({ setup_link_sent_at: new Date().toISOString() })
      .eq("id", profileId);

    if (trackError) {
      console.error("Failed to update setup_link_sent_at:", trackError);
    }

    console.log("Invite link generated successfully for", profile.email);

    return new Response(
      JSON.stringify({
        success: true,
        inviteLink,
        message: "Invite link generated successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
      }
    );
  } catch (error: unknown) {
    console.error("Error in get-invite-link:", error);
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
