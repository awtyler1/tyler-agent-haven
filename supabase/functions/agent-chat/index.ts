import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are the Tyler Insurance Group Agent Assistant — a knowledgeable, professional AI that helps Medicare insurance agents succeed.

Your expertise covers three primary areas:

1. MEDICARE PRODUCT KNOWLEDGE
- Medicare basics (Part A, B, C, D)
- Medicare Advantage plans
- Medicare Supplement (Medigap)
- Prescription drug coverage (Part D)
- LIS and Medicaid programs
- Enrollment periods and eligibility
- Plan comparisons and coverage details

2. PLATFORM NAVIGATION & TOOLS
- How to use the Tyler Insurance Group platform
- Where to find forms, resources, and downloads
- How to access carrier portals
- Certification requirements and processes
- Contracting procedures
- Using quoting tools (Connect4Insurance, Sunfire)
- Accessing CRM (BOSS)

3. SALES PROCESS GUIDANCE
- Appointment preparation and structure
- Needs assessment best practices
- Plan presentation techniques
- Handling objections
- Enrollment procedures
- Post-enrollment follow-up
- Compliance reminders

RESPONSE STYLE:
- Be clear, concise, and actionable
- Use bullet points for lists
- Reference specific platform pages when relevant
- Maintain a professional but friendly tone
- If you don't know something, say so honestly
- Never make up information about specific plans or carriers

COMPLIANCE REMINDER:
Always remind agents to follow CMS guidelines and maintain proper documentation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
