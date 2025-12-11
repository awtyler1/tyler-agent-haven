import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

interface LegalQuestion {
  answer: boolean | null;
  explanation?: string;
}

interface SelectedCarrier {
  carrier_id: string;
  carrier_name: string;
  non_resident_states: string[];
}

interface ContractingData {
  full_legal_name: string;
  agency_name?: string;
  gender?: string;
  birth_date?: string;
  npn_number?: string;
  insurance_license_number?: string;
  tax_id?: string;
  email_address: string;
  phone_mobile?: string;
  phone_business?: string;
  phone_home?: string;
  fax?: string;
  preferred_contact_methods?: string[];
  home_address: Address;
  mailing_address_same_as_home: boolean;
  mailing_address?: Address;
  ups_address_same_as_home: boolean;
  ups_address?: Address;
  previous_addresses?: Address[];
  resident_license_number?: string;
  resident_state?: string;
  license_expiration_date?: string;
  drivers_license_number?: string;
  drivers_license_state?: string;
  legal_questions: Record<string, LegalQuestion>;
  bank_routing_number?: string;
  bank_account_number?: string;
  bank_branch_name?: string;
  beneficiary_name?: string;
  beneficiary_relationship?: string;
  requesting_commission_advancing: boolean;
  aml_training_provider?: string;
  aml_completion_date?: string;
  has_ltc_certification: boolean;
  state_requires_ce: boolean;
  selected_carriers: SelectedCarrier[];
  is_corporation: boolean;
  signature_name: string;
  signature_initials: string;
  signature_date: string;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatAddress(addr: Address | undefined): string {
  if (!addr) return 'N/A';
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application } = await req.json() as { application: ContractingData };

    console.log('Generating PDF for:', application.full_legal_name);

    // Validate required fields
    const validationErrors: string[] = [];
    if (!application.signature_initials) validationErrors.push('Initials are required');
    if (!application.signature_date) validationErrors.push('Signature date is required');
    if (!application.signature_name) validationErrors.push('Signature name is required');
    if (!application.full_legal_name) validationErrors.push('Full legal name is required');

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 612; // Letter size
    const pageHeight = 792;
    const margin = 50;
    const lineHeight = 16;
    const sectionGap = 25;

    const textColor = rgb(0, 0, 0);
    const headerColor = rgb(0.2, 0.2, 0.4);
    const goldColor = rgb(0.78, 0.64, 0.35);

    // Helper functions
    const drawHeader = (page: any, text: string, y: number) => {
      page.drawText(text, { x: margin, y, size: 14, font: fontBold, color: headerColor });
      page.drawLine({
        start: { x: margin, y: y - 5 },
        end: { x: pageWidth - margin, y: y - 5 },
        thickness: 1,
        color: goldColor,
      });
      return y - 25;
    };

    const drawField = (page: any, label: string, value: string, y: number, x = margin) => {
      page.drawText(`${label}:`, { x, y, size: 9, font: fontBold, color: textColor });
      page.drawText(value || 'N/A', { x: x + 120, y, size: 9, font, color: textColor });
      return y - lineHeight;
    };

    const drawFieldWide = (page: any, label: string, value: string, y: number) => {
      page.drawText(`${label}:`, { x: margin, y, size: 9, font: fontBold, color: textColor });
      page.drawText(value || 'N/A', { x: margin + 150, y, size: 9, font, color: textColor });
      return y - lineHeight;
    };

    // ============== PAGE 1: Cover & Personal Info ==============
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Title
    page.drawText('TYLER INSURANCE GROUP', { x: margin, y, size: 20, font: fontBold, color: headerColor });
    y -= 25;
    page.drawText('Agent Contracting Packet', { x: margin, y, size: 16, font, color: textColor });
    y -= 15;
    page.drawText(`Submitted: ${formatDate(application.signature_date)}`, { x: margin, y, size: 10, font, color: textColor });
    y -= sectionGap + 10;

    // Personal Information
    y = drawHeader(page, 'PERSONAL INFORMATION', y);
    y = drawField(page, 'Full Legal Name', application.full_legal_name, y);
    if (application.agency_name) {
      y = drawField(page, 'Agency/Business', application.agency_name, y);
    }
    y = drawField(page, 'Date of Birth', formatDate(application.birth_date), y);
    y = drawField(page, 'Gender', application.gender || 'N/A', y);
    y = drawField(page, 'SSN/Tax ID', application.tax_id ? `***-**-${application.tax_id.slice(-4)}` : 'N/A', y);
    y -= sectionGap;

    // Contact Information
    y = drawHeader(page, 'CONTACT INFORMATION', y);
    y = drawField(page, 'Email', application.email_address, y);
    y = drawField(page, 'Mobile Phone', application.phone_mobile || 'N/A', y);
    y = drawField(page, 'Business Phone', application.phone_business || 'N/A', y);
    if (application.fax) {
      y = drawField(page, 'Fax', application.fax, y);
    }
    y -= sectionGap;

    // Address
    y = drawHeader(page, 'ADDRESS', y);
    y = drawFieldWide(page, 'Home Address', formatAddress(application.home_address), y);
    if (!application.mailing_address_same_as_home && application.mailing_address) {
      y = drawFieldWide(page, 'Mailing Address', formatAddress(application.mailing_address), y);
    }
    y -= sectionGap;

    // Licensing
    y = drawHeader(page, 'LICENSING INFORMATION', y);
    y = drawField(page, 'NPN Number', application.npn_number || 'N/A', y);
    y = drawField(page, 'License Number', application.insurance_license_number || 'N/A', y);
    y = drawField(page, 'Resident State', application.resident_state || 'N/A', y);
    y = drawField(page, 'License Expiration', formatDate(application.license_expiration_date), y);
    y = drawField(page, "Driver's License", `${application.drivers_license_number || 'N/A'} (${application.drivers_license_state || 'N/A'})`, y);

    // Footer with initials
    page.drawText(`Initials: ${application.signature_initials}`, { x: margin, y: 40, size: 8, font, color: textColor });
    page.drawText(`Date: ${formatDate(application.signature_date)}`, { x: margin + 100, y: 40, size: 8, font, color: textColor });
    page.drawText('Page 1', { x: pageWidth - margin - 30, y: 40, size: 8, font, color: textColor });

    // ============== PAGE 2: Banking & Training ==============
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    // Banking Information
    y = drawHeader(page, 'BANKING INFORMATION', y);
    y = drawField(page, 'Routing Number', application.bank_routing_number || 'N/A', y);
    y = drawField(page, 'Account Number', application.bank_account_number ? `****${application.bank_account_number.slice(-4)}` : 'N/A', y);
    if (application.bank_branch_name) {
      y = drawField(page, 'Bank/Branch', application.bank_branch_name, y);
    }
    y = drawField(page, 'Commission Advance', application.requesting_commission_advancing ? 'Yes' : 'No', y);
    y -= sectionGap;

    // Beneficiary
    y = drawHeader(page, 'BENEFICIARY INFORMATION', y);
    y = drawField(page, 'Beneficiary Name', application.beneficiary_name || 'N/A', y);
    y = drawField(page, 'Relationship', application.beneficiary_relationship || 'N/A', y);
    y -= sectionGap;

    // Training
    y = drawHeader(page, 'TRAINING & CERTIFICATIONS', y);
    y = drawField(page, 'AML Training', application.aml_training_provider ? 'Completed' : 'Not Completed', y);
    if (application.aml_training_provider) {
      y = drawField(page, 'Provider', application.aml_training_provider.toUpperCase(), y);
      y = drawField(page, 'Completion Date', formatDate(application.aml_completion_date), y);
    }
    y = drawField(page, 'LTC Certification', application.has_ltc_certification ? 'Yes' : 'No', y);
    y -= sectionGap;

    // Legal Questions Summary
    y = drawHeader(page, 'BACKGROUND QUESTIONS', y);
    const legalQuestions = application.legal_questions || {};
    const yesAnswers = Object.entries(legalQuestions).filter(([_, q]) => q.answer === true);
    
    if (yesAnswers.length === 0) {
      page.drawText('All background questions answered "No"', { x: margin, y, size: 10, font, color: textColor });
      y -= lineHeight;
    } else {
      page.drawText(`${yesAnswers.length} question(s) answered "Yes" - see explanations below:`, { x: margin, y, size: 10, font, color: textColor });
      y -= lineHeight + 5;
      for (const [id, q] of yesAnswers) {
        page.drawText(`Question ${id}: Yes`, { x: margin + 10, y, size: 9, font: fontBold, color: textColor });
        y -= lineHeight;
        if (q.explanation) {
          const explanation = q.explanation.substring(0, 100) + (q.explanation.length > 100 ? '...' : '');
          page.drawText(`Explanation: ${explanation}`, { x: margin + 20, y, size: 8, font, color: textColor });
          y -= lineHeight;
        }
      }
    }

    // Footer
    page.drawText(`Initials: ${application.signature_initials}`, { x: margin, y: 40, size: 8, font, color: textColor });
    page.drawText(`Date: ${formatDate(application.signature_date)}`, { x: margin + 100, y: 40, size: 8, font, color: textColor });
    page.drawText('Page 2', { x: pageWidth - margin - 30, y: 40, size: 8, font, color: textColor });

    // ============== PAGE 3: Carriers & Signature ==============
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    // Carrier Selection
    y = drawHeader(page, 'SELECTED CARRIERS', y);
    const carriers = application.selected_carriers || [];
    if (carriers.length === 0) {
      page.drawText('No carriers selected', { x: margin, y, size: 10, font, color: textColor });
      y -= lineHeight;
    } else {
      page.drawText(`${carriers.length} carrier(s) selected:`, { x: margin, y, size: 10, font, color: textColor });
      y -= lineHeight + 5;
      
      // Two column layout for carriers
      const colWidth = (pageWidth - 2 * margin) / 2;
      let col = 0;
      let startY = y;
      
      for (let i = 0; i < carriers.length; i++) {
        const carrier = carriers[i];
        const x = margin + (col * colWidth);
        page.drawText(`• ${carrier.carrier_name}`, { x, y, size: 9, font, color: textColor });
        
        if (carrier.non_resident_states && carrier.non_resident_states.length > 0) {
          y -= 12;
          page.drawText(`  States: ${carrier.non_resident_states.join(', ')}`, { x, y, size: 8, font, color: textColor });
        }
        
        y -= lineHeight;
        
        // Switch columns
        if (col === 0 && i < carriers.length - 1) {
          col = 1;
          y = startY;
        } else {
          col = 0;
          startY = y;
        }
      }
      
      y = Math.min(y, startY) - sectionGap;
    }

    // Signature Section
    y = Math.min(y, 300);
    y = drawHeader(page, 'SIGNATURE & ATTESTATION', y);
    y -= 10;

    page.drawText('I hereby certify that all information provided in this contracting packet is true and accurate.', 
      { x: margin, y, size: 10, font, color: textColor });
    y -= lineHeight;
    page.drawText('I understand that any misrepresentation may result in termination of my contract.', 
      { x: margin, y, size: 10, font, color: textColor });
    y -= sectionGap;

    // Signature box
    page.drawRectangle({
      x: margin,
      y: y - 60,
      width: 250,
      height: 50,
      borderColor: textColor,
      borderWidth: 1,
    });
    page.drawText('Signature:', { x: margin + 5, y: y - 15, size: 8, font, color: textColor });
    page.drawText(application.signature_name, { x: margin + 20, y: y - 40, size: 14, font: fontBold, color: headerColor });

    // Date box
    page.drawRectangle({
      x: margin + 280,
      y: y - 60,
      width: 150,
      height: 50,
      borderColor: textColor,
      borderWidth: 1,
    });
    page.drawText('Date:', { x: margin + 285, y: y - 15, size: 8, font, color: textColor });
    page.drawText(formatDate(application.signature_date), { x: margin + 300, y: y - 40, size: 12, font, color: textColor });

    // Footer
    page.drawText(`Initials: ${application.signature_initials}`, { x: margin, y: 40, size: 8, font, color: textColor });
    page.drawText(`Date: ${formatDate(application.signature_date)}`, { x: margin + 100, y: 40, size: 8, font, color: textColor });
    page.drawText('Page 3', { x: pageWidth - margin - 30, y: 40, size: 8, font, color: textColor });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Generate filename
    const nameParts = application.full_legal_name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `TIG_Contracting_${lastName}_${firstName}_${dateStr}.pdf`;

    console.log('PDF generated successfully:', filename, 'Size:', pdfBytes.byteLength);

    // Return the PDF as base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        pdf: base64,
        size: pdfBytes.byteLength
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
