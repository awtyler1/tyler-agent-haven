// src/components/roadmap/BrokerProfileForm.tsx
// V5 - Simplified form focused on goals and assigned resources

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BrokerProfile,
  DEFAULT_BROKER_PROFILE,
  COMMISSION,
} from '@/types/roadmap';
import {
  User,
  Target,
  Briefcase,
  Sparkles,
  Loader2,
  Save,
  Calculator,
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

  // Calculate preview economics
  const t65Monthly = Math.floor(profile.monthly_goal / 2);
  const planChangeMonthly = profile.monthly_goal - t65Monthly;
  const monthlyIncome = (t65Monthly * COMMISSION.T65) + (planChangeMonthly * COMMISSION.PLAN_CHANGE);
  const leadStarExpected = Math.round(profile.lead_star_leads * 0.15);

  return (
    <div className="space-y-6">
      {/* Broker Information */}
      <div className="bg-white rounded-xl border border-[#E5E2DB] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <User className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Agent Information</h3>
            <p className="text-sm text-muted-foreground">
              Basic details about the agent
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="broker_name">
              Agent Name <span className="text-amber-500">*</span>
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
              value="TIG Leadership"
              disabled
              className="h-11 rounded-xl bg-slate-100 text-muted-foreground"
            />
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
            <p className="text-xs text-muted-foreground">
              Client Touchpoints channel activates at 16+ clients
            </p>
          </div>
        </div>
      </div>

      {/* Production Goal */}
      <div className="bg-white rounded-xl border border-[#E5E2DB] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Production Goal</h3>
            <p className="text-sm text-muted-foreground">
              Monthly target - all channel activities scale from this
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
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
          </div>

          {/* Economics Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-slate-700">Economics Preview</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>{t65Monthly} T65 + {planChangeMonthly} Plan Changes (50/50 split)</p>
              <p className="text-gold font-semibold">
                ~${monthlyIncome.toLocaleString()}/month first-year income
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Resources */}
      <div className="bg-white rounded-xl border border-[#E5E2DB] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Assigned Resources</h3>
            <p className="text-sm text-muted-foreground">
              Resources allocated by TIG Leadership
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lead_star_leads">Lead Star Leads / Month</Label>
            <Input
              id="lead_star_leads"
              type="number"
              min="0"
              value={profile.lead_star_leads}
              onChange={(e) =>
                updateField('lead_star_leads', parseInt(e.target.value) || 0)
              }
              placeholder="0 if not assigned"
              className="h-11 rounded-xl bg-slate-50"
            />
            {profile.lead_star_leads > 0 && (
              <p className="text-xs text-muted-foreground">
                At 15% close rate → ~{leadStarExpected} expected sales
              </p>
            )}
          </div>

          {/* Seminars */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="seminar_eligible"
                checked={profile.seminar_eligible}
                onCheckedChange={(checked) =>
                  updateField('seminar_eligible', !!checked)
                }
              />
              <div>
                <Label htmlFor="seminar_eligible" className="cursor-pointer">Eligible for Seminars</Label>
                <p className="text-xs text-slate-500">
                  Check if this agent will be included in seminar assignments
                </p>
              </div>
            </div>

            {profile.seminar_eligible && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="seminars_planned">Seminars Already Planned (optional)</Label>
                <Input
                  id="seminars_planned"
                  type="number"
                  min={0}
                  max={10}
                  value={profile.seminars_planned || 0}
                  onChange={(e) =>
                    updateField('seminars_planned', parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="h-11 rounded-xl bg-slate-50 max-w-[150px]"
                />
                <p className="text-xs text-slate-500">
                  {profile.seminars_planned && profile.seminars_planned > 0
                    ? `${profile.seminars_planned} seminar${profile.seminars_planned > 1 ? 's' : ''} will appear in roadmap`
                    : 'Leave at 0 if seminars not yet scheduled - roadmap will show "To be assigned"'}
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Checkbox
                id="mira_access"
                checked={profile.mira_access}
                onCheckedChange={(checked) =>
                  updateField('mira_access', !!checked)
                }
              />
              <Label htmlFor="mira_access" className="cursor-pointer font-normal">
                MIRA Portal Access (UHC real-time leads)
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Preview */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Channels that will be assigned:</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-gold/10 text-gold text-xs font-medium rounded-full">
            Circle of Influence
          </span>
          <span className="px-3 py-1 bg-gold/10 text-gold text-xs font-medium rounded-full">
            Client Referrals
          </span>
          <span className="px-3 py-1 bg-gold/10 text-gold text-xs font-medium rounded-full">
            Professional Partners
          </span>
          {profile.book_size > 15 && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              + Client Touchpoints
            </span>
          )}
          {profile.lead_star_leads > 0 && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              + Lead Star
            </span>
          )}
          {profile.mira_access && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              + MIRA Portal
            </span>
          )}
          {profile.seminar_eligible && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              + Seminars {profile.seminars_planned && profile.seminars_planned > 0 ? `(${profile.seminars_planned} planned)` : '(TBA)'}
            </span>
          )}
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
