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

    // Get current timestamp for submission
    const submissionTimestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Prepare attachments for Caroline's email
    const attachments = files.map(file => ({
      filename: file.fileName,
      content: file.content,
    }));

    // 1. Send internal email to Caroline with attachments
    const carolineEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tyler Insurance Group <austin@tylerinsurancegroup.com>",
        to: ["caroline@tylerinsurancegroup.com"],
        subject: `New Contracting Packet Submission — ${name.trim()} (NPN ${npn.trim()})`,
        html: `
          <p>A new contracting packet has been submitted through the Tyler Insurance Group Agent Platform.</p>
          
          <h3>Agent Details:</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li>• <strong>Full Name:</strong> ${name.trim()}</li>
            <li>• <strong>Email:</strong> ${email?.trim() || "Not provided"}</li>
            <li>• <strong>NPN:</strong> ${npn.trim()}</li>
            <li>• <strong>Resident State:</strong> ${residentState.trim()}</li>
            <li>• <strong>Submitted:</strong> ${submissionTimestamp}</li>
          </ul>
          
          <h3>Documents:</h3>
          <p>• <strong>Total files attached:</strong> ${files.length}</p>
          
          <p>All uploaded documents are attached to this email for review.</p>
        `,
        attachments,
      }),
    });

    const carolineResult = await carolineEmailResponse.json();
    
    if (!carolineEmailResponse.ok) {
      console.error("Failed to send email to Caroline:", carolineResult);
      throw new Error("Failed to send internal notification email");
    }
    
    console.log("Email sent to Caroline successfully:", carolineResult);

    // 2. Send confirmation email to the agent (if email provided)
    if (email && email.trim()) {
      const agentEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Tyler Insurance Group <austin@tylerinsurancegroup.com>",
          to: [email.trim()],
          subject: "We Received Your Contracting Packet",
          html: `
            <p>Hi ${name.trim()},</p>
            
            <p>Your contracting packet and documents have been successfully received.</p>
            
            <p>Our contracting team reviews all submissions within 2–3 business days. If anything is missing or we need clarification, we'll reach out to you at this email address. You'll also be notified as carriers begin approving you.</p>
            
            <p><strong>Once you're approved, you'll be able to:</strong></p>
            <ul>
              <li>Submit and track applications</li>
              <li>Access all carrier portals</li>
              <li>Use our quoting and enrollment tools</li>
              <li>Receive commissions without delays</li>
            </ul>
            
            <p>If you have questions at any point, you can contact Caroline at <a href="mailto:caroline@tylerinsurancegroup.com">caroline@tylerinsurancegroup.com</a>.</p>
            
            <p>— Tyler Insurance Group Contracting Team</p>
          `,
        }),
      });

      const agentResult = await agentEmailResponse.json();
      
      if (!agentEmailResponse.ok) {
        console.error("Failed to send confirmation email to agent:", agentResult);
        // Don't throw error - Caroline's email succeeded, which is critical
      } else {
        console.log("Confirmation email sent to agent successfully:", agentResult);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: carolineResult }),
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
