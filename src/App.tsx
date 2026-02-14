import { useEffect, lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { UploadProvider } from "./contexts/UploadContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GlobalUploadIndicator } from "./components/book-of-business/GlobalUploadIndicator";
import { AgentShell } from "./components/shell/AgentShell";
import { AdminShell } from "./components/shell/AdminShell";

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
    <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading...</div>
  </div>
);

// ============================================================================
// ROUTE-BASED CODE SPLITTING
// Pages are lazy-loaded to reduce initial bundle size.
// Critical paths (Auth, Index) are loaded eagerly for fast initial render.
// ============================================================================

// Eager load: Critical path pages (auth flow)
import AuthPage from "./pages/AuthPage";
import SetPasswordPage from "./pages/auth/SetPasswordPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load: Agent pages (loaded after auth)
const StartHerePage = lazy(() => import("./pages/StartHerePage"));
const IndustryUpdatesPage = lazy(() => import("./pages/IndustryUpdatesPage"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const CarrierResourcesPage = lazy(() => import("./pages/CarrierResourcesPage"));
const AgentToolsPage = lazy(() => import("./pages/AgentToolsPage"));
const ContractingHubPage = lazy(() => import("./pages/ContractingHubPage"));
const FormsLibraryPage = lazy(() => import("./pages/FormsLibraryPage"));
const CarrierPortalsPage = lazy(() => import("./pages/CarrierPortalsPage"));
const CarrierPlansPage = lazy(() => import("./pages/CarrierPlansPage"));
const DocumentManagementPage = lazy(() => import("./pages/DocumentManagementPage"));
const TrainingPage = lazy(() => import("./pages/TrainingPage"));
const TrainingLibrary = lazy(() => import("./pages/training/TrainingLibrary"));
const ContractingPage = lazy(() => import("./pages/ContractingPage"));
const MyProfilePage = lazy(() => import("./pages/MyProfilePage"));
const T65ReviewPage = lazy(() => import("./pages/T65ReviewPage"));
const SyncFlow = lazy(() => import("./pages/SyncFlow"));

// Lazy load: Book of Business pages
const GrowthIncome = lazy(() => import("./pages/book/GrowthIncome"));
const BookClientList = lazy(() => import("./pages/book/ClientList"));

// Lazy load: Admin pages (only loaded by admins)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AgentsPage = lazy(() => import("./pages/admin/AgentsPage"));
const UserDetailPage = lazy(() => import("./pages/admin/UserDetailPage"));
const NewAgentPage = lazy(() => import("./pages/admin/NewAgentPage"));
const ContractingQueuePage = lazy(() => import("./pages/admin/ContractingQueuePage"));
const LabsPage = lazy(() => import("./pages/admin/LabsPage"));
const ActivityLogPage = lazy(() => import("./pages/admin/ActivityLogPage"));
const RTSImportPage = lazy(() => import("./pages/admin/RTSImportPage"));
const RoadmapGeneratorPage = lazy(() => import("./pages/admin/RoadmapGeneratorPage"));
const AgentProfilePage = lazy(() => import("./pages/admin/AgentProfilePage"));
const PdfBuilderPage = lazy(() => import("./pages/admin/PdfBuilderPage"));
const PlanFinderPage = lazy(() => import("./pages/PlanFinderPage"));
const AgentsBookPage = lazy(() => import("./pages/admin/AgentsBookPage"));
const AgentBookDetailPage = lazy(() => import("./pages/admin/AgentBookDetailPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000,        // Cache kept for 10 minutes
      refetchOnWindowFocus: false,   // DON'T refetch when tab regains focus
      refetchOnMount: 'always',      // But do fetch on first mount if no data
      retry: 1,                      // Only retry once on failure
    },
  },
});

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

// =============================================================================
// SENTRY ERROR BOUNDARY
// =============================================================================
// ErrorBoundary catches React errors that would crash the whole app.
// Instead of showing a white screen, it:
// 1. Reports the error to Sentry (so you know about it)
// 2. Shows a fallback UI (so users know something went wrong)
//
// This is different from try/catch - ErrorBoundary catches errors in the
// React component tree (render errors, lifecycle errors, etc.)
// =============================================================================
const SentryFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center p-8 max-w-md">
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
      <p className="text-slate-600 mb-4">
        We've been notified and are looking into it. Please refresh the page to try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

const App = () => (
  <Sentry.ErrorBoundary fallback={<SentryFallback />} showDialog>
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <UploadProvider>
          <ViewModeProvider>
          <GlobalUploadIndicator />
          <RecoveryRedirectHandler />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ================================ */}
            {/* Public — no shell               */}
            {/* ================================ */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/set-password" element={<SetPasswordPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* ================================ */}
            {/* Agent contracting (inside shell, accessible to contracting-required agents) */}
            {/* ================================ */}
            <Route element={<ProtectedRoute requireAgent allowContractingOnly><AgentShell /></ProtectedRoute>}>
              <Route path="contracting" element={<ContractingPage />} />
            </Route>

            {/* ================================ */}
            {/* Agent shell                     */}
            {/* ================================ */}
            <Route element={<ProtectedRoute><AgentShell /></ProtectedRoute>}>
              <Route index element={<Index />} />
              <Route path="book" element={<BookClientList />} />
              <Route path="book/growth" element={<GrowthIncome />} />
              <Route path="contracting-hub" element={<ContractingHubPage />} />
              <Route path="plan-finder" element={<PlanFinderPage />} />
              <Route path="carrier-portals" element={<CarrierPortalsPage />} />
              <Route path="carrier-resources" element={<CarrierResourcesPage />} />
              <Route path="carrier-resources/plans" element={<CarrierPlansPage />} />
              <Route path="forms-library" element={<FormsLibraryPage />} />
              <Route path="training" element={<TrainingLibrary />} />
              <Route path="training/:videoId" element={<TrainingPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="agent-tools" element={<AgentToolsPage />} />
              <Route path="my-profile" element={<MyProfilePage />} />
              <Route path="start-here" element={<StartHerePage />} />
              <Route path="industry-updates" element={<IndustryUpdatesPage />} />
              <Route path="t65-review" element={<T65ReviewPage />} />
              <Route path="sync" element={<SyncFlow />} />
              <Route path="my-clients" element={<Navigate to="/book" replace />} />
            </Route>

            {/* ================================ */}
            {/* Admin shell                     */}
            {/* ================================ */}
            <Route element={<ProtectedRoute requireAdmin><AdminShell /></ProtectedRoute>}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/agents" element={<AgentsPage />} />
              <Route path="admin/agents/new" element={<NewAgentPage />} />
              <Route path="admin/agents/book" element={<AgentsBookPage />} />
              <Route path="admin/agents/:agentId/book" element={<AgentBookDetailPage />} />
              <Route path="admin/agents/:profileId" element={<AgentProfilePage />} />
              <Route path="admin/users/:userId" element={<UserDetailPage />} />
              <Route path="admin/contracting" element={<ContractingQueuePage />} />
              <Route path="admin/rts-import" element={<RTSImportPage />} />
              <Route path="admin/roadmaps" element={<RoadmapGeneratorPage />} />
              <Route path="admin/documents" element={<DocumentManagementPage />} />
              <Route path="admin/activity-log" element={<ProtectedRoute requireSuperAdmin><ActivityLogPage /></ProtectedRoute>} />
              <Route path="admin/labs" element={<ProtectedRoute requireSuperAdmin><LabsPage /></ProtectedRoute>} />
              <Route path="admin/pdf-builder" element={<ProtectedRoute requireSuperAdmin><PdfBuilderPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ViewModeProvider>
          </UploadProvider>
        </BrowserRouter>
      </TooltipProvider>
    </FeatureFlagsProvider>
  </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
