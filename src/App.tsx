import { useEffect, lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-pulse text-slate-400">Loading...</div>
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
const ContractingPage = lazy(() => import("./pages/ContractingPage"));
const MyProfilePage = lazy(() => import("./pages/MyProfilePage"));
const BookOfBusinessPage = lazy(() => import("./pages/BookOfBusinessPage"));

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
          <ViewModeProvider>
          <RecoveryRedirectHandler />
          <Suspense fallback={<PageLoader />}>
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
              element={
                <ProtectedRoute requireAdmin>
                  <UserDetailPage />
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
              path="/admin/agents/new"
              element={
                <ProtectedRoute requireAdmin>
                  <NewAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agents/:profileId"
              element={
                <ProtectedRoute requireAdmin>
                  <AgentProfilePage />
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
              path="/admin/activity-log"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <ActivityLogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rts-import"
              element={
                <ProtectedRoute requireAdmin>
                  <RTSImportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roadmaps"
              element={
                <ProtectedRoute requireAdmin>
                  <RoadmapGeneratorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/labs"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <LabsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pdf-builder"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <PdfBuilderPage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/book-of-business" element={<ProtectedRoute><BookOfBusinessPage /></ProtectedRoute>} />
            <Route path="/start-here" element={<ProtectedRoute><StartHerePage /></ProtectedRoute>} />
            <Route path="/contracting-hub" element={<ProtectedRoute><ContractingHubPage /></ProtectedRoute>} />
            <Route path="/my-profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
            <Route path="/industry-updates" element={<ProtectedRoute><IndustryUpdatesPage /></ProtectedRoute>} />
            {/* Training Library */}
            <Route path="/training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
            <Route path="/training/:videoId" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
            <Route path="/carrier-resources" element={<ProtectedRoute><CarrierResourcesPage /></ProtectedRoute>} />
            <Route path="/carrier-resources/plans" element={<ProtectedRoute><CarrierPlansPage /></ProtectedRoute>} />
            <Route path="/agent-tools" element={<ProtectedRoute><AgentToolsPage /></ProtectedRoute>} />
            <Route path="/forms-library" element={<ProtectedRoute><FormsLibraryPage /></ProtectedRoute>} />
            <Route path="/carrier-portals" element={<ProtectedRoute><CarrierPortalsPage /></ProtectedRoute>} />
            <Route path="/admin/documents" element={<ProtectedRoute requireAdmin><DocumentManagementPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ViewModeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </FeatureFlagsProvider>
  </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
