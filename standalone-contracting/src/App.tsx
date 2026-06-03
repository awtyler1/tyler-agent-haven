import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContractingForm } from "@/components/contracting/ContractingForm";

// Standalone, public, stateless contracting flow.
// No router/auth needed — the whole app IS the contracting packet.
export default function App() {
  return (
    <TooltipProvider>
      <ContractingForm />
      <Sonner />
    </TooltipProvider>
  );
}
