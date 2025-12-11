import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContractingApplication, Carrier, getEmptyApplication } from '@/types/contracting';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';

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
  const [application, setApplication] = useState<ContractingApplication | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          // Create new application with email prefilled from login
          const newApp = {
            ...getEmptyApplication(user.id),
            email_address: user.email || null,
          };
          const dbData = toDbFormat(newApp);
          const { data: createdApp, error: createError } = await supabase
            .from('contracting_applications')
            .insert(dbData as never)
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

  // Update application field
  const updateField = useCallback(async <K extends keyof ContractingApplication>(
    field: K,
    value: ContractingApplication[K]
  ) => {
    if (!application?.id) return;

    setApplication(prev => prev ? { ...prev, [field]: value } : null);

    setSaving(true);
    try {
      const { error } = await supabase
        .from('contracting_applications')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', application.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [application?.id]);

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
      // Update profile status to CONTRACT_SUBMITTED
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'CONTRACT_SUBMITTED' })
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
  }, [application?.id, user?.id]);

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

  return {
    application,
    carriers,
    loading,
    saving,
    updateField,
    updateFields,
    goToStep,
    completeStepAndNext,
    submitApplication,
    uploadDocument,
    deleteDocument,
  };
}