import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractingSubmission {
  name: string;
  npn: string;
  email?: string;
  fileName: string;
  fileContent: string; // base64 encoded
  fileType: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, npn, email, fileName, fileContent, fileType }: ContractingSubmission = await req.json();

    // Server-side validation
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid name provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!npn || typeof npn !== "string" || !/^\d{1,10}$/.test(npn.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid NPN provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!fileContent || typeof fileContent !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "File content is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate file type
    if (fileType !== "application/pdf") {
      return new Response(
        JSON.stringify({ success: false, error: "Only PDF files are allowed" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate file size (base64 is ~33% larger, so 10MB file = ~13.3MB base64)
    const maxBase64Size = 15 * 1024 * 1024;
    if (fileContent.length > maxBase64Size) {
      return new Response(
        JSON.stringify({ success: false, error: "File size exceeds 10MB limit" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing contracting submission from ${name.trim()} (NPN: ${npn.trim()})`);

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tyler Insurance Group <onboarding@resend.dev>",
        to: ["caroline@tylerinsurancegroup.com"],
        subject: `New Contracting Submission from ${name.trim()} – NPN ${npn.trim()}`,
        html: `
          <h2>New Contracting Packet Submission</h2>
          <p><strong>Name:</strong> ${name.trim()}</p>
          <p><strong>NPN:</strong> ${npn.trim()}</p>
          <p><strong>Email:</strong> ${email?.trim() || "Not provided"}</p>
          <p>Please find the attached contracting packet.</p>
        `,
        attachments: [
          {
            filename: fileName || "contracting-packet.pdf",
            content: fileContent,
          },
        ],
      }),
    });

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contracting-packet function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to submit contracting packet" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
