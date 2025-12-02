import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink, Building2 } from "lucide-react";
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
  {
    name: "Carrier Resources",
    subtitle: "Plans & Documents",
    link: "/carrier-resources",
    icon: Building2,
  },
];

const AgentToolsPage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-20 pb-6 md:pt-24 md:pb-8 px-6 md:px-12 lg:px-20">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-2">Agent Tools</h1>
            <p className="text-body max-w-2xl mx-auto" style={{ color: 'hsl(30 10% 20%)' }}>
              Your command center for quoting, applications, CRM, and essential platforms.
            </p>
          </div>
        </section>

        {/* Carrier Portals - Row 1 */}
        <section className="pb-4 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {carrierPortals.map((carrier) => (
                <a
                  key={carrier.name}
                  href={carrier.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white border border-[#EAE7E1] rounded-lg p-4 flex flex-col items-center text-center shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] hover:border-gold/40 hover:shadow-[0_10px_32px_-2px_rgba(0,0,0,0.08)] transition-all duration-300"
                >
                  <div className="w-full h-12 mb-3 flex items-center justify-center">
                    <img 
                      src={carrier.logo} 
                      alt={carrier.name} 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p className="text-xs font-medium text-foreground mb-2">{carrier.name}</p>
                  <ExternalLink className="w-3 h-3 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Core Tools - Row 2 */}
        <section className="pb-16 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {coreTools.map((tool) => (
                tool.link ? (
                  <Link
                    key={tool.name}
                    to={tool.link}
                    onClick={() => window.scrollTo(0, 0)}
                    className="group bg-white border border-[#EAE7E1] rounded-lg p-6 flex flex-col items-center text-center shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] hover:border-gold/40 hover:shadow-[0_10px_32px_-2px_rgba(0,0,0,0.08)] transition-all duration-300"
                  >
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-lg bg-gold/8 group-hover:bg-gold/17 transition-colors">
                      {tool.icon && <tool.icon className="w-7 h-7 text-gold" />}
                    </div>
                    <h3 className="text-base font-semibold mb-1">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.subtitle}</p>
                  </Link>
                ) : (
                  <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white border border-[#EAE7E1] rounded-lg p-6 flex flex-col items-center text-center shadow-[0_2px_20px_-1px_rgba(0,0,0,0.04)] hover:border-gold/40 hover:shadow-[0_10px_32px_-2px_rgba(0,0,0,0.08)] transition-all duration-300"
                  >
                    <div className="w-16 h-16 mb-4 flex items-center justify-center overflow-hidden rounded-lg bg-cream/50">
                      {tool.logo && (
                        <img 
                          src={tool.logo} 
                          alt={tool.name} 
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <h3 className="text-base font-semibold mb-1">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{tool.subtitle}</p>
                    <ExternalLink className="w-4 h-4 text-gold opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                )
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AgentToolsPage;
