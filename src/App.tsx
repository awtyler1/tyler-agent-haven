import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StartHerePage from "./pages/StartHerePage";
import MedicareFundamentalsPage from "./pages/MedicareFundamentalsPage";
import IndustryUpdatesPage from "./pages/IndustryUpdatesPage";
import LeadsMarketingPage from "./pages/LeadsMarketingPage";
import SalesTrainingPage from "./pages/SalesTrainingPage";
import CrossSellingPage from "./pages/CrossSellingPage";
import CompliancePage from "./pages/CompliancePage";
import CarrierResourcesPage from "./pages/CarrierResourcesPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/start-here" element={<StartHerePage />} />
          <Route path="/medicare-fundamentals" element={<MedicareFundamentalsPage />} />
          <Route path="/industry-updates" element={<IndustryUpdatesPage />} />
          <Route path="/leads-marketing" element={<LeadsMarketingPage />} />
          <Route path="/sales-training" element={<SalesTrainingPage />} />
          <Route path="/cross-selling" element={<CrossSellingPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/carrier-resources" element={<CarrierResourcesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
