// ============================================================================
// send-agent-inquiry  —  /join form → emails the Broker Development team
// ----------------------------------------------------------------------------
// Self-contained (no shared imports) so it can be pasted straight into the
// Supabase dashboard editor. Deploy with "Verify JWT" OFF (this project uses
// ECC signing keys; gateway JWT verification must stay off).
//
// Requires the RESEND_API_KEY secret. Sends FROM the verified
// tylerinsurancegroup.com domain so it can reach arbitrary recipients.
// ============================================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FROM = "Tyler Insurance Group <noreply@tylerinsurancegroup.com>";
const TEAM = ["austin@tylerinsurancegroup.com"];

// Origins allowed to call this function from the browser.
const ALLOWED_ORIGINS = [
  "https://tigagenthub.com",
  "https://www.tigagenthub.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

interface AgentInquiryRequest {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

// Simple in-memory rate limiting (resets on cold start): 2 per 10 min per email.
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  for (const [k, ts] of rateLimitMap.entries()) {
    if (now - ts > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(k);
  }
  const last = rateLimitMap.get(key);
  if (last && now - last < RATE_LIMIT_WINDOW_MS) return true;
  rateLimitMap.set(key, now);
  return false;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendEmail(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error:", res.status, detail);
    throw new Error(`Resend responded ${res.status}: ${detail}`);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return json(req, { error: "Email service is not configured." }, 500);
  }

  try {
    const { name, email, phone, message }: AgentInquiryRequest = await req.json();

    if (!name || !email) {
      return json(req, { error: "Name and email are required." }, 400);
    }

    if (isRateLimited(email)) {
      return json(
        req,
        { error: "Too many requests. Please try again in a few minutes." },
        429,
      );
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = phone ? escapeHtml(phone) : "Not provided";
    const safeMessage = message ? escapeHtml(message).replace(/\n/g, "<br>") : "";

    // 1) Notify the Broker Development team (reply-to goes to the applicant).
    await sendEmail({
      from: FROM,
      to: TEAM,
      reply_to: email,
      subject: `New Agent Inquiry — ${name}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#16201b;border-bottom:2px solid #A8801F;padding-bottom:10px;">New Agent Inquiry</h2>
          <div style="background:#F4F1E8;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 10px 0;"><strong>Name:</strong> ${safeName}</p>
            <p style="margin:0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
            <p style="margin:0 0 10px 0;"><strong>Phone:</strong> ${safePhone}</p>
          </div>
          ${
            safeMessage
              ? `<div style="margin:20px 0;">
                   <p style="font-weight:bold;margin-bottom:10px;">Details:</p>
                   <p style="background:#fff;padding:15px;border-left:3px solid #A8801F;margin:0;">${safeMessage}</p>
                 </div>`
              : ""
          }
          <p style="color:#5f6b62;font-size:12px;margin-top:30px;">
            Submitted through the "Become a TIG Agent" page on tigagenthub.com.
          </p>
        </div>
      `,
    });

    // 2) Best-effort confirmation to the applicant (never fail the request on this).
    try {
      await sendEmail({
        from: FROM,
        to: [email],
        subject: "We got your note — Tyler Insurance Group",
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#16201b;">Thanks for reaching out, ${safeName}.</h2>
            <p>We got your note about joining Tyler Insurance Group, and a real person on our Broker Development team will read it.</p>
            <p>If it looks like a fit, we'll reach out within a couple business days to set up a quick 10-minute call. No pressure, no pitch.</p>
            <div style="background:#F4F1E8;padding:20px;border-radius:8px;margin:20px 0;">
              <p style="margin:0 0 10px 0;font-weight:bold;">Want to talk sooner?</p>
              <p style="margin:5px 0;">Austin Tyler: <a href="tel:8596196672">(859) 619-6672</a></p>
              <p style="margin:5px 0;">Andrew Horn: <a href="tel:2107225597">(210) 722-5597</a></p>
            </div>
            <p style="margin-top:30px;">— Austin &amp; Andrew<br><strong>Tyler Insurance Group</strong></p>
          </div>
        `,
      });
    } catch (confirmErr) {
      console.warn("Confirmation email failed (inquiry still received):", confirmErr);
    }

    return json(req, { success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    console.error("send-agent-inquiry failed:", msg);
    return json(req, { error: "Failed to send inquiry." }, 500);
  }
});
