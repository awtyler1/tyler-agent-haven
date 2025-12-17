import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContractingApplication } from '@/types/contracting';
import { toast } from 'sonner';

export interface MappingEntry {
  pdfFieldKey: string;
  valueApplied: string;
  sourceFormField: string;
  isBlank: boolean;
  status: 'success' | 'failed' | 'skipped';
}

export interface DebugLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: unknown;
}

interface PdfGenerationResult {
  success: boolean;
  filename?: string;
  pdf?: string; // base64
  size?: number;
  error?: string;
  mappingReport?: MappingEntry[];
  debugLogs?: DebugLogEntry[];
}

export function useContractingPdf() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateApplication = (application: ContractingApplication): string[] => {
    const errors: string[] = [];
    
    if (!application.signature_initials) {
      errors.push('Initials are required');
    }
    if (!application.signature_date) {
      errors.push('Signature date is required');
    }
    if (!application.signature_name) {
      errors.push('Signature name is required');
    }
    if (!application.full_legal_name) {
      errors.push('Full legal name is required');
    }
    
    // TESTING: Background signature disabled for testing
    // const uploadedDocs = (application.uploaded_documents || {}) as Record<string, string>;
    // if (!uploadedDocs.background_signature) {
    //   errors.push('Background questions signature is required');
    // }
    
    // TESTING: Legal question explanations disabled for testing
    // const legalQuestions = application.legal_questions || {};
    // Object.entries(legalQuestions).forEach(([id, q]) => {
    //   if (q && typeof q === 'object' && 'answer' in q) {
    //     const question = q as { answer: boolean | null; explanation?: string };
    //     if (question.answer === true && !question.explanation) {
    //       errors.push(`Explanation required for legal question ${id}`);
    //     }
    //   }
    // });

    return errors;
  };

  const generatePdf = async (application: ContractingApplication, saveToStorage = true): Promise<PdfGenerationResult> => {
    setGenerating(true);
    setError(null);

    try {
      // Validate first
      const validationErrors = validateApplication(application);
      if (validationErrors.length > 0) {
        const errorMsg = validationErrors.join(', ');
        setError(errorMsg);
        toast.error('Cannot generate PDF: ' + validationErrors[0]);
        return { success: false, error: errorMsg };
      }

      // Fetch the PDF template and convert to base64
      // CRITICAL: Use the SIGNATURES_FIXED template with proper /Sig type signature fields
      const templateFileName = 'TIG_Contracting_Packet_SIGNATURES_FIXED.pdf';
      let templateBase64: string | undefined;
      try {
        console.log('[pdf] Loading template from frontend:', templateFileName);
        const templateResponse = await fetch(`/templates/${templateFileName}`);
        if (templateResponse.ok) {
          const templateBlob = await templateResponse.blob();
          templateBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(templateBlob);
          });
          console.log('[pdf] Template loaded successfully, size:', templateBase64.length);
        } else {
          console.log('[pdf] Template not found at /templates/', templateFileName);
        }
      } catch (e) {
        console.log('[pdf] Could not load template, will use fallback:', e);
      }

      // Call the edge function
      const uploadedDocs = application.uploaded_documents as Record<string, string> | undefined;

      // Debug (birth fields only)
      const birthCity = typeof application.birth_city === 'string' ? application.birth_city.trim() : '';
      const birthState = typeof application.birth_state === 'string' ? application.birth_state.trim() : '';
      const birthKeys = Object.keys(application).filter((k) => k.toLowerCase().includes('birth'));
      console.log('PDF payload birth keys:', birthKeys);
      console.log('PDF payload birth_city (raw->trimmed):', application.birth_city, '->', birthCity);
      console.log('PDF payload birth_state (raw->trimmed):', application.birth_state, '->', birthState);

      // Hard guard: birth fields must be present when generating the PDF
      if (!birthCity || !birthState) {
        const msg = !birthCity && !birthState
          ? 'Birth City and Birth State are required to generate the contracting packet PDF.'
          : !birthCity
            ? 'Birth City is required to generate the contracting packet PDF.'
            : 'Birth State is required to generate the contracting packet PDF.';
        setError(msg);
        toast.error(msg);
        return { success: false, error: msg };
      }

      const { data, error: fnError } = await supabase.functions.invoke('generate-contracting-pdf', {
        body: {
          application: {
            full_legal_name: application.full_legal_name,
            agency_name: application.agency_name,
            gender: application.gender,
            birth_date: application.birth_date,
            birth_city: birthCity,
            birth_state: birthState,
            npn_number: application.npn_number,
            insurance_license_number: application.insurance_license_number,
            tax_id: application.tax_id,
            agency_tax_id: application.agency_tax_id,
            email_address: application.email_address,
            phone_mobile: application.phone_mobile,
            phone_business: application.phone_business,
            phone_home: application.phone_home,
            fax: application.fax,
            preferred_contact_methods: application.preferred_contact_methods,
            home_address: application.home_address,
            mailing_address_same_as_home: application.mailing_address_same_as_home,
            mailing_address: application.mailing_address,
            ups_address_same_as_home: application.ups_address_same_as_home,
            ups_address: application.ups_address,
            previous_addresses: application.previous_addresses,
            resident_license_number: application.resident_license_number,
            resident_state: application.resident_state,
            license_expiration_date: application.license_expiration_date,
            drivers_license_number: application.drivers_license_number,
            drivers_license_state: application.drivers_license_state,
            legal_questions: application.legal_questions,
            bank_routing_number: application.bank_routing_number,
            bank_account_number: application.bank_account_number,
            bank_branch_name: application.bank_branch_name,
            beneficiary_name: application.beneficiary_name,
            beneficiary_relationship: application.beneficiary_relationship,
            // Normalize to false if undefined/null - only true when explicitly opted in
            requesting_commission_advancing: application.requesting_commission_advancing === true,
            aml_training_provider: application.aml_training_provider,
            aml_completion_date: application.aml_completion_date,
            has_ltc_certification: application.has_ltc_certification,
            state_requires_ce: application.state_requires_ce,
            selected_carriers: application.selected_carriers,
            is_corporation: application.is_corporation,
            signature_name: application.signature_name,
            signature_initials: application.signature_initials,
            signature_date: application.signature_date,
            is_finra_registered: application.is_finra_registered,
            finra_broker_dealer_name: application.finra_broker_dealer_name,
            finra_crd_number: application.finra_crd_number,
            agreements: application.agreements,
            // Pass disciplinary entries (separate from uploaded_documents)
            disciplinary_entries: application.disciplinary_entries || {},
            // Pass the image data for embedding in PDF
            uploaded_documents: {
              initials_image: uploadedDocs?.initials_image || '',
              background_signature: uploadedDocs?.background_signature || '',
              final_signature: uploadedDocs?.final_signature || '',
            },
          },
          saveToStorage,
          userId: application.user_id,
          templateBase64,
        },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        setError(fnError.message);
        toast.error('Failed to generate PDF');
        return { success: false, error: fnError.message };
      }

      if (data.error) {
        setError(data.error);
        toast.error(data.error);
        return { success: false, error: data.error };
      }

      toast.success('Contracting packet generated successfully');
      return {
        success: true,
        filename: data.filename,
        pdf: data.pdf,
        size: data.size,
        mappingReport: data.mappingReport,
        debugLogs: data.debugLogs,
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('PDF generation error:', err);
      setError(errorMsg);
      toast.error('Failed to generate PDF');
      return { success: false, error: errorMsg };
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = (base64: string, filename: string) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download PDF');
    }
  };

  return {
    generating,
    error,
    generatePdf,
    downloadPdf,
    validateApplication,
  };
}
