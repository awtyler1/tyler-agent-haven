import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to extract metadata from filename
function extractMetadata(filename: string) {
  let carrier = "unknown";
  let documentType = "guide";

  if (filename.toLowerCase().includes("aetna")) carrier = "aetna";
  else if (filename.toLowerCase().includes("anthem")) carrier = "anthem";
  else if (filename.toLowerCase().includes("devoted")) carrier = "devoted";
  else if (filename.toLowerCase().includes("humana")) carrier = "humana";
  else if (filename.toLowerCase().includes("uhc") || filename.toLowerCase().includes("united")) carrier = "unitedhealth";
  else if (filename.toLowerCase().includes("wellcare")) carrier = "wellcare";

  if (filename.includes("SOB")) documentType = "sob";
  else if (filename.includes("EOC")) documentType = "eoc";
  else if (filename.includes("ANOC")) documentType = "anoc";
  else if (filename.includes("Formulary")) documentType = "formulary";
  else if (filename.includes("Certification")) documentType = "certification";
  else if (filename.includes("Manual") || filename.includes("Guide") || filename.includes("Playbook")) documentType = "guide";

  return { carrier, documentType };
}

// Chunk text on client side before sending to edge function
function chunkTextClient(text: string, chunkSize: number = 800): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + word).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = word + " ";
    } else {
      currentChunk += word + " ";
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Process a single document
async function processDocument(
  filename: string,
  jobId: string,
  supabase: any,
  supabaseUrl: string,
  supabaseAnonKey: string,
  projectOrigin: string
): Promise<{ success: boolean; chunksProcessed: number; error?: string }> {
  try {
    // Fetch PDF from public folder served by the project
    const pdfUrl = `${projectOrigin}/downloads/${filename}`;
    console.log(`Fetching PDF from: ${pdfUrl}`);
    
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} - ${await response.text()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`Successfully fetched PDF, size: ${arrayBuffer.byteLength} bytes`);

    // Import pdfjs dynamically
    const pdfjsLib = await import("npm:pdfjs-dist@4.10.38");
    const pdfjsWorker = await import("npm:pdfjs-dist@4.10.38/build/pdf.worker.mjs");
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 20);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + " ";
    }

    if (!fullText.trim()) {
      throw new Error("No text could be extracted");
    }

    const { carrier, documentType } = extractMetadata(filename);
    const textChunks = chunkTextClient(fullText);
    
    console.log(`Processing ${textChunks.length} chunks for ${filename}`);

    let successfulChunks = 0;
    const BATCH_SIZE = 5;

    for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
      const batch = textChunks.slice(i, Math.min(i + BATCH_SIZE, textChunks.length));
      
      const batchPromises = batch.map((chunk, batchIndex) => {
        const chunkIndex = i + batchIndex;
        return fetch(`${supabaseUrl}/functions/v1/process-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            documentText: chunk,
            documentName: filename,
            documentType,
            carrier,
            chunkIndex,
            isChunked: true,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Failed to process chunk ${chunkIndex}:`, errorData);
              return null;
            }
            return chunkIndex;
          })
          .catch((error) => {
            console.error(`Error processing chunk ${chunkIndex}:`, error);
            return null;
          });
      });

      const results = await Promise.all(batchPromises);
      successfulChunks += results.filter(r => r !== null).length;

      // Small delay between batches
      if (i + BATCH_SIZE < textChunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Successfully processed ${successfulChunks}/${textChunks.length} chunks for ${filename}`);
    return { success: true, chunksProcessed: successfulChunks };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error processing ${filename}:`, errorMessage);
    return { success: false, chunksProcessed: 0, error: errorMessage };
  }
}

// Main background processing function
async function backgroundProcessDocuments(
  documents: string[],
  jobId: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
  supabaseServiceKey: string,
  projectOrigin: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`Starting background processing for job ${jobId} with ${documents.length} documents`);

  // Update job to processing status
  await supabase
    .from('processing_jobs')
    .update({ 
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', jobId);

  let processedCount = 0;
  let failedCount = 0;

  for (const filename of documents) {
    // Update current document
    await supabase
      .from('processing_jobs')
      .update({ 
        current_document: filename,
        processed_documents: processedCount
      })
      .eq('id', jobId);

    const result = await processDocument(filename, jobId, supabase, supabaseUrl, supabaseAnonKey, projectOrigin);

    if (result.success) {
      processedCount++;
    } else {
      failedCount++;
    }

    // Small delay between documents
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Mark job as completed
  await supabase
    .from('processing_jobs')
    .update({ 
      status: 'completed',
      processed_documents: processedCount,
      failed_documents: failedCount,
      current_document: null,
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId);

  console.log(`Completed job ${jobId}: ${processedCount} processed, ${failedCount} failed`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documents, projectOrigin } = await req.json();
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: "No documents provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!projectOrigin) {
      return new Response(
        JSON.stringify({ error: "Project origin is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        status: 'pending',
        total_documents: documents.length,
        processed_documents: 0,
        failed_documents: 0
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to create job: ${jobError?.message}`);
    }

    console.log(`Created job ${job.id} for ${documents.length} documents`);

    // Start background processing
    EdgeRuntime.waitUntil(
      backgroundProcessDocuments(
        documents, 
        job.id, 
        supabaseUrl, 
        supabaseAnonKey,
        supabaseServiceKey,
        projectOrigin
      )
    );

    return new Response(
      JSON.stringify({ 
        jobId: job.id,
        message: `Started processing ${documents.length} documents in background`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error starting background job:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
