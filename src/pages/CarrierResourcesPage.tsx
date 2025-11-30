import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Building2, FileText, ExternalLink, Phone, ChevronRight, ChevronDown } from "lucide-react";

const carriers = [
  {
    id: "aetna",
    name: "Aetna",
    contacts: [
      { type: "Agent Support", number: "1-800-123-4567" },
      { type: "Enrollment", number: "1-800-234-5678" },
    ],
    links: [
      { name: "Broker Portal", url: "#" },
      { name: "Plan Finder", url: "#" },
      { name: "Training Center", url: "#" },
    ],
    states: ["Kentucky", "Ohio", "Indiana", "Tennessee"]
  },
  {
    id: "humana",
    name: "Humana",
    contacts: [
      { type: "Agent Support", number: "1-800-345-6789" },
      { type: "Enrollment", number: "1-800-456-7890" },
    ],
    links: [
      { name: "Broker Portal", url: "#" },
      { name: "Vantage", url: "#" },
      { name: "Certifications", url: "#" },
    ],
    states: ["Kentucky", "Ohio", "Indiana", "Tennessee", "West Virginia"]
  },
  {
    id: "uhc",
    name: "UnitedHealthcare",
    contacts: [
      { type: "Agent Support", number: "1-800-567-8901" },
      { type: "Enrollment", number: "1-800-678-9012" },
    ],
    links: [
      { name: "Jarvis Portal", url: "#" },
      { name: "Certifications", url: "#" },
      { name: "Marketing Materials", url: "#" },
    ],
    states: ["Kentucky", "Ohio", "Indiana", "Tennessee"]
  },
  {
    id: "wellcare",
    name: "Wellcare",
    contacts: [
      { type: "Agent Support", number: "1-800-789-0123" },
      { type: "Enrollment", number: "1-800-890-1234" },
    ],
    links: [
      { name: "Broker Portal", url: "#" },
      { name: "Plan Materials", url: "#" },
    ],
    states: ["Kentucky", "Ohio", "Tennessee"]
  },
  {
    id: "anthem",
    name: "Anthem",
    contacts: [
      { type: "Agent Support", number: "1-800-901-2345" },
      { type: "Enrollment", number: "1-800-012-3456" },
    ],
    links: [
      { name: "Producer World", url: "#" },
      { name: "Certifications", url: "#" },
    ],
    states: ["Kentucky", "Ohio", "Indiana"]
  },
];

const CarrierResourcesPage = () => {
  const [expandedCarrier, setExpandedCarrier] = useState<string | null>(carriers[0].id);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 lg:px-20 bg-cream">
          <div className="container-narrow">
            <h1 className="heading-display mb-4">Carrier Resources</h1>
            <p className="text-body max-w-2xl">
              Everything you need, organized by carrier. Fast access. No wasted time.
            </p>
          </div>
        </section>

        {/* Carrier List */}
        <section className="section-padding">
          <div className="container-narrow">
            <div className="space-y-4">
              {carriers.map((carrier) => (
                <div 
                  key={carrier.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCarrier(expandedCarrier === carrier.id ? null : carrier.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-smooth text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="heading-subsection">{carrier.name}</h3>
                        <p className="text-body-small">{carrier.states.join(", ")}</p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedCarrier === carrier.id ? "rotate-180" : ""
                      }`} 
                    />
                  </button>

                  {expandedCarrier === carrier.id && (
                    <div className="px-6 pb-6 pt-2 border-t border-border animate-fade-in">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Contacts */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Contacts</h4>
                          <div className="space-y-2">
                            {carrier.contacts.map((contact, index) => (
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
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Links</h4>
                          <div className="space-y-2">
                            {carrier.links.map((link, index) => (
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
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Downloads</h4>
                          <div className="space-y-2">
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
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CarrierResourcesPage;
