// src/components/roadmap/BrokerProfileForm.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  BrokerProfile,
  DEFAULT_BROKER_PROFILE,
  PERSONALITY_OPTIONS,
  PHONE_COMFORT_OPTIONS,
} from '@/types/roadmap';
import {
  User,
  Briefcase,
  Target,
  Sparkles,
  Loader2,
  Save,
} from 'lucide-react';

interface BrokerProfileFormProps {
  initialData?: Partial<BrokerProfile>;
  managerName: string;
  managerId?: string;
  onSubmit: (profile: BrokerProfile) => Promise<void>;
  onGenerate: (profile: BrokerProfile) => Promise<void>;
  isSubmitting?: boolean;
  isGenerating?: boolean;
}

export function BrokerProfileForm({
  initialData,
  managerName,
  managerId,
  onSubmit,
  onGenerate,
  isSubmitting = false,
  isGenerating = false,
}: BrokerProfileFormProps) {
  const [profile, setProfile] = useState<BrokerProfile>({
    ...DEFAULT_BROKER_PROFILE,
    broker_name: '',
    manager_name: managerName,
    manager_id: managerId,
    ...initialData,
  });

  // Update when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setProfile((prev) => ({
        ...prev,
        ...initialData,
        manager_name: managerName,
        manager_id: managerId,
      }));
    }
  }, [initialData, managerName, managerId]);

  const updateField = <K extends keyof BrokerProfile>(
    field: K,
    value: BrokerProfile[K]
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile.broker_name.trim()) {
      return;
    }
    await onSubmit(profile);
  };

  const handleGenerate = async () => {
    if (!profile.broker_name.trim()) {
      return;
    }
    await onGenerate(profile);
  };

  const isValid = profile.broker_name.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Broker Information */}
      <div className="bg-white rounded-xl border border-[#E5E2DB] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <User className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Broker Information</h3>
            <p className="text-sm text-muted-foreground">
              Basic details about the broker
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="broker_name">
              Broker Name <span className="text-amber-500">*</span>
            </Label>
            <Input
              id="broker_name"
              value={profile.broker_name}
              onChange={(e) => updateField('broker_name', e.target.value)}
              placeholder="Full name"
              className="h-11 rounded-xl bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager_name">Manager</Label>
            <Input
              id="manager_name"
              value={profile.manager_name}
              disabled
              className="h-11 rounded-xl bg-slate-100 text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="months_in_business">Months in Business</Label>
            <Input
              id="months_in_business"
              type="number"
              min="0"
              value={profile.months_in_business}
              onChange={(e) =>
                updateField('months_in_business', parseInt(e.target.value) || 0)
              }
              className="h-11 rounded-xl bg-slate-50"
            />
            <p className="text-xs text-muted-foreground">
              0-6 = Foundation · 6-18 = Growth · 18+ = Expansion
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="book_size">Current Book Size</Label>
            <Input
              id="book_size"
              type="number"
              min="0"
              value={profile.book_size}
              onChange={(e) =>
                updateField('book_size', parseInt(e.target.value) || 0)
              }
              placeholder="Number of clients"
              className="h-11 rounded-xl bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-white rounded-xl border border-[#E5E2DB] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Production Goal</h3>
            <p className="text-sm text-muted-foreground">
              Monthly target for this broker
            </p>
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="monthly_goal">Plans per Month</Label>
          <Input
            id="monthly_goal"
            type="number"
            min="1"
            max="50"
            value={profile.monthly_goal}
            onChange={(e) =>
              updateField('monthly_goal', parseInt(e.target.value) || 6)
            }
            className="h-11 rounded-xl bg-slate-50"
          />
          <p className="text-xs text-muted-foreground">
            Typical range: 6-10 plans/month for growth mode
          </p>
        </div>
      </div>

      {/* Profile Assessment */}
      <div className="bg-white rounded-xl border border-[#E5E2DB] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Profile Assessment</h3>
            <p className="text-sm text-muted-foreground">
              Helps match growth channels to strengths
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="personality">Personality Style</Label>
            <Select
              value={profile.personality}
              onValueChange={(v) =>
                updateField('personality', v as BrokerProfile['personality'])
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONALITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_comfort">Phone Comfort Level</Label>
            <Select
              value={String(profile.phone_comfort)}
              onValueChange={(v) =>
                updateField(
                  'phone_comfort',
                  parseInt(v) as BrokerProfile['phone_comfort']
                )
              }
            >
              <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHONE_COMFORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="strengths">Key Strengths (Optional)</Label>
            <Textarea
              id="strengths"
              value={profile.strengths || ''}
              onChange={(e) => updateField('strengths', e.target.value)}
              placeholder="e.g., Natural relationship builder, detail-oriented, great with seniors..."
              className="rounded-xl bg-slate-50 min-h-[80px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="community_connections"
              checked={profile.community_connections}
              onCheckedChange={(checked) =>
                updateField('community_connections', !!checked)
              }
            />
            <Label
              htmlFor="community_connections"
              className="cursor-pointer font-normal"
            >
              Has existing community connections
            </Label>
          </div>
        </div>
      </div>

      {/* Resource Access */}
      <div className="bg-white rounded-xl border border-[#E5E2DB] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Resource Access</h3>
            <p className="text-sm text-muted-foreground">
              What resources does this broker have?
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="mira_access"
              checked={profile.mira_access}
              onCheckedChange={(checked) =>
                updateField('mira_access', !!checked)
              }
            />
            <Label htmlFor="mira_access" className="cursor-pointer font-normal">
              MIRA Portal Access (UHC Lead Portal)
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="seminar_assigned"
              checked={profile.seminar_assigned}
              onCheckedChange={(checked) =>
                updateField('seminar_assigned', !!checked)
              }
            />
            <Label
              htmlFor="seminar_assigned"
              className="cursor-pointer font-normal"
            >
              Seminar Assigned
            </Label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={!isValid || isSubmitting || isGenerating}
          className="h-11 px-5"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Profile
        </Button>

        <Button
          onClick={handleGenerate}
          disabled={!isValid || isGenerating || isSubmitting}
          className="h-11 px-5 bg-gold hover:bg-gold/90 text-white"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Roadmap
        </Button>
      </div>
    </div>
  );
}
