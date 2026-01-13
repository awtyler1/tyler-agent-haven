import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireSuperAdmin, isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();

    // Verify the requesting user is a super admin
    await requireSuperAdmin(req, supabaseAdmin);

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
    console.error("Error in reset-user-password:", getErrorMessage(error));
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
