import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContractingApplication, Carrier, Address, LegalQuestion, SelectedCarrier, EMPTY_ADDRESS } from '@/types/contracting';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { Database, Json } from '@/integrations/supabase/types';
import { useContractingPdf } from './useContractingPdf';
import { getErrorMessage } from '@/lib/errors';

// Type alias for the database row
type DbContractingApplication = Database['public']['Tables']['contracting_applications']['Row'];

// Debounce delay for auto-save (ms)
const SAVE_DEBOUNCE_MS = 800;

// Transform database row to typed ContractingApplication
const transformDbToApplication = (row: DbContractingApplication): ContractingApplication => ({
  id: row.id,
  user_id: row.user_id,
  current_step: row.current_step,
  completed_steps: row.completed_steps ?? [],
  status: row.status as ContractingApplication['status'],

  // Personal & Contact
  full_legal_name: row.full_legal_name,
  agency_name: row.agency_name,
  agency_tax_id: row.agency_tax_id,
  gender: row.gender,
  birth_date: row.birth_date,
  birth_city: row.birth_city,
  birth_state: row.birth_state,
  npn_number: row.npn_number,
  insurance_license_number: row.insurance_license_number,
  tax_id: row.tax_id,
  email_address: row.email_address,
  phone_mobile: row.phone_mobile,
  phone_business: row.phone_business,
  phone_home: row.phone_home,
  fax: row.fax,
  preferred_contact_methods: row.preferred_contact_methods ?? [],

  // Addresses (Json -> Address)
  home_address: (row.home_address as Address | null) ?? EMPTY_ADDRESS,
  mailing_address_same_as_home: row.mailing_address_same_as_home ?? true,
  mailing_address: (row.mailing_address as Address | null) ?? EMPTY_ADDRESS,
  ups_address_same_as_home: row.ups_address_same_as_home ?? true,
  ups_address: (row.ups_address as Address | null) ?? EMPTY_ADDRESS,
  previous_addresses: (row.previous_addresses as Address[] | null) ?? [],

  // Licensing
  resident_license_number: row.resident_license_number,
  resident_state: row.resident_state,
  license_expiration_date: row.license_expiration_date,
  non_resident_states: row.non_resident_states ?? [],
  drivers_license_number: row.drivers_license_number,
  drivers_license_state: row.drivers_license_state,

  // Legal Questions (Json -> Record<string, LegalQuestion>)
  legal_questions: (row.legal_questions as Record<string, LegalQuestion> | null) ?? {},

  // Banking (boolean | null -> boolean)
  bank_routing_number: row.bank_routing_number,
  bank_account_number: row.bank_account_number,
  bank_branch_name: row.bank_branch_name,
  beneficiary_name: row.beneficiary_name,
  beneficiary_relationship: row.beneficiary_relationship,
  beneficiary_birth_date: row.beneficiary_birth_date,
  beneficiary_drivers_license_number: row.beneficiary_drivers_license_number,
  beneficiary_drivers_license_state: row.beneficiary_drivers_license_state,
  requesting_commission_advancing: row.requesting_commission_advancing ?? false,

  // Training & E&O (boolean | null -> boolean)
  has_aml_course: row.has_aml_course,
  aml_course_name: row.aml_course_name,
  aml_course_date: row.aml_course_date,
  aml_training_provider: row.aml_training_provider,
  aml_completion_date: row.aml_completion_date,
  has_ltc_certification: row.has_ltc_certification ?? false,
  state_requires_ce: row.state_requires_ce ?? false,
  eo_not_yet_covered: row.eo_not_yet_covered ?? false,
  eo_provider: row.eo_provider,
  eo_policy_number: row.eo_policy_number,
  eo_expiration_date: row.eo_expiration_date,
  is_finra_registered: row.is_finra_registered ?? false,
  finra_broker_dealer_name: row.finra_broker_dealer_name,
  finra_crd_number: row.finra_crd_number,

  // Carriers (Json -> SelectedCarrier[])
  selected_carriers: (row.selected_carriers as SelectedCarrier[] | null) ?? [],
  is_corporation: row.is_corporation ?? false,

  // Agreements (Json -> Record<string, boolean>)
  agreements: (row.agreements as Record<string, boolean> | null) ?? {},
  signature_name: row.signature_name,
  signature_initials: row.signature_initials,
  signature_date: row.signature_date,

  // Section acknowledgments (Json -> specific type)
  section_acknowledgments: (row.section_acknowledgments as ContractingApplication['section_acknowledgments'] | null) ?? {},

  // Disciplinary entries (Json -> specific type)
  disciplinary_entries: (row.disciplinary_entries as ContractingApplication['disciplinary_entries']) ?? {},

  // Documents (Json -> Record<string, string>)
  uploaded_documents: (row.uploaded_documents as Record<string, string> | null) ?? {},

  // Timestamps
  created_at: row.created_at,
  updated_at: row.updated_at,
  submitted_at: row.submitted_at,
});

// Type alias for database update
type DbContractingUpdate = Database['public']['Tables']['contracting_applications']['Update'];

// Helper to convert application data for Supabase
const toDbFormat = (data: Partial<ContractingApplication>): DbContractingUpdate => {
  const result: DbContractingUpdate = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value as Json;
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
};

export function useContractingApplication() {
  const { user } = useAuth();
  const { generatePdf, generating: generatingPdf } = useContractingPdf();
  const [application, setApplication] = useState<ContractingApplication | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs for debounced saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Record<string, unknown>>({});
  
  // Fetch or create application
  useEffect(() => {
    if (!user?.id) return;

    const fetchOrCreateApplication = async () => {
      setLoading(true);
      try {
        // Try to fetch existing application
        const { data: existingApp, error: fetchError } = await supabase
          .from('contracting_applications')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingApp) {
          // Ensure email is always synced with login email
          if (existingApp.email_address !== user.email && user.email) {
            const { error: updateError } = await supabase
              .from('contracting_applications')
              .update({ email_address: user.email })
              .eq('id', existingApp.id);
            if (!updateError) {
              existingApp.email_address = user.email;
            }
          }
          setApplication(transformDbToApplication(existingApp));
        } else {
          // Create new application with only essential fields
          const newAppData: Database['public']['Tables']['contracting_applications']['Insert'] = {
            user_id: user.id,
            email_address: user.email || null,
            status: 'in_progress',
            current_step: 1,
            completed_steps: [],
            is_test: false,
          };

          const { data: createdApp, error: createError } = await supabase
            .from('contracting_applications')
            .insert(newAppData)
            .select()
            .single();

          if (createError) throw createError;
          setApplication(transformDbToApplication(createdApp));
        }

        // Fetch carriers
        const { data: carrierData, error: carrierError } = await supabase
          .from('carriers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (carrierError) throw carrierError;
        setCarriers(carrierData as Carrier[]);
      } catch (error: unknown) {
        console.error('Error fetching application:', error);
        toast.error('Failed to load your application: ' + getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateApplication();
  }, [user?.id]);

  // Debounced save to database
  const flushSave = useCallback(async () => {
    if (!application?.id || Object.keys(pendingUpdatesRef.current).length === 0) return;
    
    const updates = { ...pendingUpdatesRef.current };
    pendingUpdatesRef.current = {};
    
    setSaving(true);
    try {
      const dbData = toDbFormat({ ...updates, updated_at: new Date().toISOString() });
      const { error } = await supabase
        .from('contracting_applications')
        .update(dbData)
        .eq('id', application.id);

      if (error) throw error;
      setLastSaved(new Date());
    } catch (error: unknown) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes: ' + getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [application?.id]);

  // Update application field with debounced save
  const updateField = useCallback(<K extends keyof ContractingApplication>(
    field: K,
    value: ContractingApplication[K]
  ) => {
    if (!application?.id) return;

    // Update local state immediately
    setApplication(prev => prev ? { ...prev, [field]: value } : null);
    
    // Queue the update
    pendingUpdatesRef.current[field] = value;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      flushSave();
    }, SAVE_DEBOUNCE_MS);
  }, [application?.id, flushSave]);

  // Update multiple fields at once
  const updateFields = useCallback(async (updates: Partial<ContractingApplication>) => {
    if (!application?.id) return;

    setApplication(prev => prev ? { ...prev, ...updates } : null);

    setSaving(true);
    try {
      const dbData = toDbFormat({ ...updates, updated_at: new Date().toISOString() });
      const { error } = await supabase
        .from('contracting_applications')
        .update(dbData)
        .eq('id', application.id);

      if (error) throw error;
    } catch (error: unknown) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes: ' + getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [application?.id]);

  // Navigate to step
  const goToStep = useCallback(async (step: number) => {
    if (!application?.id) return;
    await updateField('current_step', step);
  }, [application?.id, updateField]);

  // Mark step as complete and go to next
  const completeStepAndNext = useCallback(async (currentStep: number) => {
    if (!application?.id) return;

    const newCompletedSteps = application.completed_steps.includes(currentStep)
      ? application.completed_steps
      : [...application.completed_steps, currentStep];

    await updateFields({
      completed_steps: newCompletedSteps,
      current_step: currentStep + 1,
    });
  }, [application?.id, application?.completed_steps, updateFields]);

  // Submit application
  const submitApplication = useCallback(async () => {
    if (!application?.id) return false;

    setSaving(true);
    try {
      // Normalize application data before submission
      const normalizedApplication = {
        ...application,
        // Default requesting_commission_advancing to false if undefined/null
        requesting_commission_advancing: application.requesting_commission_advancing === true,
      };

      // Generate the PDF and save to storage
      const pdfResult = await generatePdf(normalizedApplication, true);

      if (!pdfResult.success) {
        console.error('PDF generation failed:', pdfResult.error);
        toast.error('Failed to generate contracting packet: ' + (pdfResult.error || 'Unknown error'));
        return false;
      }

      // NOTE: The edge function already saves the PDF path to uploaded_documents
      // when saveToStorage=true, so we don't need to do it here

      // Update profile status to CONTRACTING_SUBMITTED
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'CONTRACTING_SUBMITTED' })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Update application status
      const { error } = await supabase
        .from('contracting_applications')
        .update({
          status: 'submitted',
          queue_status: 'needs_action',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (error) throw error;

      setApplication(prev => prev ? { ...prev, status: 'submitted', submitted_at: new Date().toISOString() } : null);
      toast.success('Application submitted successfully!');
      return true;
    } catch (error: unknown) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit application: ' + getErrorMessage(error));
      return false;
    } finally {
      setSaving(false);
    }
  }, [application, user?.id, generatePdf]);

  // Upload document
  const uploadDocument = useCallback(async (file: File, documentType: string) => {
    if (!user?.id || !application?.id) return null;

    try {
      const fileName = `${user.id}/${documentType}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contracting-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update uploaded_documents in application
      const updatedDocs = {
        ...application.uploaded_documents,
        [documentType]: fileName,
      };

      await updateField('uploaded_documents', updatedDocs);

      toast.success(`${documentType} uploaded successfully`);
      return fileName;
    } catch (error: unknown) {
      console.error('Error uploading:', error);
      toast.error('Failed to upload document: ' + getErrorMessage(error));
      return null;
    }
  }, [user?.id, application?.id, application?.uploaded_documents, updateField]);

  // Delete document
  const deleteDocument = useCallback(async (documentType: string) => {
    if (!application?.id) return;

    const filePath = application.uploaded_documents[documentType];
    if (!filePath) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from('contracting-documents')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const updatedDocs = { ...application.uploaded_documents };
      delete updatedDocs[documentType];

      await updateField('uploaded_documents', updatedDocs);
      toast.success('Document removed');
    } catch (error: unknown) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete document: ' + getErrorMessage(error));
    }
  }, [application?.id, application?.uploaded_documents, updateField]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    application,
    carriers,
    loading,
    saving: saving || generatingPdf,
    lastSaved,
    updateField,
    updateFields,
    goToStep,
    completeStepAndNext,
    submitApplication,
    uploadDocument,
    deleteDocument,
  };
}