import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, FileText, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";
import connect4Logo from "@/assets/connect4insurance-logo.png";
import sunfireLogo from "@/assets/sunfire-logo.png";
import bossCrmLogo from "@/assets/boss-crm-logo.png";

const carrierPortals = [
  { name: "Aetna", logo: aetnaLogo, url: "https://www.aetna.com/producer_public/login.fcc" },
  { name: "Anthem", logo: anthemLogo, url: "https://brokerportal.anthem.com/apps/ptb/login" },
  { name: "Devoted", logo: devotedLogo, url: "https://agent.devoted.com/" },
  { name: "Humana", logo: humanaLogo, url: "https://account.humana.com/" },
  { name: "United Healthcare", logo: uhcLogo, url: "https://www.uhcagent.com" },
  { name: "Wellcare", logo: wellcareLogo, url: "https://brokerportal.wellcare.com/login" },
];

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
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-8 md:pt-36 md:pb-10 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-3">Agent Tools</h1>
            <p className="text-lg md:text-xl text-foreground font-medium max-w-3xl mx-auto">
              Your command center for quoting, applications, CRM, and essential platforms.
            </p>
          </div>
        </section>

        {/* Carrier Portals - Row 1 */}
        <section className="pb-1.5 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <h2 className="text-center text-sm font-medium text-foreground/70 mb-3">Carrier Portals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {carrierPortals.map((carrier) => (
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
              ))}
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
