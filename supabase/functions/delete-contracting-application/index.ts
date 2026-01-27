import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireAdmin } from "../_shared/auth.ts";

interface DeleteApplicationRequest {
  applicationId: string;
}

serve(async (req: Request): Promise<Response> => {
  console.log("=== delete-contracting-application function called ===");
  console.log("Method:", req.method);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    console.log("Starting request processing...");

    const supabaseAdmin = createSupabaseAdmin();
    console.log("Supabase admin client created");

    // Verify the requesting user is an admin
    console.log("Auth header present:", !!req.headers.get("Authorization"));
    const user = await requireAdmin(req, supabaseAdmin);
    console.log("User authenticated successfully:", user.id);

    // Parse request body
    let requestBody: DeleteApplicationRequest;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      throw new Error("Invalid request body");
    }

    const { applicationId } = requestBody;

    if (!applicationId) {
      throw new Error("Application ID is required");
    }

    console.log(`Attempting to delete application: ${applicationId}`);

    // First, get the application to log the deletion details
    const { data: application, error: fetchError } = await supabaseAdmin
      .from("contracting_applications")
      .select("id, full_legal_name, user_id")
      .eq("id", applicationId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch application:", fetchError);
      throw new Error("Application not found");
    }

    if (!application) {
      throw new Error("Application not found");
    }

    console.log(`Found application for: ${application.full_legal_name}`);

    // Delete the application
    const { error: deleteError } = await supabaseAdmin
      .from("contracting_applications")
      .delete()
      .eq("id", applicationId);

    if (deleteError) {
      console.error("Failed to delete application:", deleteError);
      throw new Error(`Failed to delete application: ${deleteError.message}`);
    }

    console.log(`Successfully deleted application ${applicationId} for ${application.full_legal_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Application deleted successfully",
        deletedId: applicationId,
        agentName: application.full_legal_name
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in delete-contracting-application:", errorMessage);

    // Determine appropriate status code
    let statusCode = 400;
    if (errorMessage.includes("Unauthorized") || errorMessage.includes("No authorization") || errorMessage.includes("Required role")) {
      statusCode = 401;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        message: errorMessage
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) }
      }
    );
  }
});
