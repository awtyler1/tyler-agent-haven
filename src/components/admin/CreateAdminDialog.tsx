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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onSuccess?: () => void;
}

export function CreateAdminDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
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
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold hover:text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Admin User</DialogTitle>
          <DialogDescription>
            Create an admin account for a team member
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Caroline Tyler"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="caroline@tylerinsurancegroup.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select 
              value={formData.role}
              onValueChange={(value: 'admin' | 'super_admin') => 
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admins can manage agents. Super Admins can also manage other admins.
            </p>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox 
              id="sendEmail"
              checked={formData.sendSetupEmail}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, sendSetupEmail: checked as boolean }))
              }
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="sendEmail" className="cursor-pointer">Send setup email</Label>
              <p className="text-xs text-muted-foreground">
                They'll receive an email to set their password
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
