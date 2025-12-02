import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Building2, ExternalLink } from "lucide-react";
import { carriers } from "@/data/carriersData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type State = "Kentucky" | "Tennessee" | "Ohio" | "Indiana" | "West Virginia" | "Georgia" | "Virginia";

const states: State[] = ["Kentucky", "Tennessee", "Ohio", "Indiana", "West Virginia", "Georgia", "Virginia"];

const CarrierPortalsPage = () => {
  const [selectedState, setSelectedState] = useState<State>("Kentucky");

  // Get carrier portals with state-specific URLs
  const carrierPortals = carriers.map(carrier => {
    const stateData = carrier.stateData[selectedState];
    
    // Try to find a portal-specific link first, otherwise use the first link
    const brokerPortalLink = stateData?.links.find(link => 
      link.name.toLowerCase().includes('portal') || 
      link.name.toLowerCase().includes('agent portal') ||
      link.name.toLowerCase().includes('broker portal') ||
      link.name.toLowerCase().includes('vantage')
    ) || stateData?.links[0];
    
    return {
      name: carrier.name,
      logo: carrier.logo,
      url: brokerPortalLink?.url || "#",
      hasUrl: !!brokerPortalLink?.url
    };
  });
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-24 pb-3 md:pt-28 md:pb-4 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-2">Carrier Portals</h1>
            <p className="text-base md:text-lg text-foreground font-medium max-w-3xl mx-auto">
              Fast access to your carrier broker portals once contracted.
            </p>
          </div>
        </section>

        {/* State Selector */}
        <section className="pb-3 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">State:</span>
              <Select value={selectedState} onValueChange={(value) => setSelectedState(value as State)}>
                <SelectTrigger className="w-[160px] h-7 text-xs border-[#D4CFC4] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {states.map((state) => (
                    <SelectItem key={state} value={state} className="text-xs">
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Carrier Portals Grid */}
        <section className="pb-4 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 min-h-[130px]">
              {carrierPortals.map((carrier) => 
                carrier.hasUrl ? (
                  <a
                    key={carrier.name}
                    href={carrier.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group card-premium border border-[#E5E2DB] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150 text-center p-2.5 flex flex-col items-center min-h-[130px]"
                  >
                    <div className="w-16 h-14 mb-1.5 flex items-center justify-center flex-shrink-0">
                      <img src={carrier.logo} alt={carrier.name} className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-xs font-semibold mb-1 leading-tight">{carrier.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-gold transition-smooth mt-auto">
                      <span>Open Portal</span>
                      <ExternalLink size={10} />
                    </div>
                  </a>
                ) : (
                  <div
                    key={carrier.name}
                    className="card-premium border border-[#E5E2DB] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] text-center p-2.5 flex flex-col items-center opacity-50 cursor-not-allowed min-h-[130px] bg-white/60"
                  >
                    <div className="w-16 h-14 mb-1.5 flex items-center justify-center flex-shrink-0">
                      <img src={carrier.logo} alt={carrier.name} className="w-full h-full object-contain grayscale" />
                    </div>
                    <h3 className="text-xs font-semibold mb-1 leading-tight text-foreground/60">{carrier.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-red-600/70 mt-auto">
                      <span>Not Available</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CarrierPortalsPage;
