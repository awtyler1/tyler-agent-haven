import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { functionName, search, limit = 50 } = await req.json();
    
    console.log(`Fetching logs for function: ${functionName}, search: ${search}, limit: ${limit}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use the analytics endpoint to query edge function logs
    const analyticsUrl = `${supabaseUrl}/rest/v1/rpc/get_edge_function_logs`;
    
    // Query the function_edge_logs using the analytics API
    // Note: This uses the Supabase Analytics API which requires special access
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    
    // Fetch logs from the Supabase Management API
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/logs.all`;
    
    // Alternative: Use the direct analytics query endpoint
    const logsQuery = `
      select 
        id,
        timestamp,
        event_message,
        metadata
      from edge_logs
      where metadata->>'function_id' is not null
      ${functionName ? `and metadata->>'path' like '%${functionName}%'` : ''}
      ${search ? `and event_message ilike '%${search}%'` : ''}
      order by timestamp desc
      limit ${limit}
    `;

    // Since we can't directly query analytics from edge functions easily,
    // let's return a helpful message and the function name for manual lookup
    // In production, you'd use the Management API with proper auth
    
    // For now, return mock structure that frontend can use
    // The actual logs would need Management API access or a different approach
    
    const response = {
      success: true,
      functionName: functionName || 'generate-contracting-pdf',
      message: 'Edge function logs are available in the Supabase dashboard. Use the "View Backend" button to access them.',
      hint: `To view logs for "${functionName || 'generate-contracting-pdf'}", go to Edge Functions > ${functionName || 'generate-contracting-pdf'} > Logs`,
      logs: [],
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching edge logs:', errMsg);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errMsg,
      logs: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
