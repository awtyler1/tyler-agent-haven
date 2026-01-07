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

export interface SignatureFieldInfo {
  name: string;
  type: string;
}

interface PdfGenerationResult {
  success: boolean;
  filename?: string;
  pdf?: string; // base64
  size?: number;
  error?: string;
  mappingReport?: MappingEntry[];
  debugLogs?: DebugLogEntry[];
  signatureFieldsFound?: SignatureFieldInfo[];
}

export function useContractingPdf() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateApplication = (application: ContractingApplication): string[] => {
    // TESTING: All validation disabled for testing purposes
    return [];
  };

  const generatePdf = async (application: ContractingApplication, saveToStorage = true, skipValidation = false): Promise<PdfGenerationResult> => {
    setGenerating(true);
    setError(null);

    try {
      // TESTING: Validation disabled for testing purposes
      // if (!skipValidation) {
      //   const validationErrors = validateApplication(application);
      //   if (validationErrors.length > 0) {
      //     const errorMsg = validationErrors.join(', ');
      //     setError(errorMsg);
      //     toast.error('Cannot generate PDF: ' + validationErrors[0]);
      //     return { success: false, error: errorMsg };
      //   }
      // }

      // Fetch the PDF template and convert to base64
      // CRITICAL: Use the SIGNATURES_FIXED template with proper /Sig type signature fields
      const templateFileName = 'TIG_Contracting_Packet_SIGNATURES_FIXED.pdf';
      // Add cache-busting to ensure fresh template is loaded
      const cacheBuster = `?v=${Date.now()}`;
      let templateBase64: string | undefined;
      try {
        const pdfPath = `/templates/${templateFileName}${cacheBuster}`;
        const templateResponse = await fetch(pdfPath);
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
        }
      } catch (e) {
        // Template load failed, will use fallback
      }

      // Call the edge function
      const uploadedDocs = application.uploaded_documents as Record<string, string> | undefined;

      // Ensure arrays are properly formatted (handle case where they might be JSON strings)
      const normalizeArray = <T>(value: T | string | null | undefined, defaultValue: T[] = []): T[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : defaultValue;
          } catch {
            return defaultValue;
          }
        }
        return defaultValue;
      };

      // Normalize array fields
      const selectedCarriers = normalizeArray(application.selected_carriers);
      const preferredContactMethods = normalizeArray<string>(application.preferred_contact_methods);
      const previousAddresses = normalizeArray(application.previous_addresses);

      const birthCity = typeof application.birth_city === 'string' ? application.birth_city.trim() : '';
      const birthState = typeof application.birth_state === 'string' ? application.birth_state.trim() : '';

      // TESTING: Birth field validation disabled for testing purposes
      // if (!skipValidation && (!birthCity || !birthState)) {
      //   const msg = !birthCity && !birthState
      //     ? 'Birth City and Birth State are required to generate the contracting packet PDF.'
      //     : !birthCity
      //       ? 'Birth City is required to generate the contracting packet PDF.'
      //       : 'Birth State is required to generate the contracting packet PDF.';
      //   setError(msg);
      //   toast.error(msg);
      //   return { success: false, error: msg };
      // }

      // The Supabase client automatically handles authentication and token refresh
      // Verify we have a session, and if token is close to expiring, refresh it
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const errorMsg = 'You must be logged in to generate the contracting packet. Please refresh the page and try again.';
        console.error('[pdf-generation] No session found:', sessionError);
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      // If token is expired, try to refresh
      const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
      const now = Date.now();
      if (expiresAt && expiresAt < now) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedSession) {
          const errorMsg = 'Your session has expired. Please refresh the page and log in again.';
          console.error('[pdf-generation] Session refresh failed:', refreshError);
          setError(errorMsg);
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }
      }

      const { data, error: fnError } = await supabase.functions.invoke('generate-contracting-pdf', {
        body: {
          application: {
            user_id: application.user_id,
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
            preferred_contact_methods: preferredContactMethods,
            home_address: application.home_address,
            mailing_address_same_as_home: application.mailing_address_same_as_home,
            mailing_address: application.mailing_address,
            ups_address_same_as_home: application.ups_address_same_as_home,
            ups_address: application.ups_address,
            previous_addresses: previousAddresses,
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
            selected_carriers: selectedCarriers,
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
          skipValidation: true, // TESTING: Always skip validation for testing
          applicationId: application.id,
          templateBase64,
        },
      });

      // Handle errors - check both fnError and data.error
      // When Edge Function returns non-2xx, fnError is set but data may still contain error details
      if (fnError) {
        console.error('Edge function error:', fnError);

        // Check if it's an authentication error (401)
        const errorStatus = (fnError as any).status || (fnError as any).context?.status;
        const is401 = errorStatus === 401 || fnError.message?.includes('401') || fnError.message?.includes('Unauthorized');

        if (is401) {
          // Try to refresh the session and retry once
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession(currentSession);

            if (refreshError || !newSession || !newSession.access_token) {
              console.error('[pdf-generation] Session refresh failed:', refreshError);
              const authErrorMsg = 'Your session has expired. Please refresh the page and log in again.';
              setError(authErrorMsg);
              toast.error(authErrorMsg);
              return { success: false, error: authErrorMsg };
            }

            // Retry the function call with the refreshed session
            const { data: retryData, error: retryError } = await supabase.functions.invoke('generate-contracting-pdf', {
              body: {
                application: {
                  user_id: application.user_id,
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
                  preferred_contact_methods: preferredContactMethods,
                  home_address: application.home_address,
                  mailing_address_same_as_home: application.mailing_address_same_as_home,
                  mailing_address: application.mailing_address,
                  ups_address_same_as_home: application.ups_address_same_as_home,
                  ups_address: application.ups_address,
                  previous_addresses: previousAddresses,
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
                  requesting_commission_advancing: application.requesting_commission_advancing === true,
                  aml_training_provider: application.aml_training_provider,
                  aml_completion_date: application.aml_completion_date,
                  has_ltc_certification: application.has_ltc_certification,
                  state_requires_ce: application.state_requires_ce,
                  selected_carriers: selectedCarriers,
                  is_corporation: application.is_corporation,
                  signature_name: application.signature_name,
                  signature_initials: application.signature_initials,
                  signature_date: application.signature_date,
                  is_finra_registered: application.is_finra_registered,
                  finra_broker_dealer_name: application.finra_broker_dealer_name,
                  finra_crd_number: application.finra_crd_number,
                  agreements: application.agreements,
                  disciplinary_entries: application.disciplinary_entries || {},
                  uploaded_documents: {
                    initials_image: uploadedDocs?.initials_image || '',
                    background_signature: uploadedDocs?.background_signature || '',
                    final_signature: uploadedDocs?.final_signature || '',
                  },
                },
                saveToStorage,
                skipValidation: true,
                applicationId: application.id,
                templateBase64,
              },
            });
            
            if (retryError) {
              const authErrorMsg = 'Authentication failed after retry. Please refresh the page and try again.';
              console.error('[pdf-generation] Retry also failed:', retryError);
              setError(authErrorMsg);
              toast.error(authErrorMsg);
              return { success: false, error: authErrorMsg };
            }
            
            if (retryData?.error) {
              const errorMsg = typeof retryData.error === 'string' ? retryData.error : JSON.stringify(retryData.error);
              setError(errorMsg);
              toast.error(errorMsg);
              return { success: false, error: errorMsg };
            }
            
            // Success on retry
            toast.success('Contracting packet generated successfully');
            return {
              success: true,
              filename: retryData.filename,
              pdf: retryData.pdf,
              size: retryData.size,
              mappingReport: retryData.mappingReport,
              debugLogs: retryData.debugLogs,
              signatureFieldsFound: retryData.signatureFieldsFound,
            };
          } catch (retryErr) {
            console.error('[pdf-generation] Retry exception:', retryErr);
            const authErrorMsg = 'Authentication failed. Please refresh the page and try again.';
            setError(authErrorMsg);
            toast.error(authErrorMsg);
            return { success: false, error: authErrorMsg };
          }
        }
        
        // Try to extract detailed error from response data
        let errorMessage = fnError.message || 'Unknown error';
        if (data?.error) {
          errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } else if (data?.details) {
          // Handle validation errors with details array
          if (Array.isArray(data.details)) {
            errorMessage = data.details.join(', ');
          } else {
            errorMessage = String(data.details);
          }
        }
        
        setError(errorMessage);
        toast.error('Failed to generate contracting packet: ' + errorMessage);
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      toast.success('Contracting packet generated successfully');
      return {
        success: true,
        filename: data.filename,
        pdf: data.pdf,
        size: data.size,
        mappingReport: data.mappingReport,
        debugLogs: data.debugLogs,
        signatureFieldsFound: data.signatureFieldsFound,
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
