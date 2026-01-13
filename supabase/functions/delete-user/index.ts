import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin, requireAdmin, isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

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

    console.log("Processing user deletion request");

    // Use the existing adminClient for all operations

    // 1. Delete uploaded documents from storage
    console.log('Step 1: Deleting storage files...');
    const { data: files } = await adminClient.storage
      .from('contracting-documents')
      .list(userId);
    
    if (files && files.length > 0) {
      // Recursively get all files in subdirectories
      const allFilePaths: string[] = [];
      
      const collectFiles = async (prefix: string) => {
        const { data: items } = await adminClient.storage
          .from('contracting-documents')
          .list(prefix);
        
        if (items) {
          for (const item of items) {
            const path = prefix ? `${prefix}/${item.name}` : item.name;
            if (item.id) {
              // It's a file
              allFilePaths.push(path);
            } else {
              // It's a folder, recurse
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
        } else {
          console.log('Deleted', allFilePaths.length, 'files from storage');
        }
      }
    }

    // 2. Delete contracting application
    console.log('Step 2: Deleting contracting application...');
    const { error: contractingError } = await adminClient
      .from('contracting_applications')
      .delete()
      .eq('user_id', userId);
    
    if (contractingError) {
      console.error('Error deleting contracting application:', contractingError);
    }

    // 3. Delete user roles
    console.log('Step 3: Deleting user roles...');
    const { error: rolesError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
    }

    // 4. Delete profile (before auth user to avoid orphaned profiles)
    console.log('Step 4: Deleting profile...');
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // 5. Delete the auth user (last step)
    console.log('Step 5: Deleting auth user...');
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user: ' + authDeleteError.message }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
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
