import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Mail, 
  User, 
  Shield, 
  Clock, 
  Send, 
  CheckCircle2, 
  Circle,
  Loader2,
  FileText,
  Power,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  onboarding_status: string;
  created_at: string;
  setup_link_sent_at: string | null;
  password_created_at: string | null;
  first_login_at: string | null;
  appointed_at: string | null;
  role: string | null;
  is_active: boolean;
}

type AppRole = 'super_admin' | 'contracting_admin' | 'broker_manager' | 'agent';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  contracting_admin: 'Contracting Admin',
  broker_manager: 'Broker Manager',
  agent: 'Agent',
};

const onboardingStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  CONTRACTING_REQUIRED: { label: 'Contracting Required', variant: 'destructive' },
  CONTRACT_SUBMITTED: { label: 'Contract Submitted', variant: 'outline' },
  APPOINTED: { label: 'Appointed', variant: 'default' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive' },
};

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLink, setSendingLink] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Editable fields
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!userId) return;
      
      setLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) throw profileError;

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        const userData = {
          ...profile,
          role: roleData?.role || null,
          is_active: profile.is_active ?? true,
        };
        
        setUser(userData);
        setEditedName(userData.full_name || '');
        setEditedEmail(userData.email || '');
      } catch (err: any) {
        console.error('Error fetching user:', err);
        toast.error('Failed to load user');
        navigate('/admin/super');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId, navigate]);

  useEffect(() => {
    if (user) {
      const nameChanged = editedName !== (user.full_name || '');
      const emailChanged = editedEmail !== (user.email || '');
      setHasChanges(nameChanged || emailChanged);
    }
  }, [editedName, editedEmail, user]);

  const handleSendSetupLink = async () => {
    if (!user) return;
    setSendingLink(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-setup-link', {
        body: { userId: user.user_id },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast.success('Setup link sent successfully');
      // Refresh user data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      
      if (updatedProfile) {
        setUser(prev => prev ? { ...prev, ...updatedProfile } : null);
      }
    } catch (err: any) {
      toast.error(`Failed to send setup link: ${err.message}`);
    } finally {
      setSendingLink(false);
    }
  };

  const handleRoleChange = async (newRole: AppRole) => {
    if (!user) return;
    setUpdatingRole(true);
    try {
      await supabase.from('user_roles').delete().eq('user_id', user.user_id);
      const { error } = await supabase.from('user_roles').insert({ user_id: user.user_id, role: newRole });
      if (error) throw error;

      toast.success('Role updated successfully');
      setUser(prev => prev ? { ...prev, role: newRole } : null);
    } catch (err: any) {
      toast.error(`Failed to update role: ${err.message}`);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setTogglingActive(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast.success(user.is_active ? 'Account deactivated' : 'Account activated');
      setUser(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    } catch (err: any) {
      toast.error(`Failed to update account status: ${err.message}`);
    } finally {
      setTogglingActive(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: editedName || null,
          email: editedEmail || null 
        })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setUser(prev => prev ? { ...prev, full_name: editedName || null, email: editedEmail || null } : null);
      setHasChanges(false);
    } catch (err: any) {
      toast.error(`Failed to update profile: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelChanges = () => {
    if (user) {
      setEditedName(user.full_name || '');
      setEditedEmail(user.email || '');
      setHasChanges(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    setUpdatingStatus(true);
    try {
      const updateData: Record<string, any> = { onboarding_status: newStatus };
      if (newStatus === 'APPOINTED' && !user.appointed_at) {
        updateData.appointed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast.success('Status updated successfully');
      setUser(prev => prev ? { ...prev, onboarding_status: newStatus, appointed_at: updateData.appointed_at || prev.appointed_at } : null);
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const timelineEvents = user ? [
    { 
      label: 'Account Created', 
      date: user.created_at, 
      completed: true,
      icon: User 
    },
    { 
      label: 'Setup Link Sent', 
      date: user.setup_link_sent_at, 
      completed: !!user.setup_link_sent_at,
      icon: Send 
    },
    { 
      label: 'Password Created', 
      date: user.password_created_at, 
      completed: !!user.password_created_at,
      icon: Shield 
    },
    { 
      label: 'First Login', 
      date: user.first_login_at, 
      completed: !!user.first_login_at,
      icon: CheckCircle2 
    },
    { 
      label: 'Appointed', 
      date: user.appointed_at, 
      completed: !!user.appointed_at,
      icon: FileText 
    },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const onboardingInfo = onboardingStatusLabels[user.onboarding_status] || { label: user.onboarding_status, variant: 'outline' as const };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/super')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{user.full_name || 'Unnamed User'}</h1>
                {!user.is_active && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user.role === 'agent' ? onboardingInfo.variant : 'secondary'} className="text-sm px-3 py-1">
                {user.role === 'agent' ? onboardingInfo.label : roleLabels[user.role || 'agent']}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Profile Information</CardTitle>
              {hasChanges && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelChanges}
                    disabled={savingProfile}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Power className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Account Active</p>
                  <p className="text-sm text-muted-foreground">
                    {user.is_active ? 'User can access the platform' : 'User is blocked from accessing'}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Switch
                      checked={user.is_active}
                      disabled={togglingActive}
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {user.is_active ? 'Deactivate Account?' : 'Activate Account?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {user.is_active 
                          ? 'This will prevent the user from accessing the platform. They can be reactivated later.'
                          : 'This will restore the user\'s access to the platform.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleToggleActive}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">{/* User Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role */}
              <div className="space-y-2">
                <Label>Role</Label>
                {updatingRole ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <Select
                    value={user.role || 'agent'}
                    onValueChange={(value) => handleRoleChange(value as AppRole)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Onboarding Status - only for agents */}
              {user.role === 'agent' && (
                <div className="space-y-2">
                  <Label>Onboarding Status</Label>
                  {updatingStatus ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    <Select
                      value={user.onboarding_status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(onboardingStatusLabels).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Send Setup Link */}
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleSendSetupLink}
                  disabled={sendingLink}
                  className="w-full"
                >
                  {sendingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {user.setup_link_sent_at ? 'Resend Setup Link' : 'Send Setup Link'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineEvents.map((event, index) => {
                  const Icon = event.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-0.5 ${event.completed ? 'text-primary' : 'text-muted-foreground/40'}`}>
                        {event.completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${event.completed ? '' : 'text-muted-foreground/60'}`}>
                          {event.label}
                        </p>
                        {event.date ? (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.date), 'MMM d, yyyy \'at\' h:mm a')}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">
                            Not yet
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}