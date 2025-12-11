import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AgentInquiryRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 2;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  
  // Clean up old entries
  for (const [k, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(k);
    }
  }
  
  const lastRequest = rateLimitMap.get(key);
  if (lastRequest && (now - lastRequest) < RATE_LIMIT_WINDOW_MS) {
    return true;
  }
  
  rateLimitMap.set(key, now);
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: AgentInquiryRequest = await req.json();

    console.log("Received agent inquiry from:", name, email);

    // Validate required fields
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check rate limit
    if (isRateLimited(email)) {
      console.log("Rate limited:", email);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to the team
    const teamEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tyler Insurance Group <onboarding@resend.dev>",
        to: ["austin@tylerinsurancegroup.com", "andrew@tylerinsurancegroup.com"],
        reply_to: email,
        subject: `New Agent Inquiry from ${name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a; border-bottom: 2px solid #A38529; padding-bottom: 10px;">New Agent Inquiry</h2>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            </div>
            
            ${message ? `
            <div style="margin: 20px 0;">
              <p style="font-weight: bold; margin-bottom: 10px;">Message:</p>
              <p style="background: #fff; padding: 15px; border-left: 3px solid #A38529; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            ` : ''}
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This inquiry was submitted through the Tyler Insurance Group Agent Portal.
            </p>
          </div>
        `,
      }),
    });

    if (!teamEmailRes.ok) {
      const errorData = await teamEmailRes.text();
      console.error("Failed to send team email:", errorData);
      throw new Error("Failed to send inquiry email");
    }

    console.log("Team notification email sent successfully");

    // Send confirmation email to the inquirer
    const confirmRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tyler Insurance Group <onboarding@resend.dev>",
        to: [email],
        subject: "We received your inquiry - Tyler Insurance Group",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Thank you for your interest, ${name}!</h2>
            
            <p>We've received your inquiry about becoming an agent with Tyler Insurance Group.</p>
            
            <p>A member of our Broker Development team will reach out to you shortly to discuss how we can help you succeed in the Medicare insurance space.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">In the meantime, feel free to reach out:</p>
              <p style="margin: 5px 0;">Austin Tyler: <a href="tel:8596196672">(859) 619-6672</a></p>
              <p style="margin: 5px 0;">Andrew Horn: <a href="tel:2107225597">(210) 722-5597</a></p>
            </div>
            
            <p>We look forward to speaking with you!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>Tyler Insurance Group</strong>
            </p>
          </div>
        `,
      }),
    });

    if (!confirmRes.ok) {
      console.warn("Failed to send confirmation email, but inquiry was received");
    } else {
      console.log("Confirmation email sent to inquirer");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Inquiry submitted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-agent-inquiry function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
