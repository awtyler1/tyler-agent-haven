import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContractingApplication } from '@/types/contracting';
import { toast } from 'sonner';

interface PdfGenerationResult {
  success: boolean;
  filename?: string;
  pdf?: string; // base64
  size?: number;
  error?: string;
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
    
    // Check legal questions with "Yes" answers have explanations
    const legalQuestions = application.legal_questions || {};
    Object.entries(legalQuestions).forEach(([id, q]) => {
      if (q && typeof q === 'object' && 'answer' in q) {
        const question = q as { answer: boolean | null; explanation?: string };
        if (question.answer === true && !question.explanation) {
          errors.push(`Explanation required for legal question ${id}`);
        }
      }
    });

    return errors;
  };

  const generatePdf = async (application: ContractingApplication): Promise<PdfGenerationResult> => {
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

      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke('generate-contracting-pdf', {
        body: {
          application: {
            full_legal_name: application.full_legal_name,
            agency_name: application.agency_name,
            gender: application.gender,
            birth_date: application.birth_date,
            npn_number: application.npn_number,
            insurance_license_number: application.insurance_license_number,
            tax_id: application.tax_id,
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
            requesting_commission_advancing: application.requesting_commission_advancing,
            aml_training_provider: application.aml_training_provider,
            aml_completion_date: application.aml_completion_date,
            has_ltc_certification: application.has_ltc_certification,
            state_requires_ce: application.state_requires_ce,
            selected_carriers: application.selected_carriers,
            is_corporation: application.is_corporation,
            signature_name: application.signature_name,
            signature_initials: application.signature_initials,
            signature_date: application.signature_date,
          },
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
