import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    console.log(`Processing contracting submission from ${name} (NPN: ${npn})`);

    // Decode base64 file content
    const binaryContent = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));

    const emailResponse = await resend.emails.send({
      from: "Tyler Insurance Group <onboarding@resend.dev>",
      to: ["caroline@tylerinsurancegroup.com"],
      subject: `New Contracting Submission from ${name} – NPN ${npn}`,
      html: `
        <h2>New Contracting Packet Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>NPN:</strong> ${npn}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <p><strong>File:</strong> ${fileName}</p>
        <hr />
        <p>The contracting packet is attached to this email.</p>
        <p><em>This is an automated message from the Tyler Insurance Group Agent Platform.</em></p>
      `,
      attachments: [
        {
          filename: fileName,
          content: binaryContent,
          content_type: fileType,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contracting-packet function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
