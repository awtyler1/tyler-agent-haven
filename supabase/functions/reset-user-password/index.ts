import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const allowedOrigins = [
  "https://www.tigagenthub.com",
  "https://tigagenthub.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Only super admins can reset passwords
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin");

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized: Super admin role required");
    }

    const { userId, newPassword }: ResetPasswordRequest = await req.json();

    if (!userId || !newPassword) {
      throw new Error("userId and newPassword are required");
    }

    // Validate password strength
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (newPassword.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters`);
    }
    if (!hasUppercase || !hasLowercase) {
      throw new Error("Password must contain uppercase and lowercase letters");
    }
    if (!hasNumber) {
      throw new Error("Password must contain at least one number");
    }
    if (!hasSpecial) {
      throw new Error("Password must contain at least one special character (!@#$%^&*()_+-=)");
    }

    console.log("Processing password reset request");

    // Update the user's password
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Failed to update password:", updateError);
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log("Password reset completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password reset for ${updatedUser.user.email}`
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in reset-user-password:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } 
      }
    );
  }
});
