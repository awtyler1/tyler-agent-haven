import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UploadStatus = 'idle' | 'reading' | 'processing' | 'saving' | 'complete' | 'error';

export interface ActiveUpload {
  id: string;
  carrierId: string;
  carrierCode: string;
  carrierName: string;
  fileName: string;
  fileSize: number;
  status: UploadStatus;
  progress: number;
  stats?: {
    imported: number;
    updated: number;
    skipped: number;
    total: number;
  };
  uploadId?: string;
  error?: string;
  startedAt: number;
}

interface UploadContextType {
  activeUploads: ActiveUpload[];
  startUpload: (params: {
    file: File;
    carrierId: string;
    carrierCode: string;
    carrierName: string;
    profileId: string;
    onProgress?: (progress: number) => void;
    onComplete?: (upload: ActiveUpload) => void;
    onError?: (error: Error) => void;
  }) => string;
  cancelUpload: (uploadId: string) => void;
  clearCompleted: () => void;
  getUpload: (id: string) => ActiveUpload | undefined;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);

  const updateUpload = useCallback((id: string, updates: Partial<ActiveUpload>) => {
    setActiveUploads(prev =>
      prev.map(u => u.id === id ? { ...u, ...updates } : u)
    );
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const startUpload = useCallback(({
    file,
    carrierId,
    carrierCode,
    carrierName,
    profileId,
    onProgress,
    onComplete,
    onError,
  }: {
    file: File;
    carrierId: string;
    carrierCode: string;
    carrierName: string;
    profileId: string;
    onProgress?: (progress: number) => void;
    onComplete?: (upload: ActiveUpload) => void;
    onError?: (error: Error) => void;
  }) => {
    const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newUpload: ActiveUpload = {
      id,
      carrierId,
      carrierCode,
      carrierName,
      fileName: file.name,
      fileSize: file.size,
      status: 'reading',
      progress: 0,
      startedAt: Date.now(),
    };

    setActiveUploads(prev => [...prev, newUpload]);

    // Run upload in background (not tied to component lifecycle)
    (async () => {
      try {
        // Stage 1: Reading
        updateUpload(id, { status: 'reading', progress: 15 });
        onProgress?.(15);
        const base64Content = await fileToBase64(file);

        // Stage 2: Processing
        updateUpload(id, { status: 'processing', progress: 40 });
        onProgress?.(40);

        const { data, error: fnError } = await supabase.functions.invoke('parse-production-report', {
          body: {
            file: base64Content,
            carrier_code: carrierCode,
            profile_id: profileId,
          },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        // Stage 3: Saving
        updateUpload(id, { status: 'saving', progress: 80 });
        onProgress?.(80);
        await new Promise(resolve => setTimeout(resolve, 400));

        // Stage 4: Complete
        const finalUpload: ActiveUpload = {
          ...newUpload,
          status: 'complete',
          progress: 100,
          stats: data.stats,
          uploadId: data.upload_id,
        };

        updateUpload(id, finalUpload);
        onProgress?.(100);
        onComplete?.(finalUpload);

      } catch (error) {
        console.error('Upload failed:', error);
        const err = error instanceof Error ? error : new Error('Upload failed');
        updateUpload(id, {
          status: 'error',
          error: err.message,
          progress: 0,
        });
        onError?.(err);
      }
    })();

    return id;
  }, [updateUpload]);

  const cancelUpload = useCallback((id: string) => {
    // Note: Can't truly cancel in-flight fetch, but we can mark it
    setActiveUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setActiveUploads(prev => prev.filter(u => u.status !== 'complete' && u.status !== 'error'));
  }, []);

  const getUpload = useCallback((id: string) => {
    return activeUploads.find(u => u.id === id);
  }, [activeUploads]);

  return (
    <UploadContext.Provider value={{
      activeUploads,
      startUpload,
      cancelUpload,
      clearCompleted,
      getUpload,
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
