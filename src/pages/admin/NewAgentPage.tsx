import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, UserPlus, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import type { Profile } from '@/hooks/useProfile';

export default function NewAgentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<Profile[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    managerId: '',
  });

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const { data: managerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'manager');

      if (managerRoles && managerRoles.length > 0) {
        const managerIds = managerRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', managerIds);
        
        if (profiles) {
          setManagers(profiles as Profile[]);
        }
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-agent', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          managerId: formData.managerId || null,
        },
      });

      if (error) throw error;

      toast.success('Agent created successfully! Welcome email sent.');
      navigate('/admin/agents');
    } catch (err: any) {
      console.error('Error creating agent:', err);
      toast.error(err.message || 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="max-w-xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin/agents">
              <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="heading-section">Add New Agent</h1>
              <p className="text-sm text-muted-foreground">Create a new agent account</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#E5E2DB] rounded-xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Agent Information</h2>
                <p className="text-xs text-muted-foreground">
                  They will receive a welcome email with setup instructions
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="border-[#E5E2DB] focus:border-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="border-[#E5E2DB] focus:border-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager" className="text-sm font-medium">Assign Manager (Optional)</Label>
                <Select
                  value={formData.managerId || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value === "none" ? "" : value }))}
                >
                  <SelectTrigger className="border-[#E5E2DB]">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No manager</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name || manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The assigned manager will be able to view this agent's progress.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/agents')}
                  className="border-[#E5E2DB]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-gold hover:bg-gold/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Agent
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
