import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Mail, Phone, CheckCircle2, Send } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';
import { formatPhoneNumber } from '@/lib/formatters';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, getDefaultRoute } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  
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
          .select('is_active')
          .eq('user_id', data.user.id)
          .single();

        if (profile && !profile.is_active) {
          // Sign out the inactive user immediately
          await supabase.auth.signOut();
          toast.error('Your account has been deactivated. Please contact support.');
          return;
        }
      }

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img src={tylerLogo} alt="Tyler Insurance Group" className="h-12 mx-auto" />
          <div>
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to access your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Link 
                  to="/auth/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          {/* Contact section */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Don't have an account? Contact us to get started.
            </p>
            <Dialog open={contactOpen} onOpenChange={(open) => {
              setContactOpen(open);
              if (!open) resetInquiryForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Us
                </Button>
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
                    
                    {/* Direct contact fallback */}
                    <div className="pt-4 border-t text-center">
                      <p className="text-xs text-muted-foreground mb-2">Or reach us directly:</p>
                      <div className="flex justify-center gap-4 text-xs">
                        <a href="tel:8596196672" className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3 w-3" />
                          Austin
                        </a>
                        <a href="tel:2107225597" className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3 w-3" />
                          Andrew
                        </a>
                      </div>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
