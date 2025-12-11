import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Mail, Phone } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, getDefaultRoute } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Us
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Get in Touch</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Interested in becoming an agent with Tyler Insurance Group? Reach out to our team.
                  </p>
                  
                  {/* Austin */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="font-medium">Austin Tyler, MBA</p>
                    <p className="text-sm text-muted-foreground mb-2">Broker Development</p>
                    <div className="flex flex-col gap-2">
                      <a href="tel:8596196672" className="text-sm flex items-center gap-2 text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5" />
                        (859) 619-6672
                      </a>
                      <a href="mailto:austin@tylerinsurancegroup.com" className="text-sm flex items-center gap-2 text-primary hover:underline">
                        <Mail className="h-3.5 w-3.5" />
                        austin@tylerinsurancegroup.com
                      </a>
                    </div>
                  </div>

                  {/* Andrew */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="font-medium">Andrew Horn, MHA</p>
                    <p className="text-sm text-muted-foreground mb-2">Broker Development</p>
                    <div className="flex flex-col gap-2">
                      <a href="tel:2107225597" className="text-sm flex items-center gap-2 text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5" />
                        (210) 722-5597
                      </a>
                      <a href="mailto:andrew@tylerinsurancegroup.com" className="text-sm flex items-center gap-2 text-primary hover:underline">
                        <Mail className="h-3.5 w-3.5" />
                        andrew@tylerinsurancegroup.com
                      </a>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
