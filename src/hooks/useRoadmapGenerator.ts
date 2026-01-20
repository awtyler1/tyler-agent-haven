// src/hooks/useGrowthPlanGenerator.ts (formerly useRoadmapGenerator.ts)
// V6 - Renamed from Roadmap to Growth Plan

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BrokerProfile,
  RoadmapGenerationResult,
  GrowthChannel,
  ActivityTargets,
  Economics,
} from '@/types/roadmap';

export function useRoadmapGenerator() {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate roadmap PDF via edge function
  const generateRoadmap = async (profile: BrokerProfile): Promise<RoadmapGenerationResult> => {
    setGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-growth-plan-pdf', {
        body: {
          profile: {
            broker_name: profile.broker_name,
            manager_name: profile.manager_name,
            book_size: profile.book_size || 0,
            monthly_goal: profile.monthly_goal,
            lead_star_leads: profile.lead_star_leads || 0,
            seminar_eligible: profile.seminar_eligible || false,
            seminars_planned: profile.seminars_planned || 0,
            mira_access: profile.mira_access || false,
          },
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate growth plan');
      }

      toast.success('Growth plan generated successfully');
      return data as RoadmapGenerationResult;
    } catch (err: any) {
      const message = err.message || 'Failed to generate growth plan';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setGenerating(false);
    }
  };

  // Save broker profile to database
  const saveBrokerProfile = async (profile: BrokerProfile): Promise<string | null> => {
    setSaving(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }

      const profileData = {
        broker_name: profile.broker_name,
        manager_id: profile.manager_id,
        manager_name: profile.manager_name,
        book_size: profile.book_size || 0,
        monthly_goal: profile.monthly_goal,
        lead_star_leads: profile.lead_star_leads || 0,
        seminar_eligible: profile.seminar_eligible || false,
        seminars_planned: profile.seminars_planned || 0,
        mira_access: profile.mira_access || false,
        profile_id: profile.profile_id || null,
        created_by: userData.user.id,
        updated_at: new Date().toISOString(),
      };

      if (profile.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('broker_roadmaps')
          .update(profileData)
          .eq('id', profile.id);

        if (updateError) throw updateError;
        toast.success('Profile updated');
        return profile.id;
      } else {
        // Insert new
        const { data: insertData, error: insertError } = await supabase
          .from('broker_roadmaps')
          .insert({
            ...profileData,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        toast.success('Profile saved');
        return insertData.id;
      }
    } catch (err: any) {
      const message = err.message || 'Failed to save profile';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Update profile after PDF generation (store generated data)
  const updateProfileAfterGeneration = async (
    profileId: string,
    result: RoadmapGenerationResult,
    pdfStoragePath?: string
  ): Promise<boolean> => {
    try {
      const updateData: any = {
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (result.channels) {
        updateData.assigned_channels = result.channels;
      }
      if (result.activity) {
        updateData.activity_targets = result.activity;
      }
      if (result.economics) {
        updateData.economics = result.economics;
      }
      if (result.review_date) {
        updateData.review_date = result.review_date;
      }
      if (pdfStoragePath) {
        updateData.pdf_storage_path = pdfStoragePath;
      }

      const { error: updateError } = await supabase
        .from('broker_roadmaps')
        .update(updateData)
        .eq('id', profileId);

      if (updateError) throw updateError;
      return true;
    } catch (err: any) {
      console.error('Failed to update profile after generation:', err);
      return false;
    }
  };

  // Fetch all broker roadmaps (for list view)
  const fetchBrokerRoadmaps = async (): Promise<BrokerProfile[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('broker_roadmaps')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      return (data || []).map((row: any) => ({
        id: row.id,
        profile_id: row.profile_id,
        broker_name: row.broker_name,
        manager_id: row.manager_id,
        manager_name: row.manager_name,
        book_size: row.book_size || 0,
        monthly_goal: row.monthly_goal || 6,
        lead_star_leads: row.lead_star_leads || 0,
        seminar_eligible: row.seminar_eligible || false,
        seminars_planned: row.seminars_planned || 0,
        mira_access: row.mira_access || false,
        last_generated_at: row.last_generated_at,
        pdf_storage_path: row.pdf_storage_path,
        review_date: row.review_date,
        assigned_channels: row.assigned_channels,
        activity_targets: row.activity_targets,
        economics: row.economics,
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_by: row.created_by,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to fetch growth plans';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch single broker profile
  const fetchBrokerProfile = async (id: string): Promise<BrokerProfile | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('broker_roadmaps')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return {
        id: data.id,
        profile_id: data.profile_id,
        broker_name: data.broker_name,
        manager_id: data.manager_id,
        manager_name: data.manager_name,
        book_size: data.book_size || 0,
        monthly_goal: data.monthly_goal || 6,
        lead_star_leads: data.lead_star_leads || 0,
        seminar_eligible: data.seminar_eligible || false,
        seminars_planned: data.seminars_planned || 0,
        mira_access: data.mira_access || false,
        last_generated_at: data.last_generated_at,
        pdf_storage_path: data.pdf_storage_path,
        review_date: data.review_date,
        assigned_channels: data.assigned_channels,
        activity_targets: data.activity_targets,
        economics: data.economics,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
      };
    } catch (err: any) {
      const message = err.message || 'Failed to fetch profile';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete broker profile
  const deleteBrokerProfile = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('broker_roadmaps')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      toast.success('Profile deleted');
      return true;
    } catch (err: any) {
      const message = err.message || 'Failed to delete profile';
      toast.error(message);
      return false;
    }
  };

  // Download PDF from base64
  const downloadPdf = (base64: string, filename: string) => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

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
      toast.error('Failed to download PDF');
    }
  };

  return {
    generating,
    saving,
    loading,
    error,
    generateRoadmap,
    saveBrokerProfile,
    updateProfileAfterGeneration,
    fetchBrokerRoadmaps,
    fetchBrokerProfile,
    deleteBrokerProfile,
    downloadPdf,
  };
}
