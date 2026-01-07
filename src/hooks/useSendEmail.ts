import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmailAttachment {
  name: string;
  contentType: string;
  contentBytes: string; // Base64 encoded
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  agentId?: string;
  communicationType?: 'initial_contracting' | 'resend_link' | 'other';
  carriersIncluded?: string[];
}

export interface SendEmailResult {
  success: boolean;
  message?: string;
  sentAt?: string;
  error?: string;
  code?: string;
}

/**
 * Fetches a file from a URL and converts it to base64
 * Works with Supabase storage signed URLs or any accessible URL
 */
export async function fileUrlToBase64(url: string): Promise<{
  contentBytes: string;
  contentType: string;
} | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch file:', response.status, response.statusText);
      return null;
    }

    const blob = await response.blob();
    const contentType = blob.type || 'application/octet-stream';

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Extract base64 portion after the data URL prefix
        const base64 = dataUrl.split(',')[1];
        resolve({ contentBytes: base64, contentType });
      };
      reader.onerror = () => {
        console.error('FileReader error');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error converting file to base64:', err);
    return null;
  }
}

/**
 * Hook for sending emails via Microsoft Graph through our edge function
 */
export function useSendEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (params: SendEmailParams): Promise<SendEmailResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('microsoft-send-email', {
        body: {
          to: params.to,
          subject: params.subject,
          body: params.body,
          attachments: params.attachments,
          agentId: params.agentId,
          communicationType: params.communicationType,
          carriersIncluded: params.carriersIncluded,
        },
      });

      if (fnError) {
        console.error('Send email function error:', fnError);
        const errorMessage = fnError.message || 'Failed to send email';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        const errorMessage = data.message || data.error;
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          code: data.code,
        };
      }

      return {
        success: true,
        message: data.message,
        sentAt: data.sentAt,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error sending email';
      console.error('Send email error:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendEmail,
    isLoading,
    error,
  };
}
