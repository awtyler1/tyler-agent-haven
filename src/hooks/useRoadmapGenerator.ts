// src/hooks/useRoadmapGenerator.ts

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrokerProfile, RoadmapGenerationResult } from '@/types/roadmap';
import { toast } from 'sonner';

export function useRoadmapGenerator() {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate PDF via edge function
  const generateRoadmap = async (
    profile: BrokerProfile,
    saveToStorage = true
  ): Promise<RoadmapGenerationResult> => {
    setGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-roadmap-pdf', {
        body: {
          profile,
          saveToStorage,
        },
      });

      if (fnError || data?.error) {
        const errorMsg = fnError?.message || data?.error;
        setError(errorMsg);
        toast.error('Failed to generate roadmap: ' + errorMsg);
        return { success: false, error: errorMsg };
      }

      toast.success('Roadmap generated successfully');
      return {
        success: true,
        filename: data.filename,
        pdf: data.pdf,
        size: data.size,
        channels: data.channels,
        phase: data.phase,
        review_date: data.review_date,
      };

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error('Failed to generate roadmap');
      return { success: false, error: errorMsg };
    } finally {
      setGenerating(false);
    }
  };

  // Save broker profile to database
  const saveBrokerProfile = async (
    profile: BrokerProfile
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    setSaving(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();

      // Remove undefined values and prepare data
      const profileData: Record<string, unknown> = {
        broker_name: profile.broker_name,
        manager_name: profile.manager_name,
        manager_id: profile.manager_id || null,
        profile_id: profile.profile_id || null,
        months_in_business: profile.months_in_business,
        book_size: profile.book_size,
        monthly_goal: profile.monthly_goal,
        personality: profile.personality,
        phone_comfort: profile.phone_comfort,
        community_connections: profile.community_connections,
        strengths: profile.strengths || null,
        mira_access: profile.mira_access,
        seminar_assigned: profile.seminar_assigned,
        seminar_dates: profile.seminar_dates || null,
        experience_phase: profile.experience_phase || null,
        assigned_channels: profile.assigned_channels || null,
        created_by: userData.user?.id,
      };

      if (profile.id) {
        // Update existing
        const { data, error } = await supabase
          .from('broker_roadmaps')
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;
        toast.success('Profile updated');
        return { success: true, id: data.id };
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('broker_roadmaps')
          .insert(profileData)
          .select()
          .single();

        if (error) throw error;
        toast.success('Profile saved');
        return { success: true, id: data.id };
      }

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error('Failed to save profile: ' + errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  };

  // Update profile after generation
  const updateProfileAfterGeneration = async (
    profileId: string,
    pdfPath: string,
    reviewDate: string,
    phase: string,
    channels: unknown
  ) => {
    try {
      await supabase
        .from('broker_roadmaps')
        .update({
          last_generated_at: new Date().toISOString(),
          pdf_storage_path: pdfPath,
          review_date: reviewDate,
          experience_phase: phase,
          assigned_channels: channels,
        })
        .eq('id', profileId);
    } catch (err) {
      console.error('Failed to update profile after generation:', err);
    }
  };

  // Fetch all broker roadmaps
  const fetchBrokerRoadmaps = async (): Promise<BrokerProfile[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('broker_roadmaps')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BrokerProfile[];
    } catch (err) {
      toast.error('Failed to load roadmaps');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch single broker profile
  const fetchBrokerProfile = async (id: string): Promise<BrokerProfile | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('broker_roadmaps')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BrokerProfile;
    } catch (err) {
      toast.error('Failed to load profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete broker profile
  const deleteBrokerProfile = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('broker_roadmaps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Profile deleted');
      return true;
    } catch (err) {
      toast.error('Failed to delete profile');
      return false;
    }
  };

  // Download PDF helper
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
