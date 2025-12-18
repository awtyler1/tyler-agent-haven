import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileCode, Database, GitBranch, Server, FileText, Folder, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Import raw file contents at build time
const fileContents: Record<string, string> = import.meta.glob(
  [
    '/src/types/contracting.ts',
    '/src/hooks/useContractingPdf.ts',
    '/src/hooks/useContractingApplication.ts',
    '/src/components/contracting/ContractingForm.tsx',
    '/src/integrations/supabase/types.ts',
    '/supabase/functions/generate-contracting-pdf/index.ts'
  ],
  { as: 'raw', eager: true }
);

export function DevOpsDocumentation() {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (path: string, filename: string) => {
    setDownloading(path);
    try {
      // Try to get content from imported files
      const fullPath = '/' + path;
      let content = fileContents[fullPath];
      
      if (!content) {
        // Try alternative path formats
        const altPaths = [
          fullPath,
          path,
          `./${path}`,
          `/${path}`
        ];
        
        for (const p of altPaths) {
          if (fileContents[p]) {
            content = fileContents[p];
            break;
          }
        }
      }

      if (!content) {
        toast.error(`Could not load file: ${filename}`);
        return;
      }

      // Create blob and trigger download
      const blob = new Blob([content], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    const files = [
      { path: 'supabase/functions/generate-contracting-pdf/index.ts', name: 'generate-contracting-pdf.ts' },
      { path: 'src/types/contracting.ts', name: 'contracting.ts' },
      { path: 'src/hooks/useContractingPdf.ts', name: 'useContractingPdf.ts' },
      { path: 'src/hooks/useContractingApplication.ts', name: 'useContractingApplication.ts' },
      { path: 'src/components/contracting/ContractingForm.tsx', name: 'ContractingForm.tsx' },
    ];

    for (const file of files) {
      await handleDownload(file.path, file.name);
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between downloads
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur border-slate-200/60 shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Server className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">DevOps Documentation</CardTitle>
                  <p className="text-sm text-slate-500">PDF Generation System Architecture</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Code Files Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-800">1. Code Files</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadAll}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download All
                </Button>
              </div>
              
              <div className="space-y-3 pl-6">
                <FileEntry 
                  title="PDF Generation Edge Function"
                  path="supabase/functions/generate-contracting-pdf/index.ts"
                  filename="generate-contracting-pdf.ts"
                  description="Main PDF generation function (~1700 lines). Handles field mapping, signature embedding, checkbox/radio logic, and PDF flattening."
                  badge="Edge Function"
                  badgeColor="purple"
                  onDownload={handleDownload}
                  downloading={downloading}
                />
                
                <FileEntry 
                  title="Form Data Types"
                  path="src/types/contracting.ts"
                  filename="contracting.ts"
                  description="TypeScript interfaces for ContractingApplication, form sections, and validation schemas."
                  badge="Types"
                  badgeColor="blue"
                  onDownload={handleDownload}
                  downloading={downloading}
                />
                
                <FileEntry 
                  title="Contracting Hook"
                  path="src/hooks/useContractingPdf.ts"
                  filename="useContractingPdf.ts"
                  description="React hook for PDF generation. Validates application, loads PDF template, calls edge function, handles downloads."
                  badge="Hook"
                  badgeColor="green"
                  onDownload={handleDownload}
                  downloading={downloading}
                />
                
                <FileEntry 
                  title="Contracting Application Hook"
                  path="src/hooks/useContractingApplication.ts"
                  filename="useContractingApplication.ts"
                  description="Manages contracting application state, auto-save, and database sync."
                  badge="Hook"
                  badgeColor="green"
                  onDownload={handleDownload}
                  downloading={downloading}
                />
                
                <FileEntry 
                  title="Contracting Form Component"
                  path="src/components/contracting/ContractingForm.tsx"
                  filename="ContractingForm.tsx"
                  description="Main form UI component. Orchestrates all sections, validation, and submission."
                  badge="Component"
                  badgeColor="orange"
                  onDownload={handleDownload}
                  downloading={downloading}
                />
                
                <FileEntry 
                  title="Database Types (Auto-generated)"
                  path="src/integrations/supabase/types.ts"
                  filename="supabase-types.ts"
                  description="Auto-generated Supabase types including contracting_applications table schema."
                  badge="Read-only"
                  badgeColor="gray"
                  onDownload={handleDownload}
                  downloading={downloading}
                />
              </div>
            </section>

            {/* Utility Functions Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-slate-800">Key Utility Functions (in Edge Function)</h3>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 font-mono text-sm">
                <FunctionEntry 
                  name="setDeterministicCheckbox"
                  description="Sets checkbox fields with explicit ON/OFF values. Handles paired checkboxes (Yes_42/No_42)."
                />
                <FunctionEntry 
                  name="decodeBase64Image"
                  description="Decodes base64 signature images for PDF embedding."
                />
                <FunctionEntry 
                  name="embedInitialsOnPage"
                  description="Embeds drawn initials image at specific coordinates per page."
                />
                <FunctionEntry 
                  name="formatDateForPdf"
                  description="Converts dates from YYYY-MM-DD to MM/DD/YYYY format for PDF fields."
                />
              </div>
            </section>

            {/* Architecture Overview Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Folder className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-slate-800">2. Architecture Overview</h3>
              </div>
              
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg p-4 space-y-4">
                <ArchitectureItem 
                  question="How does the frontend send data to PDF generation?"
                  answer="useContractingPdf hook loads PDF template from /templates/, converts to base64, then calls supabase.functions.invoke('generate-contracting-pdf') with application data + template base64."
                />
                
                <ArchitectureItem 
                  question="Is this a Supabase Edge Function? React component? Both?"
                  answer="Both. React components collect form data, useContractingPdf hook handles client-side orchestration, and the Supabase Edge Function (generate-contracting-pdf) does the actual PDF manipulation using pdf-lib."
                />
                
                <ArchitectureItem 
                  question="Where is the PDF template stored?"
                  answer="/public/templates/TIG_Contracting_Packet_SIGNATURES_FIXED.pdf - This is the Pinnacle PDF template with 331+ form fields including signature widgets."
                />
                
                <ArchitectureItem 
                  question="Where do generated PDFs go?"
                  answer="Supabase Storage bucket: contracting-documents/{userId}/contracting_packet/. Path is stored in contracting_applications.uploaded_documents.contracting_packet field."
                />
              </div>
            </section>

            {/* Data Flow Diagram */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">Data Flow</h3>
              </div>
              
              <div className="bg-indigo-50/50 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <FlowStep step="1" label="ContractingForm" />
                  <Arrow />
                  <FlowStep step="2" label="useContractingPdf" />
                  <Arrow />
                  <FlowStep step="3" label="Load PDF Template" />
                  <Arrow />
                  <FlowStep step="4" label="Edge Function" />
                  <Arrow />
                  <FlowStep step="5" label="pdf-lib Processing" />
                  <Arrow />
                  <FlowStep step="6" label="Supabase Storage" />
                </div>
              </div>
            </section>

            {/* Database Schema Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-slate-800">3. Database Schema</h3>
              </div>
              
              <div className="bg-emerald-50/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-700 mb-2">contracting_applications table</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
                  <SchemaField name="id" type="uuid" pk />
                  <SchemaField name="user_id" type="uuid" fk />
                  <SchemaField name="status" type="text" note="in_progress | submitted | approved | rejected" />
                  <SchemaField name="current_step" type="integer" />
                  <SchemaField name="completed_steps" type="integer[]" />
                  <SchemaField name="full_legal_name" type="text" />
                  <SchemaField name="birth_date" type="date" />
                  <SchemaField name="birth_city" type="text" />
                  <SchemaField name="birth_state" type="text" />
                  <SchemaField name="gender" type="text" />
                  <SchemaField name="email_address" type="text" />
                  <SchemaField name="home_address" type="jsonb" note="street, city, state, zip" />
                  <SchemaField name="mailing_address" type="jsonb" />
                  <SchemaField name="tax_id" type="text" note="SSN (encrypted)" />
                  <SchemaField name="npn_number" type="text" />
                  <SchemaField name="insurance_license_number" type="text" />
                  <SchemaField name="resident_state" type="text" />
                  <SchemaField name="legal_questions" type="jsonb" note="42 yes/no answers" />
                  <SchemaField name="disciplinary_entries" type="jsonb" note="entry1, entry2, entry3" />
                  <SchemaField name="selected_carriers" type="jsonb" note="carrier codes + states" />
                  <SchemaField name="has_aml_course" type="boolean" />
                  <SchemaField name="aml_course_name" type="text" />
                  <SchemaField name="aml_course_date" type="date" />
                  <SchemaField name="is_finra_registered" type="boolean" />
                  <SchemaField name="bank_routing_number" type="text" />
                  <SchemaField name="bank_account_number" type="text" />
                  <SchemaField name="requesting_commission_advancing" type="boolean" />
                  <SchemaField name="signature_name" type="text" />
                  <SchemaField name="signature_date" type="timestamp" />
                  <SchemaField name="uploaded_documents" type="jsonb" note="signature_image, initials_image, etc." />
                  <SchemaField name="section_acknowledgments" type="jsonb" />
                  <SchemaField name="created_at" type="timestamp" />
                  <SchemaField name="updated_at" type="timestamp" />
                </div>
              </div>
            </section>

            {/* Key Field Mappings */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-rose-600" />
                <h3 className="font-semibold text-slate-800">Critical PDF Field Mappings</h3>
              </div>
              
              <div className="bg-rose-50/50 rounded-lg p-4 space-y-2 text-sm">
                <MappingEntry form="signature_name" pdf="Signature2_es_:signer" note="Typed name (text field)" />
                <MappingEntry form="uploaded_documents.signature_image" pdf="Additionally please sign...es_:signature" note="Handwritten signature (image)" />
                <MappingEntry form="uploaded_documents.background_signature_image" pdf="all carrierspecific questions_es_:signature" note="Background signature (image)" />
                <MappingEntry form="requesting_commission_advancing" pdf="Yes_42 / No_42" note="Radio group" />
                <MappingEntry form="has_aml_course" pdf="Yes_43 / No_43" note="Radio group" />
                <MappingEntry form="is_finra_registered" pdf="Yes_47 / No_47" note="Radio group" />
                <MappingEntry form="birth_city" pdf="City_5" note="Text field" />
                <MappingEntry form="birth_state" pdf="State_5" note="Text field" />
              </div>
            </section>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Sub-components
function FileEntry({ title, path, filename, description, badge, badgeColor, onDownload, downloading }: { 
  title: string; 
  path: string;
  filename: string;
  description: string; 
  badge: string;
  badgeColor: 'purple' | 'blue' | 'green' | 'orange' | 'gray';
  onDownload: (path: string, filename: string) => void;
  downloading: string | null;
}) {
  const colors = {
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-slate-100 text-slate-600',
  };
  
  const isDownloading = downloading === path;
  
  return (
    <div className="border-l-2 border-slate-200 pl-3 py-1 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">{title}</span>
          <Badge variant="secondary" className={`text-xs ${colors[badgeColor]}`}>{badge}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(path, filename)}
          disabled={isDownloading}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
        >
          {isDownloading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
        </Button>
      </div>
      <code className="text-xs text-slate-500 block">{path}</code>
      <p className="text-xs text-slate-600 mt-1">{description}</p>
    </div>
  );
}

function FunctionEntry({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-purple-600 font-semibold">{name}()</span>
      <span className="text-slate-600">— {description}</span>
    </div>
  );
}

function ArchitectureItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <p className="font-medium text-slate-700">{question}</p>
      <p className="text-sm text-slate-600 mt-1">{answer}</p>
    </div>
  );
}

function FlowStep({ step, label }: { step: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white rounded px-2 py-1 shadow-sm border border-slate-200">
      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-medium">{step}</span>
      <span className="text-slate-700">{label}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-slate-400">→</span>;
}

function SchemaField({ name, type, pk, fk, note }: { 
  name: string; 
  type: string; 
  pk?: boolean; 
  fk?: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/60 rounded px-2 py-1">
      <span className="text-emerald-700">{name}</span>
      <span className="text-slate-400">{type}</span>
      {pk && <Badge variant="outline" className="text-[10px] px-1 py-0">PK</Badge>}
      {fk && <Badge variant="outline" className="text-[10px] px-1 py-0">FK</Badge>}
      {note && <span className="text-[10px] text-slate-400">({note})</span>}
    </div>
  );
}

function MappingEntry({ form, pdf, note }: { form: string; pdf: string; note: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <code className="bg-white px-2 py-0.5 rounded text-slate-700">{form}</code>
      <span className="text-slate-400">→</span>
      <code className="bg-rose-100 px-2 py-0.5 rounded text-rose-700">{pdf}</code>
      <span className="text-slate-500 text-xs">({note})</span>
    </div>
  );
}
