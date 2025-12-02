import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate embedding for search query using Lovable AI
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, carrier, documentType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the last user message for context search
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()?.content || "";

    // Generate embedding for the query using Lovable AI
    const queryEmbedding = await generateEmbedding(lastUserMessage, LOVABLE_API_KEY);

    // Search for relevant document chunks
    const { data: relevantChunks, error: searchError } = await supabase.rpc(
      "search_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        filter_carrier: carrier || null,
        filter_type: documentType || null,
      }
    );

    if (searchError) {
      console.error("Search error:", searchError);
      throw searchError;
    }

    // Build context from relevant chunks
    let contextText = "";
    if (relevantChunks && relevantChunks.length > 0) {
      contextText = "\n\nRELEVANT DOCUMENT CONTEXT:\n\n";
      relevantChunks.forEach((chunk: any, index: number) => {
        contextText += `[Source ${index + 1}: ${chunk.document_name}`;
        if (chunk.carrier) contextText += ` - ${chunk.carrier}`;
        if (chunk.plan_name) contextText += ` - ${chunk.plan_name}`;
        if (chunk.page_number) contextText += ` (Page ${chunk.page_number})`;
        contextText += `]\n${chunk.chunk_text}\n\n`;
      });
      contextText += "Please use this context to answer the question accurately. Always cite the source when referencing specific information.\n";
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

IMPORTANT - DOCUMENT CITATION:
When you have access to document context (carrier plan documents, formularies, SOBs, EOCs), you MUST:
- Use the specific information from those documents
- Cite the source document name and page number when possible
- Be precise with copays, deductibles, and coverage details from the documents
- If the document doesn't contain the answer, say so clearly

RESPONSE STYLE:
- Be clear, concise, and actionable
- Use bullet points for lists
- Reference specific platform pages when relevant
- Maintain a professional but friendly tone
- If you don't know something, say so honestly
- Never make up information about specific plans or carriers

COMPLIANCE REMINDER:
Always remind agents to follow CMS guidelines and maintain proper documentation.${contextText}`;

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
