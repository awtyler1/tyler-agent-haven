import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
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
  user_id?: string;
  is_finra_registered?: boolean;
  finra_broker_dealer_name?: string;
  finra_crd_number?: string;
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

// Legal question ID to PDF field mapping
const LEGAL_QUESTION_FIELD_MAP: Record<string, string> = {
  '1': 'Felony Misdemeanor federal andor state insurance andor securities or investments',
  '1A': 'undefined',
  '1B': 'Have you ever been convicted of or plead guilty or no contest to any Misdemeanor',
  '1C': 'Have you ever been convicted of or plead guilty or no contest to any violation or federal',
  '1D': 'Have you ever been convicted of or plead guilty or no contest to any violation of state',
  '1E': 'Has any foreign government court regulatory agency andor exchange ever entered an',
  '1F': 'undefined_2',
  '1G': 'undefined_3',
  '1H': 'undefined_4',
  '2': 'Have you ever been or are you currently being investigated have any pending',
  '2A': 'undefined_5',
  '2B': 'undefined_6',
  '2C': 'civil judgments andor other legal proceedings civil or criminal You may omit family',
  '2D': 'Have you ever been named as a defendant or codefendant in any lawsuit or have you',
  '3': 'undefined_7',
  '4': 'undefined_8',
  '5': 'contract or appointment or permitted you to resign for any reason other than lack of',
  '5A': 'andor investmentrelated statues regulations rules andor industry standards of',
  '5B': 'Were you terminated andor resigned because you were accused of fraud andor the',
  '5C': 'with insurance andor investmentrelated statues regulations rules andor industry',
  '6': 'Have you ever had an appointment with any insurance companies terminated for cause',
  '7': 'Does any insurer insured andor other person claim any commission chargeback andor',
  '8': 'omissions insurer arising out of your sales andor practices or have you been refused',
  '8A': 'Has a bonding andor surety company ever denied paid on andor revoked a bond for',
  '8B': 'Has any Errors  Omissions EO carrier ever denied paid claims on andor canceled',
  '9': 'Have you ever had an insurance andor securities license denied suspended canceled',
  '10': 'investment andor insurancerelated business having its authorization to do business',
  '11': 'Has any state andor federal regulatory agency revoked andor suspended your license',
  '12': 'Has any state andor federal regulatory agency found you to have made any false',
  '13': 'undefined_9',
  '14': 'sanctioned censured penalized andor otherwise disciplined you for a violation of their',
  '14A': 'Has any regulatory body ever sanctioned censured penalized andor otherwise',
  '14C': 'undefined_10',
  '15': 'Have you personally andor any insurance andor securities brokerage firms with whom',
  '15A': 'undefined_11',
  '15B': 'filed a bankruptcy petition andor been declared bankrupt either during your association',
  '15C': 'undefined_12',
  '16': 'undefined_13',
  '17': 'Are you connected in any way with a bank savings and loan association andor other',
  '18': 'undefined_14',
  '19': 'Do you have any unresolved matters pending with the Internal Revenue Services andor',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application, saveToStorage = false, userId, templateUrl } = await req.json() as { 
      application: ContractingData; 
      saveToStorage?: boolean;
      userId?: string;
      templateUrl?: string;
    };

    console.log('Generating PDF for:', application.full_legal_name, 'saveToStorage:', saveToStorage);

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

    // Fetch the PDF template
    const pdfTemplateUrl = templateUrl || 'https://wpczgwxsriezaubncuom.lovableproject.com/templates/TIG_Contracting_Packet_Template.pdf';
    
    console.log('Fetching PDF template from:', pdfTemplateUrl);
    
    // Try to fetch from multiple possible URLs
    let pdfBytes: ArrayBuffer | null = null;
    const urls = [
      pdfTemplateUrl,
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
    
    // If we couldn't fetch the template, create a simple PDF instead
    if (!pdfBytes) {
      console.log('Could not fetch template, creating PDF from scratch');
      return await createPdfFromScratch(application, saveToStorage, userId);
    }

    // Load the PDF template
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    console.log('PDF template loaded, filling form fields...');

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

    // Helper to safely set checkbox
    const setCheckbox = (fieldName: string, checked: boolean) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (checked) {
          field.check();
        } else {
          field.uncheck();
        }
      } catch (e) {
        console.log(`Checkbox not found or error: ${fieldName}`);
      }
    };

    // ==================== PAGE 1: Contract Application ====================
    setTextField('Agent Name', application.full_legal_name);
    setTextField('SSN', application.tax_id);
    setTextField('Agency Name', application.agency_name);
    setTextField('Tax ID', application.is_corporation ? application.tax_id : '');
    setTextField('Personal Name or Principal', application.full_legal_name);
    setTextField('Insurance License', application.insurance_license_number);
    setTextField('Birth Date', formatDate(application.birth_date));
    setTextField('NPN', application.npn_number);
    setTextField('MMDDYYYY', formatDateMMDDYYYY(application.birth_date));
    
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
    
    // Preferred contact
    const preferredMethods = application.preferred_contact_methods || [];
    setCheckbox('Email', preferredMethods.includes('email'));
    setCheckbox('Phone', preferredMethods.includes('phone'));
    setCheckbox('Text', preferredMethods.includes('text'));
    
    // Initials on page 1
    setTextField('INITIALS', application.signature_initials);
    setTextField('DATE', formatDate(application.signature_date));

    // ==================== PAGES 2-3: Legal Questions ====================
    const legalQuestions = application.legal_questions || {};
    
    Object.entries(LEGAL_QUESTION_FIELD_MAP).forEach(([questionId, fieldName]) => {
      const question = legalQuestions[questionId];
      if (question && question.answer !== null) {
        // These are typically checkboxes for Yes/No
        try {
          const field = form.getCheckBox(fieldName);
          if (question.answer) {
            field.check();
          }
        } catch {
          // Try as text field
          setTextField(fieldName, question.answer ? 'Yes' : 'No');
        }
      }
    });
    
    // Initials on page 2
    setTextField('INITIALS_2', application.signature_initials);
    setTextField('DATE_2', formatDate(application.signature_date));
    
    // Signature and date on page 3 (after legal questions)
    setTextField('Date', formatDate(application.signature_date));
    setTextField('INITIALS_3', application.signature_initials);
    setTextField('DATE_3', formatDate(application.signature_date));

    // ==================== PAGE 4: Banking Information ====================
    setTextField('Bank Routing', application.bank_routing_number);
    setTextField('Account', application.bank_account_number);
    setTextField('Branch Name or Location', application.bank_branch_name);
    setCheckbox('Requesting Commission Advancing', application.requesting_commission_advancing);
    setTextField('List a Beneficiary', application.beneficiary_name);
    setTextField('Relationship', application.beneficiary_relationship);
    setTextField('Drivers License', application.drivers_license_number);
    setTextField('Resident Drivers License State', application.drivers_license_state);
    
    // AML
    setCheckbox('Have you taken an AML course within the past two 2 years', !!application.aml_training_provider);
    setTextField('Course Name', application.aml_training_provider);
    setTextField('Course Date', formatDate(application.aml_completion_date));
    
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
    
    setTextField('INITIALS_4', application.signature_initials);
    setTextField('DATE_5', formatDate(application.signature_date));

    // ==================== PAGE 5-6: Additional pages ====================
    setTextField('INITIALS_5', application.signature_initials);
    setTextField('DATE_6', formatDate(application.signature_date));
    setTextField('INITIALS_6', application.signature_initials);
    setTextField('DATE_7', formatDate(application.signature_date));

    // ==================== PAGE 9: Signature Page ====================
    setTextField('Additionally please sign in the center of the box below', application.signature_name);
    setTextField('INITIALS_7', application.signature_initials);
    setTextField('DATE_8', formatDate(application.signature_date));

    // ==================== PAGE 10: Carrier Selection ====================
    const selectedCarriers = application.selected_carriers || [];
    
    selectedCarriers.forEach((carrier) => {
      // Find matching carrier in our map
      const carrierKey = Object.keys(CARRIER_FIELD_MAP).find(key => 
        carrier.carrier_name.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(carrier.carrier_name.toLowerCase())
      );
      
      if (carrierKey) {
        const mapping = CARRIER_FIELD_MAP[carrierKey];
        setCheckbox(mapping.checkbox, true);
        
        if (carrier.non_resident_states && carrier.non_resident_states.length > 0) {
          setTextField(mapping.nonResStates, carrier.non_resident_states.join(', '));
        }
      } else {
        console.log('No mapping found for carrier:', carrier.carrier_name);
      }
    });
    
    setTextField('INITIALS_8', application.signature_initials);
    setTextField('DATE_9', formatDate(application.signature_date));

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

    // Return the PDF as base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(filledPdfBytes)));

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
  const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

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
