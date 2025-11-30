import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, ExternalLink, Phone } from "lucide-react";

import aetnaLogo from "@/assets/aetna-logo.png";
import anthemLogo from "@/assets/anthem-logo.jpg";
import devotedLogo from "@/assets/devoted-logo.png";
import humanaLogo from "@/assets/humana-logo.png";
import uhcLogo from "@/assets/uhc-logo.png";
import wellcareLogo from "@/assets/wellcare-logo.jpg";

const carriers = [
  {
    id: "aetna",
    name: "Aetna",
    logo: aetnaLogo,
    contacts: [
      { type: "Agent Support", number: "1-800-123-4567" },
      { type: "Enrollment", number: "1-800-234-5678" },
    ],
    links: [
      { name: "Broker Portal", url: "https://www.aetna.com/producer_public/login.fcc" },
      { name: "Plan Finder", url: "#" },
      { name: "Training Center", url: "#" },
    ],
  },
  {
    id: "anthem",
    name: "Anthem",
    logo: anthemLogo,
    contacts: [
      { type: "Agent Support", number: "1-800-901-2345" },
      { type: "Enrollment", number: "1-800-012-3456" },
    ],
    links: [
      { name: "Producer World", url: "#" },
      { name: "Certifications", url: "#" },
    ],
  },
  {
    id: "devoted",
    name: "Devoted",
    logo: devotedLogo,
    contacts: [
      { type: "Agent Support", number: "1-800-555-1234" },
      { type: "Enrollment", number: "1-800-555-5678" },
    ],
    links: [
      { name: "Agent Portal", url: "https://agent.devoted.com/" },
      { name: "Plan Materials", url: "#" },
    ],
  },
  {
    id: "humana",
    name: "Humana",
    logo: humanaLogo,
    contacts: [
      { type: "Agent Support", number: "1-800-345-6789" },
      { type: "Enrollment", number: "1-800-456-7890" },
    ],
    links: [
      { name: "Broker Portal", url: "#" },
      { name: "Vantage", url: "#" },
      { name: "Certifications", url: "#" },
    ],
  },
  {
    id: "uhc",
    name: "UnitedHealthcare",
    logo: uhcLogo,
    contacts: [
      { type: "Agent Support", number: "1-800-567-8901" },
      { type: "Enrollment", number: "1-800-678-9012" },
    ],
    links: [
      { name: "Jarvis Portal", url: "#" },
      { name: "Certifications", url: "#" },
      { name: "Marketing Materials", url: "#" },
    ],
  },
  {
    id: "wellcare",
    name: "Wellcare",
    logo: wellcareLogo,
    contacts: [
      { type: "Agent Support", number: "1-800-789-0123" },
      { type: "Enrollment", number: "1-800-890-1234" },
    ],
    links: [
      { name: "Broker Portal", url: "#" },
      { name: "Plan Materials", url: "#" },
    ],
  },
];

const CarrierResourcesPage = () => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>(carriers[0].id);
  const activeCarrier = carriers.find(c => c.id === selectedCarrier);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-8 md:pt-40 md:pb-12 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Carrier Resources</h1>
            <p className="text-body max-w-2xl">
              Everything you need, organized by carrier. Fast access. No wasted time.
            </p>
          </div>
        </section>

        {/* Carrier Selection Grid */}
        <section className="px-6 md:px-12 lg:px-20 py-8 bg-cream border-b border-border">
          <div className="container-narrow">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {carriers.map((carrier) => (
                <button
                  key={carrier.id}
                  onClick={() => setSelectedCarrier(carrier.id)}
                  className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg border transition-all ${
                    selectedCarrier === carrier.id
                      ? "border-gold bg-white shadow-md"
                      : "border-border bg-white/50 hover:bg-white hover:border-gold/50"
                  }`}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                    <img 
                      src={carrier.logo} 
                      alt={`${carrier.name} logo`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className={`text-xs md:text-sm font-medium text-center leading-tight ${
                    selectedCarrier === carrier.id ? "text-gold" : "text-muted-foreground"
                  }`}>
                    {carrier.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Selected Carrier Details */}
        {activeCarrier && (
          <section className="section-padding">
            <div className="container-narrow">
              <div className="border border-border rounded-lg p-6 md:p-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-16 h-16 rounded-lg bg-white border border-border flex items-center justify-center p-2">
                    <img 
                      src={activeCarrier.logo} 
                      alt={`${activeCarrier.name} logo`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="heading-section">{activeCarrier.name}</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Contacts */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Contacts</h4>
                    <div className="space-y-3">
                      {activeCarrier.contacts.map((contact, index) => (
                        <a 
                          key={index}
                          href={`tel:${contact.number}`}
                          className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                        >
                          <Phone size={14} className="text-gold" />
                          <span>{contact.type}:</span>
                          <span className="font-medium">{contact.number}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Quick Links</h4>
                    <div className="space-y-3">
                      {activeCarrier.links.map((link, index) => (
                        <a 
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                        >
                          <ExternalLink size={14} className="text-gold" />
                          <span>{link.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Downloads */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Downloads</h4>
                    <div className="space-y-3">
                      <button className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth">
                        <FileText size={14} className="text-gold" />
                        <span>Summary of Benefits</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth">
                        <FileText size={14} className="text-gold" />
                        <span>Plan Comparison</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth">
                        <FileText size={14} className="text-gold" />
                        <span>Commission Schedule</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CarrierResourcesPage;
