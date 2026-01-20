import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SetPasswordPage from "./pages/auth/SetPasswordPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import StartHerePage from "./pages/StartHerePage";
import IndustryUpdatesPage from "./pages/IndustryUpdatesPage";
// MVP: Training pages removed (placeholder content)
// import SalesTrainingPage from "./pages/SalesTrainingPage";
// import SalesTrainingModulePage from "./pages/SalesTrainingModulePage";
// import TrainingLibraryPage from "./pages/TrainingLibraryPage";
// import MedicareFundamentalsPage from "./pages/MedicareFundamentalsPage";
import CompliancePage from "./pages/CompliancePage";
import CarrierResourcesPage from "./pages/CarrierResourcesPage";
import AgentToolsPage from "./pages/AgentToolsPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import ContractingHubPage from "./pages/ContractingHubPage";
import CertificationsPage from "./pages/CertificationsPage";
import MyCertificationsPage from "./pages/MyCertificationsPage";
import FormsLibraryPage from "./pages/FormsLibraryPage";
import CarrierPortalsPage from "./pages/CarrierPortalsPage";
import CarrierPlansPage from "./pages/CarrierPlansPage";
import DocumentManagementPage from "./pages/DocumentManagementPage";
import NotFound from "./pages/NotFound";
import TrainingPage from "./pages/TrainingPage";

// Agent-specific pages
import ContractingPage from "./pages/ContractingPage";
import MyProfilePage from "./pages/MyProfilePage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AgentsPage from "./pages/admin/AgentsPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import NewAgentPage from "./pages/admin/NewAgentPage";
import ContractingQueuePage from "./pages/admin/ContractingQueuePage";
import LabsPage from "./pages/admin/LabsPage";
import HierarchyManagementPage from "./pages/admin/HierarchyManagementPage";
import ActivityLogPage from "./pages/admin/ActivityLogPage";
import RTSImportPage from "./pages/admin/RTSImportPage";
import RoadmapGeneratorPage from "./pages/admin/RoadmapGeneratorPage";
import AgentProfilePage from "./pages/admin/AgentProfilePage";

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
              path="/admin/hierarchy" 
              element={
                <ProtectedRoute requireAdmin>
                  <HierarchyManagementPage />
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

            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
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
            <Route path="/certifications" element={<ProtectedRoute><CertificationsPage /></ProtectedRoute>} />
            <Route path="/my-certifications" element={<ProtectedRoute><MyCertificationsPage /></ProtectedRoute>} />
            <Route path="/forms-library" element={<ProtectedRoute><FormsLibraryPage /></ProtectedRoute>} />
            <Route path="/carrier-portals" element={<ProtectedRoute><CarrierPortalsPage /></ProtectedRoute>} />
            <Route path="/admin/documents" element={<ProtectedRoute requireAdmin><DocumentManagementPage /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </FeatureFlagsProvider>
  </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
