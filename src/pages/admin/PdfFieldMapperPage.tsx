import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Save, RefreshCw, FileText, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Skeleton } from "@/components/ui/skeleton";
import type { Json } from "@/integrations/supabase/types";

interface PdfField {
  name: string;
  type: string;
  value?: string | boolean | null;
  options?: string[];
}

interface FieldMapping {
  fieldName: string;
  mappedTo: string;
  section: string;
}

interface SavedMappings {
  contactMethods: { email: string[]; phone: string[]; text: string[] };
  marketingConsent: string[];
  taxId: string[];
  agencyName: string[];
  agencyTaxId: string[];
  gender: { male: string[]; female: string[] };
  personalNamePrincipal: string[];
  // Personal Info
  fullName: string[];
  birthDate: string[];
  birthCity: string[];
  birthState: string[];
  // Addresses
  homeAddress: { street: string[]; city: string[]; state: string[]; zip: string[]; county: string[] };
  mailingAddress: { street: string[]; city: string[]; state: string[]; zip: string[]; county: string[] };
  upsAddress: { street: string[]; city: string[]; state: string[]; zip: string[]; county: string[] };
  previousAddress: { street: string[]; city: string[]; state: string[]; zip: string[]; county: string[] };
  // Licensing
  npn: string[];
  insuranceLicense: string[];
  licenseExpiration: string[];
  residentState: string[];
  driversLicense: string[];
  driversLicenseState: string[];
  // E&O
  eoProvider: string[];
  eoPolicyNumber: string[];
  eoExpiration: string[];
  eoNotCovered: string[];
  // Banking
  bankRouting: string[];
  bankAccount: string[];
  bankName: string[];
  beneficiaryName: string[];
  beneficiaryRelationship: string[];
  beneficiaryBirthDate: string[];
  beneficiaryDriversLicense: string[];
  beneficiaryDriversLicenseState: string[];
  commissionAdvancing: string[];
  // Signatures
  initials: string[];
  initialsDate: string[];
  signature: string[];
  signatureDate: string[];
  backgroundSignature: string[];
  backgroundSignatureDate: string[];
  // Training
  amlProvider: string[];
  amlDate: string[];
  amlYes: string[];
  amlNo: string[];
  ltcCertification: string[];
  ceRequired: string[];
  // Corporation / FINRA
  isCorporation: string[];
  finraRegistered: string[];
  finraBrokerDealer: string[];
  finraCrd: string[];
  // Contact fields
  phoneMobile: string[];
  phoneBusiness: string[];
  phoneHome: string[];
  fax: string[];
  emailAddress: string[];
  // Legal Questions - simplified: each question maps to a single text field filled with "Yes" or "No"
  legalQuestions: Record<string, string[]>;
  // Carriers
  carriers: Record<string, string[]>;
  // Non-Resident States
  nonResidentStates: Record<string, string[]>;
  // Other
  ignored: string[];
  custom: Record<string, string[]>;
}

const FIELD_CATEGORIES = [
  // Personal Info
  { value: "full_name", label: "Full Legal Name", section: "Personal Info" },
  { value: "birth_date", label: "Birth Date", section: "Personal Info" },
  { value: "birth_city", label: "Birth City (Where were you born)", section: "Personal Info" },
  { value: "birth_state", label: "Birth State (Where were you born)", section: "Personal Info" },
  { value: "gender_male", label: "Gender: Male (checkbox)", section: "Personal Info" },
  { value: "gender_female", label: "Gender: Female (checkbox)", section: "Personal Info" },
  { value: "personal_name_principal", label: "Personal Name or Principal", section: "Personal Info" },
  
  // Contact Methods (checkboxes)
  { value: "contact_email", label: "Preferred: Email (checkbox)", section: "Contact Methods" },
  { value: "contact_phone", label: "Preferred: Phone (checkbox)", section: "Contact Methods" },
  { value: "contact_text", label: "Preferred: Text (checkbox)", section: "Contact Methods" },
  
  // Contact Fields (text)
  { value: "email_address", label: "Email Address", section: "Contact Fields" },
  { value: "phone_mobile", label: "Mobile Phone", section: "Contact Fields" },
  { value: "phone_business", label: "Business Phone", section: "Contact Fields" },
  { value: "phone_home", label: "Home Phone", section: "Contact Fields" },
  { value: "fax", label: "Fax", section: "Contact Fields" },
  
  // Home Address
  { value: "home_street", label: "Home: Street", section: "Home Address" },
  { value: "home_city", label: "Home: City", section: "Home Address" },
  { value: "home_state", label: "Home: State", section: "Home Address" },
  { value: "home_zip", label: "Home: ZIP", section: "Home Address" },
  { value: "home_county", label: "Home: County", section: "Home Address" },
  
  // Mailing Address
  { value: "mailing_street", label: "Mailing: Street", section: "Mailing Address" },
  { value: "mailing_city", label: "Mailing: City", section: "Mailing Address" },
  { value: "mailing_state", label: "Mailing: State", section: "Mailing Address" },
  { value: "mailing_zip", label: "Mailing: ZIP", section: "Mailing Address" },
  { value: "mailing_county", label: "Mailing: County", section: "Mailing Address" },
  
  // UPS Address
  { value: "ups_street", label: "UPS: Street", section: "UPS Address" },
  { value: "ups_city", label: "UPS: City", section: "UPS Address" },
  { value: "ups_state", label: "UPS: State", section: "UPS Address" },
  { value: "ups_zip", label: "UPS: ZIP", section: "UPS Address" },
  { value: "ups_county", label: "UPS: County", section: "UPS Address" },
  
  // Previous Address
  { value: "prev_street", label: "Previous: Street", section: "Previous Address" },
  { value: "prev_city", label: "Previous: City", section: "Previous Address" },
  { value: "prev_state", label: "Previous: State", section: "Previous Address" },
  { value: "prev_zip", label: "Previous: ZIP", section: "Previous Address" },
  { value: "prev_county", label: "Previous: County", section: "Previous Address" },
  
  // Identification & Licensing
  { value: "tax_id", label: "Tax ID (SSN)", section: "Identification" },
  { value: "agency_name", label: "Agency / Business Name", section: "Identification" },
  { value: "agency_tax_id", label: "Agency Tax ID", section: "Identification" },
  { value: "npn", label: "NPN Number", section: "Licensing" },
  { value: "insurance_license", label: "Insurance License #", section: "Licensing" },
  { value: "license_expiration", label: "License Expiration", section: "Licensing" },
  { value: "resident_state", label: "Resident State", section: "Licensing" },
  { value: "drivers_license", label: "Driver's License #", section: "Licensing" },
  { value: "drivers_license_state", label: "Driver's License State", section: "Licensing" },
  
  // E&O Insurance
  { value: "eo_provider", label: "E&O Provider", section: "E&O Insurance" },
  { value: "eo_policy_number", label: "E&O Policy Number", section: "E&O Insurance" },
  { value: "eo_expiration", label: "E&O Expiration Date", section: "E&O Insurance" },
  { value: "eo_not_covered", label: "E&O Not Yet Covered (checkbox)", section: "E&O Insurance" },
  
  // Banking
  { value: "bank_routing", label: "Routing Number", section: "Banking" },
  { value: "bank_account", label: "Account Number", section: "Banking" },
  { value: "bank_name", label: "Bank Name", section: "Banking" },
  { value: "beneficiary_name", label: "Beneficiary Name", section: "Banking" },
  { value: "beneficiary_relationship", label: "Beneficiary Relationship", section: "Banking" },
  { value: "beneficiary_birth_date", label: "Beneficiary Birth Date", section: "Banking" },
  { value: "beneficiary_drivers_license", label: "Beneficiary Driver's License", section: "Banking" },
  { value: "beneficiary_drivers_license_state", label: "Beneficiary DL State", section: "Banking" },
  { value: "commission_advancing", label: "Commission Advancing (checkbox)", section: "Banking" },
  
  // Signatures & Initials
  { value: "initials", label: "Initials Field", section: "Signatures" },
  { value: "initials_date", label: "Initials Date", section: "Signatures" },
  { value: "signature", label: "Signature Field", section: "Signatures" },
  { value: "signature_date", label: "Signature Date", section: "Signatures" },
  { value: "background_signature", label: "Background Signature (Page 3)", section: "Signatures" },
  { value: "background_signature_date", label: "Background Signature Date", section: "Signatures" },
  
  // Training
  { value: "aml_provider", label: "AML Provider", section: "Training" },
  { value: "aml_date", label: "AML Completion Date", section: "Training" },
  { value: "aml_yes", label: "AML Course: Yes (checkbox)", section: "Training" },
  { value: "aml_no", label: "AML Course: No (checkbox)", section: "Training" },
  { value: "ltc_certification", label: "LTC Certification (checkbox)", section: "Training" },
  { value: "ce_required", label: "CE Required (checkbox)", section: "Training" },
  
  // Corporation / FINRA
  { value: "is_corporation", label: "Is Corporation (checkbox)", section: "Corporation" },
  { value: "finra_registered", label: "FINRA Registered (checkbox)", section: "FINRA" },
  { value: "finra_broker_dealer", label: "FINRA Broker/Dealer Name", section: "FINRA" },
  { value: "finra_crd", label: "FINRA CRD Number", section: "FINRA" },
  
  // Consent
  { value: "marketing_consent", label: "Marketing Consent", section: "Consent" },
  
  // Legal Questions (text fields filled with "Yes" or "No")
  { value: "legal_q1", label: "Q1: Felony/Misdemeanor/Securities", section: "Legal Questions" },
  { value: "legal_q1a", label: "Q1a: Felony conviction", section: "Legal Questions" },
  { value: "legal_q1b", label: "Q1b: Misdemeanor conviction", section: "Legal Questions" },
  { value: "legal_q1c", label: "Q1c: Federal securities violation", section: "Legal Questions" },
  { value: "legal_q1d", label: "Q1d: State insurance violation", section: "Legal Questions" },
  { value: "legal_q1e", label: "Q1e: Foreign government order", section: "Legal Questions" },
  { value: "legal_q1f", label: "Q1f: Charged with felony", section: "Legal Questions" },
  { value: "legal_q1g", label: "Q1g: Charged with misdemeanor", section: "Legal Questions" },
  { value: "legal_q1h", label: "Q1h: Probation", section: "Legal Questions" },
  { value: "legal_q2", label: "Q2: Investigation/Pending charges", section: "Legal Questions" },
  { value: "legal_q2a", label: "Q2a: Criminal charges pending", section: "Legal Questions" },
  { value: "legal_q2b", label: "Q2b: Civil proceedings pending", section: "Legal Questions" },
  { value: "legal_q2c", label: "Q2c: Civil judgments", section: "Legal Questions" },
  { value: "legal_q2d", label: "Q2d: Named in lawsuit", section: "Legal Questions" },
  { value: "legal_q3", label: "Q3: Fraud allegations", section: "Legal Questions" },
  { value: "legal_q4", label: "Q4: Contract termination", section: "Legal Questions" },
  { value: "legal_q5", label: "Q5: Appointment termination", section: "Legal Questions" },
  { value: "legal_q5a", label: "Q5a: Accused of violation", section: "Legal Questions" },
  { value: "legal_q5b", label: "Q5b: Resigned due to fraud", section: "Legal Questions" },
  { value: "legal_q5c", label: "Q5c: Terminated for compliance", section: "Legal Questions" },
  { value: "legal_q6", label: "Q6: Insurance appointment terminated", section: "Legal Questions" },
  { value: "legal_q7", label: "Q7: Commission chargeback claims", section: "Legal Questions" },
  { value: "legal_q8", label: "Q8: Surety/E&O claims", section: "Legal Questions" },
  { value: "legal_q8a", label: "Q8a: Bond denied/revoked", section: "Legal Questions" },
  { value: "legal_q8b", label: "Q8b: E&O claims/cancellation", section: "Legal Questions" },
  { value: "legal_q9", label: "Q9: License denied/suspended", section: "Legal Questions" },
  { value: "legal_q10", label: "Q10: Business authorization revoked", section: "Legal Questions" },
  { value: "legal_q11", label: "Q11: License revoked/suspended", section: "Legal Questions" },
  { value: "legal_q12", label: "Q12: False statement finding", section: "Legal Questions" },
  { value: "legal_q13", label: "Q13: License lapse", section: "Legal Questions" },
  { value: "legal_q14", label: "Q14: Disciplinary action", section: "Legal Questions" },
  { value: "legal_q14a", label: "Q14a: Regulatory sanction", section: "Legal Questions" },
  { value: "legal_q14b", label: "Q14b: Professional discipline", section: "Legal Questions" },
  { value: "legal_q14c", label: "Q14c: Industry standards violation", section: "Legal Questions" },
  { value: "legal_q15", label: "Q15: Bankruptcy", section: "Legal Questions" },
  { value: "legal_q15a", label: "Q15a: Personal bankruptcy", section: "Legal Questions" },
  { value: "legal_q15b", label: "Q15b: Business bankruptcy", section: "Legal Questions" },
  { value: "legal_q15c", label: "Q15c: Firm bankruptcy", section: "Legal Questions" },
  { value: "legal_q16", label: "Q16: Judgments/Liens", section: "Legal Questions" },
  { value: "legal_q17", label: "Q17: Financial institution connection", section: "Legal Questions" },
  { value: "legal_q18", label: "Q18: Aliases", section: "Legal Questions" },
  { value: "legal_q19", label: "Q19: IRS matters", section: "Legal Questions" },
  
  // Carriers
  { value: "carrier_aetna", label: "Aetna (checkbox)", section: "Carriers" },
  { value: "carrier_anthem", label: "Anthem (checkbox)", section: "Carriers" },
  { value: "carrier_cigna", label: "Cigna (checkbox)", section: "Carriers" },
  { value: "carrier_devoted", label: "Devoted (checkbox)", section: "Carriers" },
  { value: "carrier_humana", label: "Humana (checkbox)", section: "Carriers" },
  { value: "carrier_mutual_omaha", label: "Mutual of Omaha (checkbox)", section: "Carriers" },
  { value: "carrier_uhc", label: "UnitedHealthcare (checkbox)", section: "Carriers" },
  { value: "carrier_wellcare", label: "Wellcare (checkbox)", section: "Carriers" },
  
  // Non-Resident States
  { value: "nonres_al", label: "Non-Res: Alabama", section: "Non-Resident States" },
  { value: "nonres_ak", label: "Non-Res: Alaska", section: "Non-Resident States" },
  { value: "nonres_az", label: "Non-Res: Arizona", section: "Non-Resident States" },
  { value: "nonres_ar", label: "Non-Res: Arkansas", section: "Non-Resident States" },
  { value: "nonres_ca", label: "Non-Res: California", section: "Non-Resident States" },
  { value: "nonres_co", label: "Non-Res: Colorado", section: "Non-Resident States" },
  { value: "nonres_ct", label: "Non-Res: Connecticut", section: "Non-Resident States" },
  { value: "nonres_de", label: "Non-Res: Delaware", section: "Non-Resident States" },
  { value: "nonres_fl", label: "Non-Res: Florida", section: "Non-Resident States" },
  { value: "nonres_ga", label: "Non-Res: Georgia", section: "Non-Resident States" },
  { value: "nonres_hi", label: "Non-Res: Hawaii", section: "Non-Resident States" },
  { value: "nonres_id", label: "Non-Res: Idaho", section: "Non-Resident States" },
  { value: "nonres_il", label: "Non-Res: Illinois", section: "Non-Resident States" },
  { value: "nonres_in", label: "Non-Res: Indiana", section: "Non-Resident States" },
  { value: "nonres_ia", label: "Non-Res: Iowa", section: "Non-Resident States" },
  { value: "nonres_ks", label: "Non-Res: Kansas", section: "Non-Resident States" },
  { value: "nonres_ky", label: "Non-Res: Kentucky", section: "Non-Resident States" },
  { value: "nonres_la", label: "Non-Res: Louisiana", section: "Non-Resident States" },
  { value: "nonres_me", label: "Non-Res: Maine", section: "Non-Resident States" },
  { value: "nonres_md", label: "Non-Res: Maryland", section: "Non-Resident States" },
  { value: "nonres_ma", label: "Non-Res: Massachusetts", section: "Non-Resident States" },
  { value: "nonres_mi", label: "Non-Res: Michigan", section: "Non-Resident States" },
  { value: "nonres_mn", label: "Non-Res: Minnesota", section: "Non-Resident States" },
  { value: "nonres_ms", label: "Non-Res: Mississippi", section: "Non-Resident States" },
  { value: "nonres_mo", label: "Non-Res: Missouri", section: "Non-Resident States" },
  { value: "nonres_mt", label: "Non-Res: Montana", section: "Non-Resident States" },
  { value: "nonres_ne", label: "Non-Res: Nebraska", section: "Non-Resident States" },
  { value: "nonres_nv", label: "Non-Res: Nevada", section: "Non-Resident States" },
  { value: "nonres_nh", label: "Non-Res: New Hampshire", section: "Non-Resident States" },
  { value: "nonres_nj", label: "Non-Res: New Jersey", section: "Non-Resident States" },
  { value: "nonres_nm", label: "Non-Res: New Mexico", section: "Non-Resident States" },
  { value: "nonres_ny", label: "Non-Res: New York", section: "Non-Resident States" },
  { value: "nonres_nc", label: "Non-Res: North Carolina", section: "Non-Resident States" },
  { value: "nonres_nd", label: "Non-Res: North Dakota", section: "Non-Resident States" },
  { value: "nonres_oh", label: "Non-Res: Ohio", section: "Non-Resident States" },
  { value: "nonres_ok", label: "Non-Res: Oklahoma", section: "Non-Resident States" },
  { value: "nonres_or", label: "Non-Res: Oregon", section: "Non-Resident States" },
  { value: "nonres_pa", label: "Non-Res: Pennsylvania", section: "Non-Resident States" },
  { value: "nonres_ri", label: "Non-Res: Rhode Island", section: "Non-Resident States" },
  { value: "nonres_sc", label: "Non-Res: South Carolina", section: "Non-Resident States" },
  { value: "nonres_sd", label: "Non-Res: South Dakota", section: "Non-Resident States" },
  { value: "nonres_tn", label: "Non-Res: Tennessee", section: "Non-Resident States" },
  { value: "nonres_tx", label: "Non-Res: Texas", section: "Non-Resident States" },
  { value: "nonres_ut", label: "Non-Res: Utah", section: "Non-Resident States" },
  { value: "nonres_vt", label: "Non-Res: Vermont", section: "Non-Resident States" },
  { value: "nonres_va", label: "Non-Res: Virginia", section: "Non-Resident States" },
  { value: "nonres_wa", label: "Non-Res: Washington", section: "Non-Resident States" },
  { value: "nonres_wv", label: "Non-Res: West Virginia", section: "Non-Resident States" },
  { value: "nonres_wi", label: "Non-Res: Wisconsin", section: "Non-Resident States" },
  { value: "nonres_wy", label: "Non-Res: Wyoming", section: "Non-Resident States" },
  { value: "nonres_dc", label: "Non-Res: Washington DC", section: "Non-Resident States" },
  
  // Other
  { value: "unmapped", label: "Not Mapped", section: "Other" },
  { value: "ignore", label: "Ignore This Field", section: "Other" },
];

export default function PdfFieldMapperPage() {
  const navigate = useNavigate();
  const { primaryRole, loading: roleLoading, isSuperAdmin, isAdmin } = useRole();
  const [fields, setFields] = useState<PdfField[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [savedMappings, setSavedMappings] = useState<SavedMappings | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // all, mapped, unmapped
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Check admin access
  useEffect(() => {
    if (!roleLoading && !isSuperAdmin() && !isAdmin()) {
      navigate("/");
    }
  }, [primaryRole, roleLoading, navigate, isSuperAdmin, isAdmin]);

  // Load saved mappings on mount
  useEffect(() => {
    loadSavedMappings();
  }, []);

  const loadSavedMappings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("config_value")
        .eq("config_key", "pdf_field_mappings")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading mappings:", error);
      }

      if (data?.config_value) {
        const saved = data.config_value as unknown as SavedMappings;
        setSavedMappings(saved);
        
        // Convert saved mappings to the mappings state format
        const newMappings: Record<string, string> = {};
        saved.contactMethods?.email?.forEach(f => newMappings[f] = "contact_email");
        saved.contactMethods?.phone?.forEach(f => newMappings[f] = "contact_phone");
        saved.contactMethods?.text?.forEach(f => newMappings[f] = "contact_text");
        saved.marketingConsent?.forEach(f => newMappings[f] = "marketing_consent");
        saved.taxId?.forEach(f => newMappings[f] = "tax_id");
        saved.agencyName?.forEach(f => newMappings[f] = "agency_name");
        saved.agencyTaxId?.forEach(f => newMappings[f] = "agency_tax_id");
        saved.gender?.male?.forEach(f => newMappings[f] = "gender_male");
        saved.gender?.female?.forEach(f => newMappings[f] = "gender_female");
        saved.personalNamePrincipal?.forEach(f => newMappings[f] = "personal_name_principal");
        // Personal info
        saved.fullName?.forEach(f => newMappings[f] = "full_name");
        saved.birthDate?.forEach(f => newMappings[f] = "birth_date");
        saved.birthCity?.forEach(f => newMappings[f] = "birth_city");
        saved.birthState?.forEach(f => newMappings[f] = "birth_state");
        // Addresses
        saved.homeAddress?.street?.forEach(f => newMappings[f] = "home_street");
        saved.homeAddress?.city?.forEach(f => newMappings[f] = "home_city");
        saved.homeAddress?.state?.forEach(f => newMappings[f] = "home_state");
        saved.homeAddress?.zip?.forEach(f => newMappings[f] = "home_zip");
        saved.homeAddress?.county?.forEach(f => newMappings[f] = "home_county");
        saved.mailingAddress?.street?.forEach(f => newMappings[f] = "mailing_street");
        saved.mailingAddress?.city?.forEach(f => newMappings[f] = "mailing_city");
        saved.mailingAddress?.state?.forEach(f => newMappings[f] = "mailing_state");
        saved.mailingAddress?.zip?.forEach(f => newMappings[f] = "mailing_zip");
        saved.mailingAddress?.county?.forEach(f => newMappings[f] = "mailing_county");
        saved.upsAddress?.street?.forEach(f => newMappings[f] = "ups_street");
        saved.upsAddress?.city?.forEach(f => newMappings[f] = "ups_city");
        saved.upsAddress?.state?.forEach(f => newMappings[f] = "ups_state");
        saved.upsAddress?.zip?.forEach(f => newMappings[f] = "ups_zip");
        saved.upsAddress?.county?.forEach(f => newMappings[f] = "ups_county");
        saved.previousAddress?.street?.forEach(f => newMappings[f] = "prev_street");
        saved.previousAddress?.city?.forEach(f => newMappings[f] = "prev_city");
        saved.previousAddress?.state?.forEach(f => newMappings[f] = "prev_state");
        saved.previousAddress?.zip?.forEach(f => newMappings[f] = "prev_zip");
        saved.previousAddress?.county?.forEach(f => newMappings[f] = "prev_county");
        // Licensing
        saved.npn?.forEach(f => newMappings[f] = "npn");
        saved.insuranceLicense?.forEach(f => newMappings[f] = "insurance_license");
        saved.licenseExpiration?.forEach(f => newMappings[f] = "license_expiration");
        saved.residentState?.forEach(f => newMappings[f] = "resident_state");
        saved.driversLicense?.forEach(f => newMappings[f] = "drivers_license");
        saved.driversLicenseState?.forEach(f => newMappings[f] = "drivers_license_state");
        // E&O
        saved.eoProvider?.forEach(f => newMappings[f] = "eo_provider");
        saved.eoPolicyNumber?.forEach(f => newMappings[f] = "eo_policy_number");
        saved.eoExpiration?.forEach(f => newMappings[f] = "eo_expiration");
        saved.eoNotCovered?.forEach(f => newMappings[f] = "eo_not_covered");
        // Banking
        saved.bankRouting?.forEach(f => newMappings[f] = "bank_routing");
        saved.bankAccount?.forEach(f => newMappings[f] = "bank_account");
        saved.bankName?.forEach(f => newMappings[f] = "bank_name");
        saved.beneficiaryName?.forEach(f => newMappings[f] = "beneficiary_name");
        saved.beneficiaryRelationship?.forEach(f => newMappings[f] = "beneficiary_relationship");
        saved.beneficiaryBirthDate?.forEach(f => newMappings[f] = "beneficiary_birth_date");
        saved.beneficiaryDriversLicense?.forEach(f => newMappings[f] = "beneficiary_drivers_license");
        saved.beneficiaryDriversLicenseState?.forEach(f => newMappings[f] = "beneficiary_drivers_license_state");
        saved.commissionAdvancing?.forEach(f => newMappings[f] = "commission_advancing");
        // Signatures
        saved.initials?.forEach(f => newMappings[f] = "initials");
        saved.initialsDate?.forEach(f => newMappings[f] = "initials_date");
        saved.signature?.forEach(f => newMappings[f] = "signature");
        saved.signatureDate?.forEach(f => newMappings[f] = "signature_date");
        saved.backgroundSignature?.forEach(f => newMappings[f] = "background_signature");
        saved.backgroundSignatureDate?.forEach(f => newMappings[f] = "background_signature_date");
        // Training
        saved.amlProvider?.forEach(f => newMappings[f] = "aml_provider");
        saved.amlDate?.forEach(f => newMappings[f] = "aml_date");
        saved.amlYes?.forEach(f => newMappings[f] = "aml_yes");
        saved.amlNo?.forEach(f => newMappings[f] = "aml_no");
        saved.ltcCertification?.forEach(f => newMappings[f] = "ltc_certification");
        saved.ceRequired?.forEach(f => newMappings[f] = "ce_required");
        // Corporation / FINRA
        saved.isCorporation?.forEach(f => newMappings[f] = "is_corporation");
        saved.finraRegistered?.forEach(f => newMappings[f] = "finra_registered");
        saved.finraBrokerDealer?.forEach(f => newMappings[f] = "finra_broker_dealer");
        saved.finraCrd?.forEach(f => newMappings[f] = "finra_crd");
        // Contact fields
        saved.phoneMobile?.forEach(f => newMappings[f] = "phone_mobile");
        saved.phoneBusiness?.forEach(f => newMappings[f] = "phone_business");
        saved.phoneHome?.forEach(f => newMappings[f] = "phone_home");
        saved.fax?.forEach(f => newMappings[f] = "fax");
        saved.emailAddress?.forEach(f => newMappings[f] = "email_address");
        // Legal Questions - simplified format (single text field per question)
        if (saved.legalQuestions) {
          Object.entries(saved.legalQuestions).forEach(([qNum, fieldNames]) => {
            // fieldNames is an array of PDF field names for this question
            (fieldNames as string[])?.forEach(f => newMappings[f] = `legal_q${qNum}`);
          });
        }
        // Carriers
        if (saved.carriers) {
          Object.entries(saved.carriers).forEach(([carrier, fields]) => {
            fields?.forEach(f => newMappings[f] = `carrier_${carrier}`);
          });
        }
        // Non-Resident States
        if (saved.nonResidentStates) {
          Object.entries(saved.nonResidentStates).forEach(([state, fields]) => {
            fields?.forEach(f => newMappings[f] = `nonres_${state}`);
          });
        }
        // Ignored
        saved.ignored?.forEach(f => newMappings[f] = "ignore");
        setMappings(newMappings);
      }

      // Also load extracted fields if available
      const { data: fieldsData } = await supabase
        .from("system_config")
        .select("config_value")
        .eq("config_key", "pdf_template_fields")
        .single();

      if (fieldsData?.config_value) {
        const templateFields = fieldsData.config_value as unknown as { fields: PdfField[] };
        setFields(templateFields.fields || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    
    setIsExtracting(true);
    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      
      const { data, error } = await supabase.functions.invoke("extract-pdf-fields", {
        body: { pdfBase64: base64 },
      });

      if (error) throw error;

      if (data?.fields) {
        setFields(data.fields);
        toast.success(`Extracted ${data.fields.length} fields from ${file.name}`);
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      toast.error("Failed to extract PDF fields: " + (err.message || "Unknown error"));
    } finally {
      setIsExtracting(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleMappingChange = (fieldName: string, category: string) => {
    setMappings(prev => ({
      ...prev,
      [fieldName]: category,
    }));
  };

  const saveMappings = async () => {
    setIsSaving(true);
    try {
      // Convert mappings to the structured format
      const structured: SavedMappings = {
        contactMethods: { email: [], phone: [], text: [] },
        marketingConsent: [],
        taxId: [],
        agencyName: [],
        agencyTaxId: [],
        gender: { male: [], female: [] },
        personalNamePrincipal: [],
        fullName: [],
        birthDate: [],
        birthCity: [],
        birthState: [],
        homeAddress: { street: [], city: [], state: [], zip: [], county: [] },
        mailingAddress: { street: [], city: [], state: [], zip: [], county: [] },
        upsAddress: { street: [], city: [], state: [], zip: [], county: [] },
        previousAddress: { street: [], city: [], state: [], zip: [], county: [] },
        npn: [],
        insuranceLicense: [],
        licenseExpiration: [],
        residentState: [],
        driversLicense: [],
        driversLicenseState: [],
        eoProvider: [],
        eoPolicyNumber: [],
        eoExpiration: [],
        eoNotCovered: [],
        bankRouting: [],
        bankAccount: [],
        bankName: [],
        beneficiaryName: [],
        beneficiaryRelationship: [],
        beneficiaryBirthDate: [],
        beneficiaryDriversLicense: [],
        beneficiaryDriversLicenseState: [],
        commissionAdvancing: [],
        initials: [],
        initialsDate: [],
        signature: [],
        signatureDate: [],
        backgroundSignature: [],
        backgroundSignatureDate: [],
        amlProvider: [],
        amlDate: [],
        amlYes: [],
        amlNo: [],
        ltcCertification: [],
        ceRequired: [],
        isCorporation: [],
        finraRegistered: [],
        finraBrokerDealer: [],
        finraCrd: [],
        phoneMobile: [],
        phoneBusiness: [],
        phoneHome: [],
        fax: [],
        emailAddress: [],
        legalQuestions: {},
        carriers: {},
        nonResidentStates: {},
        ignored: [],
        custom: {},
      };

      Object.entries(mappings).forEach(([fieldName, category]) => {
        // Handle legal questions dynamically - simplified format
        const legalMatch = category.match(/^legal_q(.+)$/);
        if (legalMatch) {
          const [, qNum] = legalMatch;
          if (!structured.legalQuestions[qNum]) {
            structured.legalQuestions[qNum] = [];
          }
          structured.legalQuestions[qNum].push(fieldName);
          return;
        }
        
        // Handle carriers dynamically
        const carrierMatch = category.match(/^carrier_(.+)$/);
        if (carrierMatch) {
          const [, carrier] = carrierMatch;
          if (!structured.carriers[carrier]) {
            structured.carriers[carrier] = [];
          }
          structured.carriers[carrier].push(fieldName);
          return;
        }
        
        // Handle non-resident states dynamically
        const stateMatch = category.match(/^nonres_(.+)$/);
        if (stateMatch) {
          const [, state] = stateMatch;
          if (!structured.nonResidentStates[state]) {
            structured.nonResidentStates[state] = [];
          }
          structured.nonResidentStates[state].push(fieldName);
          return;
        }
        
        switch (category) {
          case "contact_email": structured.contactMethods.email.push(fieldName); break;
          case "contact_phone": structured.contactMethods.phone.push(fieldName); break;
          case "contact_text": structured.contactMethods.text.push(fieldName); break;
          case "marketing_consent": structured.marketingConsent.push(fieldName); break;
          case "tax_id": structured.taxId.push(fieldName); break;
          case "agency_name": structured.agencyName.push(fieldName); break;
          case "agency_tax_id": structured.agencyTaxId.push(fieldName); break;
          case "gender_male": structured.gender.male.push(fieldName); break;
          case "gender_female": structured.gender.female.push(fieldName); break;
          case "personal_name_principal": structured.personalNamePrincipal.push(fieldName); break;
          case "full_name": structured.fullName.push(fieldName); break;
          case "birth_date": structured.birthDate.push(fieldName); break;
          case "birth_city": structured.birthCity.push(fieldName); break;
          case "birth_state": structured.birthState.push(fieldName); break;
          case "home_street": structured.homeAddress.street.push(fieldName); break;
          case "home_city": structured.homeAddress.city.push(fieldName); break;
          case "home_state": structured.homeAddress.state.push(fieldName); break;
          case "home_zip": structured.homeAddress.zip.push(fieldName); break;
          case "home_county": structured.homeAddress.county.push(fieldName); break;
          case "mailing_street": structured.mailingAddress.street.push(fieldName); break;
          case "mailing_city": structured.mailingAddress.city.push(fieldName); break;
          case "mailing_state": structured.mailingAddress.state.push(fieldName); break;
          case "mailing_zip": structured.mailingAddress.zip.push(fieldName); break;
          case "mailing_county": structured.mailingAddress.county.push(fieldName); break;
          case "ups_street": structured.upsAddress.street.push(fieldName); break;
          case "ups_city": structured.upsAddress.city.push(fieldName); break;
          case "ups_state": structured.upsAddress.state.push(fieldName); break;
          case "ups_zip": structured.upsAddress.zip.push(fieldName); break;
          case "ups_county": structured.upsAddress.county.push(fieldName); break;
          case "prev_street": structured.previousAddress.street.push(fieldName); break;
          case "prev_city": structured.previousAddress.city.push(fieldName); break;
          case "prev_state": structured.previousAddress.state.push(fieldName); break;
          case "prev_zip": structured.previousAddress.zip.push(fieldName); break;
          case "prev_county": structured.previousAddress.county.push(fieldName); break;
          case "npn": structured.npn.push(fieldName); break;
          case "insurance_license": structured.insuranceLicense.push(fieldName); break;
          case "license_expiration": structured.licenseExpiration.push(fieldName); break;
          case "resident_state": structured.residentState.push(fieldName); break;
          case "drivers_license": structured.driversLicense.push(fieldName); break;
          case "drivers_license_state": structured.driversLicenseState.push(fieldName); break;
          case "eo_provider": structured.eoProvider.push(fieldName); break;
          case "eo_policy_number": structured.eoPolicyNumber.push(fieldName); break;
          case "eo_expiration": structured.eoExpiration.push(fieldName); break;
          case "eo_not_covered": structured.eoNotCovered.push(fieldName); break;
          case "bank_routing": structured.bankRouting.push(fieldName); break;
          case "bank_account": structured.bankAccount.push(fieldName); break;
          case "bank_name": structured.bankName.push(fieldName); break;
          case "beneficiary_name": structured.beneficiaryName.push(fieldName); break;
          case "beneficiary_relationship": structured.beneficiaryRelationship.push(fieldName); break;
          case "beneficiary_birth_date": structured.beneficiaryBirthDate.push(fieldName); break;
          case "beneficiary_drivers_license": structured.beneficiaryDriversLicense.push(fieldName); break;
          case "beneficiary_drivers_license_state": structured.beneficiaryDriversLicenseState.push(fieldName); break;
          case "commission_advancing": structured.commissionAdvancing.push(fieldName); break;
          case "initials": structured.initials.push(fieldName); break;
          case "initials_date": structured.initialsDate.push(fieldName); break;
          case "signature": structured.signature.push(fieldName); break;
          case "signature_date": structured.signatureDate.push(fieldName); break;
          case "background_signature": structured.backgroundSignature.push(fieldName); break;
          case "background_signature_date": structured.backgroundSignatureDate.push(fieldName); break;
          case "aml_provider": structured.amlProvider.push(fieldName); break;
          case "aml_date": structured.amlDate.push(fieldName); break;
          case "aml_yes": structured.amlYes.push(fieldName); break;
          case "aml_no": structured.amlNo.push(fieldName); break;
          case "ltc_certification": structured.ltcCertification.push(fieldName); break;
          case "ce_required": structured.ceRequired.push(fieldName); break;
          case "is_corporation": structured.isCorporation.push(fieldName); break;
          case "finra_registered": structured.finraRegistered.push(fieldName); break;
          case "finra_broker_dealer": structured.finraBrokerDealer.push(fieldName); break;
          case "finra_crd": structured.finraCrd.push(fieldName); break;
          case "phone_mobile": structured.phoneMobile.push(fieldName); break;
          case "phone_business": structured.phoneBusiness.push(fieldName); break;
          case "phone_home": structured.phoneHome.push(fieldName); break;
          case "fax": structured.fax.push(fieldName); break;
          case "email_address": structured.emailAddress.push(fieldName); break;
          case "ignore": structured.ignored.push(fieldName); break;
        }
      });

      // First check if record exists
      const { data: existing } = await supabase
        .from("system_config")
        .select("id")
        .eq("config_key", "pdf_field_mappings")
        .single();

      let error;
      if (existing) {
        const result = await supabase
          .from("system_config")
          .update({
            config_value: JSON.parse(JSON.stringify(structured)),
            updated_at: new Date().toISOString(),
          })
          .eq("config_key", "pdf_field_mappings");
        error = result.error;
      } else {
        const result = await supabase
          .from("system_config")
          .insert([{
            config_key: "pdf_field_mappings",
            config_value: JSON.parse(JSON.stringify(structured)),
          }]);
        error = result.error;
      }

      if (error) throw error;

      setSavedMappings(structured);
      toast.success("Field mappings saved successfully");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Failed to save mappings: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || field.type === filterType;
    const isMapped = mappings[field.name] && mappings[field.name] !== "unmapped";
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "mapped" && isMapped) || 
      (filterStatus === "unmapped" && !isMapped);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredFields.length / itemsPerPage);
  const paginatedFields = filteredFields.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus]);

  const fieldTypes = [...new Set(fields.map(f => f.type))];

  const getMappedCount = (category: string) => {
    return Object.values(mappings).filter(m => m === category).length;
  };

  const generateTestPdf = async () => {
    setIsGeneratingTest(true);
    try {
      // Create sample test data that fills all fields
      const testApplication = {
        full_legal_name: "John Alexander Smith",
        agency_name: "Smith Insurance Agency LLC",
        agency_tax_id: "12-3456789",
        gender: Math.random() > 0.5 ? "male" : "female",
        birth_date: "1985-06-15",
        npn_number: "12345678",
        insurance_license_number: "INS-9876543",
        tax_id: "123-45-6789",
        email_address: "john.smith@testinsurance.com",
        phone_mobile: "(555) 123-4567",
        phone_business: "(555) 987-6543",
        phone_home: "(555) 111-2222",
        fax: "(555) 333-4444",
        preferred_contact_methods: ["Email", "Phone", "Text"],
        home_address: {
          street: "123 Main Street",
          city: "Louisville",
          state: "KY",
          zip: "40202",
          county: "Jefferson"
        },
        mailing_address_same_as_home: false,
        mailing_address: {
          street: "PO Box 456",
          city: "Louisville",
          state: "KY",
          zip: "40203",
          county: "Jefferson"
        },
        ups_address_same_as_home: false,
        ups_address: {
          street: "789 Business Park Dr",
          city: "Louisville",
          state: "KY",
          zip: "40204",
          county: "Jefferson"
        },
        previous_addresses: [{
          street: "456 Old Street",
          city: "Lexington",
          state: "KY",
          zip: "40511",
          county: "Fayette"
        }],
        resident_state: "KY",
        license_expiration_date: "2026-12-31",
        drivers_license_number: "DL-123456789",
        drivers_license_state: "KY",
        // Randomly assign Yes/No to legal questions for testing
        legal_questions: {
          "1": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1" },
          "1a": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1a" },
          "1b": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1b" },
          "1c": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1c" },
          "1d": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1d" },
          "1e": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1e" },
          "1f": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1f" },
          "1g": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1g" },
          "1h": { answer: Math.random() > 0.5, explanation: "Test explanation for Q1h" },
          "2": { answer: Math.random() > 0.5, explanation: "Test explanation for Q2" },
          "2a": { answer: Math.random() > 0.5, explanation: "Test explanation for Q2a" },
          "2b": { answer: Math.random() > 0.5, explanation: "Test explanation for Q2b" },
          "2c": { answer: Math.random() > 0.5, explanation: "Test explanation for Q2c" },
          "2d": { answer: Math.random() > 0.5, explanation: "Test explanation for Q2d" },
          "3": { answer: Math.random() > 0.5, explanation: "Test explanation for Q3" },
          "4": { answer: Math.random() > 0.5, explanation: "Test explanation for Q4" },
          "5": { answer: Math.random() > 0.5, explanation: "Test explanation for Q5" },
          "5a": { answer: Math.random() > 0.5, explanation: "Test explanation for Q5a" },
          "5b": { answer: Math.random() > 0.5, explanation: "Test explanation for Q5b" },
          "5c": { answer: Math.random() > 0.5, explanation: "Test explanation for Q5c" },
          "6": { answer: Math.random() > 0.5, explanation: "Test explanation for Q6" },
          "7": { answer: Math.random() > 0.5, explanation: "Test explanation for Q7" },
          "8": { answer: Math.random() > 0.5, explanation: "Test explanation for Q8" },
          "8a": { answer: Math.random() > 0.5, explanation: "Test explanation for Q8a" },
          "8b": { answer: Math.random() > 0.5, explanation: "Test explanation for Q8b" },
          "9": { answer: Math.random() > 0.5, explanation: "Test explanation for Q9" },
          "10": { answer: Math.random() > 0.5, explanation: "Test explanation for Q10" },
          "11": { answer: Math.random() > 0.5, explanation: "Test explanation for Q11" },
          "12": { answer: Math.random() > 0.5, explanation: "Test explanation for Q12" },
          "13": { answer: Math.random() > 0.5, explanation: "Test explanation for Q13" },
          "14": { answer: Math.random() > 0.5, explanation: "Test explanation for Q14" },
          "14a": { answer: Math.random() > 0.5, explanation: "Test explanation for Q14a" },
          "14b": { answer: Math.random() > 0.5, explanation: "Test explanation for Q14b" },
          "14c": { answer: Math.random() > 0.5, explanation: "Test explanation for Q14c" },
          "15": { answer: Math.random() > 0.5, explanation: "Test explanation for Q15" },
          "15a": { answer: Math.random() > 0.5, explanation: "Test explanation for Q15a" },
          "15b": { answer: Math.random() > 0.5, explanation: "Test explanation for Q15b" },
          "15c": { answer: Math.random() > 0.5, explanation: "Test explanation for Q15c" },
          "16": { answer: Math.random() > 0.5, explanation: "Test explanation for Q16" },
          "17": { answer: Math.random() > 0.5, explanation: "Test explanation for Q17" },
          "18": { answer: Math.random() > 0.5, explanation: "Test explanation for Q18" },
          "19": { answer: Math.random() > 0.5, explanation: "Test explanation for Q19" },
        },
        bank_routing_number: "123456789",
        bank_account_number: "9876543210",
        bank_branch_name: "Chase Bank - Main Street",
        beneficiary_name: "Jane Smith",
        beneficiary_relationship: "Spouse",
        beneficiary_birth_date: "1987-03-20",
        beneficiary_drivers_license_number: "DL-987654321",
        beneficiary_drivers_license_state: "KY",
        requesting_commission_advancing: true,
        aml_training_provider: "LIMRA",
        aml_completion_date: "2024-09-15",
        has_ltc_certification: true,
        state_requires_ce: false,
        is_finra_registered: true,
        finra_broker_dealer_name: "Smith Financial Services",
        finra_crd_number: "1234567",
        selected_carriers: [
          { carrier_id: "1", carrier_name: "Humana", non_resident_states: ["TN", "OH"] },
          { carrier_id: "2", carrier_name: "Aetna Medicare Advantage", non_resident_states: ["IN"] },
          { carrier_id: "3", carrier_name: "UnitedHealthcare", non_resident_states: [] },
          { carrier_id: "4", carrier_name: "WellCare", non_resident_states: ["TN"] },
          { carrier_id: "5", carrier_name: "Devoted Health", non_resident_states: [] },
        ],
        is_corporation: false,
        agreements: {
          marketing_consent: true,
          terms_accepted: true,
        },
        signature_name: "John Alexander Smith",
        signature_initials: "JAS",
        signature_date: new Date().toISOString(),
        uploaded_documents: {},
      };

      // Load template from the app's public folder and send as base64 (avoids server-side fetch issues)
      let templateBase64: string | undefined;
      try {
        const templateResponse = await fetch('/templates/TIG_Contracting_Packet_Template.pdf');
        if (templateResponse.ok) {
          const templateBlob = await templateResponse.blob();
          templateBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(templateBlob);
          });
        }
      } catch (e) {
        console.log('Could not load PDF template for test generation, will use fallback:', e);
      }

      const { data, error } = await supabase.functions.invoke('generate-contracting-pdf', {
        body: { 
          application: testApplication,
          saveToStorage: false,
          templateBase64,
        }
      });

      if (error) throw error;

      if (data?.pdf) {
        // Download the PDF
        const binaryString = atob(data.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Test_PDF_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Test PDF generated and downloaded!");
      } else {
        throw new Error("No PDF data returned");
      }
    } catch (err: any) {
      console.error("Test PDF error:", err);
      toast.error("Failed to generate test PDF: " + (err.message || "Unknown error"));
    } finally {
      setIsGeneratingTest(false);
    }
  };

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">PDF Field Mapper</h1>
              <p className="text-muted-foreground">Map PDF form fields to application data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
              disabled={isExtracting}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("pdf-upload")?.click()}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload PDF Template
            </Button>
            <Button onClick={saveMappings} disabled={isSaving || Object.keys(mappings).length === 0}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Mappings
            </Button>
            <Button 
              variant="secondary" 
              onClick={generateTestPdf} 
              disabled={isGeneratingTest}
            >
              {isGeneratingTest ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate Test PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fields.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Checkboxes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fields.filter(f => f.type === "PDFCheckBox").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Text Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fields.filter(f => f.type === "PDFTextField").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mapped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Object.keys(mappings).filter(k => mappings[k] !== "unmapped").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mapping Summary */}
        {Object.keys(mappings).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Mappings</CardTitle>
              <CardDescription>Fields mapped to application data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FIELD_CATEGORIES.filter(c => c.value !== "unmapped").map(category => {
                  const count = getMappedCount(category.value);
                  if (count === 0) return null;
                  return (
                    <Badge key={category.value} variant="secondary" className="px-3 py-1">
                      {category.label}: {count}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fields Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">PDF Form Fields</CardTitle>
                <CardDescription>
                  {fields.length === 0
                    ? "Click 'Extract Fields' to load fields from the PDF template"
                    : `Showing ${filteredFields.length} of ${fields.length} fields`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unmapped">Unmapped Only</SelectItem>
                    <SelectItem value="mapped">Mapped Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {fieldTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace("PDF", "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No fields extracted yet</p>
                <p className="text-sm mt-1">Upload your PDF template to extract form fields</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Field Name</th>
                        <th className="text-left p-3 font-medium w-32">Type</th>
                        <th className="text-left p-3 font-medium w-64">Map To</th>
                        <th className="text-left p-3 font-medium w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedFields.map((field, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="p-3">
                            <code className="text-sm bg-muted px-2 py-0.5 rounded">
                              {field.name}
                            </code>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {field.type.replace("PDF", "")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Select
                              value={mappings[field.name] || "unmapped"}
                              onValueChange={val => handleMappingChange(field.name, val)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_CATEGORIES.map(cat => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            {mappings[field.name] && mappings[field.name] !== "unmapped" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-muted-foreground/50" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({filteredFields.length} fields)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
