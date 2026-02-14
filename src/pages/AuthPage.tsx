import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Mail, CheckCircle2, Send, Eye, EyeOff } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/formatters';
import { logActivity, ActivityAction } from '@/utils/activityLogger';
import AuthLayout from '@/components/auth/AuthLayout';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, getDefaultRoute } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Inquiry form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [isAuthenticated, loading, navigate, getDefaultRoute]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Check if user account is active
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active, first_login_at')
          .eq('user_id', data.user.id)
          .single();

        if (profile && !profile.is_active) {
          // Sign out the inactive user immediately
          await supabase.auth.signOut();
          toast.error('Your account has been deactivated. Please contact support.');
          return;
        }

        // Set first_login_at for agents who haven't had it recorded yet
        if (profile && !profile.first_login_at) {
          await supabase
            .from('profiles')
            .update({ first_login_at: new Date().toISOString() })
            .eq('user_id', data.user.id);
        }
      }

      // Log successful login
      await logActivity(ActivityAction.LOGIN);

      toast.success('Welcome back!');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inquiryName.trim() || !inquiryEmail.trim()) {
      toast.error('Please provide your name and email');
      return;
    }

    // Client-side rate limiting
    const lastSubmission = localStorage.getItem('inquiry_last_submit');
    const cooldownMs = 10 * 60 * 1000; // 10 minutes
    if (lastSubmission && Date.now() - parseInt(lastSubmission) < cooldownMs) {
      const minutesLeft = Math.ceil((cooldownMs - (Date.now() - parseInt(lastSubmission))) / 60000);
      toast.error(`Please wait ${minutesLeft} minute(s) before submitting again.`);
      return;
    }

    setInquirySubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-agent-inquiry', {
        body: {
          name: inquiryName.trim(),
          email: inquiryEmail.trim(),
          phone: inquiryPhone.trim(),
          message: inquiryMessage.trim(),
        },
      });

      if (error) {
        throw error;
      }

      // Store submission time for client-side rate limiting
      localStorage.setItem('inquiry_last_submit', Date.now().toString());

      setInquirySubmitted(true);
      toast.success('Inquiry sent! We\'ll be in touch soon.');
    } catch (err: any) {
      console.error('Inquiry error:', err);
      if (err?.message?.includes('429') || err?.message?.includes('Too many')) {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error('Failed to send inquiry. Please try again or contact us directly.');
      }
    } finally {
      setInquirySubmitting(false);
    }
  };

  const resetInquiryForm = () => {
    setInquiryName('');
    setInquiryEmail('');
    setInquiryPhone('');
    setInquiryMessage('');
    setInquirySubmitted(false);
  };

  if (loading) {
    return (
      <AuthLayout>
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Loader2
            className="animate-spin"
            style={{ color: 'var(--gold)', width: 32, height: 32, margin: '0 auto' }}
          />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>Loading...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Title block */}
      <div style={{ textAlign: 'center', padding: '28px 0 32px' }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600, color: 'var(--text-primary)' }}>
          Welcome
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Sign in to access your account
        </p>
      </div>

      {/* Form area */}
      <div style={{ padding: '0 36px 36px' }}>
        <form onSubmit={handleLogin}>
          {/* Email field */}
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="login-email" className="auth-label">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label htmlFor="login-password" className="auth-label" style={{ marginBottom: 0 }}>Password</label>
              <Link
                to="/auth/forgot-password"
                style={{ fontSize: 12, fontWeight: 500, color: 'var(--gold-dark)', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="auth-input"
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-faint)',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
              </button>
            </div>
          </div>

          {/* Sign In button */}
          <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Loader2 className="animate-spin" size={16} />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: 'linear-gradient(to right, transparent, var(--bg-muted), transparent)',
            margin: '28px 0',
          }}
        />

        {/* Contact section */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Don't have an account? Contact us to get started.
        </p>

        <Dialog open={contactOpen} onOpenChange={(open) => {
          setContactOpen(open);
          if (!open) resetInquiryForm();
        }}>
          <DialogTrigger asChild>
            <button type="button" className="auth-btn-outline">
              <Mail size={16} />
              Contact Us
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Become an Agent</DialogTitle>
              <DialogDescription>
                Fill out the form below and our team will reach out to you.
              </DialogDescription>
            </DialogHeader>

            {inquirySubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Thank you!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We've received your inquiry and will be in touch shortly.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setContactOpen(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-name">Name *</Label>
                    <Input
                      id="inquiry-name"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-phone">Phone</Label>
                    <Input
                      id="inquiry-phone"
                      type="tel"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(formatPhoneNumber(e.target.value))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inquiry-email">Email *</Label>
                  <Input
                    id="inquiry-email"
                    type="email"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inquiry-message">Message</Label>
                  <Textarea
                    id="inquiry-message"
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Tell us about your experience and what you're looking for..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={inquirySubmitting}>
                  {inquirySubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Inquiry
                    </>
                  )}
                </Button>

                {/* Help text */}
                <div className="pt-4 border-t text-center">
                  <p className="text-xs text-muted-foreground">Need help? Contact your administrator.</p>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthLayout>
  );
}
