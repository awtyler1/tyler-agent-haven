import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import {
  createSupabaseAdmin,
  requireAdmin,
  isAuthError,
  getErrorStatus,
  getErrorMessage,
} from "../_shared/auth.ts";

interface PromoteRequest {
  profileId: string;
  role: "admin" | "super_admin";
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();

    // Require admin or super_admin
    const requestingUser = await requireAdmin(req, supabaseAdmin);

    const { profileId, role }: PromoteRequest = await req.json();

    if (!profileId || !role) {
      throw new Error("profileId and role are required");
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new Error("role must be 'admin' or 'super_admin'");
    }

    // Look up the target profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, full_name, email, is_active, onboarding_status")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (!profile.user_id) {
      throw new Error("Profile has no associated user account");
    }

    if (!profile.is_active) {
      throw new Error(
        "Cannot promote an inactive user. Reactivate them first."
      );
    }

    // Check existing roles
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id);

    if (rolesError) {
      throw new Error("Failed to check existing roles");
    }

    const currentRoles = existingRoles?.map((r) => r.role) || [];

    if (currentRoles.includes(role)) {
      return new Response(
        JSON.stringify({
          error: `${profile.full_name || profile.email} already has the ${role} role`,
          alreadyHasRole: true,
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(req),
          },
        }
      );
    }

    // Remove any existing admin-tier role before adding the new one
    // (e.g., if upgrading admin → super_admin, remove admin first)
    const adminTierRoles = ["admin", "super_admin"];
    const existingAdminRoles = currentRoles.filter((r) =>
      adminTierRoles.includes(r)
    );

    if (existingAdminRoles.length > 0) {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", profile.user_id)
        .in("role", existingAdminRoles);
    }

    // Add the new admin role (agent-level roles are preserved)
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: profile.user_id, role });

    if (insertError) {
      throw new Error(`Failed to assign role: ${insertError.message}`);
    }

    // Ensure onboarding_status is APPOINTED (admins should always be)
    if (profile.onboarding_status !== "APPOINTED") {
      await supabaseAdmin
        .from("profiles")
        .update({ onboarding_status: "APPOINTED" })
        .eq("id", profileId);
    }

    // Log to activity_logs
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", requestingUser.id)
      .single();

    if (callerProfile) {
      await supabaseAdmin.from("activity_logs").insert({
        user_id: callerProfile.id,
        action_type: "promote_to_admin",
        entity_type: "profile",
        entity_id: profileId,
        metadata: {
          promoted_user: profile.full_name || profile.email,
          new_role: role,
          previous_roles: currentRoles,
        },
      });
    }

    // Return the updated role set
    const { data: updatedRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${profile.full_name || profile.email} promoted to ${role}`,
        roles: updatedRoles?.map((r) => r.role) || [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(req),
        },
      }
    );
  } catch (error: unknown) {
    console.error("Promote to admin failed:", getErrorMessage(error));
    const status = isAuthError(error) ? getErrorStatus(error) : 400;
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(req),
      },
    });
  }
});
