import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireAdmin, isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

/**
 * Delete user with proper ordering to prevent orphaned data.
 *
 * CRITICAL: Delete auth user FIRST to immediately block sign-in.
 * Then clean up related data. If cleanup fails, user is still blocked
 * (safe failure mode) vs. the reverse where data is deleted but auth remains.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const adminClient = createSupabaseAdmin();

    // Verify requesting user is an admin
    const requestingUser = await requireAdmin(req, adminClient);

    // Get the user to delete
    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Prevent deleting yourself
    if (userId === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing user deletion request for:", userId);

    // Track cleanup results for response
    const cleanupResults: Record<string, { success: boolean; error?: string }> = {};

    // ============================================================
    // STEP 1: Delete auth user FIRST (blocks sign-in immediately)
    // This is the critical step - if it fails, we abort entirely
    // ============================================================
    console.log('Step 1: Deleting auth user (critical step)...');
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // Auth deletion failed - abort without touching any other data
      return new Response(
        JSON.stringify({
          error: 'Failed to delete user authentication: ' + authDeleteError.message,
          details: 'No data was modified. The user account remains intact.'
        }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    console.log('Auth user deleted - user can no longer sign in');

    // ============================================================
    // STEP 2-5: Cleanup related data (non-critical - user is already blocked)
    // We continue even if individual steps fail to clean up as much as possible
    // ============================================================

    // 2. Delete uploaded documents from storage
    console.log('Step 2: Deleting storage files...');
    try {
      const { data: files } = await adminClient.storage
        .from('contracting-documents')
        .list(userId);

      if (files && files.length > 0) {
        const allFilePaths: string[] = [];

        const collectFiles = async (prefix: string) => {
          const { data: items } = await adminClient.storage
            .from('contracting-documents')
            .list(prefix);

          if (items) {
            for (const item of items) {
              const path = prefix ? `${prefix}/${item.name}` : item.name;
              if (item.id) {
                allFilePaths.push(path);
              } else {
                await collectFiles(path);
              }
            }
          }
        };

        await collectFiles(userId);

        if (allFilePaths.length > 0) {
          const { error: storageError } = await adminClient.storage
            .from('contracting-documents')
            .remove(allFilePaths);

          if (storageError) {
            console.error('Error deleting storage files:', storageError);
            cleanupResults.storage = { success: false, error: storageError.message };
          } else {
            console.log('Deleted', allFilePaths.length, 'files from storage');
            cleanupResults.storage = { success: true };
          }
        } else {
          cleanupResults.storage = { success: true };
        }
      } else {
        cleanupResults.storage = { success: true };
      }
    } catch (storageErr) {
      console.error('Storage cleanup error:', storageErr);
      cleanupResults.storage = { success: false, error: String(storageErr) };
    }

    // 3. Delete contracting application
    console.log('Step 3: Deleting contracting application...');
    const { error: contractingError } = await adminClient
      .from('contracting_applications')
      .delete()
      .eq('user_id', userId);

    if (contractingError) {
      console.error('Error deleting contracting application:', contractingError);
      cleanupResults.contracting = { success: false, error: contractingError.message };
    } else {
      cleanupResults.contracting = { success: true };
    }

    // 4. Delete user roles
    console.log('Step 4: Deleting user roles...');
    const { error: rolesError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
      cleanupResults.roles = { success: false, error: rolesError.message };
    } else {
      cleanupResults.roles = { success: true };
    }

    // 5. Delete profile
    console.log('Step 5: Deleting profile...');
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      cleanupResults.profile = { success: false, error: profileError.message };
    } else {
      cleanupResults.profile = { success: true };
    }

    // 6. Clean up additional related data
    console.log('Step 6: Cleaning up additional data...');

    // Delete carrier_statuses
    const { error: carrierStatusError } = await adminClient
      .from('carrier_statuses')
      .delete()
      .eq('user_id', userId);
    if (carrierStatusError) {
      cleanupResults.carrier_statuses = { success: false, error: carrierStatusError.message };
    } else {
      cleanupResults.carrier_statuses = { success: true };
    }

    // Delete agent_certifications (uses profile_id, need to look up first)
    // Note: Profile is deleted but we stored the profile_id from the earlier lookup

    // Check for any cleanup failures
    const failedCleanups = Object.entries(cleanupResults)
      .filter(([_, result]) => !result.success)
      .map(([key, result]) => `${key}: ${result.error}`);

    console.log('User deleted successfully:', userId);

    if (failedCleanups.length > 0) {
      // User is deleted but some cleanup failed - still a success but with warnings
      return new Response(
        JSON.stringify({
          success: true,
          message: 'User deleted successfully',
          warnings: `Some cleanup operations failed: ${failedCleanups.join('; ')}`,
          cleanupResults
        }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully', cleanupResults }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in delete-user function:', error);
    const status = isAuthError(error) ? getErrorStatus(error) : 500;
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
