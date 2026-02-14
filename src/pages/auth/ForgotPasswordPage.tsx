import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/set-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
          {/* Green check circle */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(107,138,66,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <CheckCircle size={26} style={{ color: 'var(--green)' }} />
          </div>
          <h1
            style={{
              fontFamily: "'Lora', serif",
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: 20,
            }}
          >
            Check Your Email
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            We sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
          </p>
        </div>

        <div style={{ padding: '16px 36px 36px' }}>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Click the link in the email to reset your password. The link will expire in 24 hours.
          </p>

          {/* Back to Sign In outline button */}
          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <button type="button" className="auth-btn-outline">
              <ArrowLeft size={16} />
              Back to Sign In
            </button>
          </Link>

          {/* Help text */}
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 16 }}>
            Didn't receive the email? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gold-dark)',
                fontSize: 11,
                padding: 0,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              try again
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Request form state
  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
        {/* Mail icon circle */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(201,168,76,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <Mail size={26} style={{ color: 'var(--gold-dark)' }} />
        </div>
        <h1
          style={{
            fontFamily: "'Lora', serif",
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginTop: 20,
          }}
        >
          Forgot Password?
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Enter your email and we'll send a reset link
        </p>
      </div>

      <div style={{ padding: '24px 36px 36px' }}>
        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div style={{ marginBottom: 24 }}>
            <label htmlFor="email" className="auth-label">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          {/* Send Reset Link button */}
          <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Loader2 className="animate-spin" size={16} />
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to Sign In link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link
            to="/auth"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12.5,
              color: 'var(--text-muted)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
