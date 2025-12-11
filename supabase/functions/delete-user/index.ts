import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Delete user function called, method:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify they're a super admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the requesting user
    const { data: { user: requestingUser }, error: authError } = await userClient.auth.getUser();
    console.log('Auth getUser result - user:', requestingUser?.id, 'error:', authError?.message);
    
    if (authError || !requestingUser) {
      console.log('Auth failed:', authError?.message || 'No user returned');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify requesting user is a super admin
    const { data: roleData, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.log('User is not a super admin:', requestingUser.id);
      return new Response(
        JSON.stringify({ error: 'Only super admins can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user to delete
    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent deleting yourself
    if (userId === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting user:', userId, 'requested by:', requestingUser.id);

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

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

    // 4. Delete profile
    console.log('Step 4: Deleting profile...');
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // 5. Delete the auth user
    console.log('Step 5: Deleting auth user...');
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user: ' + authDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
