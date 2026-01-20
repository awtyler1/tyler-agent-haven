import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onSuccess?: () => void;
  /** Controlled mode: external open state */
  open?: boolean;
  /** Controlled mode: external open change handler */
  onOpenChange?: (open: boolean) => void;
}

export function CreateAdminDialog({ onSuccess, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'admin' as 'admin' | 'super_admin',
    sendSetupEmail: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          sendSetupEmail: formData.sendSetupEmail,
        },
      });

      if (error) throw error;

      toast.success(data.emailSent 
        ? `${formData.fullName} created and email sent!` 
        : `${formData.fullName} created successfully!`
      );
      
      setOpen(false);
      setFormData({
        fullName: '',
        email: '',
        role: 'admin',
        sendSetupEmail: true,
      });
      onSuccess?.();
    } catch (err: any) {
      console.error('Error creating admin:', err);
      toast.error(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only show trigger button in uncontrolled mode */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold hover:text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Create Admin</DialogTitle>
          <DialogDescription>
            Add a team member with admin access
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Caroline Horn"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
              className="h-11"
            />
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="caroline@tylerinsurancegroup.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="h-11"
            />
          </div>

          {/* Role as card selection */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Role</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  formData.role === 'admin'
                    ? 'border-gold bg-gold/5 ring-1 ring-gold'
                    : 'border-border hover:border-gold/50'
                }`}
              >
                <p className="font-medium text-sm">Admin</p>
                <p className="text-xs text-muted-foreground">Manage agents</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'super_admin' }))}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  formData.role === 'super_admin'
                    ? 'border-gold bg-gold/5 ring-1 ring-gold'
                    : 'border-border hover:border-gold/50'
                }`}
              >
                <p className="font-medium text-sm">Super Admin</p>
                <p className="text-xs text-muted-foreground">Full access</p>
              </button>
            </div>
          </div>

          {/* Send email checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              id="sendEmail"
              checked={formData.sendSetupEmail}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, sendSetupEmail: checked as boolean }))
              }
            />
            <span className="text-sm">Send setup email</span>
          </label>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gold hover:bg-gold/90 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
