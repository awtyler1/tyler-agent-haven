import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FileAttachment {
  name: string;
  fileName: string;
  content: string; // base64 encoded
  type: string;
}

interface ContractingSubmission {
  name: string;
  npn: string;
  email?: string;
  residentState: string;
  files: FileAttachment[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, npn, email, residentState, files }: ContractingSubmission = await req.json();

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

    if (!residentState || typeof residentState !== "string" || residentState.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Resident state is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "At least one file is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate file size for all files
    const maxBase64Size = 15 * 1024 * 1024;
    for (const file of files) {
      if (file.content.length > maxBase64Size) {
        return new Response(
          JSON.stringify({ success: false, error: `File ${file.fileName} exceeds 10MB limit` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    console.log(`Processing contracting submission from ${name.trim()} (NPN: ${npn.trim()})`);

    // Prepare attachments
    const attachments = files.map(file => ({
      filename: file.fileName,
      content: file.content,
    }));

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tyler Insurance Group <contracting@tylerinsurancegroup.com>",
        to: ["caroline@tylerinsurancegroup.com"],
        subject: `New Contracting Packet – ${name.trim()} – NPN ${npn.trim()}`,
        html: `
          <p>A new contracting packet has been submitted through the Tyler Insurance Group Agent Platform.</p>
          
          <h3>Agent Information:</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li>• <strong>Full Name:</strong> ${name.trim()}</li>
            <li>• <strong>Email:</strong> ${email?.trim() || "Not provided"}</li>
            <li>• <strong>NPN:</strong> ${npn.trim()}</li>
            <li>• <strong>Resident State:</strong> ${residentState.trim()}</li>
          </ul>
          
          <h3>Documents:</h3>
          <p>• <strong>Total files attached:</strong> ${files.length}</p>
          
          <p>All uploaded files are attached to this email for review.</p>
        `,
        attachments,
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
