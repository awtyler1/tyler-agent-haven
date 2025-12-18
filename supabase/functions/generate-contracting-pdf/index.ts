/**
 * Generate Contracting PDF - V5 (Form Data Compatible)
 *
 * Updated to handle the actual form data structure:
 * - Address: street1/street2 instead of street
 * - Carriers: name instead of carrier_name
 * - Legal questions: "yes"/"no" strings
 * - Missing county fields handled gracefully
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// TYPES (matching actual form data)
// ============================================================================

interface Address {
  street1?: string;
  street2?: string;
  street?: string; // Support both formats
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
}

interface LegalQuestion {
  answer: boolean | string | null;
  explanation?: string;
}

interface SelectedCarrier {
  code?: string;
  name?: string; // Form uses this
  carrier_name?: string; // Code originally expected this
  carrier_id?: string;
  non_resident_states?: string[];
}

interface MappingEntry {
  pdfFieldKey: string;
  valueApplied: string;
  sourceFormField: string;
  isBlank: boolean;
  status: "success" | "failed" | "skipped";
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get street address - handles both street1/street2 and street formats
 */
function getStreetAddress(addr: Address | null | undefined): string {
  if (!addr) return "";

  // If street exists, use it directly
  if (addr.street) return addr.street;

  // Otherwise combine street1 + street2
  const parts = [addr.street1, addr.street2].filter(Boolean);
  return parts.join(", ");
}

/**
 * Format date to MM/DD/YYYY
 */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  try {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-");
    if (year && month && day) {
      return `${month.padStart(2, "0")}/${day.padStart(2, "0")}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr || "";
  }
}

/**
 * Format phone number to (XXX) XXX-XXXX
 */
function formatPhone(phone: string | undefined | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Convert answer to boolean - handles multiple formats
 */
function answerToBool(answer: any): boolean | null {
  if (answer === true || answer === "true" || answer === "yes" || answer === "Yes" || answer === "YES") {
    return true;
  }
  if (answer === false || answer === "false" || answer === "no" || answer === "No" || answer === "NO") {
    return false;
  }
  return null;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

// ============================================================================
// FIELD MAPPING CONFIGURATION
// ============================================================================

// Legal question radio groups - maps PDF group name to question ID and options
const LEGAL_QUESTION_MAPPINGS: Record<string, { source: string; yesOption: string; noOption: string }> = {
  // Question 1 family (criminal history)
  "Felony Misdemeanor federal andor state insurance andor securities or investments": {
    source: "1",
    yesOption: "Yes",
    noOption: "No",
  },
  undefined: { source: "1a", yesOption: "Yes_2", noOption: "No_2" },
  "Have you ever been convicted of or plead guilty or no contest to any Misdemeanor": {
    source: "1b",
    yesOption: "Yes_3",
    noOption: "No_3",
  },
  "Have you ever been convicted of or plead guilty or no contest to any violation or federal": {
    source: "1c",
    yesOption: "Yes_4",
    noOption: "No_4",
  },
  "Have you ever been convicted of or plead guilty or no contest to any violation of state": {
    source: "1d",
    yesOption: "Yes_5",
    noOption: "No_5",
  },
  "Has any foreign government court regulatory agency andor exchange ever entered an": {
    source: "1e",
    yesOption: "Yes_6",
    noOption: "No_6",
  },
  undefined_2: { source: "1f", yesOption: "Yes_7", noOption: "No_7" },
  undefined_3: { source: "1g", yesOption: "Yes_8", noOption: "No_8" },
  undefined_4: { source: "1h", yesOption: "Yes_9", noOption: "No_9" },

  // Question 2 family (investigations)
  "Have you ever been or are you currently being investigated have any pending": {
    source: "2",
    yesOption: "Yes_10",
    noOption: "No_10",
  },
  undefined_5: { source: "2a", yesOption: "Yes_11", noOption: "No_11" },
  undefined_6: { source: "2b", yesOption: "Yes_12", noOption: "No_12" },
  "civil judgments andor other legal proceedings civil or criminal You may omit family": {
    source: "2c",
    yesOption: "Yes_13",
    noOption: "No_13",
  },
  "Have you ever been named as a defendant or codefendant in any lawsuit or have you": {
    source: "2d",
    yesOption: "Yes_14",
    noOption: "No_14",
  },

  // Questions 3-4 (fraud)
  undefined_7: { source: "3", yesOption: "Yes_15", noOption: "No_15" },
  undefined_8: { source: "4", yesOption: "Yes_16", noOption: "No_16" },

  // Question 5 family (terminations)
  "contract or appointment or permitted you to resign for any reason other than lack of": {
    source: "5",
    yesOption: "Yes_17",
    noOption: "No_17",
  },
  "andor investmentrelated statues regulations rules andor industry standards of": {
    source: "5a",
    yesOption: "Yes_18",
    noOption: "No_18",
  },
  "Were you terminated andor resigned because you were accused of fraud andor the": {
    source: "5b",
    yesOption: "Yes_19",
    noOption: "No_19",
  },
  "with insurance andor investmentrelated statues regulations rules andor industry": {
    source: "5c",
    yesOption: "Yes_20",
    noOption: "No_20",
  },

  // Questions 6-7
  "Have you ever had an appointment with any insurance companies terminated for cause": {
    source: "6",
    yesOption: "Yes_21",
    noOption: "No_21",
  },
  "Does any insurer insured andor other person claim any commission chargeback andor": {
    source: "7",
    yesOption: "Yes_22",
    noOption: "No_22",
  },

  // Question 8 family (E&O/bonding)
  "omissions insurer arising out of your sales andor practices or have you been refused": {
    source: "8",
    yesOption: "Yes_23",
    noOption: "No_23",
  },
  "Has a bonding andor surety company ever denied paid on andor revoked a bond for": {
    source: "8a",
    yesOption: "Yes_24",
    noOption: "No_24",
  },
  "Has any Errors  Omissions EO carrier ever denied paid claims on andor canceled": {
    source: "8b",
    yesOption: "Yes_25",
    noOption: "No_25",
  },

  // Questions 9-13 (license/regulatory)
  "Have you ever had an insurance andor securities license denied suspended canceled": {
    source: "9",
    yesOption: "Yes_26",
    noOption: "No_26",
  },
  "investment andor insurancerelated business having its authorization to do business": {
    source: "10",
    yesOption: "Yes_27",
    noOption: "No_27",
  },
  "Has any state andor federal regulatory agency revoked andor suspended your license": {
    source: "11",
    yesOption: "Yes_28",
    noOption: "No_28",
  },
  "Has any state andor federal regulatory agency found you to have made any false": {
    source: "12",
    yesOption: "Yes_29",
    noOption: "No_29",
  },
  undefined_9: { source: "13", yesOption: "Yes_30", noOption: "No_30" },

  // Question 14 family (discipline)
  "sanctioned censured penalized andor otherwise disciplined you for a violation of their": {
    source: "14",
    yesOption: "Yes_31",
    noOption: "No_31",
  },
  "Has any regulatory body ever sanctioned censured penalized andor otherwise": {
    source: "14a",
    yesOption: "Yes_32",
    noOption: "No_32",
  },
  undefined_10: { source: "14c", yesOption: "Yes_33", noOption: "No_33" },

  // Question 15 family (bankruptcy)
  "Have you personally andor any insurance andor securities brokerage firms with whom": {
    source: "15",
    yesOption: "Yes_34",
    noOption: "No_34",
  },
  undefined_11: { source: "15a", yesOption: "Yes_35", noOption: "No_35" },
  "filed a bankruptcy petition andor been declared bankrupt either during your association": {
    source: "15b",
    yesOption: "Yes_36",
    noOption: "No_36",
  },
  undefined_12: { source: "15c", yesOption: "Yes_37", noOption: "No_37" },

  // Questions 16-19
  undefined_13: { source: "16", yesOption: "Yes_38", noOption: "No_38" },
  "Are you connected in any way with a bank savings and loan association andor other": {
    source: "17",
    yesOption: "Yes_39",
    noOption: "No_39",
  },
  undefined_14: { source: "18", yesOption: "Yes_40", noOption: "No_40" },
  "Do you have any unresolved matters pending with the Internal Revenue Services andor": {
    source: "19",
    yesOption: "Yes_41",
    noOption: "No_41",
  },
};

// Other radio groups
const OTHER_RADIO_MAPPINGS: Record<string, { source: string; yesOption: string; noOption: string }> = {
  "Requesting Commission Advancing": {
    source: "requesting_commission_advancing",
    yesOption: "Yes_42",
    noOption: "No_42",
  },
  "Have you taken an AML course within the past two 2 years": {
    source: "has_aml_course",
    yesOption: "Yes_43",
    noOption: "No_43",
  },
  "Are you a registered representative with FINRA": {
    source: "is_finra_registered",
    yesOption: "Yes_47",
    noOption: "No_47",
  },
};

// Carrier mappings - checkbox field and non-resident states text field
const CARRIER_FIELD_MAP: Record<string, { checkbox: string; nonResStates: string }> = {
  aetna: { checkbox: "fill_3", nonResStates: "NONRES STATESAetna Medicare Advantage Coventry LINK" },
  humana: { checkbox: "fill_5", nonResStates: "NONRES STATESHumana LINK" },
  unitedhealthcare: { checkbox: "fill_137", nonResStates: "NONRES STATESUnitedHealthcare LINK" },
  uhc: { checkbox: "fill_137", nonResStates: "NONRES STATESUnitedHealthcare LINK" },
  wellcare: { checkbox: "fill_149", nonResStates: "NONRES STATESWellCare LINK" },
  anthem: { checkbox: "fill_35", nonResStates: "NONRES STATESAnthem BCBS Empire Amerigroup Caremore LINK" },
  devoted: { checkbox: "fill_103", nonResStates: "NONRES STATESDevoted Health LINK" },
  "devoted health": { checkbox: "fill_103", nonResStates: "NONRES STATESDevoted Health LINK" },
  cigna: { checkbox: "fill_87", nonResStates: "NONRES STATESCigna HealthSpring Bravo Health LINK" },
  "mutual of omaha": { checkbox: "fill_37", nonResStates: "NONRES STATESMutual of Omaha Med Supp PDP" },
  "mutualofomaha": { checkbox: "fill_37", nonResStates: "NONRES STATESMutual of Omaha Med Supp PDP" },
  "blue cross blue shield": { checkbox: "fill_61", nonResStates: "NONRES STATESBlue Cross Blue Shield MI LINK" },
  bcbs: { checkbox: "fill_61", nonResStates: "NONRES STATESBlue Cross Blue Shield MI LINK" },
  clover: { checkbox: "fill_91", nonResStates: "NONRES STATESClover Health LINK" },
  "clover health": { checkbox: "fill_91", nonResStates: "NONRES STATESClover Health LINK" },
  oscar: { checkbox: "fill_79", nonResStates: "NONRES STATESOscar Health LINK" },
  "oscar health": { checkbox: "fill_79", nonResStates: "NONRES STATESOscar Health LINK" },
  molina: { checkbox: "fill_33", nonResStates: "NONRES STATESMolina MA LINK" },
  selecthealth: { checkbox: "fill_101", nonResStates: "NONRES STATESSelectHealth LINK" },
  simply: { checkbox: "fill_109", nonResStates: "NONRES STATESSimply LINK" },
  scan: { checkbox: "fill_97", nonResStates: "NONRES STATESSCAN" },
  alignment: { checkbox: "fill_15", nonResStates: "NONRES STATESAlignment Health LINK" },
  "alignment health": { checkbox: "fill_15", nonResStates: "NONRES STATESAlignment Health LINK" },
  freedom: { checkbox: "fill_135", nonResStates: "NONRES STATESFreedom Optimum LINK" },
  healthfirst: { checkbox: "fill_155", nonResStates: "NONRES STATESHealthFirst LINK" },
  emblem: { checkbox: "fill_107", nonResStates: "NONRES STATESEmblem Connecticare LINK" },
  bright: { checkbox: "fill_65", nonResStates: "NONRES STATESBright ACA LINK" },
  "capitol life": { checkbox: "fill_73", nonResStates: "NONRES STATESCapitol Life  Med Supp LINK" },
  lumico: { checkbox: "fill_21", nonResStates: "NONRES STATESLUMICO MS LINK" },
  medico: { checkbox: "fill_25", nonResStates: "NONRES STATESMedico Group" },
  "national guardian": { checkbox: "fill_55", nonResStates: "NONRES STATESNational Guardian Life Med Supp LINK" },
  usic: { checkbox: "fill_141", nonResStates: "NONRES STATESUSIC MS LINK" },
  "national care dental": { checkbox: "fill_47", nonResStates: "NONRES STATESNational Care Dental LINK" },
  "united home life": { checkbox: "fill_129", nonResStates: "NONRES STATESUnited Home Life LINK" },
  "sons of norway": { checkbox: "fill_113", nonResStates: "NONRES STATESSons of Norway LINK" },
  "national life": { checkbox: "fill_59", nonResStates: "NONRES STATESNational Life Group LINK" },
  regence: { checkbox: "fill_89", nonResStates: "NONRES STATESRegence" },
  baycare: { checkbox: "fill_57", nonResStates: "NONRES STATESBayCare LINK" },
  // Life/Annuity carriers
  agla: { checkbox: "fill_11", nonResStates: "NONRES STATESAGLA Life with Living Benefits" },
  "american equity": { checkbox: "fill_19", nonResStates: "NONRES STATESAmerican Equity" },
  "american general": { checkbox: "fill_23", nonResStates: "NONRES STATESAmerican General Life Brokerage Annuity" },
  americo: { checkbox: "fill_27", nonResStates: "NONRES STATESAmerico" },
  athene: { checkbox: "fill_43", nonResStates: "NONRES STATESAthene Annuity  Life Assurance Company" },
  "baltimore life": { checkbox: "fill_49", nonResStates: "NONRES STATESBaltimore Life" },
  "bankers fidelity": { checkbox: "fill_53", nonResStates: "NONRES STATESBanker s Fidelity Life Assurance Company" },
  brighthouse: { checkbox: "fill_69", nonResStates: "NONRES STATESBrighthouse Financial" },
  columbian: { checkbox: "fill_95", nonResStates: "NONRES STATESColumbian Mutual Life Insurance Company" },
  combined: { checkbox: "fill_99", nonResStates: "NONRES STATESCombined Insurance Company of America" },
  equitable: { checkbox: "fill_111", nonResStates: "NONRES STATESEquitable Annuity" },
  equitrust: { checkbox: "fill_115", nonResStates: "NONRES STATESEquitrust" },
  "f&g": { checkbox: "fill_119", nonResStates: "NONRES STATESFG" },
  fg: { checkbox: "fill_119", nonResStates: "NONRES STATESFG" },
  foresters: { checkbox: "fill_127", nonResStates: "NONRES STATESForesters Financial" },
  "global atlantic": { checkbox: "fill_139", nonResStates: "NONRES STATESGlobal Atlantic" },
  "great american": { checkbox: "fill_143", nonResStates: "NONRES STATESGreat American" },
  "great western": { checkbox: "fill_147", nonResStates: "NONRES STATESGreat Western GI Life" },
  "guarantee trust": { checkbox: "fill_151", nonResStates: "NONRES STATESGuarantee Trust Life" },
  gtl: { checkbox: "fill_151", nonResStates: "NONRES STATESGuarantee Trust Life" },
  independence: { checkbox: "fill_9", nonResStates: "NONRES STATESIndependence Blue Cross" },
  "john hancock": { checkbox: "fill_13", nonResStates: "NONRES STATESJohn Hancock" },
  lincoln: { checkbox: "fill_17", nonResStates: "NONRES STATESLincoln Financial" },
  "national western": { checkbox: "fill_63", nonResStates: "NONRES STATESNational Western" },
  nationwide: { checkbox: "fill_67", nonResStates: "NONRES STATESNationwide" },
  "north american": { checkbox: "fill_71", nonResStates: "NONRES STATESNorth American Company NACOLAH Life  Annuity" },
  oceanview: { checkbox: "fill_75", nonResStates: "NONRES STATESOceanview" },
  protective: { checkbox: "fill_83", nonResStates: "NONRES STATESProtective L fe" },
  prudential: { checkbox: "fill_85", nonResStates: "NONRES STATESPrudential" },
  "royal neighbors": { checkbox: "fill_93", nonResStates: "NONRES STATESRoyal Neighbors of America" },
  sentinel: { checkbox: "fill_105", nonResStates: "NONRES STATESSentinel Security Life Insurance Company" },
  standard: { checkbox: "fill_117", nonResStates: "NONRES STATESThe Standard" },
  "the standard": { checkbox: "fill_117", nonResStates: "NONRES STATESThe Standard" },
  transamerica: { checkbox: "fill_125", nonResStates: "NONRES STATESTransamerica Premier" },
  "united security": { checkbox: "fill_133", nonResStates: "NONRES STATESUnited Security Assurance" },
  "washington national": { checkbox: "fill_145", nonResStates: "NONRES STATESWashinton National" },
  "william penn": { checkbox: "fill_153", nonResStates: "NONRES STATESWilliam Penn" },
};

// Duplicate groups - same value in multiple fields
const DUPLICATE_GROUPS = {
  DATE: {
    source: "signature_date",
    format: "date" as const,
    fields: ["DATE", "DATE_2", "DATE_3", "DATE_4", "DATE_5", "DATE_6", "DATE_7", "DATE_8", "DATE_9", "Date"],
  },
  INITIALS: {
    source: "signature_initials",
    fields: [
      "INITIALS",
      "INITIALS_2",
      "INITIALS_3",
      "INITIALS_4",
      "INITIALS_5",
      "INITIALS_6",
      "INITIALS_7",
      "INITIALS_8",
    ],
  },
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  console.log("=== GENERATE-CONTRACTING-PDF V5 (Form Data Compatible) ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application, templateUrl, templateBase64, skipValidation = false } = await req.json();

    const mappingReport: MappingEntry[] = [];

    const addReport = (
      fieldKey: string,
      value: string,
      source: string,
      status: MappingEntry["status"],
      error?: string,
    ) => {
      mappingReport.push({
        pdfFieldKey: fieldKey,
        valueApplied: value || "",
        sourceFormField: source,
        isBlank: !value,
        status,
        error,
      });
    };

    // ========================================================================
    // VALIDATION
    // ========================================================================

    if (!skipValidation) {
      const errors: string[] = [];
      if (!application.signature_initials) errors.push("Initials required");
      if (!application.signature_date) errors.push("Signature date required");
      if (!application.signature_name) errors.push("Signature name required");
      if (!application.full_legal_name) errors.push("Full legal name required");

      if (errors.length > 0) {
        return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ========================================================================
    // LOAD PDF TEMPLATE
    // ========================================================================

    let pdfBytes: ArrayBuffer | null = null;

    if (templateBase64) {
      const binaryString = atob(templateBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfBytes = bytes.buffer;
    }

    if (!pdfBytes) {
      const urls = [
        templateUrl,
        "https://hikhnmuckfopyzxkdeus.supabase.co/storage/v1/object/public/templates-public/TIG_Contracting_Packet_SIGNATURES_FIXED.pdf",
      ].filter(Boolean);

      for (const url of urls) {
        try {
          const response = await fetch(url!);
          if (response.ok) {
            pdfBytes = await response.arrayBuffer();
            console.log(`Loaded template from: ${url}`);
            break;
          }
        } catch (e) {
          console.warn(`Failed to load from ${url}:`, e);
        }
      }
    }

    if (!pdfBytes) {
      return new Response(JSON.stringify({ error: "Could not load PDF template" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();

    // ========================================================================
    // FIELD SETTER FUNCTIONS
    // ========================================================================

    const setTextField = (fieldName: string, value: string | undefined | null, source: string) => {
      if (!value) {
        addReport(fieldName, "", source, "skipped");
        return;
      }
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
        addReport(fieldName, value, source, "success");
      } catch (err) {
        addReport(fieldName, value, source, "failed", String(err));
      }
    };

    /**
     * CRITICAL: Checkbox setter that ALWAYS explicitly sets state
     */
    const setCheckbox = (fieldName: string, shouldCheck: boolean, source: string) => {
      try {
        const checkbox = form.getCheckBox(fieldName);
        if (shouldCheck) {
          checkbox.check();
        } else {
          checkbox.uncheck(); // <-- KEY FIX
        }
        addReport(fieldName, shouldCheck ? "checked" : "unchecked", source, "success");
      } catch (err) {
        // Fallback: try as text field
        try {
          const textField = form.getTextField(fieldName);
          textField.setText(shouldCheck ? "X" : "");
          addReport(fieldName, shouldCheck ? "X" : "", source, "success");
        } catch {
          addReport(fieldName, shouldCheck ? "checked" : "unchecked", source, "failed", String(err));
        }
      }
    };

    const setRadioGroup = (
      groupName: string,
      shouldSelectYes: boolean | null,
      yesOption: string,
      noOption: string,
      source: string,
    ) => {
      // Default to No if null/undefined
      const optionToSelect = shouldSelectYes === true ? yesOption : noOption;
      try {
        const radioGroup = form.getRadioGroup(groupName);
        radioGroup.select(optionToSelect);
        addReport(groupName, optionToSelect, source, "success");
      } catch (err) {
        addReport(groupName, optionToSelect, source, "failed", String(err));
      }
    };

    // ========================================================================
    // PAGE 1: PERSONAL INFORMATION
    // ========================================================================

    // Agent identification
    setTextField("Agent Name", application.full_legal_name, "full_legal_name");
    setTextField("SSN", application.tax_id, "tax_id");
    setTextField("Agency Name", application.agency_name, "agency_name");
    setTextField("Tax ID", application.agency_tax_id, "agency_tax_id");
    setTextField("Personal Name or Principal", application.full_legal_name, "full_legal_name");
    setTextField("Insurance License", application.insurance_license_number, "insurance_license_number");
    setTextField("Birth Date", formatDate(application.birth_date), "birth_date");
    setTextField("NPN", application.npn_number, "npn_number");

    // Home Address - handles both street and street1/street2 formats
    if (application.home_address) {
      const addr = application.home_address;
      setTextField("Agent Home Address", getStreetAddress(addr), "home_address.street");
      setTextField("City", addr.city, "home_address.city");
      setTextField("State", addr.state, "home_address.state");
      setTextField("ZIP", addr.zip, "home_address.zip");
      setTextField("County", addr.county || "", "home_address.county");
    }

    // Mailing Address (with same-as-home logic)
    const mailingAddr = application.mailing_address_same_as_home
      ? application.home_address
      : application.mailing_address;
    if (mailingAddr) {
      setTextField("Mailing Address", getStreetAddress(mailingAddr), "mailing_address.street");
      setTextField("City_2", mailingAddr.city, "mailing_address.city");
      setTextField("State_2", mailingAddr.state, "mailing_address.state");
      setTextField("ZIP_2", mailingAddr.zip, "mailing_address.zip");
      setTextField("County_2", mailingAddr.county || "", "mailing_address.county");
    }

    // UPS Address (with same-as-home logic)
    const upsAddr = application.ups_address_same_as_home ? application.home_address : application.ups_address;
    if (upsAddr) {
      setTextField("UPS Street Address", getStreetAddress(upsAddr), "ups_address.street");
      setTextField("City_3", upsAddr.city, "ups_address.city");
      setTextField("State_3", upsAddr.state, "ups_address.state");
      setTextField("ZIP_3", upsAddr.zip, "ups_address.zip");
      setTextField("County_3", upsAddr.county || "", "ups_address.county");
    }

    // Contact info
    setTextField("Phone Res", formatPhone(application.phone_home), "phone_home");
    setTextField("Business", formatPhone(application.phone_business), "phone_business");
    setTextField("Fax", formatPhone(application.fax), "fax");
    setTextField("Mobile", formatPhone(application.phone_mobile), "phone_mobile");
    setTextField("Email Address", application.email_address, "email_address");

    // Previous Address
    if (application.previous_addresses?.[0]) {
      const prev = application.previous_addresses[0];
      setTextField("Previous Address", getStreetAddress(prev), "previous_addresses.0.street");
      setTextField("City_4", prev.city, "previous_addresses.0.city");
      setTextField("State_4", prev.state, "previous_addresses.0.state");
      setTextField("ZIP_4", prev.zip, "previous_addresses.0.zip");
      setTextField("County_4", prev.county || "", "previous_addresses.0.county");
    }

    // Gender radio
    const gender = application.gender?.toLowerCase();
    if (gender === "male" || gender === "female") {
      try {
        const genderGroup = form.getRadioGroup("MMDDYYYY");
        genderGroup.select(gender === "male" ? "Male" : "Female");
        addReport("MMDDYYYY", gender === "male" ? "Male" : "Female", "gender", "success");
      } catch (err) {
        addReport("MMDDYYYY", gender, "gender", "failed", String(err));
      }
    }

    // Contact method checkboxes - with EXPLICIT unchecking
    const preferredMethods = (application.preferred_contact_methods || []).map((m: string) => m.toLowerCase());
    const wantsEmail = preferredMethods.includes("email");
    const wantsPhone = preferredMethods.some((m: string) => ["phone", "mobile", "home", "business"].includes(m));
    const wantsText = preferredMethods.some((m: string) => ["text", "sms"].includes(m));

    setCheckbox("Email", wantsEmail, "preferred_contact_methods.email");
    setCheckbox("Phone", wantsPhone, "preferred_contact_methods.phone");
    setCheckbox("Text", wantsText, "preferred_contact_methods.text");

    // Marketing consent checkbox (text field that acts like checkbox)
    if (application.agreements?.marketing_consent) {
      setTextField(
        "Additionally by checking here I agree to let Tyler Insurance Group send me information about",
        "X",
        "agreements.marketing_consent",
      );
    }

    // ========================================================================
    // PAGES 2-3: LEGAL QUESTIONS
    // ========================================================================

    const legalQuestions = application.legal_questions || {};

    for (const [groupName, config] of Object.entries(LEGAL_QUESTION_MAPPINGS)) {
      const question = legalQuestions[config.source];
      const answer = answerToBool(question?.answer);
      setRadioGroup(groupName, answer, config.yesOption, config.noOption, `legal_questions.${config.source}`);
    }

    // ========================================================================
    // PAGE 4: BANKING, BENEFICIARY, AML
    // ========================================================================

    setTextField("Bank Routing", application.bank_routing_number, "bank_routing_number");
    setTextField("Account", application.bank_account_number, "bank_account_number");
    setTextField("Branch Name or Location", application.bank_branch_name, "bank_branch_name");

    setTextField("List a Beneficiary", application.beneficiary_name, "beneficiary_name");
    setTextField("Relationship", application.beneficiary_relationship, "beneficiary_relationship");
    setTextField("Drivers License", application.drivers_license_number, "drivers_license_number");
    setTextField("Resident Drivers License State", application.drivers_license_state, "drivers_license_state");

    // AML
    setTextField("Course Name", application.aml_course_name || application.aml_training_provider, "aml_course_name");
    setTextField(
      "Course Date",
      formatDate(application.aml_course_date || application.aml_completion_date),
      "aml_course_date",
    );
    setTextField("Date Completed", formatDate(application.aml_completion_date), "aml_completion_date");

    // Birth location
    setTextField("State_5", application.birth_state, "birth_state");
    setTextField("City_5", application.birth_city, "birth_city");

    // Radio groups on page 4-6
    for (const [groupName, config] of Object.entries(OTHER_RADIO_MAPPINGS)) {
      const value = getNestedValue(application, config.source);
      const boolValue = answerToBool(value);
      setRadioGroup(groupName, boolValue, config.yesOption, config.noOption, config.source);
    }

    // AML Training Provider checkboxes
    const amlProvider = (application.aml_training_provider || "").toUpperCase();
    setCheckbox("LIMRA", amlProvider === "LIMRA", "aml_training_provider");
    setCheckbox("None", amlProvider === "NONE" || amlProvider === "", "aml_training_provider");
    setCheckbox(
      "Other",
      amlProvider !== "" && amlProvider !== "LIMRA" && amlProvider !== "NONE",
      "aml_training_provider",
    );

    // ========================================================================
    // PAGE 6-7: FINRA, PROFESSIONAL INFO
    // ========================================================================

    setTextField("BrokerDealer Name", application.finra_broker_dealer_name, "finra_broker_dealer_name");
    setTextField("CRD", application.finra_crd_number, "finra_crd_number");
    setTextField(
      "Nevada Accident and Health Insurance License",
      application.insurance_license_number,
      "insurance_license_number",
    );
    setTextField("Expiration Date", formatDate(application.license_expiration_date), "license_expiration_date");

    // ========================================================================
    // DUPLICATE GROUPS (DATE, INITIALS)
    // ========================================================================

    for (const [_groupName, config] of Object.entries(DUPLICATE_GROUPS)) {
      let value = getNestedValue(application, config.source);
      if ('format' in config && config.format === 'date') {
        value = formatDate(value);
      }
      for (const fieldName of config.fields) {
        setTextField(fieldName, value, config.source);
      }
    }

    // ========================================================================
    // PAGE 10: CARRIER SELECTIONS
    // ========================================================================

    const selectedCarriers = application.selected_carriers || [];
    console.log(`Processing ${selectedCarriers.length} carriers`);

    for (const carrier of selectedCarriers) {
      // Handle both naming conventions
      const carrierName = carrier.carrier_name || carrier.name || "";
      const nonResStates = carrier.non_resident_states || [];

      // Normalize carrier name for lookup
      const normalizedName = carrierName.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Find matching carrier in map
      let mapping = CARRIER_FIELD_MAP[normalizedName];

      // If no exact match, try partial matching
      if (!mapping) {
        const matchKey = Object.keys(CARRIER_FIELD_MAP).find((key) => {
          return normalizedName.includes(key) || key.includes(normalizedName);
        });
        if (matchKey) {
          mapping = CARRIER_FIELD_MAP[matchKey];
        }
      }

      if (mapping) {
        // Set checkbox (these are text fields that show 'X')
        setTextField(mapping.checkbox, "X", `selected_carriers.${carrierName}`);

        // Set non-resident states if any
        if (nonResStates.length > 0) {
          setTextField(
            mapping.nonResStates,
            nonResStates.join(", "),
            `selected_carriers.${carrierName}.non_resident_states`,
          );
        }
        console.log(`Mapped carrier: ${carrierName} -> ${mapping.checkbox}`);
      } else {
        console.warn(`No carrier mapping found for: ${carrierName} (normalized: ${normalizedName})`);
        addReport(`carrier_${normalizedName}`, carrierName, "selected_carriers", "failed", "No mapping found");
      }
    }

    // ========================================================================
    // SIGNATURES
    // ========================================================================

    const uploadedDocs = application.uploaded_documents || {};

    const embedAndDrawImage = async (
      dataUrl: string | undefined,
      pageIndex: number,
      fieldName: string,
      source: string,
    ) => {
      if (!dataUrl || !dataUrl.startsWith("data:image")) {
        addReport(fieldName, "", source, "skipped", "Not a data URL");
        return;
      }

      try {
        // Get field coordinates
        const field = form.getField(fieldName);
        const widgets = (field as any).acroField.getWidgets();
        if (!widgets || widgets.length === 0) {
          throw new Error("No widgets found for field");
        }
        const rect = widgets[0].getRectangle();

        // Decode and embed image
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        // Try PNG first, fall back to JPEG
        let image;
        try {
          image = await pdfDoc.embedPng(imageBytes);
        } catch {
          image = await pdfDoc.embedJpg(imageBytes);
        }

        // Draw on page
        const page = pages[pageIndex];
        page.drawImage(image, {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });

        addReport(fieldName, "[IMAGE]", source, "success");
      } catch (err) {
        addReport(fieldName, "[IMAGE]", source, "failed", String(err));
      }
    };

    // Background signature (Page 4 - index 3)
    await embedAndDrawImage(
      uploadedDocs.background_signature_image || uploadedDocs.background_signature,
      3,
      "all carrierspecific questions_es_:signature",
      "uploaded_documents.background_signature_image",
    );

    // Final signature (Page 10 - index 9)
    await embedAndDrawImage(
      uploadedDocs.signature_image || uploadedDocs.final_signature,
      9,
      "Additionally please sign in the center of the box below_es_:signature",
      "uploaded_documents.signature_image",
    );

    // ========================================================================
    // FLATTEN AND SAVE
    // ========================================================================

    form.flatten();
    const filledPdfBytes = await pdfDoc.save();

    // Generate filename
    const nameParts = (application.full_legal_name || "Unknown").split(" ");
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    const dateStr = (application.signature_date?.split("T")[0] || new Date().toISOString().split("T")[0]).replace(
      /-/g,
      "",
    );
    const filename = `TIG_Contracting_${lastName}_${firstName}_${dateStr}.pdf`;

    // Convert to base64
    const uint8Array = new Uint8Array(filledPdfBytes);
    let binaryString = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binaryString);

    // Summary
    const successCount = mappingReport.filter((m) => m.status === "success").length;
    const failedCount = mappingReport.filter((m) => m.status === "failed").length;
    const skippedCount = mappingReport.filter((m) => m.status === "skipped").length;

    console.log(`PDF generated: ${filename}`);
    console.log(`Mappings: ${successCount} success, ${failedCount} failed, ${skippedCount} skipped`);

    // Log failures for debugging
    const failures = mappingReport.filter((m) => m.status === "failed");
    if (failures.length > 0) {
      console.log(
        "Failed mappings:",
        failures.map((f) => `${f.pdfFieldKey}: ${f.error}`),
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        pdf: base64,
        size: filledPdfBytes.byteLength,
        mappingReport,
        summary: {
          total: mappingReport.length,
          success: successCount,
          failed: failedCount,
          skipped: skippedCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
