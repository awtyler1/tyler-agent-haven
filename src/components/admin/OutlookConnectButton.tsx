import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, Check, Loader2, AlertCircle } from 'lucide-react';

export function OutlookConnectButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to connect Outlook');
      }

      // Check if token is expired
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();

      if (now > expiresAt) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('Session expired. Please log in again.');
        }
      }

      const { data, error: fnError } = await supabase.functions.invoke('microsoft-oauth-start');

      if (fnError) {
        console.error('OAuth function error:', fnError);
        throw new Error(fnError.message || 'Edge function error');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned from function');
      }
    } catch (err) {
      console.error('OAuth start error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start OAuth');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleConnect}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Connect Outlook
      </Button>
      
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
