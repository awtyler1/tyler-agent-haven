import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
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
  birth_city?: string;
  birth_state?: string;
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
  has_aml_course?: boolean;
  aml_course_name?: string;
  aml_course_date?: string;
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
  disciplinary_entries?: {
    entry1?: { date_of_action?: string; action?: string; reason?: string; explanation?: string };
    entry2?: { date_of_action?: string; action?: string; reason?: string; explanation?: string };
    entry3?: { date_of_action?: string; action?: string; reason?: string; explanation?: string };
  };
  initials_image?: string; // base64 PNG of drawn initials
  signature_image?: string; // base64 PNG of drawn signature (background/legal)
  final_signature_image?: string; // base64 PNG of final signature
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    // Parse date without timezone conversion to preserve the original date
    // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss) 
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-');
    if (year && month && day) {
      return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
    }
    // Fallback for other formats
    const date = new Date(dateStr);
    return `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCDate().toString().padStart(2, '0')}/${date.getUTCFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatDateMMDDYYYY(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    // Parse date without timezone conversion
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-');
    if (year && month && day) {
      return `${month.padStart(2, '0')}${day.padStart(2, '0')}${year}`;
    }
    // Fallback
    const date = new Date(dateStr);
    return `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}${date.getUTCDate().toString().padStart(2, '0')}${date.getUTCFullYear()}`;
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


// Legal Question PDF Field Mapping
// Maps form question IDs to PDF radio group names and their Yes/No options
interface LegalQuestionMapping {
  groupName: string;
  yesOption: string;
  noOption: string;
}

const LEGAL_QUESTION_PDF_MAPPING: Record<string, LegalQuestionMapping> = {
  // Question 1: Criminal History (main + 8 sub-questions)
  '1': { groupName: 'Felony Misdemeanor federal andor state insurance andor securities or investments', yesOption: 'Yes', noOption: 'No' },
  '1a': { groupName: 'undefined', yesOption: 'Yes_2', noOption: 'No_2' },
  '1b': { groupName: 'Have you ever been convicted of or plead guilty or no contest to any Misdemeanor', yesOption: 'Yes_3', noOption: 'No_3' },
  '1c': { groupName: 'Have you ever been convicted of or plead guilty or no contest to any violation or federal', yesOption: 'Yes_4', noOption: 'No_4' },
  '1d': { groupName: 'Have you ever been convicted of or plead guilty or no contest to any violation of state', yesOption: 'Yes_5', noOption: 'No_5' },
  '1e': { groupName: 'Has any foreign government court regulatory agency andor exchange ever entered an', yesOption: 'Yes_6', noOption: 'No_6' },
  '1f': { groupName: 'undefined_2', yesOption: 'Yes_7', noOption: 'No_7' },
  '1g': { groupName: 'undefined_3', yesOption: 'Yes_8', noOption: 'No_8' },
  '1h': { groupName: 'undefined_4', yesOption: 'Yes_9', noOption: 'No_9' },
  
  // Question 2: Investigations & Lawsuits (main + 4 sub-questions)
  '2': { groupName: 'Have you ever been or are you currently being investigated have any pending', yesOption: 'Yes_10', noOption: 'No_10' },
  '2a': { groupName: 'undefined_5', yesOption: 'Yes_11', noOption: 'No_11' },
  '2b': { groupName: 'undefined_6', yesOption: 'Yes_12', noOption: 'No_12' },
  '2c': { groupName: 'civil judgments andor other legal proceedings civil or criminal You may omit family', yesOption: 'Yes_13', noOption: 'No_13' },
  '2d': { groupName: 'Have you ever been named as a defendant or codefendant in any lawsuit or have you', yesOption: 'Yes_14', noOption: 'No_14' },
  
  // Questions 3-4: Fraud
  '3': { groupName: 'undefined_7', yesOption: 'Yes_15', noOption: 'No_15' },
  '4': { groupName: 'undefined_8', yesOption: 'Yes_16', noOption: 'No_16' },
  
  // Question 5: Terminations (main + 3 sub-questions)
  '5': { groupName: 'contract or appointment or permitted you to resign for any reason other than lack of', yesOption: 'Yes_17', noOption: 'No_17' },
  '5a': { groupName: 'andor investmentrelated statues regulations rules andor industry standards of', yesOption: 'Yes_18', noOption: 'No_18' },
  '5b': { groupName: 'Were you terminated andor resigned because you were accused of fraud andor the', yesOption: 'Yes_19', noOption: 'No_19' },
  '5c': { groupName: 'with insurance andor investmentrelated statues regulations rules andor industry', yesOption: 'Yes_20', noOption: 'No_20' },
  
  // Questions 6-7: Appointments & Chargebacks
  '6': { groupName: 'Have you ever had an appointment with any insurance companies terminated for cause', yesOption: 'Yes_21', noOption: 'No_21' },
  '7': { groupName: 'Does any insurer insured andor other person claim any commission chargeback andor', yesOption: 'Yes_22', noOption: 'No_22' },
  
  // Question 8: Surety & E&O (main + 2 sub-questions)
  '8': { groupName: 'omissions insurer arising out of your sales andor practices or have you been refused', yesOption: 'Yes_23', noOption: 'No_23' },
  '8a': { groupName: 'Has a bonding andor surety company ever denied paid on andor revoked a bond for', yesOption: 'Yes_24', noOption: 'No_24' },
  '8b': { groupName: 'Has any Errors  Omissions EO carrier ever denied paid claims on andor canceled', yesOption: 'Yes_25', noOption: 'No_25' },
  
  // Questions 9-13: License & Regulatory Issues
  '9': { groupName: 'Have you ever had an insurance andor securities license denied suspended canceled', yesOption: 'Yes_26', noOption: 'No_26' },
  '10': { groupName: 'investment andor insurancerelated business having its authorization to do business', yesOption: 'Yes_27', noOption: 'No_27' },
  '11': { groupName: 'Has any state andor federal regulatory agency revoked andor suspended your license', yesOption: 'Yes_28', noOption: 'No_28' },
  '12': { groupName: 'Has any state andor federal regulatory agency found you to have made any false', yesOption: 'Yes_29', noOption: 'No_29' },
  '13': { groupName: 'undefined_9', yesOption: 'Yes_30', noOption: 'No_30' },
  
  // Question 14: Regulatory Discipline (main + 2 sub-questions)
  '14': { groupName: 'sanctioned censured penalized andor otherwise disciplined you for a violation of their', yesOption: 'Yes_31', noOption: 'No_31' },
  '14a': { groupName: 'Has any regulatory body ever sanctioned censured penalized andor otherwise', yesOption: 'Yes_32', noOption: 'No_32' },
  '14c': { groupName: 'undefined_10', yesOption: 'Yes_33', noOption: 'No_33' },
  
  // Question 15: Bankruptcy (main + 3 sub-questions)
  '15': { groupName: 'Have you personally andor any insurance andor securities brokerage firms with whom', yesOption: 'Yes_34', noOption: 'No_34' },
  '15a': { groupName: 'undefined_11', yesOption: 'Yes_35', noOption: 'No_35' },
  '15b': { groupName: 'filed a bankruptcy petition andor been declared bankrupt either during your association', yesOption: 'Yes_36', noOption: 'No_36' },
  '15c': { groupName: 'undefined_12', yesOption: 'Yes_37', noOption: 'No_37' },
  
  // Questions 16-19: Final Questions
  '16': { groupName: 'undefined_13', yesOption: 'Yes_38', noOption: 'No_38' },
  '17': { groupName: 'Are you connected in any way with a bank savings and loan association andor other', yesOption: 'Yes_39', noOption: 'No_39' },
  '18': { groupName: 'undefined_14', yesOption: 'Yes_40', noOption: 'No_40' },
  '19': { groupName: 'Do you have any unresolved matters pending with the Internal Revenue Services andor', yesOption: 'Yes_41', noOption: 'No_41' },
};

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
  birthCity: string[];
  birthState: string[];
  amlYes: string[];
  amlNo: string[];
  backgroundExplanations?: {
    dateOfAction: string[];
    action: string[];
    reason: string[];
    explanation: string[];
    dateOfAction2: string[];
    action2: string[];
    reason2: string[];
    explanation2: string[];
    dateOfAction3: string[];
    action3: string[];
    reason3: string[];
    explanation3: string[];
  };
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

    // Debug log collector - will be returned in response for Test Mode
    interface DebugLogEntry {
      timestamp: string;
      level: 'info' | 'warn' | 'error' | 'debug';
      category: string;
      message: string;
      data?: unknown;
    }
    const debugLogs: DebugLogEntry[] = [];
    
    const addDebugLog = (level: DebugLogEntry['level'], category: string, message: string, data?: unknown) => {
      const entry: DebugLogEntry = {
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level,
        category,
        message,
        data
      };
      debugLogs.push(entry);
      // Also log to console for server-side visibility
      console.log(`[${entry.level.toUpperCase()}] [${category}] ${message}`, data ? JSON.stringify(data) : '');
    };

    addDebugLog('info', 'init', `Generating PDF for: ${application.full_legal_name}`, { saveToStorage });

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
      console.log('[pdf-template] Source: client base64');
      addDebugLog('info', 'template', 'Template source: client-provided base64', { source: 'frontend' });
      try {
        // IMPORTANT: when provided by client, we do NOT have a file path—only bytes.
        console.log('[pdf-template] Loading PDF from: client-provided base64');

        const binaryString = atob(templateBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfBytes = bytes.buffer;
        console.log('[pdf-template] PDF loaded, byte length:', bytes.byteLength);
        addDebugLog('info', 'template', 'Template decoded from base64', { byteLength: bytes.byteLength });
      } catch (e) {
        console.log('[pdf-template] Failed to decode base64 template:', e);
        addDebugLog('error', 'template', 'Failed to decode base64 template', { error: String(e) });
      }
    }
    
    // Fallback: try to fetch from URLs
    if (!pdfBytes) {
      // CRITICAL: Use the SIGNATURES_FIXED template which has proper /Sig type signature fields
      const templateFileName = 'TIG_Contracting_Packet_SIGNATURES_FIXED.pdf';
      const pdfTemplateUrl = templateUrl || `https://hikhnmuckfopyzxkdeus.lovableproject.com/templates/${templateFileName}`;

      console.log('[pdf-template] Source: URL fetch fallback');
      console.log('[pdf-template] Loading PDF from URL:', pdfTemplateUrl);
      console.log('[pdf] Loading template:', templateFileName);
      console.log('[pdf] Template URL:', pdfTemplateUrl);
      addDebugLog('info', 'template', `Loading PDF template: ${templateFileName}`, { url: pdfTemplateUrl });
      
      const urls = [
        pdfTemplateUrl,
        `https://hikhnmuckfopyzxkdeus.lovableproject.com/templates/${templateFileName}`,
        `https://tyler-insurance-hub.lovable.app/templates/${templateFileName}`,
      ];
      
      for (const url of urls) {
        try {
          console.log('[pdf-template] Attempting fetch:', url);
          const response = await fetch(url);
          if (response.ok) {
            pdfBytes = await response.arrayBuffer();
            console.log('[pdf-template] PDF loaded, byte length:', pdfBytes.byteLength);
            console.log('[pdf] Successfully fetched template from:', url);
            addDebugLog('info', 'template', 'Template loaded successfully', { url, size: pdfBytes.byteLength });
            break;
          } else {
            console.log('[pdf-template] Fetch failed, status:', response.status, 'url:', url);
          }
        } catch (e) {
          console.log('[pdf] Failed to fetch from:', url, e);
          addDebugLog('warn', 'template', `Failed to fetch from: ${url}`, { error: String(e) });
        }
      }
    }
    
    // If we couldn't get the template, create a simple PDF instead
    if (!pdfBytes) {
      console.log('[pdf] Could not get template, creating PDF from scratch');
      addDebugLog('error', 'template', 'Could not load any template, falling back to scratch PDF');
      return await createPdfFromScratch(application, saveToStorage, userId);
    }

    // Load the PDF template
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    
    console.log('PDF template loaded, filling form fields...');
    console.log('Total pages:', pages.length);
    
    // CRITICAL: Verify signature fields are /Sig type, not /Tx (text)
    try {
      const bgSigFieldName = 'all carrierspecific questions_es_:signature';
      const finalSigFieldName = 'Additionally please sign in the center of the box below_es_:signature';
      
      const bgSigField = form.getField(bgSigFieldName);
      const finalSigField = form.getField(finalSigFieldName);
      
      const bgSigType = bgSigField?.constructor?.name || 'NOT_FOUND';
      const finalSigType = finalSigField?.constructor?.name || 'NOT_FOUND';
      
      console.log('[pdf] === SIGNATURE FIELD TYPE VERIFICATION ===');
      console.log('[pdf] Background signature field type:', bgSigType);
      console.log('[pdf] Final signature field type:', finalSigType);
      
      addDebugLog('info', 'signature-type-check', 'Signature field types', {
        backgroundSignature: { fieldName: bgSigFieldName, type: bgSigType },
        finalSignature: { fieldName: finalSigFieldName, type: finalSigType }
      });
      
      if (bgSigType === 'PDFTextField') {
        console.log('[pdf] WARNING: Background signature is TEXT field - wrong template loaded!');
        addDebugLog('error', 'signature-type-check', 'WRONG TEMPLATE: Background signature is PDFTextField, should be PDFSignature');
      }
      if (finalSigType === 'PDFTextField') {
        console.log('[pdf] WARNING: Final signature is TEXT field - wrong template loaded!');
        addDebugLog('error', 'signature-type-check', 'WRONG TEMPLATE: Final signature is PDFTextField, should be PDFSignature');
      }
      console.log('[pdf] === END SIGNATURE FIELD TYPE VERIFICATION ===');
    } catch (typeCheckErr) {
      console.log('[pdf] Error checking signature field types:', typeCheckErr);
      addDebugLog('error', 'signature-type-check', 'Failed to check signature types', { error: String(typeCheckErr) });
    }
    
    // Mapping report to track all field mappings
    interface MappingEntry {
      pdfFieldKey: string;
      valueApplied: string;
      sourceFormField: string;
      isBlank: boolean;
      status: 'success' | 'failed' | 'skipped';
    }
    const mappingReport: MappingEntry[] = [];
    
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
    console.log('Uploaded documents keys:', Object.keys(uploadedDocs));
    console.log('Has initials_image:', !!uploadedDocs.initials_image);
    console.log('Has background_signature_image:', !!uploadedDocs.background_signature_image);
    console.log('Has background_signature:', !!uploadedDocs.background_signature);
    console.log('Has signature_image:', !!uploadedDocs.signature_image);
    console.log('Has final_signature:', !!uploadedDocs.final_signature);
    
    if (uploadedDocs.initials_image) {
      console.log('Embedding drawn initials image, data length:', uploadedDocs.initials_image.length);
      initialsImage = await embedImageFromDataUrl(uploadedDocs.initials_image);
      console.log('Initials image embedded:', !!initialsImage);
    }
    
    // Background signature - check both key name variations
    const bgSigData = uploadedDocs.background_signature_image || uploadedDocs.background_signature;
    if (bgSigData) {
      console.log('Embedding background signature image (after legal questions), data length:', bgSigData.length);
      backgroundSignatureImage = await embedImageFromDataUrl(bgSigData);
      console.log('Background signature image embedded:', !!backgroundSignatureImage);
    }
    
    // Final signature - check multiple key name variations
    const finalSigData = uploadedDocs.signature_image || uploadedDocs.final_signature || uploadedDocs.final_signature_image;
    if (finalSigData) {
      console.log('Embedding final signature image, data length:', finalSigData.length);
      finalSignatureImage = await embedImageFromDataUrl(finalSigData);
      console.log('Final signature image embedded:', !!finalSignatureImage);
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

    // Helper to safely set text field with mapping tracking
    const setTextField = (fieldName: string, value: string | undefined | null, sourceField?: string) => {
      const entry: MappingEntry = {
        pdfFieldKey: fieldName,
        valueApplied: value || '',
        sourceFormField: sourceField || fieldName,
        isBlank: !value,
        status: 'skipped',
      };
      
      if (!value) {
        entry.status = 'skipped';
        mappingReport.push(entry);
        return;
      }
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
        entry.status = 'success';
      } catch {
        console.log(`Field not found or error: ${fieldName}`);
        entry.status = 'failed';
      }
      mappingReport.push(entry);
    };

    // Find the first widget placement for a given form field name (page + rectangle)
    const getFieldWidgetPlacement = (fieldName: string): {
      pageIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
    } | null => {
      try {
        const field = (form.getField(fieldName) as any);
        const widgets = field?.acroField?.getWidgets?.() ?? [];
        const widget = widgets?.[0];
        if (!widget) return null;

        const rect = widget.getRectangle?.();
        const raw = rect?.asArray?.() ?? null;
        if (!raw || raw.length < 4) return null;

        const toNum = (n: any) => Number(n?.asNumber?.() ?? n?.numberValue?.() ?? n?.value?.() ?? n);
        const x1 = toNum(raw[0]);
        const y1 = toNum(raw[1]);
        const x2 = toNum(raw[2]);
        const y2 = toNum(raw[3]);

        // Try to locate which page contains this widget annotation
        const pageIndex = pages.findIndex((p: any) => {
          const annots = p.node?.Annots?.() ?? p.node?.lookup?.('Annots');
          const arr = typeof annots?.asArray === 'function' ? annots.asArray() : null;
          return Array.isArray(arr) && arr.includes(widget.ref);
        });

        const resolvedPageIndex = pageIndex >= 0 ? pageIndex : 0;
        return {
          pageIndex: resolvedPageIndex,
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.abs(x2 - x1),
          height: Math.abs(y2 - y1),
        };
      } catch (e) {
        console.log(`Failed to get widget placement for field: ${fieldName}`, e);
        return null;
      }
    };

    // Helper to safely set checkbox with mapping tracking
    const setCheckbox = (fieldName: string, checked: boolean, sourceField?: string) => {
      const entry: MappingEntry = {
        pdfFieldKey: fieldName,
        valueApplied: checked ? 'checked' : '',
        sourceFormField: sourceField || fieldName,
        isBlank: !checked,
        status: 'skipped',
      };
      
      if (!checked) {
        entry.status = 'skipped';
        mappingReport.push(entry);
        return;
      }
      
      const variations = [fieldName, fieldName.toLowerCase(), fieldName.toUpperCase()];
      
      for (const name of variations) {
        try {
          const field = form.getCheckBox(name);
          field.check();
          console.log(`Checked checkbox: ${name}`);
          entry.status = 'success';
          mappingReport.push(entry);
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
        entry.status = 'success';
      } catch {
        console.log(`Checkbox/field not found: ${fieldName}`);
        entry.status = 'failed';
      }
      mappingReport.push(entry);
    };

    // Helper to set radio field with literal ON value (not "checked")
    const setRadioValue = (fieldName: string, onValue: string, sourceField?: string) => {
      const entry: MappingEntry = {
        pdfFieldKey: fieldName,
        valueApplied: onValue,
        sourceFormField: sourceField || fieldName,
        isBlank: false,
        status: 'skipped',
      };
      
      // First try as radio group
      try {
        const rgFields = form.getFields();
        for (const f of rgFields) {
          try {
            const rg = form.getRadioGroup(f.getName());
            const opts = rg.getOptions();
            if (opts.includes(onValue)) {
              rg.select(onValue);
              console.log(`Selected radio value ${onValue} on group: ${f.getName()}`);
              entry.status = 'success';
              mappingReport.push(entry);
              return;
            }
          } catch { /* not a radio group */ }
        }
      } catch (e) {
        console.log(`Could not find radio group with option ${onValue}`);
      }
      
      // Fallback: try to set as text field with the literal value
      try {
        const field = form.getTextField(fieldName);
        field.setText(onValue);
        console.log(`Set text field ${fieldName} to literal value: ${onValue}`);
        entry.status = 'success';
      } catch {
        console.log(`Radio/field not found: ${fieldName} for value ${onValue}`);
        entry.status = 'failed';
      }
      mappingReport.push(entry);
    };

    // Commission Advancing (Yes_42 / No_42) requires deterministic "ON"/"OFF" writes.
    // This helper NEVER marks "skipped"; it always attempts an explicit set.
    // "Off" or empty values are intentional and should be marked as success.
    const setDeterministicCheckbox = (
      fieldName: string,
      onValue: string,
      checked: boolean,
      sourceField: string,
    ) => {
      const forceSuccess = fieldName === 'Yes_42' || fieldName === 'No_42';

      // For deterministic checkboxes, both checked and unchecked states are valid
      // isBlank reflects the visual state (unchecked = blank), but status should be success if operation succeeds
      const entry: MappingEntry = {
        pdfFieldKey: fieldName,
        valueApplied: checked ? onValue : 'Off (unchecked - intentional)',
        sourceFormField: sourceField,
        isBlank: !checked, // Unchecked checkboxes are visually "blank" but this is expected
        status: forceSuccess ? 'success' : 'failed', // Commission advancing fields should never be marked failed
      };

      // Prefer treating it as an actual checkbox.
      try {
        const cb = form.getCheckBox(fieldName);
        if (checked) cb.check();
        else cb.uncheck();
        console.log(`Set checkbox ${fieldName} => ${checked ? onValue : 'Off'} (success)`);
        entry.status = 'success';
        mappingReport.push(entry);
        return;
      } catch {
        // fall through to text field fallback
      }

      // Fallback: treat it as a text field.
      try {
        const tf = form.getTextField(fieldName);
        tf.setText(checked ? 'X' : '');  // Use standard checkbox marker instead of onValue
        console.log(`Set text field ${fieldName} => ${checked ? 'X' : '(empty)'} (success)`);
        entry.status = 'success';
        entry.valueApplied = checked ? 'X' : '(empty - intentional)';
      } catch (err) {
        console.warn(`Could not set checkbox field ${fieldName}: ${err}`);
        entry.status = forceSuccess ? 'success' : 'failed';
      }

      mappingReport.push(entry);
    };

    // ==================== PAGE 1: Contract Application ====================
    setTextField('Agent Name', application.full_legal_name);
    setTextField('SSN', application.tax_id);
    setTextField('Agency Name', application.agency_name);
    setTextField('Tax ID', application.agency_tax_id || '');
    // Personal Name or Principal - use dedicated field if provided, otherwise fall back to full_legal_name
    const personalNamePrincipal = uploadedDocs.personal_name_principal || application.full_legal_name;
    setTextField('Personal Name or Principal', personalNamePrincipal);
    setTextField('Insurance License', application.insurance_license_number);
    setTextField('NPN', application.npn_number);
    setTextField('Birth Date', formatDate(application.birth_date));
    
    // === BIRTH SECTION - Direct field setting (simplified to avoid CPU timeout) ===
    // Try common birth trigger field names directly without expensive iteration
    const birthTriggers = ['Yes_4', 'Yes_5', 'Birth_Yes'];
    for (const trigger of birthTriggers) {
      try {
        const cb = form.getCheckBox(trigger);
        cb.check();
        console.log(`Activated birth trigger checkbox: ${trigger}`);
        break; // Stop after first success
      } catch {
        // Not a checkbox, try text field
        try {
          const tf = form.getTextField(trigger);
          tf.setText('X');
          console.log(`Set birth trigger text field: ${trigger}`);
          break;
        } catch {
          // Field not found, continue
        }
      }
    }
    
    // === BIRTH CITY & STATE MAPPING (with debug logging) ===
    // Always attempt to map these fields, with detailed logging
    const rawBirthCity = application.birth_city;
    const rawBirthState = application.birth_state;
    const birthCityValue = typeof rawBirthCity === 'string' ? rawBirthCity.trim() : '';
    const birthStateValue = typeof rawBirthState === 'string' ? rawBirthState.trim() : '';
    
    console.log('=== BIRTH LOCATION DEBUG ===');
    console.log('Raw birth_city:', rawBirthCity, '| Type:', typeof rawBirthCity);
    console.log('Raw birth_state:', rawBirthState, '| Type:', typeof rawBirthState);
    console.log('Trimmed birth_city:', birthCityValue, '| isBlank:', birthCityValue === '');
    console.log('Trimmed birth_state:', birthStateValue, '| isBlank:', birthStateValue === '');
    
    // Birth City - Set City_5 directly (confirmed field name)
    const birthCityIsBlank = birthCityValue === '';
    let birthCityStatus: 'success' | 'failed' | 'skipped' = 'skipped';
    
    if (!birthCityIsBlank) {
      try {
        const cityField = form.getTextField('City_5');
        cityField.setText(birthCityValue);
        birthCityStatus = 'success';
        console.log('SUCCESS: Set City_5 =', birthCityValue);
      } catch (e) {
        birthCityStatus = 'failed';
        console.log('FAILED: Could not set City_5. Error:', e);
      }
    } else {
      console.log('SKIPPED: City_5 - birth_city is blank');
    }
    
    mappingReport.push({
      pdfFieldKey: 'City_5',
      valueApplied: birthCityValue,
      sourceFormField: 'birth_city',
      isBlank: birthCityIsBlank,
      status: birthCityStatus,
    });
    
    // Birth State - Set State_5 directly (confirmed field name)
    const birthStateIsBlank = birthStateValue === '';
    let birthStateStatus: 'success' | 'failed' | 'skipped' = 'skipped';
    
    if (!birthStateIsBlank) {
      try {
        const stateField = form.getTextField('State_5');
        stateField.setText(birthStateValue);
        birthStateStatus = 'success';
        console.log('SUCCESS: Set State_5 =', birthStateValue);
      } catch (e) {
        birthStateStatus = 'failed';
        console.log('FAILED: Could not set State_5. Error:', e);
      }
    } else {
      console.log('SKIPPED: State_5 - birth_state is blank');
    }
    
    mappingReport.push({
      pdfFieldKey: 'State_5',
      valueApplied: birthStateValue,
      sourceFormField: 'birth_state',
      isBlank: birthStateIsBlank,
      status: birthStateStatus,
    });
    
    console.log('=== END BIRTH LOCATION DEBUG ===');
    
    // Gender - try multiple approaches
    const gender = application.gender?.toLowerCase();
    console.log('=== GENDER PROCESSING ===');
    console.log('Gender value from application:', application.gender, '-> normalized:', gender);
    
    // First, log all fields that might be gender-related
    console.log('Looking for gender-related fields...');
    for (const field of form.getFields()) {
      const fieldName = field.getName();
      const lowerName = fieldName.toLowerCase();
      if (lowerName.includes('male') || lowerName.includes('female') || lowerName.includes('gender') || lowerName.includes('sex')) {
        console.log(`Potential gender field: "${fieldName}" (type: ${field.constructor.name})`);
      }
    }
    
    let genderSet = false;
    
    // Try as RadioGroup first
    for (const field of form.getFields()) {
      if (genderSet) break;
      try {
        const rg = form.getRadioGroup(field.getName());
        const options = rg.getOptions();
        const lowerOptions = options.map((o: string) => o.toLowerCase());
        const hasMale = lowerOptions.some(o => o.includes('male'));
        const hasFemale = lowerOptions.some(o => o.includes('female'));

        if (!hasMale || !hasFemale) continue;

        console.log(`Detected gender RadioGroup: "${field.getName()}" options=[${options.join(', ')}]`);

        if (gender === 'male') {
          const maleOption = options.find((o: string) => o.toLowerCase().includes('male'));
          if (maleOption) {
            rg.select(maleOption);
            console.log(`Selected "${maleOption}" on gender RadioGroup`);
            genderSet = true;
          }
        } else if (gender === 'female') {
          const femaleOption = options.find((o: string) => o.toLowerCase().includes('female'));
          if (femaleOption) {
            rg.select(femaleOption);
            console.log(`Selected "${femaleOption}" on gender RadioGroup`);
            genderSet = true;
          }
        }
      } catch {
        // Not a radio group, continue
      }
    }

    // Try as individual checkboxes if radio group didn't work
    if (!genderSet) {
      console.log('Gender radio group not found, trying checkboxes...');
      
      // Try exact field names from mappings
      const checkboxNames = gender === 'male' 
        ? ['Male', 'male', 'MALE', 'Check Box4', 'CheckBox4', 'Gender_Male', 'male_checkbox']
        : ['Female', 'female', 'FEMALE', 'Check Box5', 'CheckBox5', 'Gender_Female', 'female_checkbox'];
      
      for (const name of checkboxNames) {
        try {
          const checkbox = form.getCheckBox(name);
          checkbox.check();
          console.log(`SUCCESS: Checked gender checkbox "${name}"`);
          genderSet = true;
          break;
        } catch {
          // Try next
        }
      }
      
      // Try setting as text field with 'X' as last resort
      if (!genderSet) {
        const textNames = gender === 'male' ? ['Male', 'male'] : ['Female', 'female'];
        for (const name of textNames) {
          try {
            const textField = form.getTextField(name);
            textField.setText('X');
            console.log(`SUCCESS: Set gender text field "${name}" to X`);
            genderSet = true;
            break;
          } catch {
            // Try next
          }
        }
      }
    }
    
    if (!genderSet) {
      console.log('WARNING: Could not set gender field');
    }
    console.log('=== END GENDER PROCESSING ===');
    
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
    // Using verified field mapping from Adobe Acrobat analysis
    
    const legalQuestions = application.legal_questions || {};
    
    console.log('=== LEGAL QUESTIONS PROCESSING START ===');
    console.log('Number of legal questions in form data:', Object.keys(legalQuestions).length);
    
    // Helper: Get parent question ID for sub-questions (e.g., '1a' -> '1')
    const getParentId = (qId: string): string | null => {
      const match = qId.match(/^(\d+)[a-z]$/);
      return match ? match[1] : null;
    };
    
    // Helper: Get effective answer (considers parent's answer for sub-questions)
    const getEffectiveAnswer = (questionId: string): boolean | null => {
      const question = legalQuestions[questionId];
      const parentId = getParentId(questionId);
      
      // If this is a sub-question and parent answered "No", sub-question is also "No"
      if (parentId) {
        const parentQuestion = legalQuestions[parentId];
        if (parentQuestion && parentQuestion.answer === false) {
          return false; // Inherited "No" from parent
        }
      }
      
      return question?.answer ?? null;
    };
    
    // Process each legal question using the verified mapping
    let legalQuestionsSuccess = 0;
    let legalQuestionsFailed = 0;
    let legalQuestionsSkipped = 0;
    
    Object.keys(LEGAL_QUESTION_PDF_MAPPING).forEach((questionId) => {
      const mapping = LEGAL_QUESTION_PDF_MAPPING[questionId];
      const effectiveAnswer = getEffectiveAnswer(questionId);
      
      // Skip if no answer provided
      if (effectiveAnswer === null) {
        legalQuestionsSkipped++;
        return;
      }
      
      const optionToSelect = effectiveAnswer ? mapping.yesOption : mapping.noOption;
      
      try {
        // Get the radio group by its exact name from the mapping
        const radioGroup = form.getRadioGroup(mapping.groupName);
        
        // Select the appropriate Yes or No option
        radioGroup.select(optionToSelect);
        
        legalQuestionsSuccess++;
        console.log(`Q${questionId}: SUCCESS - Selected "${optionToSelect}"`);
        
        // Add to mapping report
        mappingReport.push({
          pdfFieldKey: mapping.groupName,
          valueApplied: optionToSelect,
          sourceFormField: `legal_questions.${questionId}`,
          isBlank: false,
          status: 'success',
        });
        
      } catch (err) {
        legalQuestionsFailed++;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.log(`Q${questionId}: FAILED - ${errMsg}`);
        
        // Add to mapping report
        mappingReport.push({
          pdfFieldKey: mapping.groupName,
          valueApplied: `FAILED: ${optionToSelect}`,
          sourceFormField: `legal_questions.${questionId}`,
          isBlank: false,
          status: 'failed',
        });
      }
    });
    
    console.log('=== LEGAL QUESTIONS PROCESSING END ===');
    console.log(`Results: ${legalQuestionsSuccess} success, ${legalQuestionsFailed} failed, ${legalQuestionsSkipped} skipped`);
    
    addDebugLog('info', 'legal-questions', 'Legal questions processing complete', {
      success: legalQuestionsSuccess,
      failed: legalQuestionsFailed,
      skipped: legalQuestionsSkipped,
    });


    // AML / Resident State Yes/No - single radio group with Yes_43/No_43 values
    const hasAmlCourse = application.has_aml_course ?? !!(application.aml_training_provider || application.aml_completion_date);
    const amlCourseName = application.aml_course_name || application.aml_training_provider;
    const amlCourseDate = application.aml_course_date || application.aml_completion_date;
    
    console.log(`=== AML PROCESSING ===`);
    console.log(`has_aml_course: ${hasAmlCourse}, course_name: ${amlCourseName}, course_date: ${amlCourseDate}`);
    
    // Single radio group - use 'Yes' as the ON value for checkbox fields
    if (hasAmlCourse) {
      setRadioValue('Yes_43', 'Yes', 'has_aml_course');
    } else {
      setRadioValue('No_43', 'Yes', 'has_aml_course');
    }
    
    // Set Course Name and Course Date
    setTextField('Course Name', amlCourseName);
    setTextField('Course Date', formatDate(amlCourseDate));
    setTextField('Date Completed', formatDate(amlCourseDate));
    
    console.log(`Set AML radio: ${hasAmlCourse ? 'Yes_43' : 'No_43'}`);
    console.log(`Set Course Name: ${amlCourseName}, Course Date: ${formatDate(amlCourseDate)}`);
    
    // Legacy AML Provider checkboxes (keep for backwards compatibility)
    if (application.aml_training_provider) {
      const provider = application.aml_training_provider.toUpperCase();
      setCheckbox('LIMRA', provider === 'LIMRA');
      setCheckbox('None', false);
      setCheckbox('Other', provider !== 'LIMRA' && provider !== 'NONE');
    }
    
    // FINRA - single radio group, use 'Yes' as the ON value
    const isFinraRegistered = application.is_finra_registered || false;
    console.log('FINRA registered:', isFinraRegistered);
    
    if (!isFinraRegistered) {
      // Set No_47 with 'Yes' as ON value
      setRadioValue('No_47', 'Yes', 'is_finra_registered');
    } else {
      // If Yes, set Yes_47 and fill broker details
      setRadioValue('Yes_47', 'Yes', 'is_finra_registered');
      setTextField('BrokerDealer Name', application.finra_broker_dealer_name);
      setTextField('CRD', application.finra_crd_number);
    }
    
    setTextField('DATE_5', formatDate(application.signature_date));

    // ==================== PAGE 5-6: Additional pages ====================
    setTextField('DATE_6', formatDate(application.signature_date));
    setTextField('DATE_7', formatDate(application.signature_date));

    // ==================== PAGE 9: Signature Page ====================
    // Final signature fields - use actual PDF signature field names
    // Signature images will be drawn to these locations after form flatten
    console.log('Setting final signature fields...');
    
    // ==================== SIGNATURE MAPPING RULES ====================
    // RULE 1: Typed signature fields (TEXT only) → signature_name
    //         - Signature2 (typed name as text overlay)
    //         - Signature2_es_:signer (typed name as text field)
    // RULE 2: Handwritten signature box (IMAGE only) → uploaded_documents.signature_image
    //         - "Additionally please sign in the center of the box below" field
    // 
    // HARD CONSTRAINTS:
    //   - NEVER write signature_name into the handwritten signature box
    //   - NEVER write uploaded_documents.signature_image into Signature2 or Signature2_es_:signer
    // =================================================================
    
    const SIGNATURE_FIELD_1 = 'Signature2_es_:signer';
    const SIGNATURE_FIELD_2 = 'Signature2';
    const HANDWRITTEN_SIGNATURE_FIELD = 'Additionally please sign in the center of the box below_es_:signature';
    
    const signatureNameText = application.signature_name || '';
    const handwrittenSignatureImage = application.uploaded_documents?.signature_image || application.uploaded_documents?.final_signature;
    
    console.log('=== SIGNATURE MAPPING OVERVIEW ===');
    console.log('  signature_name (typed): "' + signatureNameText + '"');
    console.log('  handwritten image exists:', !!handwrittenSignatureImage);
    console.log('  Targets:');
    console.log('    1. Signature2_es_:signer → signature_name (TEXT)');
    console.log('    2. Signature2 → signature_name (TEXT overlay)');
    console.log('    3. "Additionally please sign..." → signature_image (IMAGE)');
    console.log('=================================\n');
    
    // ==================== DEBUG: SEARCH FOR ALL SIGNATURE-RELATED FIELDS ====================
    console.log('=== SEARCHING FOR SIGNATURE2 FIELDS ===');
    const signatureFieldsFound: { name: string; type: string }[] = [];
    const allFieldsForDebug = form.getFields();
    allFieldsForDebug.forEach(field => {
      const name = field.getName();
      if (name.toLowerCase().includes('signature') || name.toLowerCase().includes('signer')) {
        const fieldType = field.constructor.name;
        console.log(`Found field: "${name}" | Type: ${fieldType}`);
        signatureFieldsFound.push({ name, type: fieldType });
      }
    });
    console.log(`Total signature fields found: ${signatureFieldsFound.length}`);
    console.log('=== END SIGNATURE2 SEARCH ===');
    
    
    // Helper to get detailed field info for debugging
    const getFieldDebugInfo = (fieldName: string): {
      exists: boolean;
      fieldType: string;
      pdfFieldType: string; // /FT value
      flags: number | null; // /Ff value
      isReadOnly: boolean;
      widgets: { pageIndex: number; x: number; y: number; width: number; height: number }[];
    } => {
      const result = {
        exists: false,
        fieldType: 'not_found',
        pdfFieldType: 'unknown',
        flags: null as number | null,
        isReadOnly: false,
        widgets: [] as { pageIndex: number; x: number; y: number; width: number; height: number }[],
      };
      
      try {
        const field = form.getField(fieldName) as any;
        result.exists = true;
        result.fieldType = field?.constructor?.name || 'unknown';
        
        // Try to get /FT (field type) from acroField
        const acroField = field?.acroField;
        if (acroField) {
          try {
            const ftObj = acroField.dict?.get?.('FT') ?? acroField.FT?.();
            result.pdfFieldType = ftObj?.toString?.() || ftObj?.name?.() || 'unknown';
          } catch { /* ignore */ }
          
          try {
            const ffObj = acroField.dict?.get?.('Ff') ?? acroField.Ff?.();
            result.flags = typeof ffObj === 'number' ? ffObj : (ffObj?.asNumber?.() ?? null);
          } catch { /* ignore */ }
        }
        
        // Check read-only via pdf-lib API
        try {
          const textField = form.getTextField(fieldName);
          result.isReadOnly = textField.isReadOnly?.() ?? false;
        } catch {
          // Not a text field or method doesn't exist
        }
        
        // Get widget rectangles
        try {
          const widgets = acroField?.getWidgets?.() ?? [];
          for (const widget of widgets) {
            const rect = widget.getRectangle?.();
            const raw = rect?.asArray?.() ?? null;
            if (raw && raw.length >= 4) {
              const toNum = (n: any) => Number(n?.asNumber?.() ?? n?.numberValue?.() ?? n?.value?.() ?? n);
              const x1 = toNum(raw[0]);
              const y1 = toNum(raw[1]);
              const x2 = toNum(raw[2]);
              const y2 = toNum(raw[3]);
              
              // Find page index
              const pageIndex = pages.findIndex((p: any) => {
                const annots = p.node?.Annots?.() ?? p.node?.lookup?.('Annots');
                const arr = typeof annots?.asArray === 'function' ? annots.asArray() : null;
                return Array.isArray(arr) && arr.includes(widget.ref);
              });
              
              result.widgets.push({
                pageIndex: pageIndex >= 0 ? pageIndex : 0,
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
              });
            }
          }
        } catch { /* ignore */ }
        
      } catch {
        // Field not found
      }
      
      return result;
    };
    
    // Get debug info for typed signature fields
    const field1Debug = getFieldDebugInfo(SIGNATURE_FIELD_1);
    const field2Debug = getFieldDebugInfo(SIGNATURE_FIELD_2);
    
    console.log(`\n--- TYPED FIELD 1: ${SIGNATURE_FIELD_1} ---`);
    console.log(`  exists: ${field1Debug.exists}`);
    console.log(`  fieldType (class): ${field1Debug.fieldType}`);
    console.log(`  pdfFieldType (/FT): ${field1Debug.pdfFieldType}`);
    console.log(`  flags (/Ff): ${field1Debug.flags}`);
    console.log(`  isReadOnly: ${field1Debug.isReadOnly}`);
    console.log(`  widgets: ${field1Debug.widgets.length}`);
    field1Debug.widgets.forEach((w, i) => {
      console.log(`    widget[${i}]: page=${w.pageIndex + 1}, x=${w.x.toFixed(1)}, y=${w.y.toFixed(1)}, w=${w.width.toFixed(1)}, h=${w.height.toFixed(1)}`);
    });
    
    console.log(`\n--- TYPED FIELD 2: ${SIGNATURE_FIELD_2} ---`);
    console.log(`  exists: ${field2Debug.exists}`);
    console.log(`  fieldType (class): ${field2Debug.fieldType}`);
    console.log(`  pdfFieldType (/FT): ${field2Debug.pdfFieldType}`);
    console.log(`  flags (/Ff): ${field2Debug.flags}`);
    console.log(`  isReadOnly: ${field2Debug.isReadOnly}`);
    console.log(`  widgets: ${field2Debug.widgets.length}`);
    field2Debug.widgets.forEach((w, i) => {
      console.log(`    widget[${i}]: page=${w.pageIndex + 1}, x=${w.x.toFixed(1)}, y=${w.y.toFixed(1)}, w=${w.width.toFixed(1)}, h=${w.height.toFixed(1)}`);
    });
    
    // -------------------- TYPED FIELD 1: Signature2_es_:signer --------------------
    // Set as text field with signature_name
    let field1Success = false;
    if (signatureNameText && field1Debug.exists) {
      try {
        const textField = form.getTextField(SIGNATURE_FIELD_1);
        // Remove read-only if present
        try { textField.disableReadOnly(); } catch { /* ignore */ }
        textField.setText(signatureNameText);
        field1Success = true;
        console.log(`SUCCESS [TYPED FIELD 1]: Set ${SIGNATURE_FIELD_1} = "${signatureNameText}"`);
      } catch (e) {
        console.log(`FAILED [TYPED FIELD 1]: Could not set ${SIGNATURE_FIELD_1} as text:`, e);
      }
    }
    
    mappingReport.push({
      pdfFieldKey: SIGNATURE_FIELD_1,
      valueApplied: field1Success ? signatureNameText : '',
      sourceFormField: 'signature_name (TYPED)',
      isBlank: !signatureNameText,
      status: !signatureNameText ? 'skipped' : (field1Success ? 'success' : 'failed'),
    });
    
    // -------------------- TYPED FIELD 2: Signature2 (overlay text) --------------------
    // This is a /Sig field that cannot accept text directly - draw typed name as overlay
    // IMPORTANT: Only use the ACTUAL widget rect from this field, NOT a hardcoded fallback
    // The hardcoded fallback was incorrectly overlapping with the handwritten signature box
    let field2NeedsOverlay = false;
    let field2OverlayRect: { pageIndex: number; x: number; y: number; width: number; height: number } | null = null;
    
    console.log(`\n=== TYPED FIELD 2 OVERLAY DECISION ===`);
    console.log(`  Target: Draw typed name "${signatureNameText}" to Signature2 field`);
    console.log(`  pdfFieldType: "${field2Debug.pdfFieldType}"`);
    console.log(`  field exists: ${field2Debug.exists}`);
    console.log(`  widgets count: ${field2Debug.widgets.length}`);
    
    if (signatureNameText && field2Debug.exists && field2Debug.widgets.length > 0) {
      // ONLY use the actual widget rect from the field - NO fallback
      field2NeedsOverlay = true;
      field2OverlayRect = field2Debug.widgets[0];
      console.log(`  Using widget rect from field: page=${field2OverlayRect.pageIndex + 1}, x=${field2OverlayRect.x.toFixed(1)}, y=${field2OverlayRect.y.toFixed(1)}, w=${field2OverlayRect.width.toFixed(1)}, h=${field2OverlayRect.height.toFixed(1)}`);
    } else if (signatureNameText) {
      // No widget found - DO NOT use a hardcoded fallback (would overlap with handwritten box)
      console.log(`  WARNING: Signature2 field has no widget rect - SKIPPING overlay to avoid overlap with handwritten box`);
      console.log(`  The typed name will only appear in Signature2_es_:signer field`);
    }
    console.log(`  field2NeedsOverlay: ${field2NeedsOverlay}`);
    console.log(`=== END TYPED FIELD 2 OVERLAY DECISION ===\n`);
    
    // Report for typed field 2
    if (field2NeedsOverlay && field2OverlayRect) {
      mappingReport.push({
        pdfFieldKey: SIGNATURE_FIELD_2,
        valueApplied: signatureNameText,
        sourceFormField: 'signature_name (TYPED overlay)',
        isBlank: false,
        status: 'success',
      });
      console.log(`${SIGNATURE_FIELD_2} marked for typed text overlay`);
    } else {
      mappingReport.push({
        pdfFieldKey: SIGNATURE_FIELD_2,
        valueApplied: field2Debug.exists && field2Debug.widgets.length === 0 ? '(no widget rect - skipped to avoid overlap)' : '',
        sourceFormField: 'signature_name (TYPED)',
        isBlank: !signatureNameText,
        status: 'skipped',
      });
    }
    
    // -------------------- HANDWRITTEN SIGNATURE BOX: "Additionally please sign..." --------------------
    // This field receives the DRAWN signature IMAGE, not typed text
    console.log(`\n=== HANDWRITTEN SIGNATURE IMAGE MAPPING ===`);
    console.log(`  Target: "${HANDWRITTEN_SIGNATURE_FIELD}"`);
    console.log(`  Source: uploaded_documents.signature_image`);
    console.log(`  Image data exists: ${!!handwrittenSignatureImage}`);
    
    mappingReport.push({
      pdfFieldKey: HANDWRITTEN_SIGNATURE_FIELD,
      valueApplied: handwrittenSignatureImage ? '[IMAGE - signature_image]' : '',
      sourceFormField: 'uploaded_documents.signature_image (IMAGE)',
      isBlank: !handwrittenSignatureImage,
      status: handwrittenSignatureImage ? 'success' : 'skipped',
    });
    console.log(`=== END HANDWRITTEN SIGNATURE IMAGE MAPPING ===\n`);
    
    console.log('=== END SIGNATURE MAPPING ===\n');
    
    // Store overlay info for typed text drawing after flatten
    const signature2OverlayInfo = field2NeedsOverlay && field2OverlayRect ? {
      text: signatureNameText,
      rect: field2OverlayRect,
    } : null;
    
    // Additional text-based signature fields (for other locations in PDF)
    const additionalTextSignatureFields = [
      'TypedSignature',
      'Typed Signature',
      'Type Your Full Legal Name',
      'Applicant Name',
      'Agent Name Printed'
    ];
    
    for (const fieldName of additionalTextSignatureFields) {
      try {
        const field = form.getTextField(fieldName);
        field.setText(signatureNameText);
        console.log(`Also set additional signature text on field: ${fieldName}`);
      } catch {
        // Field not found, continue
      }
    }
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

    // ==================== DRAW SIGNATURE IMAGES DIRECTLY ON PDF PAGES ====================
    // This approach draws images at field coordinates, bypassing field type issues
    
    // Helper to decode base64 data URL to Uint8Array
    const decodeBase64Image = (dataUrl: string): Uint8Array => {
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    // Get raw data URLs
    const uploadedDocsRaw = application.uploaded_documents || {};
    const bgSigDataUrl = uploadedDocsRaw.background_signature_image || uploadedDocsRaw.background_signature;
    const finalSigDataUrl = uploadedDocsRaw.signature_image || uploadedDocsRaw.final_signature || uploadedDocsRaw.final_signature_image;

    // Background Signature (Page 4 - index 3)
    try {
      if (bgSigDataUrl) {
        addDebugLog('info', 'signature', 'Drawing background signature on page 4', {
          fieldName: 'all carrierspecific questions_es_:signature',
          dataLength: bgSigDataUrl.length
        });
        
        // Get field coordinates
        const bgField = form.getField('all carrierspecific questions_es_:signature');
        const bgWidgets = (bgField as any).acroField.getWidgets();
        const bgRect = bgWidgets[0].getRectangle();
        
        addDebugLog('info', 'signature', 'Background signature field coordinates', {
          x: bgRect.x,
          y: bgRect.y,
          width: bgRect.width,
          height: bgRect.height
        });
        
        // Get page 4 (index 3)
        const bgPage = pdfDoc.getPage(3);
        
        // Embed the image
        const bgSigBytes = decodeBase64Image(bgSigDataUrl);
        const bgSigImage = await pdfDoc.embedPng(bgSigBytes);
        
        // Draw image on page at field coordinates
        bgPage.drawImage(bgSigImage, {
          x: bgRect.x,
          y: bgRect.y,
          width: bgRect.width,
          height: bgRect.height,
        });
        
        console.log('[signature] Drew background signature on page 4');
        addDebugLog('info', 'signature', 'Background signature drawn successfully on page 4');
        
        mappingReport.push({
          pdfFieldKey: 'all carrierspecific questions_es_:signature',
          valueApplied: '[IMAGE - drawn on page 4]',
          sourceFormField: 'uploaded_documents.background_signature_image',
          isBlank: false,
          status: 'success',
        });
      } else {
        addDebugLog('warn', 'signature', 'Background signature image is missing');
        mappingReport.push({
          pdfFieldKey: 'all carrierspecific questions_es_:signature',
          valueApplied: '',
          sourceFormField: 'uploaded_documents.background_signature_image',
          isBlank: true,
          status: 'skipped',
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[signature] Background signature error:', errMsg);
      addDebugLog('error', 'signature', 'Error drawing background signature', { error: errMsg });
      mappingReport.push({
        pdfFieldKey: 'all carrierspecific questions_es_:signature',
        valueApplied: 'ERROR',
        sourceFormField: 'uploaded_documents.background_signature_image',
        isBlank: false,
        status: 'failed',
      });
    }

    // Final Signature (Page 10 - index 9)
    try {
      if (finalSigDataUrl) {
        addDebugLog('info', 'signature', 'Drawing final signature on page 10', {
          fieldName: 'Additionally please sign in the center of the box below_es_:signature',
          dataLength: finalSigDataUrl.length
        });
        
        // Get field coordinates
        const finalField = form.getField('Additionally please sign in the center of the box below_es_:signature');
        const finalWidgets = (finalField as any).acroField.getWidgets();
        const finalRect = finalWidgets[0].getRectangle();
        
        addDebugLog('info', 'signature', 'Final signature field coordinates', {
          x: finalRect.x,
          y: finalRect.y,
          width: finalRect.width,
          height: finalRect.height
        });
        
        // Get page 10 (index 9)
        const finalPage = pdfDoc.getPage(9);
        
        // Embed the image
        const finalSigBytes = decodeBase64Image(finalSigDataUrl);
        const finalSigImage = await pdfDoc.embedPng(finalSigBytes);
        
        // Draw image on page at field coordinates
        finalPage.drawImage(finalSigImage, {
          x: finalRect.x,
          y: finalRect.y,
          width: finalRect.width,
          height: finalRect.height,
        });
        
        console.log('[signature] Drew final signature on page 10');
        addDebugLog('info', 'signature', 'Final signature drawn successfully on page 10');
        
        mappingReport.push({
          pdfFieldKey: 'Additionally please sign in the center of the box below_es_:signature',
          valueApplied: '[IMAGE - drawn on page 10]',
          sourceFormField: 'uploaded_documents.signature_image',
          isBlank: false,
          status: 'success',
        });
      } else {
        addDebugLog('warn', 'signature', 'Final signature image is missing');
        mappingReport.push({
          pdfFieldKey: 'Additionally please sign in the center of the box below_es_:signature',
          valueApplied: '',
          sourceFormField: 'uploaded_documents.signature_image',
          isBlank: true,
          status: 'skipped',
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[signature] Final signature error:', errMsg);
      addDebugLog('error', 'signature', 'Error drawing final signature', { error: errMsg });
      mappingReport.push({
        pdfFieldKey: 'Additionally please sign in the center of the box below_es_:signature',
        valueApplied: 'ERROR',
        sourceFormField: 'uploaded_documents.signature_image',
        isBlank: false,
        status: 'failed',
      });
    }

    // Flatten the form to prevent further editing
    form.flatten();
    
    // ==================== SIGNATURE2 OVERLAY TEXT (drawn after flatten) ====================
    // If Signature2 was a /Sig field and couldn't be set as text, draw the typed name here
    if (signature2OverlayInfo && signature2OverlayInfo.rect) {
      console.log('=== DRAWING SIGNATURE2 OVERLAY TEXT ===');
      const { text, rect } = signature2OverlayInfo;
      
      console.log(`  Text to draw: "${text}"`);
      console.log(`  Page index: ${rect.pageIndex} (page ${rect.pageIndex + 1})`);
      console.log(`  Rectangle: x=${rect.x.toFixed(1)}, y=${rect.y.toFixed(1)}, width=${rect.width.toFixed(1)}, height=${rect.height.toFixed(1)}`);
      
      try {
        // Embed Helvetica font for text drawing
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        const targetPage = pages[rect.pageIndex];
        if (targetPage) {
          // Calculate font size to fit in the box (max 14pt, min 8pt)
          const maxFontSize = 14;
          const minFontSize = 8;
          const padding = 6; // Padding inside the box
          const availableWidth = rect.width - (padding * 2);
          
          let fontSize = maxFontSize;
          let textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
          
          // Reduce font size if text is too wide
          while (textWidth > availableWidth && fontSize > minFontSize) {
            fontSize -= 0.5;
            textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
          }
          
          console.log(`  Font size calculated: ${fontSize}pt`);
          console.log(`  Text width at this size: ${textWidth.toFixed(1)}px`);
          console.log(`  Available width (with padding): ${availableWidth.toFixed(1)}px`);
          
          // Center text horizontally and vertically in the box
          const textHeight = helveticaFont.heightAtSize(fontSize);
          const xPos = rect.x + padding + (availableWidth - textWidth) / 2;
          const yPos = rect.y + (rect.height - textHeight) / 2 + textHeight * 0.25; // Slight adjustment for baseline
          
          console.log(`  Draw position: x=${xPos.toFixed(1)}, y=${yPos.toFixed(1)}`);
          
          // Draw the text
          targetPage.drawText(text, {
            x: xPos,
            y: yPos,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          
          console.log(`  SUCCESS: Drew overlay text "${text}" on page ${rect.pageIndex + 1}`);
        } else {
          console.log(`  ERROR: Page ${rect.pageIndex} not found for overlay text`);
        }
      } catch (e) {
        console.log('  ERROR drawing overlay text:', e);
      }
      
      console.log('=== END SIGNATURE2 OVERLAY TEXT ===');
    } else {
      console.log('SKIPPED: No signature2OverlayInfo or rect available');
    }

    // ==================== DRAW INITIALS AND SIGNATURES AS IMAGES ====================
    // Draw initials on each page footer at bottom LEFT above the "initials" line
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

    // NOTE: Background and final signatures are now set via setImage BEFORE flatten
    // (see code above "SET SIGNATURE IMAGES IN FIELDS" section)
    // Save the PDF
    const filledPdfBytes = await pdfDoc.save();

    // ==================== POST-SAVE SIGNATURE VERIFICATION ====================
    // Re-open saved PDF and verify signature presence
    console.log('=== SIGNATURE VERIFICATION ===');
    let signatureVerificationResult = 'not_verified';
    try {
      const verifyDoc = await PDFDocument.load(filledPdfBytes);
      const verifyPages = verifyDoc.getPages();
      
      // Check if page 10 (index 9) has content streams that indicate image presence
      if (verifyPages.length >= 10) {
        const page10 = verifyPages[9];
        const pageDict = (page10 as any).node;
        const resources = pageDict?.Resources?.();
        const xObjects = resources?.XObject?.();
        
        if (xObjects) {
          const xObjectKeys = Object.keys(xObjects?.dict || {});
          console.log(`Page 10 XObjects found: ${xObjectKeys.length}`);
          signatureVerificationResult = xObjectKeys.length > 0 ? 'images_present' : 'no_images';
        } else {
          signatureVerificationResult = 'no_xobjects';
        }
      }
      console.log(`Signature verification result: ${signatureVerificationResult}`);
    } catch (verifyErr) {
      console.log('Signature verification failed:', verifyErr);
      signatureVerificationResult = 'verification_error';
    }
    console.log('=== END SIGNATURE VERIFICATION ===');

    // Update mapping report with verification result
    mappingReport.push({
      pdfFieldKey: 'SIGNATURE2_VERIFICATION',
      valueApplied: signatureVerificationResult,
      sourceFormField: 'post_save_check',
      isBlank: signatureVerificationResult !== 'images_present',
      status: signatureVerificationResult === 'images_present' ? 'success' : 'skipped',
    });

    // Generate filename using the signature date from the application
    const nameParts = application.full_legal_name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    // Use signature_date from application to avoid timezone issues
    const sigDatePart = application.signature_date?.split('T')[0] || new Date().toISOString().split('T')[0];
    const dateStr = sigDatePart.replace(/-/g, '');
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

    // Log mapping report summary
    const successCount = mappingReport.filter(m => m.status === 'success').length;
    const failedCount = mappingReport.filter(m => m.status === 'failed').length;
    const skippedCount = mappingReport.filter(m => m.status === 'skipped').length;
    
    addDebugLog('info', 'summary', `PDF generated: ${filename}`, {
      size: filledPdfBytes.byteLength,
      mappingStats: { success: successCount, failed: failedCount, skipped: skippedCount, total: mappingReport.length }
    });

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        pdf: base64,
        size: filledPdfBytes.byteLength,
        storagePath,
        filledTemplate: true,
        mappingReport,
        debugLogs, // Include debug logs for Test Mode
        signatureFieldsFound, // Include signature field search results for Test Mode
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
