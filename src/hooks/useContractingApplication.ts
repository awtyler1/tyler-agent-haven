import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContractingApplication, Carrier, getEmptyApplication } from '@/types/contracting';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';
import { useContractingPdf } from './useContractingPdf';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

// Debounce delay for auto-save (ms)
const SAVE_DEBOUNCE_MS = 800;

// Helper to convert application data for Supabase
const toDbFormat = (data: Partial<ContractingApplication>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = value as Json;
    } else {
      result[key] = value;
    }
  }
  return result;
};

export function useContractingApplication() {
  const { user } = useAuth();
  const { generatePdf, generating: generatingPdf } = useContractingPdf();
  const { isEnabled } = useFeatureFlags();
  const [application, setApplication] = useState<ContractingApplication | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs for debounced saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Record<string, unknown>>({});
  
  // Check if test mode is enabled
  const isTestMode = isEnabled('test_mode');

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
          setApplication(existingApp as unknown as ContractingApplication);
        } else {
          // Create new application with only essential fields to avoid schema cache issues
          const { data: createdApp, error: createError } = await supabase
            .from('contracting_applications')
            .insert({
              user_id: user.id,
              email_address: user.email || null,
              status: 'in_progress',
              current_step: 1,
              completed_steps: [],
              is_test: isTestMode,
            } as never)
            .select()
            .single();

          if (createError) throw createError;
          setApplication(createdApp as unknown as ContractingApplication);
        }

        // Fetch carriers
        const { data: carrierData, error: carrierError } = await supabase
          .from('carriers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (carrierError) throw carrierError;
        setCarriers(carrierData as Carrier[]);
      } catch (error) {
        console.error('Error fetching application:', error);
        toast.error('Failed to load your application');
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
        .update(dbData as never)
        .eq('id', application.id);

      if (error) throw error;
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
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
        .update(dbData as never)
        .eq('id', application.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
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

      // First, generate the PDF and save to storage
      console.log('Generating contracting PDF...');
      const pdfResult = await generatePdf(normalizedApplication, true); // saveToStorage = true
      
      if (!pdfResult.success) {
        console.error('PDF generation failed:', pdfResult.error);
        toast.error('Failed to generate contracting packet: ' + (pdfResult.error || 'Unknown error'));
        return false;
      }

      console.log('PDF generated successfully:', pdfResult.filename);

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
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (error) throw error;

      setApplication(prev => prev ? { ...prev, status: 'submitted', submitted_at: new Date().toISOString() } : null);
      toast.success('Application submitted successfully!');
      return true;
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit application');
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
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Failed to upload document');
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
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete document');
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