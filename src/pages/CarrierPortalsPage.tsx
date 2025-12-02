import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Building2, ExternalLink } from "lucide-react";
import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";

const carrierPortals = [
  { name: "Aetna", url: "https://www.aetna.com/producer_public/login.fcc", logo: aetnaLogo },
  { name: "Anthem", url: "https://brokerportal.anthem.com/apps/ptb/login", logo: anthemLogo },
  { name: "Devoted", url: "https://agent.devoted.com/", logo: devotedLogo },
  { name: "Humana", url: "https://account.humana.com/", logo: humanaLogo },
  { name: "United Healthcare", url: "https://www.uhcjarvis.com/content/jarvis/en/sign_in.html#/sign_in", logo: uhcLogo },
  { name: "Wellcare", url: "https://www.wellcare.com/Broker-Resources/Broker-Resources", logo: wellcareLogo },
];

const CarrierPortalsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-8 md:pt-36 md:pb-10 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow text-center">
            <h1 className="heading-display mb-3">Carrier Portals</h1>
            <p className="text-lg md:text-xl text-foreground font-medium max-w-3xl mx-auto">
              Fast access to your carrier broker portals once contracted.
            </p>
          </div>
        </section>

        {/* Carrier Portals Grid */}
        <section className="py-8 md:py-12 px-6 md:px-12 lg:px-20">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-6">
              <h2 className="heading-section mb-2">Broker Portal Access</h2>
              <p className="text-body text-sm">
                Log in to your carrier broker portals to access applications, commissions, training materials, and support resources.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {carrierPortals.map((carrier) => (
                <a
                  key={carrier.name}
                  href={carrier.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group card-premium border border-[#E5E2DB] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:bg-white/[1.015] hover:border-[#D4CFC4] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-150 text-center py-6 flex flex-col items-center"
                >
                  {'logo' in carrier && carrier.logo ? (
                    <div className="w-24 h-16 mb-3 rounded-lg overflow-hidden group-hover:scale-110 transition-transform flex items-center justify-center">
                      <img src={carrier.logo} alt={carrier.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <Building2 className="w-10 h-10 text-gold mb-3 group-hover:scale-110 transition-transform" />
                  )}
                  <h3 className="text-base font-semibold mb-1">{carrier.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-gold transition-smooth">
                    <span>Open Portal</span>
                    <ExternalLink size={12} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CarrierPortalsPage;
