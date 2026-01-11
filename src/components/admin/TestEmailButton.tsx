import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function TestEmailButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleTestEmail = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Get the logged-in user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase.functions.invoke('microsoft-send-email', {
        body: {
          to: user.email,
          subject: 'TIG Platform Test Email',
          body: `
            <h2>Test Email from TIG Agent Platform</h2>
            <p>If you're seeing this, the Microsoft Graph integration is working correctly!</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated test email.</p>
          `,
        },
      });

      console.log('Send email response:', { data, error });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      setStatus('success');
      setMessage('Test email sent! Check your inbox.');
    } catch (err) {
      console.error('Test email error:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleTestEmail}
        disabled={loading}
        variant={status === 'success' ? 'outline' : 'default'}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {loading ? 'Sending...' : status === 'success' ? 'Email Sent!' : 'Send Test Email'}
      </Button>
      
      {message && (
        <p className={`text-sm flex items-center gap-1 ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {status === 'error' && <AlertCircle className="h-4 w-4" />}
          {message}
        </p>
      )}
    </div>
  );
}

