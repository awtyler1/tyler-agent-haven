import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  agency_tax_id?: string;
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
  beneficiary_birth_date?: string;
  beneficiary_drivers_license_number?: string;
  beneficiary_drivers_license_state?: string;
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
  user_id?: string;
  is_finra_registered?: boolean;
  finra_broker_dealer_name?: string;
  finra_crd_number?: string;
  agreements?: Record<string, boolean>;
  uploaded_documents?: Record<string, string>;
  initials_image?: string; // base64 PNG of drawn initials
  signature_image?: string; // base64 PNG of drawn signature (background/legal)
  final_signature_image?: string; // base64 PNG of final signature
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

function formatDateMMDDYYYY(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// Carrier name to PDF field mapping
const CARRIER_FIELD_MAP: Record<string, { checkbox: string; nonResStates: string }> = {
  'Aetna Medicare Advantage': { checkbox: 'fill_3', nonResStates: 'NONRES STATESAetna Medicare Advantage Coventry LINK' },
  'Aetna Medicare Supplement': { checkbox: 'fill_7', nonResStates: 'NONRES STATESAetna Medicare Supplement ACI CLI' },
  'AGLA Life': { checkbox: 'fill_11', nonResStates: 'NONRES STATESAGLA Life with Living Benefits' },
  'Alignment Health': { checkbox: 'fill_15', nonResStates: 'NONRES STATESAlignment Health LINK' },
  'American Equity': { checkbox: 'fill_19', nonResStates: 'NONRES STATESAmerican Equity' },
  'American General Life': { checkbox: 'fill_23', nonResStates: 'NONRES STATESAmerican General Life Brokerage Annuity' },
  'Americo': { checkbox: 'fill_27', nonResStates: 'NONRES STATESAmerico' },
  'Americo Legacy': { checkbox: 'fill_31', nonResStates: 'NONRES STATESAmerico Legacy' },
  'Anthem': { checkbox: 'fill_35', nonResStates: 'NONRES STATESAnthem BCBS Empire Amerigroup Caremore LINK' },
  'Assurity Legacy': { checkbox: 'fill_39', nonResStates: 'NONRES STATESAssurity Legacy' },
  'Athene': { checkbox: 'fill_43', nonResStates: 'NONRES STATESAthene Annuity  Life Assurance Company' },
  'Athene IA': { checkbox: 'fill_45', nonResStates: 'NONRES STATESAthene IA Annuity' },
  'Baltimore Life': { checkbox: 'fill_49', nonResStates: 'NONRES STATESBaltimore Life' },
  'Bankers Fidelity': { checkbox: 'fill_53', nonResStates: 'NONRES STATESBanker s Fidelity Life Assurance Company' },
  'BayCare': { checkbox: 'fill_57', nonResStates: 'NONRES STATESBayCare LINK' },
  'Blue Cross Blue Shield MI': { checkbox: 'fill_61', nonResStates: 'NONRES STATESBlue Cross Blue Shield MI LINK' },
  'Bright ACA': { checkbox: 'fill_65', nonResStates: 'NONRES STATESBright ACA LINK' },
  'Brighthouse Financial': { checkbox: 'fill_69', nonResStates: 'NONRES STATESBrighthouse Financial' },
  'Capitol Life': { checkbox: 'fill_73', nonResStates: 'NONRES STATESCapitol Life  Med Supp LINK' },
  'Cigna ACA': { checkbox: 'fill_77', nonResStates: 'NONRES STATESCigna ACA LINK' },
  'Cigna Final Expense': { checkbox: 'fill_81', nonResStates: 'NONRES STATESCigna Final Expense Med Supp Arlic Loyal American  CHLIC' },
  'Cigna HealthSpring': { checkbox: 'fill_87', nonResStates: 'NONRES STATESCigna HealthSpring Bravo Health LINK' },
  'Clover Health': { checkbox: 'fill_91', nonResStates: 'NONRES STATESClover Health LINK' },
  'Columbian Mutual': { checkbox: 'fill_95', nonResStates: 'NONRES STATESColumbian Mutual Life Insurance Company' },
  'Combined Insurance': { checkbox: 'fill_99', nonResStates: 'NONRES STATESCombined Insurance Company of America' },
  'Devoted Health': { checkbox: 'fill_103', nonResStates: 'NONRES STATESDevoted Health LINK' },
  'Emblem': { checkbox: 'fill_107', nonResStates: 'NONRES STATESEmblem Connecticare LINK' },
  'Equitable Annuity': { checkbox: 'fill_111', nonResStates: 'NONRES STATESEquitable Annuity' },
  'Equitrust': { checkbox: 'fill_115', nonResStates: 'NONRES STATESEquitrust' },
  'F&G': { checkbox: 'fill_119', nonResStates: 'NONRES STATESFG' },
  'F&G Legacy': { checkbox: 'fill_123', nonResStates: 'NONRES STATESFG Legacy' },
  'Foresters Financial': { checkbox: 'fill_127', nonResStates: 'NONRES STATESForesters Financial' },
  'Foresters Life': { checkbox: 'fill_131', nonResStates: 'NONRES STATESForesters Life' },
  'Freedom': { checkbox: 'fill_135', nonResStates: 'NONRES STATESFreedom Optimum LINK' },
  'Global Atlantic': { checkbox: 'fill_139', nonResStates: 'NONRES STATESGlobal Atlantic' },
  'Great American': { checkbox: 'fill_143', nonResStates: 'NONRES STATESGreat American' },
  'Great Western': { checkbox: 'fill_147', nonResStates: 'NONRES STATESGreat Western GI Life' },
  'Guarantee Trust Life': { checkbox: 'fill_151', nonResStates: 'NONRES STATESGuarantee Trust Life' },
  'HealthFirst': { checkbox: 'fill_155', nonResStates: 'NONRES STATESHealthFirst LINK' },
  'Humana': { checkbox: 'fill_5', nonResStates: 'NONRES STATESHumana LINK' },
  'Independence Blue Cross': { checkbox: 'fill_9', nonResStates: 'NONRES STATESIndependence Blue Cross' },
  'John Hancock': { checkbox: 'fill_13', nonResStates: 'NONRES STATESJohn Hancock' },
  'Lincoln Financial': { checkbox: 'fill_17', nonResStates: 'NONRES STATESLincoln Financial' },
  'LUMICO': { checkbox: 'fill_21', nonResStates: 'NONRES STATESLUMICO MS LINK' },
  'Medico Group': { checkbox: 'fill_25', nonResStates: 'NONRES STATESMedico Group' },
  'Molina ACA': { checkbox: 'fill_29', nonResStates: 'NONRES STATESMolina ACA LINK' },
  'Molina MA': { checkbox: 'fill_33', nonResStates: 'NONRES STATESMolina MA LINK' },
  'Mutual of Omaha': { checkbox: 'fill_37', nonResStates: 'NONRES STATESMutual of Omaha Med Supp PDP' },
  'Mutual of Omaha Insurance': { checkbox: 'fill_41', nonResStates: 'NONRES STATESMutual of Omaha Insurance Company Omaha Insurance United of Omaha Life Ins United World Life Ins' },
  'National Care Dental': { checkbox: 'fill_47', nonResStates: 'NONRES STATESNational Care Dental LINK' },
  'National Guardian Life': { checkbox: 'fill_51', nonResStates: 'NONRES STATESNational Guardian Life' },
  'National Guardian Life Med Supp': { checkbox: 'fill_55', nonResStates: 'NONRES STATESNational Guardian Life Med Supp LINK' },
  'National Life Group': { checkbox: 'fill_59', nonResStates: 'NONRES STATESNational Life Group LINK' },
  'National Western': { checkbox: 'fill_63', nonResStates: 'NONRES STATESNational Western' },
  'Nationwide': { checkbox: 'fill_67', nonResStates: 'NONRES STATESNationwide' },
  'North American': { checkbox: 'fill_71', nonResStates: 'NONRES STATESNorth American Company NACOLAH Life  Annuity' },
  'Oceanview': { checkbox: 'fill_75', nonResStates: 'NONRES STATESOceanview' },
  'Oscar Health': { checkbox: 'fill_79', nonResStates: 'NONRES STATESOscar Health LINK' },
  'Protective Life': { checkbox: 'fill_83', nonResStates: 'NONRES STATESProtective L fe' },
  'Prudential': { checkbox: 'fill_85', nonResStates: 'NONRES STATESPrudential' },
  'Regence': { checkbox: 'fill_89', nonResStates: 'NONRES STATESRegence' },
  'Royal Neighbors': { checkbox: 'fill_93', nonResStates: 'NONRES STATESRoyal Neighbors of America' },
  'SCAN': { checkbox: 'fill_97', nonResStates: 'NONRES STATESSCAN' },
  'SelectHealth': { checkbox: 'fill_101', nonResStates: 'NONRES STATESSelectHealth LINK' },
  'Sentinel Security': { checkbox: 'fill_105', nonResStates: 'NONRES STATESSentinel Security Life Insurance Company' },
  'Simply': { checkbox: 'fill_109', nonResStates: 'NONRES STATESSimply LINK' },
  'Sons of Norway': { checkbox: 'fill_113', nonResStates: 'NONRES STATESSons of Norway LINK' },
  'The Standard': { checkbox: 'fill_117', nonResStates: 'NONRES STATESThe Standard' },
  'Transamerica New York': { checkbox: 'fill_121', nonResStates: 'NONRES STATESTransammerica New York' },
  'Transamerica Premier': { checkbox: 'fill_125', nonResStates: 'NONRES STATESTransamerica Premier' },
  'United Home Life': { checkbox: 'fill_129', nonResStates: 'NONRES STATESUnited Home Life LINK' },
  'United Security': { checkbox: 'fill_133', nonResStates: 'NONRES STATESUnited Security Assurance' },
  'UnitedHealthcare': { checkbox: 'fill_137', nonResStates: 'NONRES STATESUnitedHealthcare LINK' },
  'USIC MS': { checkbox: 'fill_141', nonResStates: 'NONRES STATESUSIC MS LINK' },
  'Washington National': { checkbox: 'fill_145', nonResStates: 'NONRES STATESWashinton National' },
  'WellCare': { checkbox: 'fill_149', nonResStates: 'NONRES STATESWellCare LINK' },
  'William Penn': { checkbox: 'fill_153', nonResStates: 'NONRES STATESWilliam Penn' },
};

// Legal question ordering (matches the contracting form question IDs)
// We use this order to map to PDF radio button option names (Yes/No, Yes_2/No_2, ...)
const LEGAL_QUESTION_ORDER: string[] = [
  '1',
  '1a',
  '1b',
  '1c',
  '1d',
  '1e',
  '1f',
  '1g',
  '1h',
  '2',
  '2a',
  '2b',
  '2c',
  '2d',
  '3',
  '4',
  '5',
  '5a',
  '5b',
  '5c',
  '6',
  '7',
  '8',
  '8a',
  '8b',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '14a',
  '14b',
  '14c',
  '15',
  '15a',
  '15b',
  '15c',
  '16',
  '17',
  '18',
  '19',
];
// Field mappings interface (loaded from database)
interface FieldMappings {
  contactMethods: {
    email: string[];
    phone: string[];
    text: string[];
  };
  marketingConsent: string[];
  taxId: string[];
  agencyTaxId: string[];
  gender: {
    male: string[];
    female: string[];
  };
  amlYes: string[];
  amlNo: string[];
  custom: Record<string, string[]>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application, saveToStorage = false, userId, templateUrl, templateBase64 } = await req.json() as { 
      application: ContractingData; 
      saveToStorage?: boolean;
      userId?: string;
      templateUrl?: string;
      templateBase64?: string;
    };

    console.log('Generating PDF for:', application.full_legal_name, 'saveToStorage:', saveToStorage);

    // Initialize Supabase client early to load mappings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load field mappings from database
    let fieldMappings: FieldMappings | null = null;
    try {
      const { data: mappingsData } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'pdf_field_mappings')
        .single();
      
      if (mappingsData?.config_value) {
        fieldMappings = mappingsData.config_value as unknown as FieldMappings;
        console.log('Loaded field mappings from database');
      }
    } catch (e) {
      console.log('No custom field mappings found, using defaults');
    }

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

    let pdfBytes: ArrayBuffer | null = null;
    
    // First, try to use the base64 template if provided
    if (templateBase64) {
      console.log('Using base64 template provided by client');
      try {
        const binaryString = atob(templateBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfBytes = bytes.buffer;
        console.log('Template decoded from base64, size:', pdfBytes.byteLength);
      } catch (e) {
        console.log('Failed to decode base64 template:', e);
      }
    }
    
    // Fallback: try to fetch from URLs
    if (!pdfBytes) {
      const pdfTemplateUrl = templateUrl || 'https://hikhnmuckfopyzxkdeus.lovableproject.com/templates/TIG_Contracting_Packet_Template.pdf';
      console.log('Fetching PDF template from:', pdfTemplateUrl);
      
      const urls = [
        pdfTemplateUrl,
        'https://hikhnmuckfopyzxkdeus.lovableproject.com/templates/TIG_Contracting_Packet_Template.pdf',
        'https://tyler-insurance-hub.lovable.app/templates/TIG_Contracting_Packet_Template.pdf',
      ];
      
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            pdfBytes = await response.arrayBuffer();
            console.log('Successfully fetched template from:', url);
            break;
          }
        } catch (e) {
          console.log('Failed to fetch from:', url, e);
        }
      }
    }
    
    // If we couldn't get the template, create a simple PDF instead
    if (!pdfBytes) {
      console.log('Could not get template, creating PDF from scratch');
      return await createPdfFromScratch(application, saveToStorage, userId);
    }

    // Load the PDF template
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    
    console.log('PDF template loaded, filling form fields...');
    console.log('Total pages:', pages.length);
    
    // Log all form fields for debugging
    const allFields = form.getFields();
    console.log('Total form fields found:', allFields.length);
    
    // Log field names that look like Yes/No or checkbox fields
    console.log('=== SEARCHING FOR YES/NO FIELDS ===');
    allFields.forEach((f: any, idx: number) => {
      const name = f.getName();
      const type = f.constructor.name;
      const lowerName = name.toLowerCase();
      // Log fields that might be Yes/No related
      if (lowerName.includes('yes') || lowerName.includes('no') || 
          lowerName.includes('check') || lowerName.includes('box') ||
          type.includes('Check') || type.includes('Button')) {
        console.log(`CHECKBOX/YESNO Field ${idx}: ${name} (type: ${type})`);
      }
    });
    console.log('=== END YESNO FIELD SEARCH ===');

    // Helper to embed image from base64 data URL
    const embedImageFromDataUrl = async (dataUrl: string) => {
      try {
        if (!dataUrl) return null;
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Check if PNG or try as PNG (signature pads typically output PNG)
        if (dataUrl.includes('image/png')) {
          return await pdfDoc.embedPng(imageBytes);
        } else {
          // Try PNG first, fallback to JPEG
          try {
            return await pdfDoc.embedPng(imageBytes);
          } catch {
            return await pdfDoc.embedJpg(imageBytes);
          }
        }
      } catch (e) {
        console.log('Failed to embed image:', e);
        return null;
      }
    };

    // Embed drawn initials and signature images if provided
    let initialsImage = null;
    let backgroundSignatureImage = null;
    let finalSignatureImage = null;

    const uploadedDocs = application.uploaded_documents || {};
    
    if (uploadedDocs.initials_image) {
      console.log('Embedding drawn initials image');
      initialsImage = await embedImageFromDataUrl(uploadedDocs.initials_image);
    }
    
    if (uploadedDocs.background_signature) {
      console.log('Embedding background signature image (after legal questions)');
      backgroundSignatureImage = await embedImageFromDataUrl(uploadedDocs.background_signature);
    }
    
    if (uploadedDocs.final_signature) {
      console.log('Embedding final signature image');
      finalSignatureImage = await embedImageFromDataUrl(uploadedDocs.final_signature);
    }

    // Helper to draw initials on a page at specific position
    const drawInitialsOnPage = (pageIndex: number, x: number, y: number, width = 60, height = 25) => {
      if (initialsImage && pageIndex < pages.length) {
        try {
          const page = pages[pageIndex];
          const dims = initialsImage.scale(1);
          const scaleFactor = Math.min(width / dims.width, height / dims.height);
          page.drawImage(initialsImage, {
            x,
            y,
            width: dims.width * scaleFactor,
            height: dims.height * scaleFactor,
          });
          console.log(`Drew initials on page ${pageIndex + 1} at (${x}, ${y})`);
        } catch (e) {
          console.log(`Failed to draw initials on page ${pageIndex + 1}:`, e);
        }
      }
    };

    // Helper to draw signature on a page
    const drawSignatureOnPage = (signatureImg: typeof initialsImage, pageIndex: number, x: number, y: number, width = 200, height = 50) => {
      if (signatureImg && pageIndex < pages.length) {
        try {
          const page = pages[pageIndex];
          const dims = signatureImg.scale(1);
          const scaleFactor = Math.min(width / dims.width, height / dims.height);
          page.drawImage(signatureImg, {
            x,
            y,
            width: dims.width * scaleFactor,
            height: dims.height * scaleFactor,
          });
          console.log(`Drew signature on page ${pageIndex + 1} at (${x}, ${y})`);
        } catch (e) {
          console.log(`Failed to draw signature on page ${pageIndex + 1}:`, e);
        }
      }
    };

    // Helper to safely set text field
    const setTextField = (fieldName: string, value: string | undefined | null) => {
      if (!value) return;
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
      } catch (e) {
        console.log(`Field not found or error: ${fieldName}`);
      }
    };

    // Helper to safely set checkbox - try multiple variations
    const setCheckbox = (fieldName: string, checked: boolean) => {
      if (!checked) return;
      
      const variations = [fieldName, fieldName.toLowerCase(), fieldName.toUpperCase()];
      
      for (const name of variations) {
        try {
          const field = form.getCheckBox(name);
          field.check();
          console.log(`Checked checkbox: ${name}`);
          return;
        } catch {
          // Try next variation
        }
      }
      
      // Fallback: try to set as text field with 'X'
      try {
        const field = form.getTextField(fieldName);
        field.setText('X');
        console.log(`Set text field with X: ${fieldName}`);
      } catch {
        console.log(`Checkbox/field not found: ${fieldName}`);
      }
    };

    // ==================== PAGE 1: Contract Application ====================
    setTextField('Agent Name', application.full_legal_name);
    setTextField('SSN', application.tax_id);
    setTextField('Agency Name', application.agency_name);
    setTextField('Tax ID', application.agency_tax_id || '');
    setTextField('TaxId', application.agency_tax_id || ''); // Alternative field name without space
    setTextField('Personal Name or Principal', application.full_legal_name);
    setTextField('Insurance License', application.insurance_license_number);
    setTextField('Birth Date', formatDate(application.birth_date));
    setTextField('NPN', application.npn_number);
    setTextField('MMDDYYYY', formatDateMMDDYYYY(application.birth_date));
    
    // Gender - try as RadioGroup first, then checkboxes
    const gender = application.gender?.toLowerCase();
    console.log('Gender value from application:', application.gender, '-> normalized:', gender);
    
    // Try to auto-detect the Gender radio group by looking for options that include both "Male" and "Female"
    let genderSet = false;
    for (const field of form.getFields()) {
      try {
        const rg = form.getRadioGroup(field.getName());
        const options = rg.getOptions();
        const lowerOptions = options.map((o: string) => o.toLowerCase());
        const hasMale = lowerOptions.includes('male');
        const hasFemale = lowerOptions.includes('female');

        if (!hasMale || !hasFemale) continue;

        console.log(`Detected gender RadioGroup: ${field.getName()} options=${options.join(',')}`);

        if (gender === 'male') {
          rg.select(options[lowerOptions.indexOf('male')]);
          console.log(`Selected Male on gender RadioGroup: ${field.getName()}`);
          genderSet = true;
        } else if (gender === 'female') {
          rg.select(options[lowerOptions.indexOf('female')]);
          console.log(`Selected Female on gender RadioGroup: ${field.getName()}`);
          genderSet = true;
        }

        if (genderSet) break;
      } catch {
        // Not a radio group
      }
    }

    if (!genderSet) {
      console.log('Gender radio group not detected; falling back to checkbox attempts');
    }
    
    // Also try as individual checkboxes
    if (gender === 'male') {
      setCheckbox('Male', true);
      setCheckbox('Check Box4', true);
    } else if (gender === 'female') {
      setCheckbox('Female', true);
      setCheckbox('Check Box5', true);
    }
    
    // Home Address
    if (application.home_address) {
      setTextField('Agent Home Address', application.home_address.street);
      setTextField('City', application.home_address.city);
      setTextField('State', application.home_address.state);
      setTextField('ZIP', application.home_address.zip);
      setTextField('County', application.home_address.county);
    }
    
    // Mailing Address
    const mailingAddr = application.mailing_address_same_as_home ? application.home_address : application.mailing_address;
    if (mailingAddr) {
      setTextField('Mailing Address', mailingAddr.street);
      setTextField('City_2', mailingAddr.city);
      setTextField('State_2', mailingAddr.state);
      setTextField('ZIP_2', mailingAddr.zip);
      setTextField('County_2', mailingAddr.county);
    }
    
    // UPS Address
    const upsAddr = application.ups_address_same_as_home ? application.home_address : application.ups_address;
    if (upsAddr) {
      setTextField('UPS Street Address', upsAddr.street);
      setTextField('City_3', upsAddr.city);
      setTextField('State_3', upsAddr.state);
      setTextField('ZIP_3', upsAddr.zip);
      setTextField('County_3', upsAddr.county);
    }
    
    // Contact info
    setTextField('Phone Res', application.phone_home);
    setTextField('Business', application.phone_business);
    setTextField('Fax', application.fax);
    setTextField('Mobile', application.phone_mobile);
    setTextField('Email Address', application.email_address);
    
    // Previous address
    if (application.previous_addresses && application.previous_addresses.length > 0) {
      const prevAddr = application.previous_addresses[0];
      setTextField('Previous Address', prevAddr.street);
      setTextField('City_4', prevAddr.city);
      setTextField('State_4', prevAddr.state);
      setTextField('ZIP_4', prevAddr.zip);
      setTextField('County_4', prevAddr.county);
    }
    
    // Preferred contact methods - use database mappings if available
    const preferredMethods = (application.preferred_contact_methods || []).map((m: string) => m.toLowerCase());
    console.info('CONTACT_METHODS_SELECTED::' + JSON.stringify(preferredMethods));

    // Use database mappings if available, otherwise fall back to auto-detection
    if (fieldMappings?.contactMethods) {
      console.log('Using database field mappings for contact methods');
      if (preferredMethods.includes('email')) {
        for (const fieldName of fieldMappings.contactMethods.email) {
          setCheckbox(fieldName, true);
        }
      }
      if (preferredMethods.includes('phone')) {
        for (const fieldName of fieldMappings.contactMethods.phone) {
          setCheckbox(fieldName, true);
        }
      }
      if (preferredMethods.includes('text')) {
        for (const fieldName of fieldMappings.contactMethods.text) {
          setCheckbox(fieldName, true);
        }
      }
    } else {
      // Fallback: auto-detect contact method fields
      console.log('No database mappings found, using auto-detection');
      const contactCandidates = form.getFields()
        .map((f: any) => ({ name: f.getName(), type: f?.constructor?.name }))
        .filter(({ name }: { name: string }) => {
          const n = name.toLowerCase();
          return (
            n.includes('preferred') || n.includes('contact') ||
            n.includes('email') || n.includes('phone') || n.includes('text')
          );
        });

      console.info('CONTACT_METHOD_FIELDS::' + JSON.stringify(contactCandidates));

      const setIfSelected = (method: 'email' | 'phone' | 'text') => {
        if (!preferredMethods.includes(method)) return;
        for (const c of contactCandidates) {
          const lower = c.name.toLowerCase();
          const matches =
            (method === 'email' && lower.includes('email')) ||
            (method === 'phone' && lower.includes('phone')) ||
            (method === 'text' && lower.includes('text'));
          if (!matches || c.type !== 'PDFCheckBox') continue;
          setCheckbox(c.name, true);
        }
      };

      setIfSelected('email');
      setIfSelected('phone');
      setIfSelected('text');
    }
    
    // Marketing consent - use database mappings if available
    const marketingConsent = application.agreements?.marketing_consent || false;
    console.log('Marketing consent value:', marketingConsent);
    if (marketingConsent) {
      if (fieldMappings?.marketingConsent && fieldMappings.marketingConsent.length > 0) {
        for (const fieldName of fieldMappings.marketingConsent) {
          // Try as checkbox first, then as text field
          setCheckbox(fieldName, true);
          setTextField(fieldName, 'X');
        }
      } else {
        // Fallback to known field name
        setTextField('Additionally by checking here I agree to let Tyler Insurance Group send me information about', 'X');
      }
    }
    
    // Date on page 1 (initials will be drawn as image)
    setTextField('DATE', formatDate(application.signature_date));

    // ==================== PAGES 2-3: Legal Questions ====================
    const legalQuestions = application.legal_questions || {};

    console.log('=== LEGAL QUESTIONS PROCESSING START ===');
    console.log('Number of legal questions in application:', Object.keys(legalQuestions).length);
    
    // Get legal question field mappings from database
    const legalFieldMappings = (fieldMappings as any)?.legalQuestions || {};
    console.log('Legal field mappings loaded:', Object.keys(legalFieldMappings).length, 'questions mapped');
    
    // Fill legal questions using database field mappings
    LEGAL_QUESTION_ORDER.forEach((questionId) => {
      const question = (legalQuestions as Record<string, LegalQuestion>)[questionId];
      if (!question || question.answer === null || question.answer === undefined) return;

      // Get the PDF field names for this question from database mappings
      const pdfFieldNames = legalFieldMappings[questionId] || [];
      const answerText = question.answer === true ? 'Yes' : 'No';
      
      console.log(`Q${questionId}: answer=${question.answer}, pdfFields=${JSON.stringify(pdfFieldNames)}`);
      
      for (const fieldName of pdfFieldNames) {
        // Try as text field first
        try {
          const field = form.getTextField(fieldName);
          field.setText(answerText);
          console.log(`SUCCESS: Set text field "${fieldName}" to "${answerText}"`);
        } catch {
          // Try as checkbox
          try {
            const cb = form.getCheckBox(fieldName);
            if (question.answer === true) {
              cb.check();
              console.log(`SUCCESS: Checked checkbox "${fieldName}"`);
            } else {
              cb.uncheck();
              console.log(`SUCCESS: Unchecked checkbox "${fieldName}"`);
            }
          } catch {
            console.log(`FAILED: Could not find field "${fieldName}" for Q${questionId}`);
          }
        }
      }
      
      // If answer is Yes, also log the explanation (for reference)
      if (question.answer === true && question.explanation) {
        console.log(`Q${questionId} explanation: ${question.explanation.substring(0, 50)}...`);
      }
    });

    // Fallback: Also try the original radio group approach in case this PDF has them
    const radioGroups: Array<{ name: string; options: string[] }> = [];
    for (const field of form.getFields()) {
      try {
        const rg = form.getRadioGroup(field.getName());
        const opts = rg.getOptions();
        if (opts && opts.length > 0) {
          radioGroups.push({ name: field.getName(), options: opts });
        }
      } catch {
        // Not a radio group
      }
    }

    if (radioGroups.length > 0) {
      console.log('Radio groups found:', radioGroups.length);
      LEGAL_QUESTION_ORDER.forEach((questionId, idx) => {
        const question = (legalQuestions as Record<string, LegalQuestion>)[questionId];
        if (!question || question.answer === null || question.answer === undefined) return;

        const ordinal = idx + 1;
        const yesOpt = ordinal === 1 ? 'Yes' : `Yes_${ordinal}`;
        const noOpt = ordinal === 1 ? 'No' : `No_${ordinal}`;

        const match = radioGroups.find((rg) => rg.options.includes(yesOpt) || rg.options.includes(noOpt));
        if (!match) return;

        try {
          const rg = form.getRadioGroup(match.name);
          rg.select(question.answer === true ? yesOpt : noOpt);
          console.log(`SUCCESS: Selected ${question.answer === true ? yesOpt : noOpt} on radio group ${match.name}`);
        } catch (e) {
          console.log(`FAILED: Could not select for Q${questionId} on radio group ${match.name}`);
        }
      });
    }

    console.log('=== LEGAL QUESTIONS PROCESSING END ===');

    // Date on page 2 (initials will be drawn as image)
    setTextField('DATE_2', formatDate(application.signature_date));
    
    // Date on page 3/4 (background signature section after legal questions)
    setTextField('DATE_3', formatDate(application.signature_date));
    setTextField('DATE_4', formatDate(application.signature_date));
    setTextField('Date_2', formatDate(application.signature_date));
    setTextField('Date_3', formatDate(application.signature_date));
    setTextField('Date_4', formatDate(application.signature_date));
    
    // Log all fields containing "date" to help find the right one
    const dateFields = form.getFields().filter((f: any) => f.getName().toLowerCase().includes('date'));
    console.log('=== DATE FIELDS FOUND ===');
    dateFields.forEach((f: any) => console.log(`Date field: ${f.getName()} (type: ${f.constructor?.name})`));
    console.log('=== END DATE FIELDS ===');
    
    // Signature and date on page 3/4 (after legal questions)
    setTextField('Signature', application.signature_name);
    setTextField('Signature_2', application.signature_name);
    setTextField('Agent Signature', application.signature_name);
    setTextField('Applicant Signature', application.signature_name);
    setTextField('Date', formatDate(application.signature_date));

    // ==================== PAGE 4: Banking Information ====================
    setTextField('Bank Routing', application.bank_routing_number);
    setTextField('Account', application.bank_account_number);
    setTextField('Branch Name or Location', application.bank_branch_name);
    setCheckbox('Requesting Commission Advancing', application.requesting_commission_advancing);
    
    // Beneficiary Information
    setTextField('List a Beneficiary', application.beneficiary_name);
    setTextField('Relationship', application.beneficiary_relationship);
    setTextField('Beneficiary Birth Date', formatDate(application.beneficiary_birth_date));
    setTextField('Beneficiary DOB', formatDate(application.beneficiary_birth_date));
    setTextField('Beneficiary Drivers License', application.beneficiary_drivers_license_number);
    setTextField('Beneficiary DL', application.beneficiary_drivers_license_number);
    setTextField('Beneficiary Drivers License State', application.beneficiary_drivers_license_state);
    setTextField('Beneficiary DL State', application.beneficiary_drivers_license_state);
    
    // Agent Driver's License
    setTextField('Drivers License', application.drivers_license_number);
    setTextField('Resident Drivers License State', application.drivers_license_state);
    
    // License expiration - try multiple field names from mapping
    setTextField('MMDDYYYY', formatDateMMDDYYYY(application.license_expiration_date));
    setTextField('Expiration Date', formatDate(application.license_expiration_date));
    setTextField('License Expiration', formatDate(application.license_expiration_date));
    
    // Resident State
    setTextField('State_5', application.resident_state);
    setTextField('Resident State', application.resident_state);
    
    // Insurance License Number - try alternate field names
    setTextField('Nevada Accident and Health Insurance License', application.insurance_license_number);
    
    // AML - handle as radio group, checkbox, or text field
    const hasAmlTraining = !!(application.aml_training_provider || application.aml_completion_date);
    const amlFieldName = fieldMappings?.amlYes?.length 
      ? fieldMappings.amlYes[0] 
      : 'Have you taken an AML course within the past two 2 years';
    
    console.log(`AML training: ${hasAmlTraining}, field name: ${amlFieldName}`);
    
    // Try as radio group first (Yes/No options)
    let amlSet = false;
    try {
      const amlRadio = form.getRadioGroup(amlFieldName);
      const options = amlRadio.getOptions();
      console.log(`Found AML radio group: ${amlFieldName}, options: ${options.join(', ')}`);
      
      const lowerOptions = options.map((o: string) => o.toLowerCase());
      const yesIndex = lowerOptions.findIndex(o => o === 'yes' || o.includes('yes'));
      const noIndex = lowerOptions.findIndex(o => o === 'no' || o.includes('no'));
      
      if (yesIndex !== -1 || noIndex !== -1) {
        if (hasAmlTraining && yesIndex !== -1) {
          amlRadio.select(options[yesIndex]);
          console.log(`Selected Yes on AML radio group`);
          amlSet = true;
        } else if (!hasAmlTraining && noIndex !== -1) {
          amlRadio.select(options[noIndex]);
          console.log(`Selected No on AML radio group`);
          amlSet = true;
        }
      }
    } catch {
      console.log(`AML field ${amlFieldName} is not a radio group`);
    }
    
    // Try as dropdown/select
    if (!amlSet) {
      try {
        const dropdown = form.getDropdown(amlFieldName);
        const options = dropdown.getOptions();
        console.log(`Found AML dropdown: ${amlFieldName}, options: ${options.join(', ')}`);
        
        const lowerOptions = options.map((o: string) => o.toLowerCase());
        const targetOption = hasAmlTraining ? 'yes' : 'no';
        const optionIndex = lowerOptions.findIndex(o => o === targetOption || o.includes(targetOption));
        
        if (optionIndex !== -1) {
          dropdown.select(options[optionIndex]);
          console.log(`Selected ${options[optionIndex]} on AML dropdown`);
          amlSet = true;
        }
      } catch {
        console.log(`AML field ${amlFieldName} is not a dropdown`);
      }
    }
    
    // Try as checkbox
    if (!amlSet) {
      if (fieldMappings?.amlYes?.length) {
        fieldMappings.amlYes.forEach(fieldName => setCheckbox(fieldName, hasAmlTraining));
      }
      if (fieldMappings?.amlNo?.length) {
        fieldMappings.amlNo.forEach(fieldName => setCheckbox(fieldName, !hasAmlTraining));
      }
      // Fallback to default field name
      setCheckbox(amlFieldName, hasAmlTraining);
    }
    
    setTextField('Course Name', application.aml_training_provider);
    setTextField('Course Date', formatDate(application.aml_completion_date));
    setTextField('Date Completed', formatDate(application.aml_completion_date));
    
    // AML Provider checkboxes
    if (application.aml_training_provider) {
      const provider = application.aml_training_provider.toUpperCase();
      setCheckbox('LIMRA', provider === 'LIMRA');
      setCheckbox('None', false);
      setCheckbox('Other', provider !== 'LIMRA' && provider !== 'NONE');
    }
    
    // FINRA
    setCheckbox('Are you a registered representative with FINRA', application.is_finra_registered || false);
    if (application.is_finra_registered) {
      setTextField('BrokerDealer Name', application.finra_broker_dealer_name);
      setTextField('CRD', application.finra_crd_number);
    }
    
    setTextField('DATE_5', formatDate(application.signature_date));

    // ==================== PAGE 5-6: Additional pages ====================
    setTextField('DATE_6', formatDate(application.signature_date));
    setTextField('DATE_7', formatDate(application.signature_date));

    // ==================== PAGE 9: Signature Page ====================
    setTextField('Additionally please sign in the center of the box below', application.signature_name);
    setTextField('DATE_8', formatDate(application.signature_date));

    // ==================== PAGE 10: Carrier Selection ====================
    const selectedCarriers = application.selected_carriers || [];
    
    console.log('Processing carriers:', selectedCarriers.length);
    
    selectedCarriers.forEach((carrier) => {
      console.log('Looking for carrier:', carrier.carrier_name);
      
      // Normalize carrier name for matching
      const normalizedCarrierName = carrier.carrier_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Find matching carrier in our map using multiple strategies
      let carrierKey = Object.keys(CARRIER_FIELD_MAP).find(key => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Exact match after normalization
        if (normalizedKey === normalizedCarrierName) return true;
        
        // Key contains carrier name or vice versa
        if (normalizedKey.includes(normalizedCarrierName) || normalizedCarrierName.includes(normalizedKey)) return true;
        
        // Check for common abbreviations/variations
        const keyWords = key.toLowerCase().split(/\s+/);
        const carrierWords = carrier.carrier_name.toLowerCase().split(/\s+/);
        
        // If first word matches (e.g., "Humana" matches "Humana Medicare")
        if (keyWords[0] === carrierWords[0] && keyWords[0].length > 3) return true;
        
        return false;
      });
      
      if (carrierKey) {
        const mapping = CARRIER_FIELD_MAP[carrierKey];
        console.log('Found mapping for', carrier.carrier_name, '-> checkbox:', mapping.checkbox);
        
        // Try to check the checkbox
        try {
          const field = form.getCheckBox(mapping.checkbox);
          field.check();
          console.log('Successfully checked:', mapping.checkbox);
        } catch (e) {
          console.log('Checkbox not found:', mapping.checkbox, '- trying as text field');
          setTextField(mapping.checkbox, 'X');
        }
        
        // Set non-resident states if any
        if (carrier.non_resident_states && carrier.non_resident_states.length > 0) {
          console.log('Setting non-resident states:', carrier.non_resident_states.join(', '));
          setTextField(mapping.nonResStates, carrier.non_resident_states.join(', '));
        }
      } else {
        console.log('No mapping found for carrier:', carrier.carrier_name);
        // Try to find by first word as fallback
        const firstWord = carrier.carrier_name.split(/\s+/)[0];
        const fallbackKey = Object.keys(CARRIER_FIELD_MAP).find(key => 
          key.toLowerCase().startsWith(firstWord.toLowerCase())
        );
        if (fallbackKey) {
          const mapping = CARRIER_FIELD_MAP[fallbackKey];
          console.log('Using fallback mapping:', fallbackKey, '-> checkbox:', mapping.checkbox);
          try {
            const field = form.getCheckBox(mapping.checkbox);
            field.check();
          } catch {
            setTextField(mapping.checkbox, 'X');
          }
          if (carrier.non_resident_states && carrier.non_resident_states.length > 0) {
            setTextField(mapping.nonResStates, carrier.non_resident_states.join(', '));
          }
        }
      }
    });
    
    setTextField('DATE_9', formatDate(application.signature_date));

    // ==================== DRAW INITIALS AND SIGNATURES AS IMAGES ====================
    // Draw initials on each page footer at bottom LEFT above the "initials" line
    // Page indices are 0-based, y=55 to position above the label line
    if (initialsImage) {
      const initialsPositions = [
        // Skip page 1 (index 0) - no initials needed
        { page: 1, x: 50, y: 68 },   // Page 2
        { page: 2, x: 50, y: 68 },   // Page 3
        { page: 3, x: 50, y: 68 },   // Page 4
        { page: 4, x: 50, y: 68 },   // Page 5
        { page: 5, x: 50, y: 68 },   // Page 6
        { page: 6, x: 50, y: 68 },   // Page 7
        { page: 7, x: 50, y: 68 },   // Page 8
        { page: 8, x: 50, y: 68 },   // Page 9
        { page: 9, x: 50, y: 68 },   // Page 10
        { page: 10, x: 50, y: 68 },  // Page 11 (last page)
      ];
      
      for (const pos of initialsPositions) {
        drawInitialsOnPage(pos.page, pos.x, pos.y);
      }
    }
    
    // Draw background signature on page 3 (changing index to 2 since index 2 appeared on page 2)
    if (backgroundSignatureImage) {
      // Position in signature area - signature box on page 3
      drawSignatureOnPage(backgroundSignatureImage, 3, 80, 100, 250, 60);
    }
    
    // Draw final signature on signature page (page 9 typically) - 0-indexed so page 8
    if (finalSignatureImage) {
      // Position in main signature box
      drawSignatureOnPage(finalSignatureImage, 8, 180, 350, 250, 80);
    }

    // Flatten the form to prevent further editing
    form.flatten();
    
    // Save the PDF
    const filledPdfBytes = await pdfDoc.save();

    // Generate filename
    const nameParts = application.full_legal_name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `TIG_Contracting_${lastName}_${firstName}_${dateStr}.pdf`;

    console.log('PDF generated successfully:', filename, 'Size:', filledPdfBytes.byteLength);

    // Save to storage if requested
    let storagePath: string | null = null;
    
    if (saveToStorage && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      storagePath = `${userId}/contracting_packet/${filename}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contracting-documents')
        .upload(storagePath, filledPdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });
      
      if (uploadError) {
        console.error('Failed to save PDF to storage:', uploadError);
      } else {
        console.log('PDF saved to storage:', storagePath);
        
        // Update the contracting application
        const { data: currentApp } = await supabase
          .from('contracting_applications')
          .select('uploaded_documents')
          .eq('user_id', userId)
          .single();
        
        if (currentApp) {
          const currentDocs = (currentApp.uploaded_documents as Record<string, string>) || {};
          const updatedDocs = { ...currentDocs, contracting_packet: storagePath };
          
          await supabase
            .from('contracting_applications')
            .update({ uploaded_documents: updatedDocs })
            .eq('user_id', userId);
        }
      }
    }

    // Return the PDF as base64 (chunked to avoid stack overflow)
    const uint8Array = new Uint8Array(filledPdfBytes);
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binaryString);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        pdf: base64,
        size: filledPdfBytes.byteLength,
        storagePath,
        filledTemplate: true,
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

// Fallback function to create PDF from scratch if template can't be loaded
async function createPdfFromScratch(application: ContractingData, saveToStorage: boolean, userId?: string) {
  const { PDFDocument: PDFDoc, StandardFonts, rgb } = await import("https://esm.sh/pdf-lib@1.17.1");
  
  const pdfDoc = await PDFDoc.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawText('TYLER INSURANCE GROUP - CONTRACTING PACKET', {
    x: margin, y, size: 16, font: fontBold, color: rgb(0.2, 0.2, 0.4)
  });
  y -= 30;

  page.drawText(`Agent: ${application.full_legal_name}`, { x: margin, y, size: 12, font });
  y -= 20;
  page.drawText(`Email: ${application.email_address}`, { x: margin, y, size: 10, font });
  y -= 15;
  page.drawText(`Date: ${formatDate(application.signature_date)}`, { x: margin, y, size: 10, font });
  y -= 30;

  page.drawText('Note: Template PDF could not be loaded. This is a summary document.', {
    x: margin, y, size: 10, font, color: rgb(0.6, 0, 0)
  });
  y -= 20;
  page.drawText('Please contact support for the complete contracting packet.', {
    x: margin, y, size: 10, font
  });

  const pdfBytes = await pdfDoc.save();
  const uint8Array = new Uint8Array(pdfBytes);
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64 = btoa(binaryString);

  const nameParts = application.full_legal_name.split(' ');
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts[0];
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const filename = `TIG_Contracting_${lastName}_${firstName}_${dateStr}.pdf`;

  return new Response(
    JSON.stringify({
      success: true,
      filename,
      pdf: base64,
      size: pdfBytes.byteLength,
      filledTemplate: false,
      warning: 'Template could not be loaded, generated summary PDF instead',
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  );
}
