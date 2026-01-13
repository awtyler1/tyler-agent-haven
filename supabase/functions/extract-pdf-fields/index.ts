import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { pdfUrl, pdfBase64 } = await req.json();
    
    let pdfBytes: ArrayBuffer;
    
    if (pdfBase64) {
      // Decode base64
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfBytes = bytes.buffer;
    } else if (pdfUrl) {
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
      }
      pdfBytes = await pdfResponse.arrayBuffer();
    } else {
      return new Response(
        JSON.stringify({ error: 'pdfUrl or pdfBase64 is required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    // Extract field information
    const fieldInfo = fields.map((field: any) => {
      const type = field.constructor.name;
      const name = field.getName();
      
      let value = null;
      let options = null;
      
      try {
        if (type === 'PDFTextField') {
          value = field.getText?.() || null;
        } else if (type === 'PDFCheckBox') {
          value = field.isChecked?.() || false;
        } else if (type === 'PDFDropdown' || type === 'PDFOptionList') {
          options = field.getOptions?.() || [];
          value = field.getSelected?.() || null;
        } else if (type === 'PDFRadioGroup') {
          options = field.getOptions?.() || [];
          value = field.getSelected?.() || null;
        }
      } catch (e) {
        // Could not get value for field
      }
      
      return {
        name,
        type,
        value,
        options,
      };
    });
    
    // Group fields by type for easier reading
    const grouped = {
      textFields: fieldInfo.filter((f: any) => f.type === 'PDFTextField'),
      checkboxes: fieldInfo.filter((f: any) => f.type === 'PDFCheckBox'),
      dropdowns: fieldInfo.filter((f: any) => f.type === 'PDFDropdown'),
      radioGroups: fieldInfo.filter((f: any) => f.type === 'PDFRadioGroup'),
      other: fieldInfo.filter((f: any) => !['PDFTextField', 'PDFCheckBox', 'PDFDropdown', 'PDFRadioGroup'].includes(f.type)),
    };

    // Save to system_config for later retrieval
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabase
      .from('system_config')
      .upsert({
        config_key: 'pdf_template_fields',
        config_value: { fields: fieldInfo, grouped, totalFields: fields.length, pageCount: pdfDoc.getPageCount() },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'config_key' });

    return new Response(
      JSON.stringify({
        success: true,
        totalFields: fields.length,
        pageCount: pdfDoc.getPageCount(),
        fields: fieldInfo,
        grouped,
        savedToDb: true,
      }, null, 2),
      { 
        status: 200, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: unknown) {
    console.error('Error extracting PDF fields:', error);
    return new Response(
      JSON.stringify({
        error: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});
