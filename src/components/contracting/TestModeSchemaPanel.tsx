import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Database, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ContractingApplication } from '@/types/contracting';

interface FieldSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  description?: string;
}

interface SchemaSection {
  name: string;
  fields: FieldSchema[];
}

// Define the complete schema structure
const FORM_SCHEMA: SchemaSection[] = [
  {
    name: 'Personal Information',
    fields: [
      { name: 'full_legal_name', type: 'string', nullable: true, description: 'Full legal name of applicant' },
      { name: 'gender', type: 'string', nullable: true, description: '"Male" or "Female"' },
      { name: 'birth_date', type: 'string (YYYY-MM-DD)', nullable: true, description: 'Date of birth' },
      { name: 'birth_city', type: 'string', nullable: true, description: 'City of birth' },
      { name: 'birth_state', type: 'string', nullable: true, description: 'State of birth (2-letter code)' },
      { name: 'email_address', type: 'string', nullable: true, description: 'Email address' },
      { name: 'phone_mobile', type: 'string', nullable: true, description: 'Mobile phone number' },
      { name: 'phone_business', type: 'string', nullable: true, description: 'Business phone number' },
      { name: 'phone_home', type: 'string', nullable: true, description: 'Home phone number' },
      { name: 'fax', type: 'string', nullable: true, description: 'Fax number' },
      { name: 'preferred_contact_methods', type: 'string[]', nullable: false, defaultValue: '[]', description: 'Array of contact method preferences' },
    ],
  },
  {
    name: 'Addresses',
    fields: [
      { name: 'home_address', type: 'Address', nullable: false, description: '{ street, city, state, zip, county }' },
      { name: 'mailing_address_same_as_home', type: 'boolean', nullable: false, defaultValue: 'true' },
      { name: 'mailing_address', type: 'Address', nullable: false, description: '{ street, city, state, zip, county }' },
      { name: 'ups_address_same_as_home', type: 'boolean', nullable: false, defaultValue: 'true' },
      { name: 'ups_address', type: 'Address', nullable: false, description: '{ street, city, state, zip, county }' },
      { name: 'previous_addresses', type: 'Address[]', nullable: false, defaultValue: '[]', description: 'Array of previous addresses' },
    ],
  },
  {
    name: 'Licensing & Identification',
    fields: [
      { name: 'agency_name', type: 'string', nullable: true, description: 'Agency/Business name' },
      { name: 'agency_tax_id', type: 'string', nullable: true, description: 'Agency Tax ID' },
      { name: 'npn_number', type: 'string', nullable: true, description: 'National Producer Number' },
      { name: 'insurance_license_number', type: 'string', nullable: true, description: 'Insurance license number' },
      { name: 'tax_id', type: 'string', nullable: true, description: 'SSN or Tax ID (9 digits)' },
      { name: 'resident_license_number', type: 'string', nullable: true, description: 'Resident license number' },
      { name: 'resident_state', type: 'string', nullable: true, description: 'Resident state (2-letter code)' },
      { name: 'license_expiration_date', type: 'string (YYYY-MM-DD)', nullable: true, description: 'License expiration date' },
      { name: 'non_resident_states', type: 'string[]', nullable: false, defaultValue: '[]', description: 'Array of non-resident state codes' },
      { name: 'drivers_license_number', type: 'string', nullable: true, description: "Driver's license number" },
      { name: 'drivers_license_state', type: 'string', nullable: true, description: "Driver's license state" },
    ],
  },
  {
    name: 'Legal Questions',
    fields: [
      { name: 'legal_questions', type: 'Record<string, LegalQuestion>', nullable: false, defaultValue: '{}', description: '{ [questionId]: { answer: boolean | null, explanation?: string } }' },
      { name: 'disciplinary_entries', type: 'DisciplinaryEntries', nullable: false, defaultValue: '{}', description: '{ entry1?: {...}, entry2?: {...}, entry3?: {...} }' },
    ],
  },
  {
    name: 'Banking & Direct Deposit',
    fields: [
      { name: 'bank_routing_number', type: 'string', nullable: true, description: '9-digit routing number' },
      { name: 'bank_account_number', type: 'string', nullable: true, description: 'Account number' },
      { name: 'bank_branch_name', type: 'string', nullable: true, description: 'Bank/branch name' },
      { name: 'beneficiary_name', type: 'string', nullable: true, description: 'Beneficiary full name' },
      { name: 'beneficiary_relationship', type: 'string', nullable: true, description: 'Relationship to applicant' },
      { name: 'beneficiary_birth_date', type: 'string (YYYY-MM-DD)', nullable: true, description: 'Beneficiary date of birth' },
      { name: 'requesting_commission_advancing', type: 'boolean', nullable: false, defaultValue: 'false', description: 'Request commission advancing?' },
    ],
  },
  {
    name: 'Training & Certifications',
    fields: [
      { name: 'has_aml_course', type: 'boolean', nullable: true, description: 'Completed AML course in past 2 years?' },
      { name: 'aml_course_name', type: 'string', nullable: true, description: 'AML course name (if yes)' },
      { name: 'aml_course_date', type: 'string (YYYY-MM-DD)', nullable: true, description: 'AML course date (if yes)' },
      { name: 'aml_training_provider', type: 'string', nullable: true, description: 'AML training provider' },
      { name: 'aml_completion_date', type: 'string (YYYY-MM-DD)', nullable: true, description: 'AML completion date' },
      { name: 'has_ltc_certification', type: 'boolean', nullable: false, defaultValue: 'false', description: 'Has LTC certification?' },
      { name: 'state_requires_ce', type: 'boolean', nullable: false, defaultValue: 'false', description: 'State requires CE?' },
      { name: 'eo_not_yet_covered', type: 'boolean', nullable: false, defaultValue: 'false', description: 'Not yet E&O covered?' },
      { name: 'eo_provider', type: 'string', nullable: true, description: 'E&O provider name' },
      { name: 'eo_policy_number', type: 'string', nullable: true, description: 'E&O policy number' },
      { name: 'eo_expiration_date', type: 'string', nullable: true, description: 'E&O expiration date' },
      { name: 'is_finra_registered', type: 'boolean', nullable: false, defaultValue: 'false', description: 'FINRA registered?' },
      { name: 'finra_broker_dealer_name', type: 'string', nullable: true, description: 'FINRA broker/dealer name' },
      { name: 'finra_crd_number', type: 'string', nullable: true, description: 'FINRA CRD number' },
    ],
  },
  {
    name: 'Carrier Selection',
    fields: [
      { name: 'selected_carriers', type: 'SelectedCarrier[]', nullable: false, defaultValue: '[]', description: '{ carrier_id, carrier_name, non_resident_states[] }' },
      { name: 'is_corporation', type: 'boolean', nullable: false, defaultValue: 'false', description: 'Operating as corporation?' },
    ],
  },
  {
    name: 'Agreements & Signature',
    fields: [
      { name: 'agreements', type: 'Record<string, boolean>', nullable: false, defaultValue: '{}', description: 'Agreement checkboxes by ID' },
      { name: 'signature_name', type: 'string', nullable: true, description: 'Typed signature name' },
      { name: 'signature_initials', type: 'string', nullable: true, description: 'Typed initials (e.g., "JD")' },
      { name: 'signature_date', type: 'string (ISO)', nullable: true, description: 'Signature timestamp' },
      { name: 'section_acknowledgments', type: 'Record<string, Acknowledgment>', nullable: false, defaultValue: '{}', description: '{ [sectionId]: { acknowledged, acknowledgedAt, initials? } }' },
    ],
  },
  {
    name: 'Uploaded Documents',
    fields: [
      { name: 'uploaded_documents.insurance_license', type: 'string (storage path)', nullable: true, description: 'Insurance license document' },
      { name: 'uploaded_documents.voided_check', type: 'string (storage path)', nullable: true, description: 'Voided check or bank letter' },
      { name: 'uploaded_documents.aml_certificate', type: 'string (storage path)', nullable: true, description: 'AML certificate' },
      { name: 'uploaded_documents.ce_certificate', type: 'string (storage path)', nullable: true, description: 'CE certificate' },
      { name: 'uploaded_documents.ltc_certificate', type: 'string (storage path)', nullable: true, description: 'LTC certificate' },
      { name: 'uploaded_documents.eo_certificate', type: 'string (storage path)', nullable: true, description: 'E&O certificate' },
      { name: 'uploaded_documents.corporate_resolution', type: 'string (storage path)', nullable: true, description: 'Corporate resolution' },
      { name: 'uploaded_documents.background_documents', type: 'string (storage path)', nullable: true, description: 'Background explanation docs' },
      { name: 'uploaded_documents.initials_image', type: 'string (base64)', nullable: true, description: 'Drawn initials as image' },
      { name: 'uploaded_documents.signature_image', type: 'string (base64)', nullable: true, description: 'Final drawn signature' },
      { name: 'uploaded_documents.background_signature_image', type: 'string (base64)', nullable: true, description: 'Background section signature' },
      { name: 'uploaded_documents.contracting_packet', type: 'string (storage path)', nullable: true, description: 'Generated PDF path' },
    ],
  },
  {
    name: 'System Fields',
    fields: [
      { name: 'id', type: 'uuid', nullable: false, description: 'Application ID' },
      { name: 'user_id', type: 'uuid', nullable: false, description: 'Owner user ID' },
      { name: 'status', type: 'enum', nullable: false, defaultValue: 'in_progress', description: '"in_progress" | "submitted" | "approved" | "rejected"' },
      { name: 'current_step', type: 'number', nullable: false, defaultValue: '1', description: 'Current wizard step (legacy)' },
      { name: 'completed_steps', type: 'number[]', nullable: false, defaultValue: '[]', description: 'Completed step IDs (legacy)' },
      { name: 'created_at', type: 'string (ISO)', nullable: false, description: 'Creation timestamp' },
      { name: 'updated_at', type: 'string (ISO)', nullable: false, description: 'Last update timestamp' },
      { name: 'submitted_at', type: 'string (ISO)', nullable: true, description: 'Submission timestamp' },
    ],
  },
];

interface TestModeSchemaPanelProps {
  application: ContractingApplication;
}

export function TestModeSchemaPanel({ application }: TestModeSchemaPanelProps) {
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    FORM_SCHEMA.forEach(section => {
      allExpanded[section.name] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  // Get current value for a field
  const getCurrentValue = (fieldName: string): unknown => {
    const parts = fieldName.split('.');
    let value: unknown = application;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return value;
  };

  // Format current value for display
  const formatCurrentValue = (value: unknown): string => {
    if (value === null || value === undefined) return '(null)';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string') {
      if (value.startsWith('data:image')) return '(base64 image)';
      if (value.length > 50) return value.substring(0, 50) + '...';
      return `"${value}"`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return `[${value.length} items]`;
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      return `{${keys.length} keys}`;
    }
    return String(value);
  };

  // Check if value is populated
  const isPopulated = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  };

  // Generate text export
  const generateSchemaText = () => {
    const lines = [
      '=== FORM SCHEMA & DATA STRUCTURE ===',
      `Total Sections: ${FORM_SCHEMA.length}`,
      `Total Fields: ${FORM_SCHEMA.reduce((sum, s) => sum + s.fields.length, 0)}`,
      '',
    ];

    FORM_SCHEMA.forEach(section => {
      lines.push(`--- ${section.name.toUpperCase()} ---`);
      section.fields.forEach(field => {
        const currentValue = getCurrentValue(field.name);
        lines.push(`  ${field.name}`);
        lines.push(`    Type: ${field.type}`);
        lines.push(`    Nullable: ${field.nullable}`);
        if (field.defaultValue) lines.push(`    Default: ${field.defaultValue}`);
        if (field.description) lines.push(`    Description: ${field.description}`);
        lines.push(`    Current Value: ${formatCurrentValue(currentValue)}`);
        lines.push('');
      });
    });

    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateSchemaText());
      setCopied(true);
      toast.success('Schema copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const totalFields = FORM_SCHEMA.reduce((sum, s) => sum + s.fields.length, 0);
  const populatedCount = FORM_SCHEMA.reduce((sum, section) => {
    return sum + section.fields.filter(f => isPopulated(getCurrentValue(f.name))).length;
  }, 0);

  return (
    <Card className="border-blue-300 bg-blue-50/50">
      <div className="p-4 border-b border-blue-200 bg-blue-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-700" />
            <h3 className="font-semibold text-blue-900">Form Schema & Data Structure</h3>
            <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-100">
              Test Mode
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="text-xs text-blue-700 hover:bg-blue-100"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="text-xs text-blue-700 hover:bg-blue-100"
            >
              Collapse All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="border-blue-400 text-blue-700 hover:bg-blue-100"
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-blue-700">
          <span>{FORM_SCHEMA.length} sections</span>
          <span>•</span>
          <span>{totalFields} fields</span>
          <span>•</span>
          <span className="font-medium">{populatedCount} populated</span>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4 space-y-2">
          {FORM_SCHEMA.map(section => (
            <Collapsible
              key={section.name}
              open={expandedSections[section.name]}
              onOpenChange={() => toggleSection(section.name)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-100/50 hover:bg-blue-100 transition-colors">
                  {expandedSections[section.name] ? (
                    <ChevronDown className="h-4 w-4 text-blue-700" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-blue-700" />
                  )}
                  <span className="font-medium text-blue-900">{section.name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {section.fields.filter(f => isPopulated(getCurrentValue(f.name))).length}/{section.fields.length}
                  </Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-2 space-y-1">
                  {section.fields.map(field => {
                    const currentValue = getCurrentValue(field.name);
                    const populated = isPopulated(currentValue);
                    return (
                      <div
                        key={field.name}
                        className={`grid grid-cols-[1fr_auto_1fr] gap-2 p-2 rounded text-xs border ${
                          populated
                            ? 'bg-green-50/50 border-green-200'
                            : 'bg-background border-border'
                        }`}
                      >
                        <div>
                          <div className="font-mono font-medium text-foreground">{field.name}</div>
                          <div className="text-muted-foreground mt-0.5">
                            <span className="text-blue-600">{field.type}</span>
                            {field.nullable && <span className="text-amber-600 ml-1">?</span>}
                            {field.defaultValue && (
                              <span className="text-muted-foreground ml-1">= {field.defaultValue}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-muted-foreground">→</span>
                        </div>
                        <div className="font-mono text-right">
                          <div className={populated ? 'text-green-700' : 'text-muted-foreground'}>
                            {formatCurrentValue(currentValue)}
                          </div>
                          {field.description && (
                            <div className="text-muted-foreground/70 mt-0.5 text-[10px]">
                              {field.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-blue-200 bg-blue-100/30 text-xs text-blue-700 text-center">
        ContractingApplication interface • {populatedCount}/{totalFields} fields populated
      </div>
    </Card>
  );
}
