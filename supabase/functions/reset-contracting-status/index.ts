import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetContractingRequest {
  email: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Only super admins can reset contracting status
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin");

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized: Super admin role required");
    }

    const { email }: ResetContractingRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Super admin ${user.email} resetting contracting status for ${email}`);

    // Find user by email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const targetUser = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!targetUser) {
      throw new Error(`User with email ${email} not found`);
    }

    const userId = targetUser.id;

    // Delete uploaded documents from storage (best-effort)
    try {
      const { data: files, error: storageListError } = await supabaseAdmin.storage
        .from('contracting-documents')
        .list(userId);

      if (!storageListError && files && files.length > 0) {
        const filePaths = files.map((f) => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from('contracting-documents').remove(filePaths);

        // Also check for subdirectories (like contracting_packet/)
        for (const file of files) {
          if (!file.name.includes('.')) {
            const { data: subFiles } = await supabaseAdmin.storage
              .from('contracting-documents')
              .list(`${userId}/${file.name}`);

            if (subFiles && subFiles.length > 0) {
              const subPaths = subFiles.map((sf) => `${userId}/${file.name}/${sf.name}`);
              await supabaseAdmin.storage.from('contracting-documents').remove(subPaths);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Storage cleanup skipped/failed:', e);
    }

    // Reset carrier_statuses (delete all for this user)
    const { error: carrierStatusError } = await supabaseAdmin
      .from('carrier_statuses')
      .delete()
      .eq('user_id', userId);
    
    if (carrierStatusError) {
      console.warn('Failed to delete carrier_statuses:', carrierStatusError);
    }

    // Reset contracting_applications
    const { data: existingApp, error: fetchAppError } = await supabaseAdmin
      .from('contracting_applications')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchAppError) {
      throw new Error(`Failed to fetch application: ${fetchAppError.message}`);
    }

    const resetPayload = {
      status: 'in_progress',
      submitted_at: null,
      current_step: 1,
      completed_steps: [],

      // form fields
      full_legal_name: null,
      agency_name: null,
      agency_tax_id: null,
      gender: null,
      birth_date: null,
      birth_city: null,
      birth_state: null,
      npn_number: null,
      insurance_license_number: null,
      tax_id: null,
      email_address: email,
      phone_mobile: null,
      phone_business: null,
      phone_home: null,
      fax: null,
      preferred_contact_methods: [],

      home_address: {},
      mailing_address_same_as_home: true,
      mailing_address: {},
      ups_address_same_as_home: true,
      ups_address: {},
      previous_addresses: [],

      resident_license_number: null,
      resident_state: null,
      license_expiration_date: null,
      non_resident_states: [],
      drivers_license_number: null,
      drivers_license_state: null,

      legal_questions: {},

      bank_routing_number: null,
      bank_account_number: null,
      bank_branch_name: null,
      beneficiary_name: null,
      beneficiary_relationship: null,
      beneficiary_birth_date: null,
      beneficiary_drivers_license_number: null,
      beneficiary_drivers_license_state: null,
      requesting_commission_advancing: false,

      has_aml_course: null,
      aml_course_name: null,
      aml_course_date: null,
      aml_training_provider: null,
      aml_completion_date: null,
      has_ltc_certification: false,
      state_requires_ce: false,
      eo_not_yet_covered: false,
      eo_provider: null,
      eo_policy_number: null,
      eo_expiration_date: null,
      is_finra_registered: false,
      finra_broker_dealer_name: null,
      finra_crd_number: null,

      selected_carriers: [],
      is_corporation: false,
      agreements: {},

      signature_name: null,
      signature_initials: null,
      signature_date: null,

      section_acknowledgments: {},
      uploaded_documents: {},
    };

    if (existingApp?.id) {
      const { error: resetError } = await supabaseAdmin
        .from('contracting_applications')
        .update(resetPayload)
        .eq('id', existingApp.id);
      if (resetError) {
        throw new Error(`Failed to update application: ${resetError.message}`);
      }
    } else {
      const { error: createError } = await supabaseAdmin
        .from('contracting_applications')
        .insert({ user_id: userId, ...resetPayload } as never);
      if (createError) {
        throw new Error(`Failed to create application: ${createError.message}`);
      }
    }

    // Reset profile onboarding status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ onboarding_status: 'CONTRACTING_REQUIRED' })
      .eq('user_id', userId);
    
    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    console.log(`Contracting status reset successful for ${email} (${userId})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Contracting status reset for ${email}`,
        userId: userId
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in reset-contracting-status:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});

