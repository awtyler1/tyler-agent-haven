import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    // Get client IP for rate limiting (from Cloudflare or direct)
    const clientIP = req.headers.get("cf-connecting-ip") || 
                     req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     "unknown";

    // Validate input
    if (!password || typeof password !== "string") {
      return new Response(
        JSON.stringify({ valid: false, error: "Password is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client for rate limiting storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limiting using system_config table
    const rateLimitKey = `rate_limit_${clientIP.replace(/\./g, "_")}`;
    
    const { data: rateLimitData } = await supabase
      .from("system_config")
      .select("config_value")
      .eq("config_key", rateLimitKey)
      .single();

    const now = Date.now();
    let attempts = 0;
    let lockoutUntil = 0;

    if (rateLimitData) {
      const config = rateLimitData.config_value as { attempts: number; lockout_until: number; last_attempt: number };
      attempts = config.attempts || 0;
      lockoutUntil = config.lockout_until || 0;

      // Check if currently locked out
      if (lockoutUntil > now) {
        const remainingMinutes = Math.ceil((lockoutUntil - now) / 60000);
        console.log(`Rate limit: IP ${clientIP} is locked out for ${remainingMinutes} more minutes`);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: `Too many attempts. Please try again in ${remainingMinutes} minutes.`,
            locked: true
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Reset attempts if lockout period has passed
      if (lockoutUntil > 0 && lockoutUntil <= now) {
        attempts = 0;
      }
    }

    const sitePassword = Deno.env.get("SITE_PASSWORD");
    
    if (!sitePassword) {
      console.error("SITE_PASSWORD environment variable not set");
      return new Response(
        JSON.stringify({ valid: false, error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isValid = password === sitePassword;

    if (isValid) {
      // Clear rate limit on successful validation
      await supabase
        .from("system_config")
        .delete()
        .eq("config_key", rateLimitKey);
      
      console.log(`Password validation success from IP ${clientIP}`);
    } else {
      // Increment failed attempts
      attempts += 1;
      const newLockoutUntil = attempts >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;

      await supabase
        .from("system_config")
        .upsert({
          config_key: rateLimitKey,
          config_value: {
            attempts,
            lockout_until: newLockoutUntil,
            last_attempt: now
          }
        }, { onConflict: "config_key" });

      console.log(`Password validation failed from IP ${clientIP}. Attempt ${attempts}/${MAX_ATTEMPTS}`);

      if (attempts >= MAX_ATTEMPTS) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: "Too many failed attempts. Please try again in 15 minutes.",
            locked: true
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response(
      JSON.stringify({ valid: isValid }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in validate-password function:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Validation failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
