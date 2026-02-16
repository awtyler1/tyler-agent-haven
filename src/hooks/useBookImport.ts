// Multi-step import flow state machine.
// Manages: file upload -> parse -> mismatch check -> summary -> commit -> success

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ImportMode =
  | 'carrier-grid'
  | 'bulk-upload'
  | 'processing'
  | 'mismatch'
  | 'summary'
  | 'success';

export interface BatchSummary {
  batchId: string;
  status: string;
  sourceFormat: string;
  detectedFormat: string;
  formatMismatch: boolean;
  mismatchDetectedCarrier?: string;
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  termedRecords: number;
  skipDetails: { row: number; reason: string }[];
  fileName?: string;
  expectedCarrierId?: string;
  expectedCarrierCode?: string;
  expectedCarrierName?: string;
}

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export function useBookImport() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const profileId = profile?.id ? String(profile.id) : null;

  const [mode, setMode] = useState<ImportMode>('carrier-grid');
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preImportClientCount, setPreImportClientCount] = useState<number>(0);
  const lastFileRef = useRef<{ file: File; carrierId?: string; carrierCode?: string; carrierName?: string } | null>(null);
  const [uploadStartedAt, setUploadStartedAt] = useState<number | null>(null);

  const startUpload = useCallback(async (
    file: File,
    carrierId?: string,
    carrierCode?: string,
    carrierName?: string
  ) => {
    if (!profileId) return;

    setError(null);
    setIsUploading(true);
    setMode('processing');
    lastFileRef.current = { file, carrierId, carrierCode, carrierName };
    setUploadStartedAt(Date.now());

    try {
      const fileContent = await readFileAsBase64(file);

      const { data, error: fnError } = await supabase.functions.invoke(
        'import-book-of-business',
        {
          body: {
            action: 'parse',
            fileContent,
            fileName: file.name,
            profileId,
            expectedCarrierId: carrierId || undefined,
            expectedCarrierCode: carrierCode || undefined,
          },
        }
      );

      if (fnError) throw new Error(fnError.message || 'Upload failed');
      if (data?.error) throw new Error(data.error);

      const batchData: BatchSummary = {
        batchId: data.batchId,
        status: data.status,
        sourceFormat: data.sourceFormat,
        detectedFormat: data.detectedFormat,
        formatMismatch: data.formatMismatch,
        mismatchDetectedCarrier: data.mismatchDetectedCarrier,
        totalRecords: data.totalRecords,
        newRecords: data.newRecords,
        updatedRecords: data.updatedRecords,
        skippedRecords: data.skippedRecords,
        termedRecords: data.termedRecords,
        skipDetails: data.skipDetails || [],
        fileName: file.name,
        expectedCarrierId: carrierId,
        expectedCarrierCode: carrierCode,
        expectedCarrierName: carrierName,
      };

      setBatch(batchData);

      if (data.formatMismatch) {
        setMode('mismatch');
      } else {
        setMode('summary');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      // Stay in processing mode — component renders error state
    } finally {
      setIsUploading(false);
      setUploadStartedAt(null);
    }
  }, [profileId]);

  const commitImport = useCallback(async () => {
    if (!batch?.batchId) return;

    setError(null);
    setIsCommitting(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'import-book-of-business',
        {
          body: { action: 'commit', batchId: batch.batchId },
        }
      );

      if (fnError) throw new Error(fnError.message || 'Commit failed');
      if (data?.error) throw new Error(data.error);

      setBatch(prev => prev ? {
        ...prev,
        status: 'committed',
        newRecords: data.newRecords ?? prev.newRecords,
        updatedRecords: data.updatedRecords ?? prev.updatedRecords,
      } : null);

      setMode('success');

      queryClient.invalidateQueries({ queryKey: ['book-clients'] });
      queryClient.invalidateQueries({ queryKey: ['import-status'] });
      queryClient.invalidateQueries({ queryKey: ['import-pending'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['book-summary'] });
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setIsCommitting(false);
    }
  }, [batch?.batchId, queryClient]);

  const cancelImport = useCallback(async () => {
    if (!batch?.batchId) {
      setMode('carrier-grid');
      setBatch(null);
      return;
    }

    try {
      await supabase.functions.invoke('import-book-of-business', {
        body: { action: 'cancel', batchId: batch.batchId },
      });
    } catch {
      // Best-effort cancel
    }

    setBatch(null);
    setError(null);
    setMode('carrier-grid');
    queryClient.invalidateQueries({ queryKey: ['import-pending'] });
  }, [batch?.batchId, queryClient]);

  const resumeImport = useCallback((pendingBatch: any) => {
    setBatch({
      batchId: pendingBatch.id,
      status: pendingBatch.status,
      sourceFormat: pendingBatch.sourceFormat,
      detectedFormat: pendingBatch.detectedFormat || '',
      formatMismatch: pendingBatch.formatMismatch,
      mismatchDetectedCarrier: pendingBatch.mismatchDetectedCarrier,
      totalRecords: pendingBatch.totalRecords,
      newRecords: pendingBatch.newRecords,
      updatedRecords: pendingBatch.updatedRecords,
      skippedRecords: pendingBatch.skippedRecords,
      termedRecords: pendingBatch.termedRecords,
      skipDetails: pendingBatch.skipDetails || [],
      fileName: pendingBatch.fileName,
    });
    setMode('summary');
  }, []);

  const acceptMismatch = useCallback((_useDetectedCarrier: boolean) => {
    if (!batch) return;
    setMode('summary');
  }, [batch]);

  const retryUpload = useCallback(() => {
    if (!lastFileRef.current) return;
    const { file, carrierId, carrierCode, carrierName } = lastFileRef.current;
    startUpload(file, carrierId, carrierCode, carrierName);
  }, [startUpload]);

  const reset = useCallback(() => {
    setBatch(null);
    setError(null);
    setIsUploading(false);
    setIsCommitting(false);
    setUploadStartedAt(null);
    setMode('carrier-grid');
  }, []);

  return {
    mode,
    setMode,
    isUploading,
    isCommitting,
    batch,
    error,
    uploadStartedAt,
    preImportClientCount,
    setPreImportClientCount,
    startUpload,
    retryUpload,
    commitImport,
    cancelImport,
    resumeImport,
    acceptMismatch,
    reset,
  };
}
