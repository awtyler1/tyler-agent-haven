import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, FileText, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { carriers } from "@/data/carriersData";
import connect4Logo from "@/assets/connect4insurance-logo.png";
import sunfireLogo from "@/assets/sunfire-logo.png";
import bossCrmLogo from "@/assets/boss-crm-logo.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type State = "Kentucky" | "Tennessee" | "Ohio" | "Indiana" | "West Virginia" | "Georgia" | "Virginia";

const states: State[] = ["Kentucky", "Tennessee", "Ohio", "Indiana", "West Virginia", "Georgia", "Virginia"];

const coreTools = [
  {
    name: "Connect4Insurance",
    subtitle: "Quoting & E-apps",
    url: "https://pinnacle7.destinationrx.com/PC/Agent/Account/Login",
    logo: connect4Logo,
  },
  {
    name: "Sunfire",
    subtitle: "Quoting & Enrollment",
    url: "https://www.sunfirematrix.com/app/agent/pfs",
    logo: sunfireLogo,
  },
  {
    name: "BOSS CRM",
    subtitle: "Lead Management",
    url: "https://fmo.kizen.com/login",
    logo: bossCrmLogo,
  },
];

const AgentToolsPage = () => {
  const [selectedState, setSelectedState] = useState<State>("Kentucky");

  // Get carrier portals with state-specific URLs
  const carrierPortals = carriers.map(carrier => {
    const stateData = carrier.stateData[selectedState];
    const brokerPortalLink = stateData?.links.find(link => 
      link.name.toLowerCase().includes('portal') || 
      link.name.toLowerCase().includes('agent portal') ||
      link.name.toLowerCase().includes('broker portal') ||
      link.name.toLowerCase().includes('vantage')
    );
    
    return {
      name: carrier.name,
      logo: carrier.logo,
      url: brokerPortalLink?.url || "#",
      hasUrl: !!brokerPortalLink?.url
    };
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-6 md:pt-36 md:pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-3">Agent Tools</h1>
            <p className="text-lg md:text-xl text-foreground font-medium max-w-3xl mx-auto">
              Your command center for quoting, applications, CRM, and essential platforms.
            </p>
          </div>
        </section>

        {/* State Selector */}
        <section className="pb-3 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">State:</span>
              <Select value={selectedState} onValueChange={(value) => setSelectedState(value as State)}>
                <SelectTrigger className="w-[180px] h-8 text-sm border-[#D4CFC4] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {states.map((state) => (
                    <SelectItem key={state} value={state} className="text-sm">
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Carrier Portals - Row 1 */}
        <section className="pb-1.5 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <h2 className="text-center text-sm font-medium text-foreground/70 mb-3">Carrier Portals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {carrierPortals.map((carrier) => 
                carrier.hasUrl ? (
                  <a
                    key={carrier.name}
                    href={carrier.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white border border-[#D4CFC4] rounded-lg p-2.5 flex flex-col items-center text-center shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] hover:bg-white/[1.02] hover:border-[#BAB5A6] hover:shadow-[0_8px_26px_-4px_rgba(0,0,0,0.16)] hover:-translate-y-[3px] transition-all duration-140 ease-in-out"
                  >
                    <div className="w-[76px] h-[76px] mb-1.5 flex items-center justify-center">
                      <img 
                        src={carrier.logo} 
                        alt={carrier.name} 
                        className="max-w-[76px] max-h-[76px] w-auto h-auto object-contain"
                        style={{ filter: 'brightness(0.98) contrast(1.02)' }}
                      />
                    </div>
                    <p className="text-[11px] font-medium text-foreground mb-0.5">{carrier.name}</p>
                    <p className="text-[9px] text-gold/70 mb-1">Portal Login →</p>
                    <ExternalLink className="w-2.5 h-2.5 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <div
                    key={carrier.name}
                    className="bg-white/60 border border-[#D4CFC4] rounded-lg p-2.5 flex flex-col items-center text-center shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] opacity-50 cursor-not-allowed"
                  >
                    <div className="w-[76px] h-[76px] mb-1.5 flex items-center justify-center">
                      <img 
                        src={carrier.logo} 
                        alt={carrier.name} 
                        className="max-w-[76px] max-h-[76px] w-auto h-auto object-contain grayscale"
                        style={{ filter: 'brightness(0.98) contrast(1.02) grayscale(100%)' }}
                      />
                    </div>
                    <p className="text-[11px] font-medium text-foreground/60 mb-0.5">{carrier.name}</p>
                    <p className="text-[9px] text-red-600/70 mb-1">Not Available</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Core Tools - Row 2 */}
        <section className="pb-1.5 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {coreTools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white border border-[#D4CFC4] rounded-lg p-3.5 flex flex-col items-center text-center shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] hover:bg-white/[1.02] hover:border-[#BAB5A6] hover:shadow-[0_8px_26px_-4px_rgba(0,0,0,0.16)] hover:-translate-y-[3px] transition-all duration-140 ease-in-out"
                >
                  <div className="w-[76px] h-[76px] mb-2 flex items-center justify-center">
                    <img 
                      src={tool.logo} 
                      alt={tool.name} 
                      className="max-w-[76px] max-h-[76px] w-auto h-auto object-contain"
                      style={{ filter: 'brightness(0.96) contrast(1.04)' }}
                    />
                  </div>
                  <h3 className="text-sm font-semibold mb-0.5">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1.5">{tool.subtitle}</p>
                  <ExternalLink className="w-3.5 h-3.5 text-gold opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Carrier Resources - Full Width Bar */}
        <section className="pb-1.5 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <Link
              to="/carrier-resources"
              onClick={() => window.scrollTo(0, 0)}
              className="group bg-white border border-[#D4CFC4] rounded-lg p-3 flex items-center gap-4 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] hover:bg-white/[1.02] hover:border-[#BAB5A6] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.14)] hover:-translate-y-[2px] transition-all duration-140 ease-in-out"
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gold/8 flex items-center justify-center group-hover:bg-gold/17 transition-colors">
                <FileText className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-0">Carrier Resources</h3>
                <p className="text-xs text-muted-foreground">Contacts, Quick Links, Downloads, and Plan Documents</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Forms Library - Full Width Bar */}
        <section className="pb-6 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <Link
              to="/forms-library"
              onClick={() => window.scrollTo(0, 0)}
              className="group bg-white border border-[#D4CFC4] rounded-lg p-3 flex items-center gap-4 shadow-[0_3px_14px_-2px_rgba(0,0,0,0.10)] hover:bg-white/[1.02] hover:border-[#BAB5A6] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.14)] hover:-translate-y-[2px] transition-all duration-140 ease-in-out"
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gold/8 flex items-center justify-center group-hover:bg-gold/17 transition-colors">
                <FolderOpen className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-0">Forms Library</h3>
                <p className="text-xs text-muted-foreground">SOA Forms, CMS Forms, HIPAA Forms, and Essential Client Documents</p>
              </div>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AgentToolsPage;
