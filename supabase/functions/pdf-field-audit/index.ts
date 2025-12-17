import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FieldInfo {
  fieldName: string;
  fieldType: string;
  pageIndex: number;
  rect: { x: number; y: number; width: number; height: number } | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { templateBase64, templateUrl } = body as { templateBase64?: string; templateUrl?: string };
    
    let pdfBytes: ArrayBuffer | null = null;
    
    // Option 1: Use provided base64 template
    if (templateBase64) {
      console.log('Using provided base64 template');
      const binaryString = atob(templateBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfBytes = bytes.buffer;
    }
    
    // Option 2: Fetch from provided URL
    if (!pdfBytes && templateUrl) {
      console.log('Fetching from provided URL:', templateUrl);
      const response = await fetch(templateUrl);
      if (response.ok) {
        pdfBytes = await response.arrayBuffer();
      }
    }
    
    // Option 3: Try default URLs
    if (!pdfBytes) {
      const possibleUrls = [
        'https://hikhnmuckfopyzxkdeus.lovableproject.com/templates/TIG_Contracting_Packet_Template.pdf',
        'https://tyler-insurance-hub.lovable.app/templates/TIG_Contracting_Packet_Template.pdf',
      ];
      
      for (const url of possibleUrls) {
        try {
          console.log('Trying URL:', url);
          const response = await fetch(url);
          if (response.ok) {
            pdfBytes = await response.arrayBuffer();
            console.log('Loaded from:', url);
            break;
          }
        } catch (e) {
          console.log('Failed to fetch from', url);
        }
      }
    }
    
    if (!pdfBytes) {
      return new Response(JSON.stringify({ 
        error: 'Could not fetch template. Provide templateBase64 or templateUrl in request body.',
        example: '{ "templateUrl": "https://example.com/template.pdf" }'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Template loaded, size:', pdfBytes.byteLength);
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    const allFields = form.getFields();
    
    console.log('Total fields found:', allFields.length);
    console.log('Total pages:', pages.length);
    
    const fieldInfos: FieldInfo[] = [];
    
    for (const field of allFields) {
      const fieldName = field.getName();
      const fieldTypeName = field.constructor.name;
      
      // Map constructor name to friendly type using pdf-lib's field type methods
      let fieldType = 'unknown';
      const nameLower = fieldName.toLowerCase();
      try {
        // Check field name first for signature fields (often renamed text fields)
        if (nameLower.includes('signature') || nameLower.includes('_es_:signer')) {
          fieldType = 'signature';
        }
        // Use duck typing to detect field type
        else if (typeof (field as any).getText === 'function') fieldType = 'text';
        else if (typeof (field as any).isChecked === 'function') fieldType = 'checkbox';
        else if (typeof (field as any).getSelected === 'function') fieldType = 'radio';
        else if (fieldTypeName.includes('Sig') || fieldTypeName.includes('ignature')) fieldType = 'signature';
        else if (typeof (field as any).getOptions === 'function') fieldType = 'dropdown';
        else if (fieldTypeName.includes('Button') || fieldTypeName.includes('Btn')) fieldType = 'button';
        else fieldType = fieldTypeName;
      } catch {
        fieldType = fieldTypeName;
      }
      
      // Get widget placement
      let pageIndex = -1;
      let rect: { x: number; y: number; width: number; height: number } | null = null;
      
      try {
        const acroField = (field as any).acroField;
        const widgets = acroField?.getWidgets?.() ?? [];
        const widget = widgets?.[0];
        
        if (widget) {
          const rectObj = widget.getRectangle?.();
          const raw = rectObj?.asArray?.() ?? null;
          
          if (raw && raw.length >= 4) {
            const toNum = (n: any) => Number(n?.asNumber?.() ?? n?.numberValue?.() ?? n?.value?.() ?? n);
            const x1 = toNum(raw[0]);
            const y1 = toNum(raw[1]);
            const x2 = toNum(raw[2]);
            const y2 = toNum(raw[3]);
            
            rect = {
              x: Math.min(x1, x2),
              y: Math.min(y1, y2),
              width: Math.abs(x2 - x1),
              height: Math.abs(y2 - y1),
            };
            
            // Find which page contains this widget
            pageIndex = pages.findIndex((p: any) => {
              const annots = p.node?.Annots?.() ?? p.node?.lookup?.('Annots');
              const arr = typeof annots?.asArray === 'function' ? annots.asArray() : null;
              return Array.isArray(arr) && arr.includes(widget.ref);
            });
            
            if (pageIndex < 0) pageIndex = 0;
          }
        }
      } catch (e) {
        console.log(`Error getting widget for field ${fieldName}:`, e);
      }
      
      fieldInfos.push({
        fieldName,
        fieldType,
        pageIndex,
        rect,
      });
    }
    
    // Sort by pageIndex, then fieldName
    fieldInfos.sort((a, b) => {
      if (a.pageIndex !== b.pageIndex) {
        return a.pageIndex - b.pageIndex;
      }
      return a.fieldName.localeCompare(b.fieldName);
    });
    
    // Summary stats
    const summary = {
      totalFields: fieldInfos.length,
      totalPages: pages.length,
      byType: {} as Record<string, number>,
      byPage: {} as Record<number, number>,
      signatureFields: fieldInfos.filter(f => f.fieldType === 'signature').map(f => f.fieldName),
    };
    
    for (const f of fieldInfos) {
      summary.byType[f.fieldType] = (summary.byType[f.fieldType] || 0) + 1;
      summary.byPage[f.pageIndex] = (summary.byPage[f.pageIndex] || 0) + 1;
    }
    
    return new Response(JSON.stringify({ summary, fields: fieldInfos }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in pdf-field-audit:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
