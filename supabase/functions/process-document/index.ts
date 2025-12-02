import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple text chunking function - reduced for memory efficiency
function chunkText(text: string, chunkSize: number = 800, overlap: number = 150): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  
  return chunks;
}

// Generate embeddings using Lovable AI with retry logic
async function generateEmbedding(text: string, apiKey: string, retries = 3): Promise<number[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
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
        const error = await response.text();
        console.error("Embedding error:", error);
        throw new Error(`Failed to generate embedding: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      console.log(`Retry attempt ${attempt + 1}/${retries} for embedding`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Failed after retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, documentName, documentType, carrier, planName, chunkIndex, isChunked } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // If text is already chunked from client, just process the single chunk
    if (isChunked) {
      const cleanText = documentText.replace(/\s+/g, " ").trim();
      
      // Generate embedding for this chunk
      const embedding = await generateEmbedding(cleanText, LOVABLE_API_KEY);

      // Store in database with retry logic
      let insertError = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await supabase.from("document_chunks").insert({
          document_name: documentName,
          document_type: documentType.toLowerCase(),
          carrier: carrier?.toLowerCase(),
          plan_name: planName,
          chunk_text: cleanText,
          chunk_index: chunkIndex || 0,
          embedding: embedding,
        });

        if (!error) {
          insertError = null;
          break;
        }
        
        insertError = error;
        console.error(`Error inserting chunk (attempt ${attempt + 1}/3):`, error);
        
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }

      if (insertError) {
        throw insertError;
      }

      console.log(`Successfully processed chunk ${chunkIndex} for ${documentName}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          chunksProcessed: 1,
          documentName 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Legacy path: chunk on server (for backward compatibility)
    const cleanText = documentText.replace(/\s+/g, " ").trim();
    const chunks = chunkText(cleanText, 800, 150);

    console.log(`Processing ${chunks.length} chunks for ${documentName}`);

    // Process only first chunk to avoid memory issues
    const chunk = chunks[0];
    const embedding = await generateEmbedding(chunk, LOVABLE_API_KEY);

    const { error } = await supabase.from("document_chunks").insert({
      document_name: documentName,
      document_type: documentType.toLowerCase(),
      carrier: carrier?.toLowerCase(),
      plan_name: planName,
      chunk_text: chunk,
      chunk_index: 0,
      embedding: embedding,
    });

    if (error) {
      console.error(`Error inserting chunk:`, error);
      throw error;
    }

    console.log(`Successfully processed ${documentName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksProcessed: 1,
        documentName 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Document processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
