import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PasswordGate from "./components/PasswordGate";
import { AgentChatWidget } from "./components/AgentChatWidget";
import Index from "./pages/Index";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PasswordGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/start-here" element={<StartHerePage />} />
            <Route path="/contracting-hub" element={<ContractingHubPage />} />
            <Route path="/industry-updates" element={<IndustryUpdatesPage />} />
            <Route path="/sales-training" element={<SalesTrainingPage />} />
            <Route path="/sales-training-module" element={<SalesTrainingModulePage />} />
            <Route path="/training-library" element={<TrainingLibraryPage />} />
            <Route path="/medicare-fundamentals" element={<MedicareFundamentalsPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/carrier-resources" element={<CarrierResourcesPage />} />
            <Route path="/carrier-resources/plans" element={<CarrierPlansPage />} />
            <Route path="/agent-tools" element={<AgentToolsPage />} />
            <Route path="/certifications" element={<CertificationsPage />} />
            <Route path="/forms-library" element={<FormsLibraryPage />} />
            <Route path="/carrier-portals" element={<CarrierPortalsPage />} />
            <Route path="/admin/documents" element={<DocumentManagementPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AgentChatWidget />
        </BrowserRouter>
      </PasswordGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
