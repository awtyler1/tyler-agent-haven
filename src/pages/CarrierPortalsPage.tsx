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
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Carrier Portals</h1>
            <p className="text-body max-w-2xl">
              Fast access to your carrier broker portals once contracted.
            </p>
          </div>
        </section>

        {/* Carrier Portals Grid */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="border-l-4 border-gold pl-6 mb-10">
              <h2 className="heading-section mb-2">Broker Portal Access</h2>
              <p className="text-body">
                Log in to your carrier broker portals to access applications, commissions, training materials, and support resources.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {carrierPortals.map((carrier) => (
                <a
                  key={carrier.name}
                  href={carrier.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group card-premium hover:border-gold transition-smooth text-center py-10 flex flex-col items-center"
                >
                  {'logo' in carrier && carrier.logo ? (
                    <div className="w-28 h-20 mb-4 rounded-lg overflow-hidden group-hover:scale-110 transition-transform flex items-center justify-center">
                      <img src={carrier.logo} alt={carrier.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <Building2 className="w-12 h-12 text-gold mb-4 group-hover:scale-110 transition-transform" />
                  )}
                  <h3 className="heading-subsection mb-2">{carrier.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-gold transition-smooth">
                    <span>Open Portal</span>
                    <ExternalLink size={14} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Support Note */}
        <section className="section-padding bg-cream">
          <div className="container-narrow">
            <div className="card-premium max-w-2xl mx-auto text-center">
              <h3 className="heading-subsection mb-4">Need Portal Access?</h3>
              <p className="text-body mb-6">
                If you need credentials or are having trouble accessing a carrier portal, reach out to our contracting support team.
              </p>
              <a 
                href="/contact"
                className="btn-primary-gold inline-block"
              >
                Contact Support
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CarrierPortalsPage;
