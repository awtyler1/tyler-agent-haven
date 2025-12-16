import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Save, RefreshCw, FileText, CheckCircle2, AlertCircle } from "lucide-react";
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
  // Personal Info
  fullName: string[];
  birthDate: string[];
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
  // Banking
  bankRouting: string[];
  bankAccount: string[];
  bankName: string[];
  beneficiaryName: string[];
  beneficiaryRelationship: string[];
  // Signatures
  initials: string[];
  signature: string[];
  signatureDate: string[];
  // Training
  amlProvider: string[];
  amlDate: string[];
  // Phone fields
  phoneMobile: string[];
  phoneBusiness: string[];
  phoneHome: string[];
  fax: string[];
  emailAddress: string[];
  custom: Record<string, string[]>;
}

const FIELD_CATEGORIES = [
  // Personal Info
  { value: "full_name", label: "Full Legal Name", section: "Personal Info" },
  { value: "birth_date", label: "Birth Date", section: "Personal Info" },
  { value: "gender_male", label: "Gender: Male", section: "Personal Info" },
  { value: "gender_female", label: "Gender: Female", section: "Personal Info" },
  
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
  { value: "agency_tax_id", label: "Agency Tax ID", section: "Identification" },
  { value: "npn", label: "NPN Number", section: "Licensing" },
  { value: "insurance_license", label: "Insurance License #", section: "Licensing" },
  { value: "license_expiration", label: "License Expiration", section: "Licensing" },
  { value: "resident_state", label: "Resident State", section: "Licensing" },
  { value: "drivers_license", label: "Driver's License #", section: "Licensing" },
  { value: "drivers_license_state", label: "Driver's License State", section: "Licensing" },
  
  // Banking
  { value: "bank_routing", label: "Routing Number", section: "Banking" },
  { value: "bank_account", label: "Account Number", section: "Banking" },
  { value: "bank_name", label: "Bank Name", section: "Banking" },
  { value: "beneficiary_name", label: "Beneficiary Name", section: "Banking" },
  { value: "beneficiary_relationship", label: "Beneficiary Relationship", section: "Banking" },
  
  // Signatures
  { value: "initials", label: "Initials Field", section: "Signatures" },
  { value: "signature", label: "Signature Field", section: "Signatures" },
  { value: "signature_date", label: "Signature Date", section: "Signatures" },
  
  // Training
  { value: "aml_provider", label: "AML Provider", section: "Training" },
  { value: "aml_date", label: "AML Completion Date", section: "Training" },
  
  // Consent
  { value: "marketing_consent", label: "Marketing Consent", section: "Consent" },
  
  // Other
  { value: "unmapped", label: "Not Mapped", section: "Other" },
];

export default function PdfFieldMapperPage() {
  const navigate = useNavigate();
  const { primaryRole, loading: roleLoading, isSuperAdmin, isAdmin } = useRole();
  const [fields, setFields] = useState<PdfField[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [savedMappings, setSavedMappings] = useState<SavedMappings | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

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
        saved.agencyTaxId?.forEach(f => newMappings[f] = "agency_tax_id");
        saved.gender?.male?.forEach(f => newMappings[f] = "gender_male");
        saved.gender?.female?.forEach(f => newMappings[f] = "gender_female");
        // Personal info
        saved.fullName?.forEach(f => newMappings[f] = "full_name");
        saved.birthDate?.forEach(f => newMappings[f] = "birth_date");
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
        // Banking
        saved.bankRouting?.forEach(f => newMappings[f] = "bank_routing");
        saved.bankAccount?.forEach(f => newMappings[f] = "bank_account");
        saved.bankName?.forEach(f => newMappings[f] = "bank_name");
        saved.beneficiaryName?.forEach(f => newMappings[f] = "beneficiary_name");
        saved.beneficiaryRelationship?.forEach(f => newMappings[f] = "beneficiary_relationship");
        // Signatures
        saved.initials?.forEach(f => newMappings[f] = "initials");
        saved.signature?.forEach(f => newMappings[f] = "signature");
        saved.signatureDate?.forEach(f => newMappings[f] = "signature_date");
        // Training
        saved.amlProvider?.forEach(f => newMappings[f] = "aml_provider");
        saved.amlDate?.forEach(f => newMappings[f] = "aml_date");
        // Contact fields
        saved.phoneMobile?.forEach(f => newMappings[f] = "phone_mobile");
        saved.phoneBusiness?.forEach(f => newMappings[f] = "phone_business");
        saved.phoneHome?.forEach(f => newMappings[f] = "phone_home");
        saved.fax?.forEach(f => newMappings[f] = "fax");
        saved.emailAddress?.forEach(f => newMappings[f] = "email_address");
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
        agencyTaxId: [],
        gender: { male: [], female: [] },
        fullName: [],
        birthDate: [],
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
        bankRouting: [],
        bankAccount: [],
        bankName: [],
        beneficiaryName: [],
        beneficiaryRelationship: [],
        initials: [],
        signature: [],
        signatureDate: [],
        amlProvider: [],
        amlDate: [],
        phoneMobile: [],
        phoneBusiness: [],
        phoneHome: [],
        fax: [],
        emailAddress: [],
        custom: {},
      };

      Object.entries(mappings).forEach(([fieldName, category]) => {
        switch (category) {
          case "contact_email": structured.contactMethods.email.push(fieldName); break;
          case "contact_phone": structured.contactMethods.phone.push(fieldName); break;
          case "contact_text": structured.contactMethods.text.push(fieldName); break;
          case "marketing_consent": structured.marketingConsent.push(fieldName); break;
          case "tax_id": structured.taxId.push(fieldName); break;
          case "agency_tax_id": structured.agencyTaxId.push(fieldName); break;
          case "gender_male": structured.gender.male.push(fieldName); break;
          case "gender_female": structured.gender.female.push(fieldName); break;
          case "full_name": structured.fullName.push(fieldName); break;
          case "birth_date": structured.birthDate.push(fieldName); break;
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
          case "bank_routing": structured.bankRouting.push(fieldName); break;
          case "bank_account": structured.bankAccount.push(fieldName); break;
          case "bank_name": structured.bankName.push(fieldName); break;
          case "beneficiary_name": structured.beneficiaryName.push(fieldName); break;
          case "beneficiary_relationship": structured.beneficiaryRelationship.push(fieldName); break;
          case "initials": structured.initials.push(fieldName); break;
          case "signature": structured.signature.push(fieldName); break;
          case "signature_date": structured.signatureDate.push(fieldName); break;
          case "aml_provider": structured.amlProvider.push(fieldName); break;
          case "aml_date": structured.amlDate.push(fieldName); break;
          case "phone_mobile": structured.phoneMobile.push(fieldName); break;
          case "phone_business": structured.phoneBusiness.push(fieldName); break;
          case "phone_home": structured.phoneHome.push(fieldName); break;
          case "fax": structured.fax.push(fieldName); break;
          case "email_address": structured.emailAddress.push(fieldName); break;
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
    return matchesSearch && matchesType;
  });

  const fieldTypes = [...new Set(fields.map(f => f.type))];

  const getMappedCount = (category: string) => {
    return Object.values(mappings).filter(m => m === category).length;
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
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-64"
                />
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
                    {filteredFields.slice(0, 100).map((field, idx) => (
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
                            <AlertCircle className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredFields.length > 100 && (
                  <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                    Showing first 100 fields. Use search to find specific fields.
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
