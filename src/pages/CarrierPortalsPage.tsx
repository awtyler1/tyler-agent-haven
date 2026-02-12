import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useCarrierDirectory, useSupportedCarriers } from "@/hooks/useCarrierDirectory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// State codes and display names
const STATES = [
  { code: 'KY', name: 'Kentucky' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'OH', name: 'Ohio' },
  { code: 'IN', name: 'Indiana' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'GA', name: 'Georgia' },
  { code: 'VA', name: 'Virginia' },
];

const CarrierPortalsPage = () => {
  const [selectedStateCode, setSelectedStateCode] = useState<string>('KY');

  const supportedCarriers = useSupportedCarriers();
  const { carriers, loading, error } = useCarrierDirectory(selectedStateCode);

  // Build portal data for each carrier
  const carrierPortals = supportedCarriers.map(supported => {
    const carrierData = carriers.find(c => c.code === supported.code);

    // Find portal link - look for 'portal' type or links containing 'portal' in name
    const portalLink = carrierData?.links.find(link =>
      link.link_type === 'portal' ||
      link.name.toLowerCase().includes('portal') ||
      link.name.toLowerCase().includes('vantage')
    );

    return {
      code: supported.code,
      name: supported.name,
      logo: supported.logo,
      url: portalLink?.url || null,
      linkName: portalLink?.name || 'Broker Portal',
    };
  });

  const selectedStateName = STATES.find(s => s.code === selectedStateCode)?.name || selectedStateCode;

  return (
    <div className="px-8 py-5">
        {/* Hero */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Carrier Portals</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fast access to your carrier broker portals.</p>
        </div>

        {/* State Selector */}
        <section className="pb-3 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">State:</span>
              <Select value={selectedStateCode} onValueChange={setSelectedStateCode}>
                <SelectTrigger className="w-[160px] h-7 text-xs border-[#D4CFC4] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code} className="text-xs">
                      {state.name}
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
                <span className="ml-2 text-sm text-muted-foreground">Loading portals...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600">Failed to load carrier portals. Please try again.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 min-h-[130px]">
                {carrierPortals.map((carrier) =>
                  carrier.url ? (
                    <a
                      key={carrier.code}
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
                      key={carrier.code}
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
            )}
          </div>
        </section>
    </div>
  );
};

export default CarrierPortalsPage;
