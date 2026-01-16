# Strategic Growth Roadmap Generator - Context Document

This document contains all the context needed to build a Strategic Growth Roadmap Generator feature for the TIG Platform.

---

## 1. Project Structure

### TSX Files (React Components)
```
src/App.tsx
src/components/admin/AgentDocumentsCard.tsx
src/components/admin/CarrierManagement.tsx
src/components/admin/CarrierStatusPanel.tsx
src/components/admin/ContractingSubmissionDetail.tsx
src/components/admin/CreateAdminDialog.tsx
src/components/admin/CreateUserDialog.tsx
src/components/admin/DevOpsDocumentation.tsx
src/components/admin/HierarchyAssignmentPanel.tsx
src/components/admin/HierarchyManagement.tsx
src/components/admin/OutlookConnectButton.tsx
src/components/admin/queue/AgentList.tsx
src/components/admin/queue/AgentPanel.tsx
src/components/admin/StateDefaultsManagement.tsx
src/components/admin/SystemStatusCard.tsx
src/components/admin/TestEmailButton.tsx
src/components/admin/UserManagementTable.tsx
src/components/AgentChatWidget.tsx
src/components/AgentProfileDropdown.tsx
src/components/contracting/AddressAutocomplete.tsx
src/components/contracting/ContractingForm.tsx
src/components/contracting/FileDropZone.tsx
src/components/contracting/FormFieldError.tsx
src/components/contracting/InitialsAcknowledgmentBar.tsx
src/components/contracting/InitialsPad.tsx
src/components/contracting/SectionAcknowledgment.tsx
src/components/contracting/SectionNav.tsx
src/components/contracting/sections/AdditionalLicensesSection.tsx
src/components/contracting/sections/AddressSection.tsx
src/components/contracting/sections/AgreementsSection.tsx
src/components/contracting/sections/BackgroundQuestionsSection1.tsx
src/components/contracting/sections/BackgroundQuestionsSection2.tsx
src/components/contracting/sections/BackgroundSignatureSection.tsx
src/components/contracting/sections/BankingSection.tsx
src/components/contracting/sections/DocumentsSection.tsx
src/components/contracting/sections/HomeAddressSection.tsx
src/components/contracting/sections/InitialsEntrySection.tsx
src/components/contracting/sections/LegalQuestionsSection.tsx
src/components/contracting/sections/LicensingSection.tsx
src/components/contracting/sections/MailingShippingSection.tsx
src/components/contracting/sections/MarketingConsentSection.tsx
src/components/contracting/sections/PersonalInfoSection.tsx
src/components/contracting/sections/SignatureSection.tsx
src/components/contracting/sections/SignSubmitSection.tsx
src/components/contracting/sections/TrainingSection.tsx
src/components/contracting/SendToPinnacleModal.tsx
src/components/contracting/SignaturePad.tsx
src/components/contracting/SuccessModal.tsx
src/components/contracting/ValidationBanner.tsx
src/components/DarkModeToggle.tsx
```

### TS Files (Hooks, Types, Utilities)
```
src/components/ui/use-toast.ts
src/data/carriersData.ts
src/data/trainingVideos.ts
src/hooks/use-toast.ts
src/hooks/useAgentProfile.ts
src/hooks/useAuth.ts
src/hooks/useContractingApplication.ts
src/hooks/useContractingPdf.ts
src/hooks/useContractingValidation.ts
src/hooks/useDarkMode.ts
src/hooks/useFormValidation.ts
src/hooks/useProfile.ts
src/hooks/useRole.ts
src/hooks/useSendEmail.ts
src/hooks/useSystemStatus.ts
src/hooks/useUserManagement.ts
src/integrations/supabase/client.ts
src/integrations/supabase/types.ts
src/lib/confetti.ts
src/lib/errors.ts
src/lib/formatters.ts
src/lib/utils.ts
src/pages/admin/__fixtures__/sampleContractingPayload.ts
src/types/contracting.ts
src/utils/activityLogger.ts
src/vite-env.d.ts
```

### Admin Pages
```
src/pages/admin/ManagersPage.tsx
src/pages/admin/NewManagerPage.tsx
src/pages/admin/PdfFieldExtractorPage.tsx
src/pages/admin/AdminSettingsPage.tsx
src/pages/admin/HierarchyManagementPage.tsx
src/pages/admin/PlatformMapPage.tsx
src/pages/admin/UserDetailPage.tsx
src/pages/admin/AgentsPage.tsx
src/pages/admin/ActivityLogPage.tsx
src/pages/admin/AdminDashboard.tsx
src/pages/admin/ContractingQueuePage.tsx
src/pages/admin/NewAgentPage.tsx
src/pages/admin/PdfFieldAuditPage.tsx
src/pages/admin/PdfFieldMapperPage.tsx
```

### Edge Functions
```
supabase/functions/microsoft-oauth-callback/index.ts
supabase/functions/agent-chat/index.ts
supabase/functions/agent-chat-rag/index.ts
supabase/functions/create-admin/index.ts
supabase/functions/create-agent/index.ts
supabase/functions/delete-user/index.ts
supabase/functions/extract-pdf-fields/index.ts
supabase/functions/fetch-edge-logs/index.ts
supabase/functions/generate-contracting-pdf/index.ts
supabase/functions/microsoft-oauth-start/index.ts
supabase/functions/microsoft-send-email/index.ts
supabase/functions/pdf-field-audit/index.ts
supabase/functions/process-document/index.ts
supabase/functions/reset-contracting-status/index.ts
supabase/functions/reset-user-password/index.ts
supabase/functions/send-agent-inquiry/index.ts
supabase/functions/send-contracting-packet/index.ts
supabase/functions/send-setup-link/index.ts
supabase/functions/validate-password/index.ts
```

---

## 2. Database Types (Supabase)

### Profiles Table (Key for user data)
```typescript
profiles: {
  Row: {
    appointed_at: string | null
    assigned_carriers: string[] | null
    contracting_notes: string | null
    created_at: string
    developer_access: boolean | null
    email: string | null
    excluded_carriers: string[] | null
    first_login_at: string | null
    full_name: string | null
    hierarchy_entity_id: string | null
    hierarchy_type: string | null
    id: string
    is_active: boolean
    is_test: boolean | null
    manager_id: string | null
    onboarding_status: Database["public"]["Enums"]["onboarding_status"]
    password_created_at: string | null
    setup_link_sent_at: string | null
    updated_at: string
    upline_user_id: string | null
    user_id: string
  }
  // Insert and Update types available in full types file
}
```

### Enums
```typescript
app_role: "super_admin" | "admin" | "manager" | "independent_agent" | "internal_tig_agent"
onboarding_status: "CONTRACTING_REQUIRED" | "CONTRACTING_SUBMITTED" | "APPOINTED" | "SUSPENDED"
```

### Other Key Tables
- `carriers` - Insurance carrier information
- `carrier_statuses` - Agent's status with each carrier
- `contracting_applications` - Full contracting form data
- `hierarchy_entities` - Organization hierarchy
- `user_roles` - User role assignments

---

## 3. Tailwind Config & Brand Colors

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        cream: "hsl(var(--cream))",
        charcoal: "hsl(var(--charcoal))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### CSS Variables (src/index.css) - Brand Colors
```css
:root {
  --background: 0 0% 100%;
  --foreground: 30 10% 15%;
  --card: 0 0% 100%;
  --card-foreground: 30 10% 15%;
  --popover: 0 0% 100%;
  --popover-foreground: 30 10% 15%;

  /* Gold accent from the logo - PRIMARY BRAND COLOR */
  --primary: 43 56% 41%;
  --primary-foreground: 0 0% 100%;

  --secondary: 40 20% 96%;
  --secondary-foreground: 30 10% 15%;
  --muted: 40 15% 95%;
  --muted-foreground: 30 8% 35%;
  --accent: 43 56% 41%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 40 20% 90%;
  --input: 40 20% 90%;
  --ring: 43 56% 41%;
  --radius: 0.5rem;

  /* Custom tokens - USE THESE */
  --gold: 43 56% 41%;           /* Primary gold accent */
  --gold-light: 43 40% 85%;     /* Light gold for backgrounds */
  --gold-dark: 43 60% 32%;      /* Dark gold for hover states */
  --cream: 40 30% 98%;          /* Cream background */
  --charcoal: 30 10% 15%;       /* Dark text color */

  /* Typography */
  --font-serif: "Playfair Display", Georgia, serif;  /* Headings */
  --font-sans: "Inter", system-ui, sans-serif;       /* Body text */
}
```

---

## 4. Example Admin Page (AdminDashboard.tsx)

```tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  FileText,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle,
  Settings,
  RotateCcw,
  Loader2,
  Building2,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

interface DashboardStats {
  totalAgents: number;
  inContracting: number;
  appointed: number;
}

interface AttentionItem {
  id: string;
  userId: string;
  name: string;
  reason: string;
  daysAgo: number;
  type: 'contracting_stale' | 'issue' | 'new_submission';
}

interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    inContracting: 0,
    appointed: 0,
  });
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [newSubmissions, setNewSubmissions] = useState(0);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-serif font-semibold text-foreground mb-1">
              Welcome back, {firstName}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your agents
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalAgents}</p>
                  <p className="text-sm text-muted-foreground">Total Agents</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.inContracting}</p>
                  <p className="text-sm text-muted-foreground">In Contracting</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.appointed}</p>
                  <p className="text-sm text-muted-foreground">Appointed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-10">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => navigate('/admin/agents/new')}
                className="h-auto py-6 flex flex-col items-center gap-2 bg-white border border-[#E5E2DB] text-foreground hover:border-gold hover:bg-gold/5 shadow-sm"
                variant="outline"
              >
                <UserPlus className="w-6 h-6 text-gold" />
                Add Agent
              </Button>

              <Button
                onClick={() => navigate('/admin/contracting')}
                className="h-auto py-6 flex flex-col items-center gap-2 bg-white border border-[#E5E2DB] text-foreground hover:border-gold hover:bg-gold/5 shadow-sm relative"
                variant="outline"
              >
                <FileText className="w-6 h-6 text-gold" />
                Contracting Queue
                {newSubmissions > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {newSubmissions}
                  </span>
                )}
              </Button>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
```

---

## 5. Example Form Component (PersonalInfoSection.tsx)

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { Mail, Phone, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { formatPhone } from '@/lib/formatters';

interface PersonalInfoSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  fieldSuccess?: Record<string, boolean>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
  onFieldBlur?: (fieldName: string, value: any, application: ContractingApplication) => void;
}

export function PersonalInfoSection({
  application,
  onUpdate,
  disabled,
  fieldErrors = {},
  fieldSuccess = {},
  showValidation = false,
  onClearError,
  onFieldBlur
}: PersonalInfoSectionProps) {

  // Helper to get field styling based on validation state
  const getFieldClass = (fieldName: string) => {
    const hasError = fieldErrors[fieldName] && (showValidation || fieldErrors[fieldName]);
    const isSuccess = fieldSuccess[fieldName];

    if (hasError) return "border-amber-400 focus:ring-amber-400/20";
    if (isSuccess) return "border-green-400/50";
    return "border-slate-200";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="p-5">
        {disabled && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-400 mb-4">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div className="space-y-3" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          <div className="grid gap-3 md:grid-cols-2">
            {/* Full Legal Name */}
            <div className="space-y-1">
              <label htmlFor="full_legal_name" className="block text-sm font-medium text-slate-700">
                Full Legal Name <span className="text-amber-500">*</span>
              </label>
              <input
                id="full_legal_name"
                value={application.full_legal_name || ''}
                onChange={(e) => {
                  onUpdate('full_legal_name', e.target.value);
                  onClearError?.('full_legal_name');
                }}
                onBlur={() => onFieldBlur?.('full_legal_name', application.full_legal_name, application)}
                placeholder="Full name as shown on ID"
                className={cn(
                  "w-full h-11 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  getFieldClass('full_legal_name')
                )}
              />
              <FormFieldError error={fieldErrors.full_legal_name} show={!!fieldErrors.full_legal_name} />
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <label htmlFor="birth_date" className="block text-sm font-medium text-slate-700">
                Date of Birth <span className="text-amber-500">*</span>
              </label>
              <input
                id="birth_date"
                type="date"
                value={application.birth_date || ''}
                onChange={(e) => {
                  onUpdate('birth_date', e.target.value);
                  onClearError?.('birth_date');
                }}
                onBlur={() => onFieldBlur?.('birth_date', application.birth_date, application)}
                className={cn(
                  "w-full h-11 px-4 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  getFieldClass('birth_date')
                )}
              />
              <FormFieldError error={fieldErrors.birth_date} show={!!fieldErrors.birth_date} />
            </div>

            {/* Gender Radio Group */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Gender <span className="text-amber-500">*</span>
              </label>
              <RadioGroup
                value={application.gender || ''}
                onValueChange={(value) => onUpdate('gender', value)}
                className="flex gap-3"
              >
                <label className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors",
                  application.gender === 'Male'
                    ? "border-slate-900 bg-slate-100"
                    : "border-slate-200 hover:bg-slate-50"
                )}>
                  <RadioGroupItem value="Male" id="gender-male" />
                  <span className="text-sm text-slate-700">Male</span>
                </label>
                <label className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors",
                  application.gender === 'Female'
                    ? "border-slate-900 bg-slate-100"
                    : "border-slate-200 hover:bg-slate-50"
                )}>
                  <RadioGroupItem value="Female" id="gender-female" />
                  <span className="text-sm text-slate-700">Female</span>
                </label>
              </RadioGroup>
            </div>

            {/* Select Example */}
            <div className="space-y-1">
              <label htmlFor="birth_state" className="block text-sm font-medium text-slate-700">
                State of Birth <span className="text-amber-500">*</span>
              </label>
              <Select
                value={application.birth_state || ''}
                onValueChange={(v) => {
                  onUpdate('birth_state', v);
                  onClearError?.('birth_state');
                }}
              >
                <SelectTrigger className={cn(
                  "h-11 rounded-xl bg-slate-50 border",
                  getFieldClass('birth_state')
                )}>
                  <SelectValue placeholder="Select state..." />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. PDF Generation Pattern

### Hook (useContractingPdf.ts)
```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContractingApplication } from '@/types/contracting';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

export interface MappingEntry {
  pdfFieldKey: string;
  valueApplied: string;
  sourceFormField: string;
  isBlank: boolean;
  status: 'success' | 'failed' | 'skipped';
}

interface PdfGenerationResult {
  success: boolean;
  filename?: string;
  pdf?: string; // base64
  size?: number;
  error?: string;
  mappingReport?: MappingEntry[];
}

export function useContractingPdf() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePdf = async (
    application: ContractingApplication,
    saveToStorage = true,
    skipValidation = false
  ): Promise<PdfGenerationResult> => {
    setGenerating(true);
    setError(null);

    try {
      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke('generate-contracting-pdf', {
        body: {
          application: {
            user_id: application.user_id,
            full_legal_name: application.full_legal_name,
            // ... other fields
          },
          saveToStorage,
          skipValidation,
          applicationId: application.id,
        },
      });

      if (fnError || data?.error) {
        const errorMsg = fnError?.message || data?.error;
        setError(errorMsg);
        toast.error('Failed to generate PDF: ' + errorMsg);
        return { success: false, error: errorMsg };
      }

      toast.success('PDF generated successfully');
      return {
        success: true,
        filename: data.filename,
        pdf: data.pdf,
        size: data.size,
        mappingReport: data.mappingReport,
      };

    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error('Failed to generate PDF');
      return { success: false, error: errorMsg };
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = (base64: string, filename: string) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded');
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  return {
    generating,
    error,
    generatePdf,
    downloadPdf,
  };
}
```

### Edge Function Structure (supabase/functions/generate-contracting-pdf/index.ts)
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseClient = createClient(supabaseUrl!, supabaseServiceKey!);

    const body = await req.json();
    const { application, saveToStorage = false, applicationId } = body;

    // Load PDF template
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Fill form fields
    const setTextField = (fieldName: string, value: string | undefined | null) => {
      if (!value) return;
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
        field.setFontSize(10);
        field.updateAppearances(helveticaFont);
      } catch (err) {
        console.error(`Failed to set field ${fieldName}:`, err);
      }
    };

    setTextField("Agent Name", application.full_legal_name);
    // ... more fields

    // Flatten and save
    form.flatten();
    const filledPdfBytes = await pdfDoc.save();

    // Convert to base64
    const uint8Array = new Uint8Array(filledPdfBytes);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

    // Optionally save to storage
    if (saveToStorage && applicationId) {
      const storagePath = `${application.user_id}/contracting_packet/${Date.now()}_packet.pdf`;
      await supabaseClient.storage
        .from('contracting-documents')
        .upload(storagePath, new Uint8Array(filledPdfBytes), {
          contentType: 'application/pdf',
          upsert: true
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        filename: `Generated_${Date.now()}.pdf`,
        pdf: base64,
        size: filledPdfBytes.byteLength,
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
```

---

## 7. Key UI Components Used

From `@/components/ui/`:
- `Button` - Primary buttons with variants (default, outline, ghost, destructive)
- `Input` - Text inputs
- `Label` - Form labels
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - Dropdowns
- `RadioGroup`, `RadioGroupItem` - Radio buttons
- `Checkbox` - Checkboxes
- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Card containers
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` - Modals

From `lucide-react`:
- Icons like `Users`, `FileText`, `CheckCircle`, `Clock`, `AlertCircle`, etc.

---

## 8. Styling Patterns Summary

### Card Pattern
```tsx
<div className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm">
  {/* Content */}
</div>
```

### Section Header
```tsx
<h2 className="text-sm font-medium text-muted-foreground mb-3">
  Section Title
</h2>
```

### Page Header
```tsx
<h1 className="text-3xl font-serif font-semibold text-foreground mb-1">
  Page Title
</h1>
<p className="text-muted-foreground">
  Subtitle description
</p>
```

### Button with Icon
```tsx
<Button
  onClick={handleClick}
  className="h-auto py-6 flex flex-col items-center gap-2 bg-white border border-[#E5E2DB] text-foreground hover:border-gold hover:bg-gold/5 shadow-sm"
  variant="outline"
>
  <IconComponent className="w-6 h-6 text-gold" />
  Button Text
</Button>
```

### Input Field Pattern
```tsx
<div className="space-y-1">
  <label htmlFor="field_name" className="block text-sm font-medium text-slate-700">
    Field Label <span className="text-amber-500">*</span>
  </label>
  <input
    id="field_name"
    value={value || ''}
    onChange={(e) => handleChange(e.target.value)}
    placeholder="Placeholder text"
    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
  />
</div>
```

### Page Layout
```tsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
  <Navigation />
  <main className="flex-1 pt-28 pb-12">
    <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
      {/* Page content */}
    </div>
  </main>
  <Footer />
</div>
```

---

## 9. Important Notes for Implementation

1. **Authentication**: Use `useAuth()` hook from `@/hooks/useAuth` to get current user and check roles
2. **Supabase Client**: Import from `@/integrations/supabase/client`
3. **Toast Notifications**: Use `toast` from `sonner` for success/error messages
4. **Icons**: Use `lucide-react` for all icons
5. **Date Formatting**: Use `date-fns` for date formatting
6. **Class Merging**: Use `cn()` from `@/lib/utils` for conditional class names
7. **Gold Accent**: Use `text-gold`, `bg-gold`, `border-gold` for TIG brand color
8. **Form Validation**: Amber color (`text-amber-500`, `border-amber-400`) for required/errors
9. **Success State**: Green color (`text-green-600`, `border-green-400`) for success

---

*Generated on: January 16, 2026*
*For: Strategic Growth Roadmap Generator Feature*
