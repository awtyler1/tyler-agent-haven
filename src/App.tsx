import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import AgentsPage from "./pages/admin/AgentsPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import PlatformMapPage from "./pages/admin/PlatformMapPage";
import NewAgentPage from "./pages/admin/NewAgentPage";

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
              path="/admin/super" 
              element={<SuperAdminDashboard />} 
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
            
            {/* Main app routes - protected to redirect agents in contracting mode */}
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
  </QueryClientProvider>
);

export default App;
