import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { isAuthError, getErrorStatus, getErrorMessage } from "../_shared/auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Where completed packets are emailed. Override per-deployment.
const CONTRACTING_TEAM_EMAIL = Deno.env.get("CONTRACTING_TEAM_EMAIL") || "caroline@tylerinsurancegroup.com";
// Carbon-copied on every submission. Comma-separated list via env, with a
// sensible default.
const CONTRACTING_TEAM_CC = (Deno.env.get("CONTRACTING_TEAM_CC") || "andrew@tylerinsurancegroup.com,austin@tylerinsurancegroup.com")
  .split(",")
  .map((addr) => addr.trim())
  .filter(Boolean);
const FROM_ADDRESS = Deno.env.get("CONTRACTING_FROM_ADDRESS") || "Tyler Insurance Group <austin@send.tylerinsurancegroup.com>";
const REPLY_TO = Deno.env.get("CONTRACTING_REPLY_TO") || "austin@tylerinsurancegroup.com";
// Optional shared secret. When set, callers must send a matching
// `x-contracting-secret` header. Leave unset for a fully open endpoint.
const SUBMIT_SECRET = Deno.env.get("CONTRACTING_SUBMIT_SECRET");

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
  selectedCarriers?: string[];
  files: FileAttachment[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Public endpoint (no login). Optional shared-secret gate for abuse control.
    if (SUBMIT_SECRET) {
      const provided = req.headers.get("x-contracting-secret");
      if (provided !== SUBMIT_SECRET) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
        );
      }
    }

    // Validate API key is configured
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    const { name, npn, email, residentState, selectedCarriers, files }: ContractingSubmission = await req.json();

    // Extract first name from full name
    const firstName = name.trim().split(' ')[0];

    // Server-side validation
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid name provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    if (!npn || typeof npn !== "string" || !/^\d{1,10}$/.test(npn.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid NPN provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    if (!residentState || typeof residentState !== "string" || residentState.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Resident state is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "At least one file is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    // Validate file size for all files
    const maxBase64Size = 15 * 1024 * 1024;
    for (const file of files) {
      if (file.content.length > maxBase64Size) {
        return new Response(
          JSON.stringify({ success: false, error: `File ${file.fileName} exceeds 15MB limit` }),
          { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
        );
      }
    }

    console.log("Processing contracting packet submission");

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

    // Format carriers list for email
    const carriersListHtml = selectedCarriers && selectedCarriers.length > 0
      ? `<ul style="margin: 10px 0; padding-left: 20px;">${selectedCarriers.map(c => `<li>${c}</li>`).join('')}</ul>`
      : '<p style="color: #666; font-style: italic;">No carriers specified</p>';

    // 1. Send internal email to Caroline/Pinnacle
    const carolineEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        reply_to: REPLY_TO,
        to: [CONTRACTING_TEAM_EMAIL],
        cc: CONTRACTING_TEAM_CC,
        subject: `New Contracting Packet Submission — ${name.trim()} (NPN ${npn.trim()})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">New Contracting Packet Received</h2>

            <p style="font-size: 16px; line-height: 1.6; color: #333; background: #f0f7ff; padding: 15px; border-radius: 8px; border-left: 4px solid #C8A45C;">
              <strong>${firstName} will be agent level, direct to TIG, with the following carriers:</strong>
            </p>
            ${carriersListHtml}

            <div style="background: #f8f8f8; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 10px 0;"><strong>Agent Name:</strong> ${name.trim()}</p>
              <p style="margin: 0 0 10px 0;"><strong>NPN:</strong> ${npn.trim()}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email || 'Not provided'}</p>
              <p style="margin: 0;"><strong>Resident State:</strong> ${residentState}</p>
            </div>

            <p style="font-size: 14px; color: #666;">
              Submitted: ${submissionTimestamp}<br>
              Files attached: ${files.length} document(s)
            </p>
          </div>
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

    // 2. Send confirmation email to the agent with their PDF copy (if email provided)
    if (email && email.trim()) {
      const agentEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          reply_to: REPLY_TO,
          to: [email.trim()],
          subject: "We Received Your Contracting Packet",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${name.trim()},</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Your contracting packet and documents have been successfully received.</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;"><strong>A copy of your submitted contracting packet is attached to this email for your records.</strong></p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Our contracting team reviews all submissions within 2–3 business days. If anything is missing or we need clarification, we'll reach out to you at this email address. You'll also be notified as carriers begin approving you.</p>
              
              <div style="background: #f8f8f8; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #333;">Once you're approved, you'll be able to:</p>
                <ul style="margin: 10px 0; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #555;">
                  <li>Submit and track applications</li>
                  <li>Access all carrier portals</li>
                  <li>Use our quoting and enrollment tools</li>
                  <li>Receive commissions without delays</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">If you have questions at any point, you can contact Caroline at <a href="mailto:caroline@tylerinsurancegroup.com" style="color: #C8A45C; text-decoration: none;">caroline@tylerinsurancegroup.com</a>.</p>
              
              <p style="font-size: 14px; line-height: 1.5; color: #666; margin-top: 30px;">
                Best,<br>
                <strong>Austin Tyler</strong><br>
                Tyler Insurance Group
              </p>
            </div>
          `,
          attachments, // Include the PDF attachment
        }),
      });

      const agentResult = await agentEmailResponse.json();
      
      if (!agentEmailResponse.ok) {
        console.error("Failed to send confirmation email to agent:", agentResult);
        // Don't throw error - Caroline's email succeeded, which is critical
      } else {
        console.log("Confirmation email sent to agent with PDF attachment:", agentResult);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Contracting packet submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  } catch (error: unknown) {
    console.error("Error in send-contracting-packet function:", error);
    const status = isAuthError(error) ? getErrorStatus(error) : 500;
    return new Response(
      JSON.stringify({ success: false, error: getErrorMessage(error) }),
      { status, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

serve(handler);
