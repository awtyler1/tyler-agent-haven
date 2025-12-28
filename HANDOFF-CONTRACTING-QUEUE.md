# Handoff Document: Admin Contracting Queue Feature

This document contains all files and information needed to build the admin contracting queue feature.

---

## 1. Router Configuration

**File:** `src/App.tsx`

```tsx
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { TestModeBanner } from "./components/TestModeBanner";
import { ViewModeBanner } from "./components/ViewModeBanner";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { AgentChatWidget } from "./components/AgentChatWidget";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SetPasswordPage from "./pages/auth/SetPasswordPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import StartHerePage from "./pages/StartHerePage";
import IndustryUpdatesPage from "./pages/IndustryUpdatesPage";
import SalesTrainingPage from "./pages/SalesTrainingPage";
import SalesTrainingModulePage from "./pages/SalesTrainingModulePage";
import TrainingLibraryPage from "./pages/TrainingLibraryPage";
import MedicareFundamentalsPage from "./pages/MedicareFundamentalsPage";
import CompliancePage from "./pages/CompliancePage";
import CarrierResourcesPage from "./pages/CarrierResourcesPage";
import AgentToolsPage from "./pages/AgentToolsPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import ContractingHubPage from "./pages/ContractingHubPage";
import CertificationsPage from "./pages/CertificationsPage";
import FormsLibraryPage from "./pages/FormsLibraryPage";
import CarrierPortalsPage from "./pages/CarrierPortalsPage";
import CarrierPlansPage from "./pages/CarrierPlansPage";
import DocumentManagementPage from "./pages/DocumentManagementPage";
import NotFound from "./pages/NotFound";

// Agent-specific pages
import ContractingPage from "./pages/ContractingPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AgentsPage from "./pages/admin/AgentsPage";
import ManagersPage from "./pages/admin/ManagersPage";
import NewManagerPage from "./pages/admin/NewManagerPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import PlatformMapPage from "./pages/admin/PlatformMapPage";
import NewAgentPage from "./pages/admin/NewAgentPage";
import PdfFieldExtractorPage from "./pages/admin/PdfFieldExtractorPage";
import PdfFieldMapperPage from "./pages/admin/PdfFieldMapperPage";
import ContractingQueuePage from "./pages/admin/ContractingQueuePage";
import PdfFieldAuditPage from "./pages/admin/PdfFieldAuditPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import HierarchyManagementPage from "./pages/admin/HierarchyManagementPage";

// Developer pages
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import FeatureFlagsPage from "./pages/developer/FeatureFlagsPage";
import SystemHealthPage from "./pages/developer/SystemHealthPage";
import TestDataSeederPage from "./pages/developer/TestDataSeederPage";
import PlatformExperienceMapPage from "./pages/developer/PlatformExperienceMapPage";
import ViewAsPage from "./pages/developer/ViewAsPage";

const queryClient = new QueryClient();

// Component to handle recovery token redirects
function RecoveryRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if this is a recovery redirect (has type=recovery in hash)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Redirect to set-password page while preserving the hash
      navigate('/auth/set-password' + hash, { replace: true });
    }
  }, [navigate, location]);

  return null;
}

// Conditionally show chat widget (hide during contracting flow and auth pages)
function ConditionalChatWidget() {
  const location = useLocation();
  const hiddenPaths = ['/contracting', '/auth'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) return null;
  return <AgentChatWidget />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FeatureFlagsProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <ViewModeBanner />
          <TestModeBanner />
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <RecoveryRedirectHandler />
          <Routes>
            {/* Auth */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/set-password" element={<SetPasswordPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Agent contracting (accessible only to agents needing contracting) */}
            <Route 
              path="/contracting" 
              element={
                <ProtectedRoute requireAgent allowContractingOnly>
                  <ContractingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/:userId" 
              element={<UserDetailPage />} 
            />
            <Route 
              path="/admin/platform-map" 
              element={<PlatformMapPage />} 
            />
            <Route 
              path="/admin/pdf-extractor" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <PdfFieldExtractorPage />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/agents" 
              element={
                <ProtectedRoute requireAdmin>
                  <AgentsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/managers" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <ManagersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/managers/new" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <NewManagerPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/agents/new" 
              element={
                <ProtectedRoute requireAdmin>
                  <NewAgentPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/contracting" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractingQueuePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pdf-mapper" 
              element={
                <ProtectedRoute requireAdmin>
                  <PdfFieldMapperPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pdf-audit" 
              element={
                <ProtectedRoute requireAdmin>
                  <PdfFieldAuditPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/hierarchy" 
              element={
                <ProtectedRoute requireAdmin>
                  <HierarchyManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminSettingsPage />
                </ProtectedRoute>
              } 
            />

            {/* Developer routes */}
            <Route 
              path="/developer" 
              element={
                <ProtectedRoute requireDeveloper>
                  <DeveloperDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/feature-flags" 
              element={
                <ProtectedRoute requireDeveloper>
                  <FeatureFlagsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/system-health" 
              element={
                <ProtectedRoute requireDeveloper>
                  <SystemHealthPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/pdf-extractor" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PdfFieldExtractorPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/pdf-mapper" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PdfFieldMapperPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/pdf-audit" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PdfFieldAuditPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/platform-map" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PlatformMapPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/test-seeder" 
              element={
                <ProtectedRoute requireDeveloper>
                  <TestDataSeederPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/experience-map" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PlatformExperienceMapPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/view-as" 
              element={
                <ProtectedRoute requireDeveloper>
                  <ViewAsPage />
                </ProtectedRoute>
              } 
            />

            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/start-here" element={<ProtectedRoute><StartHerePage /></ProtectedRoute>} />
            <Route path="/contracting-hub" element={<ProtectedRoute><ContractingHubPage /></ProtectedRoute>} />
            <Route path="/industry-updates" element={<ProtectedRoute><IndustryUpdatesPage /></ProtectedRoute>} />
            <Route path="/sales-training" element={<ProtectedRoute><SalesTrainingPage /></ProtectedRoute>} />
            <Route path="/sales-training-module" element={<ProtectedRoute><SalesTrainingModulePage /></ProtectedRoute>} />
            <Route path="/training-library" element={<ProtectedRoute><TrainingLibraryPage /></ProtectedRoute>} />
            <Route path="/medicare-fundamentals" element={<ProtectedRoute><MedicareFundamentalsPage /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
            <Route path="/carrier-resources" element={<ProtectedRoute><CarrierResourcesPage /></ProtectedRoute>} />
            <Route path="/carrier-resources/plans" element={<ProtectedRoute><CarrierPlansPage /></ProtectedRoute>} />
            <Route path="/agent-tools" element={<ProtectedRoute><AgentToolsPage /></ProtectedRoute>} />
            <Route path="/certifications" element={<ProtectedRoute><CertificationsPage /></ProtectedRoute>} />
            <Route path="/forms-library" element={<ProtectedRoute><FormsLibraryPage /></ProtectedRoute>} />
            <Route path="/carrier-portals" element={<ProtectedRoute><CarrierPortalsPage /></ProtectedRoute>} />
            <Route path="/admin/documents" element={<ProtectedRoute requireAdmin><DocumentManagementPage /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ConditionalChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </ViewModeProvider>
  </FeatureFlagsProvider>
  </QueryClientProvider>
);

export default App;
```

**Key Route:** `/admin/contracting` → `ContractingQueuePage` (requires admin role)

---

## 2. Admin Contracting Page

**File:** `src/pages/admin/ContractingQueuePage.tsx`

**Status:** ✅ EXISTS

See full file contents below (section continues in next part due to length).

---

## 3. Contracting Applications Hook

**File:** `src/hooks/useContractingApplication.ts`

**Status:** ✅ EXISTS

See full file contents in separate section below.

---

## 4. Existing Contracting Admin Hooks

**Files Found:**
- `src/hooks/useContractingApplication.ts` - Main hook for managing contracting applications
- `src/hooks/useContractingValidation.ts` - Validation logic for contracting forms
- `src/hooks/useContractingPdf.ts` - PDF generation for contracting packets

**Note:** No dedicated admin hooks like `useContractingQueue.ts` or `useContractingAdmin.ts` exist. The admin page (`ContractingQueuePage.tsx`) uses direct Supabase queries.

---

## 5. Contracting Types

**File:** `src/types/contracting.ts`

See full file contents in separate section below.

---

## 6. Database Schema

**Table:** `contracting_applications`

**⚠️ IMPORTANT:** Run this query in Supabase SQL Editor to get the exact current schema:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contracting_applications'
ORDER BY ordinal_position;
```

**Schema Documentation (from DATABASE_SCHEMA.md):**

Based on the documentation, here's the expected schema structure:

**Core Fields:**
- `id` (uuid, NOT NULL) - Primary key
- `user_id` (uuid, NOT NULL) - Foreign key to auth.users
- `status` (text, NOT NULL) - Application status: 'in_progress' | 'submitted' | 'approved' | 'rejected'
- `current_step` (number, NOT NULL) - Current step in wizard
- `completed_steps` (number[], NOT NULL) - Array of completed step numbers
- `is_test` (boolean, nullable) - Whether this is test data
- `upline_id` (uuid, nullable) - Upline/manager user ID
- `sent_to_upline_at` (timestamp, nullable) - When sent to upline
- `sent_to_upline_by` (uuid, nullable) - Who sent to upline
- `submitted_at` (timestamp, nullable) - Submission timestamp
- `created_at` (timestamp, NOT NULL) - Creation timestamp
- `updated_at` (timestamp, NOT NULL) - Last update timestamp

**Personal Information:**
- `full_legal_name` (text, nullable)
- `email_address` (text, nullable)
- `birth_date` (text, nullable)
- `birth_city` (text, nullable)
- `birth_state` (text, nullable)
- `gender` (text, nullable)
- `resident_state` (text, nullable)
- `resident_license_number` (text, nullable)
- `npn_number` (text, nullable)

**Addresses (JSONB):**
- `home_address` (jsonb, nullable)
- `mailing_address` (jsonb, nullable)
- `mailing_address_same_as_home` (boolean, nullable)
- `ups_address` (jsonb, nullable)
- `ups_address_same_as_home` (boolean, nullable)
- `previous_addresses` (jsonb, nullable)

**Contact:**
- `phone_home` (text, nullable)
- `phone_mobile` (text, nullable)
- `phone_business` (text, nullable)
- `fax` (text, nullable)
- `preferred_contact_methods` (text[], nullable)

**Identification:**
- `drivers_license_number` (text, nullable)
- `drivers_license_state` (text, nullable)
- `insurance_license_number` (text, nullable)
- `license_expiration_date` (text, nullable)

**Business:**
- `agency_name` (text, nullable)
- `agency_tax_id` (text, nullable)
- `tax_id` (text, nullable)
- `is_corporation` (boolean, nullable)
- `contract_level` (text, nullable)

**Banking:**
- `bank_routing_number` (text, nullable)
- `bank_account_number` (text, nullable)
- `bank_branch_name` (text, nullable)
- `requesting_commission_advancing` (boolean, nullable)

**Beneficiary:**
- `beneficiary_name` (text, nullable)
- `beneficiary_relationship` (text, nullable)
- `beneficiary_birth_date` (text, nullable)
- `beneficiary_drivers_license_number` (text, nullable)
- `beneficiary_drivers_license_state` (text, nullable)

**Compliance:**
- `has_aml_course` (boolean, nullable)
- `aml_course_name` (text, nullable)
- `aml_training_provider` (text, nullable)
- `aml_course_date` (text, nullable)
- `aml_completion_date` (text, nullable)
- `has_ltc_certification` (boolean, nullable)
- `state_requires_ce` (boolean, nullable)
- `non_resident_states` (text[], nullable)

**E&O Insurance:**
- `eo_provider` (text, nullable)
- `eo_policy_number` (text, nullable)
- `eo_expiration_date` (text, nullable)
- `eo_not_yet_covered` (boolean, nullable)

**FINRA:**
- `is_finra_registered` (boolean, nullable)
- `finra_broker_dealer_name` (text, nullable)
- `finra_crd_number` (text, nullable)

**Other (JSONB):**
- `selected_carriers` (jsonb, nullable)
- `uploaded_documents` (jsonb, nullable) - **Key for approval flow**
- `legal_questions` (jsonb, nullable)
- `disciplinary_entries` (jsonb, NOT NULL, default: {})
- `agreements` (jsonb, nullable)
- `section_acknowledgments` (jsonb, nullable)

**Signatures:**
- `signature_name` (text, nullable)
- `signature_initials` (text, nullable)
- `signature_date` (text, nullable)

**Note:** The `uploaded_documents` JSONB field stores document paths as key-value pairs:
```json
{
  "insurance_license": "user_id/insurance_license/timestamp_filename.pdf",
  "voided_check": "user_id/voided_check/timestamp_filename.pdf",
  "eo_certificate": "user_id/eo_certificate/timestamp_filename.pdf",
  "contracting_packet": "user_id/contracting_packet_filename.pdf",
  ...
}
```

---

## 7. Reference Admin Page

**File:** `src/pages/admin/AgentsPage.tsx`

See full file contents in separate section below. This shows the pattern for admin pages with:
- Search functionality
- Status badges
- List view with filtering
- Navigation structure
- Permission checks

---

## 8. Existing RLS Policies

**Table:** `contracting_applications`

From migration files, the following RLS policies exist:

```sql
-- Enable RLS
ALTER TABLE public.contracting_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
  ON public.contracting_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create their own applications"
  ON public.contracting_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update their own applications"
  ON public.contracting_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.contracting_applications FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Admins can update all applications
CREATE POLICY "Admins can update all applications"
  ON public.contracting_applications FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Super admins can delete test applications
CREATE POLICY "Super admins can delete test applications" 
  ON public.contracting_applications FOR DELETE 
  TO authenticated 
  USING (
    is_test = true 
    AND has_role(auth.uid(), 'super_admin')
  );
```

---

## Full File Contents

### ContractingQueuePage.tsx

```tsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  UserX,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { toast } from "sonner";
import { ContractingSubmissionDetail } from "@/components/admin/ContractingSubmissionDetail";

interface ContractingSubmission {
  id: string;
  user_id: string;
  full_legal_name: string | null;
  email_address: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  npn_number: string | null;
  resident_state: string | null;
  uploaded_documents: Record<string, string> | null;
  is_test?: boolean;
  // From profiles join
  profile_name?: string | null;
  profile_email?: string | null;
}

interface WaitingAgent {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  onboarding_status: string;
}

export default function ContractingQueuePage() {
  const [submissions, setSubmissions] = useState<ContractingSubmission[]>([]);
  const [waitingAgents, setWaitingAgents] = useState<WaitingAgent[]>([]);
  const [waitingCollapsed, setWaitingCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hideTestData, setHideTestData] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousSelectedId = useRef<string | null>(null);

  const selected = submissions.find((s) => s.id === selectedId);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Handle transition animation when switching submissions
  useEffect(() => {
    if (selectedId !== previousSelectedId.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
      previousSelectedId.current = selectedId;
      return () => clearTimeout(timer);
    }
  }, [selectedId]);

  const fetchSubmissions = async () => {
    try {
      // Fetch agents waiting to complete wizard (CONTRACTING_REQUIRED status)
      const { data: waiting, error: waitingError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, created_at, onboarding_status")
        .eq("onboarding_status", "CONTRACTING_REQUIRED")
        .order("created_at", { ascending: false }) as { data: Array<{ user_id: string; full_name: string | null; email: string | null; created_at: string; onboarding_status: string }> | null; error: Error | null };

      if (waitingError) {
        console.error("Error fetching waiting agents:", waitingError);
      } else {
        setWaitingAgents(waiting || []);
      }

      // Fetch contracting applications
      const { data: applications, error: appError } = await supabase
        .from("contracting_applications")
        .select(
          "id, user_id, full_legal_name, email_address, status, submitted_at, created_at, updated_at, npn_number, resident_state, uploaded_documents, is_test",
        )
        .order("submitted_at", { ascending: false, nullsFirst: false });

      if (appError) throw appError;

      // Fetch profiles to get names for agents who haven't completed the wizard
      const userIds = (applications || []).map((a) => a.user_id).filter(Boolean);

      let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        if (!profileError && profiles) {
          profileMap = profiles.reduce(
            (acc, p) => {
              acc[p.user_id] = { full_name: p.full_name, email: p.email };
              return acc;
            },
            {} as Record<string, { full_name: string | null; email: string | null }>,
          );
        }
      }

      // Merge profile data with applications
      const merged = (applications || []).map((app) => ({
        ...app,
        profile_name: profileMap[app.user_id]?.full_name || null,
        profile_email: profileMap[app.user_id]?.email || null,
      })) as ContractingSubmission[];

      setSubmissions(merged);

      // Auto-select first submission
      if (merged.length > 0 && !selectedId) {
        setSelectedId(merged[0].id);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      toast.error("Failed to load contracting submissions");
    } finally {
      setLoading(false);
    }
  };

  // Get display name - prefer full_legal_name, fall back to profile name
  const getDisplayName = (submission: ContractingSubmission): string => {
    return submission.full_legal_name || submission.profile_name || "Unknown";
  };

  // Get display email - prefer email_address, fall back to profile email
  const getDisplayEmail = (submission: ContractingSubmission): string => {
    return submission.email_address || submission.profile_email || "";
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "in_progress":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "submitted":
        return "New";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "in_progress":
        return "In Progress";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-3 w-3" />;
      case "approved":
        return <CheckCircle className="h-3 w-3" />;
      case "rejected":
        return <AlertCircle className="h-3 w-3" />;
      case "in_progress":
        return <FileText className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const displayName = getDisplayName(s).toLowerCase();
    const displayEmail = getDisplayEmail(s).toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      displayName.includes(searchLower) || displayEmail.includes(searchLower) || s.npn_number?.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesTestFilter = hideTestData ? !s.is_test : true;

    return matchesSearch && matchesStatus && matchesTestFilter;
  });

  const statusCounts = {
    all: submissions.filter((s) => (hideTestData ? !s.is_test : true)).length,
    submitted: submissions.filter((s) => s.status === "submitted" && (hideTestData ? !s.is_test : true)).length,
    approved: submissions.filter((s) => s.status === "approved" && (hideTestData ? !s.is_test : true)).length,
    rejected: submissions.filter((s) => s.status === "rejected" && (hideTestData ? !s.is_test : true)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Fixed position below nav, extends to bottom */}
      <div className="fixed top-20 left-0 right-0 bottom-0 flex">
        {/* Left Panel - Submissions List */}
        <div className="w-96 border-r border-border flex flex-col bg-card">
          {/* Header */}
          <div className="p-4 border-b border-border space-y-4 flex-shrink-0">
            <h1 className="text-xl font-semibold text-foreground">Contracting Queue</h1>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, NPN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "all", label: "All", count: statusCounts.all },
                { value: "submitted", label: "New", count: statusCounts.submitted },
                { value: "approved", label: "Approved", count: statusCounts.approved },
                { value: "rejected", label: "Rejected", count: statusCounts.rejected },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Hide Test Data Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="hideTest"
                checked={hideTestData}
                onCheckedChange={(checked) => setHideTestData(checked as boolean)}
              />
              <label htmlFor="hideTest" className="text-sm text-muted-foreground cursor-pointer">
                Hide test data
              </label>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {/* Waiting on Agent Section */}
            {waitingAgents.length > 0 && (
              <div className="border-b border-border">
                <button
                  onClick={() => setWaitingCollapsed(!waitingCollapsed)}
                  className="w-full p-3 flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {waitingCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-amber-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-amber-600" />
                    )}
                    <UserX className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Waiting on Agent</span>
                  </div>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    {waitingAgents.length}
                  </span>
                </button>

                {!waitingCollapsed && (
                  <div className="bg-amber-50/50">
                    {waitingAgents.map((agent) => (
                      <div key={agent.user_id} className="p-3 border-b border-amber-100 last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground text-sm">
                            {agent.full_name || "Unnamed Agent"}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">PENDING</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{agent.email || "No email"}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created {format(new Date(agent.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submissions List */}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-sm">No submissions found</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <button
                  key={submission.id}
                  onClick={() => setSelectedId(submission.id)}
                  className={`w-full p-4 border-b border-border text-left transition-all duration-200 ${
                    selectedId === submission.id
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : "hover:bg-muted/50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground truncate">
                      {getDisplayName(submission)}
                      {submission.is_test && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">TEST</span>
                      )}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusStyle(submission.status)}`}
                    >
                      {getStatusIcon(submission.status)}
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {submission.resident_state || "N/A"} • NPN: {submission.npn_number || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {submission.submitted_at
                      ? format(new Date(submission.submitted_at), "MMM d, yyyy h:mm a")
                      : "Not submitted"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Submission Details */}
        <div className="flex-1 overflow-y-auto bg-muted/30">
          {selected ? (
            <div className={`h-full transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
              <ContractingSubmissionDetail submission={selected as any} onRefresh={fetchSubmissions} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a submission to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### useContractingApplication.ts

See attached file: `src/hooks/useContractingApplication.ts` (354 lines)

Key functions:
- `updateField` - Update single field with debounced save
- `updateFields` - Update multiple fields at once
- `submitApplication` - Submit application and generate PDF
- `uploadDocument` - Upload document to storage
- `deleteDocument` - Delete document from storage
- `goToStep` - Navigate to wizard step
- `completeStepAndNext` - Mark step complete and advance

---

### Contracting Types (contracting.ts)

See attached file: `src/types/contracting.ts` (344 lines)

Key interfaces:
- `ContractingApplication` - Main application type
- `Address` - Address structure
- `LegalQuestion` - Legal question answer structure
- `SelectedCarrier` - Carrier selection structure
- `Carrier` - Carrier information

---

### Reference: AgentsPage.tsx

See attached file: `src/pages/admin/AgentsPage.tsx` (242 lines)

This shows the pattern for admin pages:
- Search functionality
- Status badges
- List view with cards
- Permission checks
- Navigation structure
- Loading states

---

## Additional Components

### ContractingSubmissionDetail.tsx

**File:** `src/components/admin/ContractingSubmissionDetail.tsx`

**Full Contents:**

```tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Eye, 
  User, 
  Calendar, 
  MapPin,
  CheckCircle,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HierarchyAssignmentPanel } from './HierarchyAssignmentPanel';
import { CarrierStatusPanel } from './CarrierStatusPanel';

interface ContractingSubmission {
  id: string;
  user_id: string;
  full_legal_name: string | null;
  email_address: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  npn_number: string | null;
  resident_state: string | null;
  uploaded_documents: Record<string, string> | null;
  is_test?: boolean;
}

interface ContractingSubmissionDetailProps {
  submission: ContractingSubmission;
  onRefresh: () => void;
}

const DOCUMENT_LABELS: Record<string, string> = {
  insurance_license: 'Insurance License',
  government_id: 'Government ID',
  voided_check: 'Voided Check',
  eo_certificate: 'E&O Certificate',
  aml_certificate: 'AML Certificate',
  ce_certificate: 'CE Certificate',
  ltc_certificate: 'LTC Certificate',
  corporate_resolution: 'Corporate Resolution',
  background_explanation: 'Background Documentation',
  contracting_packet: 'Contracting Packet',
};

export function ContractingSubmissionDetail({ submission, onRefresh }: ContractingSubmissionDetailProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({ open: false, action: null });
  const [processing, setProcessing] = useState(false);

  const uploadedDocs = (submission.uploaded_documents || {}) as Record<string, string>;
  const docEntries = Object.entries(uploadedDocs).filter(
    ([key, value]) => value && DOCUMENT_LABELS[key]
  );

  const handleViewDocument = async (docType: string, filePath: string) => {
    const { data } = await supabase.storage
      .from('contracting-documents')
      .createSignedUrl(filePath, 300);

    if (data?.signedUrl) {
      // Open in new tab - Chrome blocks iframes for Supabase signed URLs
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleApprove = async () => {
    setProcessing(true);

    try {
      // Update application status
      const { error: appError } = await supabase
        .from('contracting_applications')
        .update({ status: 'approved' })
        .eq('id', submission.id);

      if (appError) throw appError;

      // Update profile onboarding status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'APPOINTED' })
        .eq('user_id', submission.user_id);

      if (profileError) throw profileError;

      toast.success(`${submission.full_legal_name} has been approved`);
      setConfirmDialog({ open: false, action: null });
      onRefresh();

    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('contracting_applications')
        .update({ status: 'rejected' })
        .eq('id', submission.id);

      if (error) throw error;

      toast.success(`${submission.full_legal_name}'s application has been rejected`);
      setConfirmDialog({ open: false, action: null });
      onRefresh();

    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {submission.full_legal_name || 'Unnamed Agent'}
            </h3>
            {submission.is_test && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Test
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{submission.email_address}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Submitted</p>
          <p className="text-sm font-medium">
            {submission.submitted_at 
              ? format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')
              : 'Not submitted'
            }
          </p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>NPN: {submission.npn_number || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>State: {submission.resident_state || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created: {format(new Date(submission.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Documents */}
      {docEntries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Documents ({docEntries.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {docEntries.map(([docType, filePath]) => (
              <button
                key={docType}
                onClick={() => handleViewDocument(docType, filePath)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate flex-1">
                  {DOCUMENT_LABELS[docType]}
                </span>
                <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchy Assignment */}
      <HierarchyAssignmentPanel
        userId={submission.user_id}
        currentHierarchyType={null}
        currentEntityId={null}
        currentUplineUserId={null}
        onSave={onRefresh}
      />

      {/* Carrier Status */}
      <CarrierStatusPanel
        userId={submission.user_id}
        residentState={submission.resident_state}
      />

      {/* Actions */}
      {submission.status !== 'approved' && submission.status !== 'rejected' && (
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = `/admin/users/${submission.user_id}`}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Full Profile
          </Button>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setConfirmDialog({ open: true, action: 'approve' })}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => setConfirmDialog({ open: true, action: 'reject' })}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' ? 'Approve Application' : 'Reject Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve' ? (
                <>
                  Are you sure you want to approve <strong>{submission.full_legal_name}</strong>'s application?
                  This will grant them full platform access.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong>{submission.full_legal_name}</strong>'s application?
                  They will need to resubmit.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog.action === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'}
              disabled={processing}
              onClick={(e) => {
                e.preventDefault();
                if (confirmDialog.action === 'approve') {
                  handleApprove();
                } else {
                  handleReject();
                }
              }}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

**Key Features:**
- Document viewing with signed URLs
- Approve/Reject actions with confirmation dialogs
- Updates both `contracting_applications.status` and `profiles.onboarding_status`
- Hierarchy assignment panel integration
- Carrier status panel integration
- Full profile link navigation

---

## Notes for Implementation

1. **Database Query**: Run the SQL query in section 6 to get the exact current schema
2. **RLS Policies**: The policies shown are from migrations. Verify they match your current Supabase setup
3. **Admin Access**: The route requires `requireAdmin` which checks for 'admin' or 'super_admin' roles
4. **Test Data**: The page has a toggle to hide test data (`is_test` flag)
5. **Status Flow**: Applications move from `in_progress` → `submitted` → `approved`/`rejected`
6. **Profile Integration**: The page joins with `profiles` table to get display names for agents who haven't completed the wizard

---

## Next Steps

1. Review the existing `ContractingQueuePage.tsx` to understand current implementation
2. Check if any enhancements are needed based on requirements
3. Verify database schema matches expectations
4. Test RLS policies ensure admins can access all applications
5. Review `ContractingSubmissionDetail` component for any needed updates

