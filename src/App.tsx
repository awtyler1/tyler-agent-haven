import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PasswordGate from "./components/PasswordGate";
import Index from "./pages/Index";
import StartHerePage from "./pages/StartHerePage";
import MedicareFundamentalsPage from "./pages/MedicareFundamentalsPage";
import WhatIsMedicare from "./pages/medicare-fundamentals/WhatIsMedicare";
import WhatIsABroker from "./pages/medicare-fundamentals/WhatIsABroker";
import PartA from "./pages/medicare-fundamentals/PartA";
import PartB from "./pages/medicare-fundamentals/PartB";
import MedicareAdvantage from "./pages/medicare-fundamentals/MedicareAdvantage";
import MedicareSupplement from "./pages/medicare-fundamentals/MedicareSupplement";
import PartD from "./pages/medicare-fundamentals/PartD";
import LISMedicaid from "./pages/medicare-fundamentals/LISMedicaid";
import EnrollmentPeriods from "./pages/medicare-fundamentals/EnrollmentPeriods";
import ComplianceBasics from "./pages/medicare-fundamentals/ComplianceBasics";
import CommonClientScenarios from "./pages/medicare-fundamentals/CommonClientScenarios";
import IndustryUpdatesPage from "./pages/IndustryUpdatesPage";
import LeadsMarketingPage from "./pages/LeadsMarketingPage";
import SalesTrainingPage from "./pages/SalesTrainingPage";
import CrossSellingPage from "./pages/CrossSellingPage";
import CompliancePage from "./pages/CompliancePage";
import CarrierResourcesPage from "./pages/CarrierResourcesPage";
import AgentToolsPage from "./pages/AgentToolsPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import ContractingHubPage from "./pages/ContractingHubPage";
import CertificationsPage from "./pages/CertificationsPage";
import FormsLibraryPage from "./pages/FormsLibraryPage";
import CarrierPortalsPage from "./pages/CarrierPortalsPage";
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
            <Route path="/medicare-fundamentals" element={<MedicareFundamentalsPage />} />
            <Route path="/medicare-fundamentals/what-is-medicare" element={<WhatIsMedicare />} />
            <Route path="/medicare-fundamentals/what-is-a-broker" element={<WhatIsABroker />} />
            <Route path="/medicare-fundamentals/part-a" element={<PartA />} />
            <Route path="/medicare-fundamentals/part-b" element={<PartB />} />
            <Route path="/medicare-fundamentals/medicare-advantage" element={<MedicareAdvantage />} />
            <Route path="/medicare-fundamentals/medicare-supplement" element={<MedicareSupplement />} />
            <Route path="/medicare-fundamentals/part-d" element={<PartD />} />
            <Route path="/medicare-fundamentals/lis-medicaid" element={<LISMedicaid />} />
            <Route path="/medicare-fundamentals/enrollment-periods" element={<EnrollmentPeriods />} />
            <Route path="/medicare-fundamentals/compliance-basics" element={<ComplianceBasics />} />
            <Route path="/medicare-fundamentals/common-client-scenarios" element={<CommonClientScenarios />} />
            <Route path="/industry-updates" element={<IndustryUpdatesPage />} />
            <Route path="/leads-marketing" element={<LeadsMarketingPage />} />
            <Route path="/sales-training" element={<SalesTrainingPage />} />
            <Route path="/cross-selling" element={<CrossSellingPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/carrier-resources" element={<CarrierResourcesPage />} />
            <Route path="/agent-tools" element={<AgentToolsPage />} />
            <Route path="/certifications" element={<CertificationsPage />} />
            <Route path="/forms-library" element={<FormsLibraryPage />} />
            <Route path="/carrier-portals" element={<CarrierPortalsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PasswordGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
