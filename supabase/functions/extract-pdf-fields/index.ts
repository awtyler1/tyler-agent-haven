import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl, pdfBase64 } = await req.json();
    
    let pdfBytes: ArrayBuffer;
    
    if (pdfBase64) {
      // Decode base64
      console.log('Using base64 PDF data');
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfBytes = bytes.buffer;
    } else if (pdfUrl) {
      console.log('Fetching PDF from:', pdfUrl);
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
      }
      pdfBytes = await pdfResponse.arrayBuffer();
    } else {
      return new Response(
        JSON.stringify({ error: 'pdfUrl or pdfBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('PDF size:', pdfBytes.byteLength, 'bytes');
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    console.log('PDF loaded successfully, pages:', pdfDoc.getPageCount());
    
    // Get the form
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('Found', fields.length, 'form fields');
    
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
        console.log(`Could not get value for field ${name}:`, e);
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
    
    return new Response(
      JSON.stringify({
        success: true,
        totalFields: fields.length,
        pageCount: pdfDoc.getPageCount(),
        fields: fieldInfo,
        grouped,
      }, null, 2),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error extracting PDF fields:', error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        stack: errorStack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
