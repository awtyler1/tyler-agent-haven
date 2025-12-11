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

// Field positions on each page (x, y coordinates from bottom-left)
// These will need to be adjusted based on the actual PDF template
const FIELD_POSITIONS = {
  // Page 2 - Contract Application
  page2: {
    agentName: { x: 150, y: 695 },
    ssn: { x: 150, y: 670 },
    agencyName: { x: 400, y: 695 },
    taxId: { x: 400, y: 670 },
    personalName: { x: 150, y: 645 },
    insuranceLicense: { x: 400, y: 645 },
    birthDate: { x: 150, y: 620 },
    npn: { x: 400, y: 620 },
    genderMale: { x: 150, y: 595 },
    genderFemale: { x: 200, y: 595 },
    homeStreet: { x: 150, y: 545 },
    homeCity: { x: 150, y: 520 },
    homeState: { x: 300, y: 520 },
    homeZip: { x: 400, y: 520 },
    homeCounty: { x: 480, y: 520 },
    mailingStreet: { x: 150, y: 470 },
    mailingCity: { x: 150, y: 445 },
    mailingState: { x: 300, y: 445 },
    mailingZip: { x: 400, y: 445 },
    mailingCounty: { x: 480, y: 445 },
    upsStreet: { x: 150, y: 395 },
    upsCity: { x: 150, y: 370 },
    upsState: { x: 300, y: 370 },
    upsZip: { x: 400, y: 370 },
    upsCounty: { x: 480, y: 370 },
    phoneRes: { x: 150, y: 320 },
    phoneBusiness: { x: 280, y: 320 },
    fax: { x: 400, y: 320 },
    mobile: { x: 480, y: 320 },
    email: { x: 150, y: 295 },
    prevStreet: { x: 150, y: 245 },
    prevCity: { x: 150, y: 220 },
    prevState: { x: 300, y: 220 },
    prevZip: { x: 400, y: 220 },
    prevCounty: { x: 480, y: 220 },
    contactEmail: { x: 150, y: 165 },
    contactPhone: { x: 220, y: 165 },
    contactText: { x: 290, y: 165 },
    initials: { x: 100, y: 95 },
  },
  // Page 3 - Legal Questions (1-8A)
  page3: {
    initials: { x: 100, y: 60 },
  },
  // Page 4 - Legal Questions (8B-19) + Signature
  page4: {
    signature: { x: 150, y: 120 },
    signatureDate: { x: 400, y: 120 },
    initials: { x: 100, y: 60 },
  },
  // Page 5 - Banking
  page5: {
    routingNumber: { x: 200, y: 620 },
    accountNumber: { x: 200, y: 595 },
    branchName: { x: 200, y: 570 },
    commissionYes: { x: 320, y: 520 },
    commissionNo: { x: 370, y: 520 },
    beneficiaryName: { x: 200, y: 485 },
    beneficiaryRelation: { x: 400, y: 485 },
    driversLicense: { x: 200, y: 450 },
    driversState: { x: 400, y: 450 },
    amlYes: { x: 420, y: 405 },
    amlNo: { x: 470, y: 405 },
    courseName: { x: 200, y: 370 },
    courseDate: { x: 200, y: 345 },
    initials: { x: 100, y: 60 },
  },
  // Page 6 - Additional Info (SelectHealth)
  page6: {
    initials: { x: 100, y: 60 },
  },
  // Page 7 - Letter of Explanation
  page7: {
    amlProvider: { x: 320, y: 205 },
    amlDate: { x: 200, y: 175 },
    initials: { x: 100, y: 60 },
  },
  // Page 8 - Agent Referral
  page8: {
    initials: { x: 100, y: 60 },
  },
  // Page 9 - E&O placeholder
  page9: {
    initials: { x: 100, y: 60 },
  },
  // Page 10 - Signature Authorization
  page10: {
    authName: { x: 90, y: 445 },
    signatureBox: { x: 200, y: 250 },
    initials: { x: 100, y: 60 },
  },
  // Page 11 - Carrier Selection
  page11: {
    initials: { x: 100, y: 40 },
  },
};

// Carrier name to checkbox position mapping for page 11
const CARRIER_POSITIONS: Record<string, { x: number; y: number }> = {
  'Aetna Medicare Advantage': { x: 47, y: 670 },
  'Aetna Medicare Supplement': { x: 47, y: 655 },
  'AGLA Life': { x: 47, y: 640 },
  'Alignment Health': { x: 47, y: 625 },
  'American Equity': { x: 47, y: 610 },
  'Americo': { x: 47, y: 580 },
  'Anthem': { x: 47, y: 550 },
  'Athene': { x: 47, y: 505 },
  'Cigna': { x: 47, y: 445 },
  'Devoted Health': { x: 47, y: 385 },
  'Humana': { x: 330, y: 670 },
  'UnitedHealthcare': { x: 330, y: 355 },
  'WellCare': { x: 330, y: 340 },
  // Add more carriers as needed
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatDateMMYYYY(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application, templateUrl } = await req.json() as { 
      application: ContractingData; 
      templateUrl: string;
    };

    console.log('Generating PDF for:', application.full_legal_name);

    // Validate required fields
    const validationErrors: string[] = [];
    if (!application.signature_initials) validationErrors.push('Initials are required');
    if (!application.signature_date) validationErrors.push('Signature date is required');
    if (!application.signature_name) validationErrors.push('Signature name is required');
    if (!application.full_legal_name) validationErrors.push('Full legal name is required');
    
    // Check legal questions have answers
    const legalQuestions = application.legal_questions || {};
    const yesAnswers = Object.entries(legalQuestions).filter(([_, q]) => q.answer === true);
    for (const [id, q] of yesAnswers) {
      if (!q.explanation) {
        validationErrors.push(`Explanation required for legal question ${id}`);
      }
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the template PDF
    console.log('Fetching template from:', templateUrl);
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error(`Failed to fetch template: ${templateResponse.status}`);
    }
    const templateBytes = await templateResponse.arrayBuffer();

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    const fontSize = 10;
    const smallFontSize = 8;
    const textColor = rgb(0, 0, 0);
    const initials = application.signature_initials.toUpperCase();
    const signatureDate = formatDate(application.signature_date);

    // Helper to draw text
    const drawText = (page: any, text: string, x: number, y: number, size = fontSize) => {
      if (!text) return;
      page.drawText(text, { x, y, size, font, color: textColor });
    };

    // Helper to draw checkmark
    const drawCheck = (page: any, x: number, y: number) => {
      page.drawText('X', { x, y, size: 12, font: fontBold, color: textColor });
    };

    // Helper to draw initials and date on each page
    const drawPageInitials = (page: any, pos: { x: number; y: number }) => {
      drawText(page, initials, pos.x, pos.y);
      drawText(page, signatureDate, pos.x + 60, pos.y);
    };

    // PAGE 2 - Contract Application (index 1)
    if (pages.length > 1) {
      const page = pages[1];
      const pos = FIELD_POSITIONS.page2;
      
      drawText(page, application.full_legal_name, pos.agentName.x, pos.agentName.y);
      drawText(page, application.tax_id || '', pos.ssn.x, pos.ssn.y);
      drawText(page, application.agency_name || '', pos.agencyName.x, pos.agencyName.y);
      if (application.is_corporation && application.tax_id) {
        drawText(page, application.tax_id, pos.taxId.x, pos.taxId.y);
      }
      drawText(page, application.full_legal_name, pos.personalName.x, pos.personalName.y);
      drawText(page, application.insurance_license_number || '', pos.insuranceLicense.x, pos.insuranceLicense.y);
      drawText(page, formatDate(application.birth_date), pos.birthDate.x, pos.birthDate.y);
      drawText(page, application.npn_number || '', pos.npn.x, pos.npn.y);
      
      // Gender checkbox
      if (application.gender === 'Male') {
        drawCheck(page, pos.genderMale.x, pos.genderMale.y);
      } else if (application.gender === 'Female') {
        drawCheck(page, pos.genderFemale.x, pos.genderFemale.y);
      }

      // Home address
      const home = application.home_address;
      if (home) {
        drawText(page, home.street, pos.homeStreet.x, pos.homeStreet.y);
        drawText(page, home.city, pos.homeCity.x, pos.homeCity.y);
        drawText(page, home.state, pos.homeState.x, pos.homeState.y);
        drawText(page, home.zip, pos.homeZip.x, pos.homeZip.y);
        drawText(page, home.county, pos.homeCounty.x, pos.homeCounty.y);
      }

      // Mailing address
      const mailing = application.mailing_address_same_as_home ? home : application.mailing_address;
      if (mailing) {
        drawText(page, mailing.street, pos.mailingStreet.x, pos.mailingStreet.y);
        drawText(page, mailing.city, pos.mailingCity.x, pos.mailingCity.y);
        drawText(page, mailing.state, pos.mailingState.x, pos.mailingState.y);
        drawText(page, mailing.zip, pos.mailingZip.x, pos.mailingZip.y);
        drawText(page, mailing.county, pos.mailingCounty.x, pos.mailingCounty.y);
      }

      // UPS address
      const ups = application.ups_address_same_as_home ? home : application.ups_address;
      if (ups) {
        drawText(page, ups.street, pos.upsStreet.x, pos.upsStreet.y);
        drawText(page, ups.city, pos.upsCity.x, pos.upsCity.y);
        drawText(page, ups.state, pos.upsState.x, pos.upsState.y);
        drawText(page, ups.zip, pos.upsZip.x, pos.upsZip.y);
        drawText(page, ups.county, pos.upsCounty.x, pos.upsCounty.y);
      }

      // Phone numbers
      drawText(page, application.phone_home || '', pos.phoneRes.x, pos.phoneRes.y);
      drawText(page, application.phone_business || '', pos.phoneBusiness.x, pos.phoneBusiness.y);
      drawText(page, application.fax || '', pos.fax.x, pos.fax.y);
      drawText(page, application.phone_mobile || '', pos.mobile.x, pos.mobile.y);
      drawText(page, application.email_address, pos.email.x, pos.email.y);

      // Previous address
      const prev = application.previous_addresses?.[0];
      if (prev) {
        drawText(page, prev.street, pos.prevStreet.x, pos.prevStreet.y);
        drawText(page, prev.city, pos.prevCity.x, pos.prevCity.y);
        drawText(page, prev.state, pos.prevState.x, pos.prevState.y);
        drawText(page, prev.zip, pos.prevZip.x, pos.prevZip.y);
        drawText(page, prev.county, pos.prevCounty.x, pos.prevCounty.y);
      }

      // Contact preferences
      const prefs = application.preferred_contact_methods || [];
      if (prefs.includes('Email')) drawCheck(page, pos.contactEmail.x, pos.contactEmail.y);
      if (prefs.includes('Phone')) drawCheck(page, pos.contactPhone.x, pos.contactPhone.y);
      if (prefs.includes('Text')) drawCheck(page, pos.contactText.x, pos.contactText.y);

      drawPageInitials(page, pos.initials);
    }

    // PAGE 3 - Legal Questions Part 1 (index 2)
    if (pages.length > 2) {
      const page = pages[2];
      // Legal questions 1-8A - would need precise checkbox positions
      // For now, just add initials
      drawPageInitials(page, FIELD_POSITIONS.page3.initials);
    }

    // PAGE 4 - Legal Questions Part 2 + Signature (index 3)
    if (pages.length > 3) {
      const page = pages[3];
      const pos = FIELD_POSITIONS.page4;
      
      // Signature and date at bottom of legal questions
      drawText(page, application.signature_name, pos.signature.x, pos.signature.y);
      drawText(page, signatureDate, pos.signatureDate.x, pos.signatureDate.y);
      
      drawPageInitials(page, pos.initials);
    }

    // PAGE 5 - Banking Information (index 4)
    if (pages.length > 4) {
      const page = pages[4];
      const pos = FIELD_POSITIONS.page5;
      
      drawText(page, application.bank_routing_number || '', pos.routingNumber.x, pos.routingNumber.y);
      drawText(page, application.bank_account_number || '', pos.accountNumber.x, pos.accountNumber.y);
      drawText(page, application.bank_branch_name || '', pos.branchName.x, pos.branchName.y);
      
      if (application.requesting_commission_advancing) {
        drawCheck(page, pos.commissionYes.x, pos.commissionYes.y);
      } else {
        drawCheck(page, pos.commissionNo.x, pos.commissionNo.y);
      }
      
      drawText(page, application.beneficiary_name || '', pos.beneficiaryName.x, pos.beneficiaryName.y);
      drawText(page, application.beneficiary_relationship || '', pos.beneficiaryRelation.x, pos.beneficiaryRelation.y);
      drawText(page, application.drivers_license_number || '', pos.driversLicense.x, pos.driversLicense.y);
      drawText(page, application.drivers_license_state || '', pos.driversState.x, pos.driversState.y);
      
      if (application.aml_training_provider) {
        drawCheck(page, pos.amlYes.x, pos.amlYes.y);
        drawText(page, application.aml_training_provider, pos.courseName.x, pos.courseName.y);
        drawText(page, formatDateMMYYYY(application.aml_completion_date), pos.courseDate.x, pos.courseDate.y);
      } else {
        drawCheck(page, pos.amlNo.x, pos.amlNo.y);
      }
      
      drawPageInitials(page, pos.initials);
    }

    // PAGE 6 - Additional Info (index 5)
    if (pages.length > 5) {
      const page = pages[5];
      drawPageInitials(page, FIELD_POSITIONS.page6.initials);
    }

    // PAGE 7 - Letter of Explanation (index 6)
    if (pages.length > 6) {
      const page = pages[6];
      const pos = FIELD_POSITIONS.page7;
      
      // AML provider
      if (application.aml_training_provider === 'LIMRA') {
        drawCheck(page, pos.amlProvider.x, pos.amlProvider.y);
      }
      drawText(page, formatDate(application.aml_completion_date), pos.amlDate.x, pos.amlDate.y);
      
      drawPageInitials(page, pos.initials);
    }

    // PAGE 8 - Agent Referral (index 7)
    if (pages.length > 7) {
      const page = pages[7];
      drawPageInitials(page, FIELD_POSITIONS.page8.initials);
    }

    // PAGE 9 - E&O placeholder (index 8)
    if (pages.length > 8) {
      const page = pages[8];
      drawPageInitials(page, FIELD_POSITIONS.page9.initials);
    }

    // PAGE 10 - Signature Authorization (index 9)
    if (pages.length > 9) {
      const page = pages[9];
      const pos = FIELD_POSITIONS.page10;
      
      // Authorization name (the "I, ____" blank)
      drawText(page, application.full_legal_name, pos.authName.x, pos.authName.y);
      
      // Signature in the box
      drawText(page, application.signature_name, pos.signatureBox.x, pos.signatureBox.y, 14);
      
      drawPageInitials(page, pos.initials);
    }

    // PAGE 11 - Carrier Selection (index 10)
    if (pages.length > 10) {
      const page = pages[10];
      
      // Mark selected carriers
      for (const carrier of application.selected_carriers) {
        // Try to find carrier position by matching name
        const carrierName = carrier.carrier_name;
        for (const [name, pos] of Object.entries(CARRIER_POSITIONS)) {
          if (carrierName.toLowerCase().includes(name.toLowerCase()) || 
              name.toLowerCase().includes(carrierName.toLowerCase())) {
            drawCheck(page, pos.x, pos.y);
            
            // Add non-resident states if any
            if (carrier.non_resident_states && carrier.non_resident_states.length > 0) {
              const statesStr = carrier.non_resident_states.join(', ');
              drawText(page, statesStr, pos.x + 150, pos.y, smallFontSize);
            }
            break;
          }
        }
      }
      
      drawPageInitials(page, FIELD_POSITIONS.page11.initials);
    }

    // Flatten the PDF to make it non-editable
    const form = pdfDoc.getForm();
    form.flatten();

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Generate filename
    const nameParts = application.full_legal_name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `TIG_Contracting_${lastName}_${firstName}_${dateStr}.pdf`;

    console.log('PDF generated successfully:', filename);

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
