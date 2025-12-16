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
  custom: Record<string, string[]>;
}

const FIELD_CATEGORIES = [
  { value: "contact_email", label: "Contact Method: Email", section: "Contact Methods" },
  { value: "contact_phone", label: "Contact Method: Phone", section: "Contact Methods" },
  { value: "contact_text", label: "Contact Method: Text", section: "Contact Methods" },
  { value: "marketing_consent", label: "Marketing Consent", section: "Consent" },
  { value: "tax_id", label: "Tax ID (SSN)", section: "Identification" },
  { value: "agency_tax_id", label: "Agency Tax ID", section: "Identification" },
  { value: "gender_male", label: "Gender: Male", section: "Personal Info" },
  { value: "gender_female", label: "Gender: Female", section: "Personal Info" },
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
        custom: {},
      };

      Object.entries(mappings).forEach(([fieldName, category]) => {
        switch (category) {
          case "contact_email":
            structured.contactMethods.email.push(fieldName);
            break;
          case "contact_phone":
            structured.contactMethods.phone.push(fieldName);
            break;
          case "contact_text":
            structured.contactMethods.text.push(fieldName);
            break;
          case "marketing_consent":
            structured.marketingConsent.push(fieldName);
            break;
          case "tax_id":
            structured.taxId.push(fieldName);
            break;
          case "agency_tax_id":
            structured.agencyTaxId.push(fieldName);
            break;
          case "gender_male":
            structured.gender.male.push(fieldName);
            break;
          case "gender_female":
            structured.gender.female.push(fieldName);
            break;
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
