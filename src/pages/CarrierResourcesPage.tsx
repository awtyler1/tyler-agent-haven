import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, ExternalLink, Phone, Mail, ArrowRight } from "lucide-react";
import { carriers } from "@/data/carriersData";

const CarrierResourcesPage = () => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>(carriers[0].id);
  const activeCarrier = carriers.find(c => c.id === selectedCarrier);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Carrier Selection Grid */}
        <section className="px-6 md:px-12 lg:px-20 pt-24 md:pt-28 pb-4 bg-cream border-b border-border">
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
          <section className="px-6 md:px-12 lg:px-20 py-6">
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

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                  {/* Contacts */}
                  <div>
                    <h4 className="text-base font-semibold text-gold uppercase tracking-wider mb-4">Contacts</h4>
                    <div className="space-y-4">
                      {activeCarrier.contacts.map((contact, index) => (
                        <div key={index} className="space-y-1">
                          {'name' in contact ? (
                            <>
                              <p className="text-sm font-medium text-foreground">{contact.name}</p>
                              {'role' in contact && contact.role && (
                                <p className="text-xs text-muted-foreground">{contact.role}{('region' in contact && contact.region) ? ` – ${contact.region}` : ''}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground">{contact.type}</p>
                              {'subtitle' in contact && contact.subtitle && (
                                <p className="text-xs text-muted-foreground">{contact.subtitle}</p>
                              )}
                            </>
                          )}
                          <div className="flex flex-col gap-1 mt-1">
                            {(('phone' in contact && contact.phone) || ('number' in contact && contact.number)) && (
                              <a 
                                href={`tel:${'phone' in contact ? contact.phone : contact.number}`}
                                className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                              >
                                <Phone size={14} className="text-gold" />
                                <span>{'phone' in contact ? contact.phone : contact.number}</span>
                              </a>
                            )}
                            {'email' in contact && contact.email && (
                              <a 
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                              >
                                <Mail size={14} className="text-gold" />
                                <span>{contact.email}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h4 className="text-base font-semibold text-gold uppercase tracking-wider mb-4">Quick Links</h4>
                    <div className="space-y-3">
                      {activeCarrier.links.map((link, index) => (
                        <div key={index}>
                          <a 
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                          >
                            <ExternalLink size={14} className="text-gold flex-shrink-0" />
                            <span>{link.name}</span>
                          </a>
                          {'subtext' in link && link.subtext && (
                            <p className="text-xs text-muted-foreground ml-[22px] mt-0.5">{link.subtext}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Downloads */}
                  <div>
                    <h4 className="text-base font-semibold text-gold uppercase tracking-wider mb-4">Downloads</h4>
                    <div className="space-y-3">
                      {'downloads' in activeCarrier && activeCarrier.downloads ? (
                        activeCarrier.downloads.map((download, index) => (
                          <a 
                            key={index}
                            href={download.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-foreground hover:text-gold transition-smooth"
                          >
                            <FileText size={14} className="text-gold" />
                            <span>{download.name}</span>
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No downloads available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan Documents Button */}
                <div className="pt-6 border-t border-border">
                  <Link
                    to="/carrier-resources/plans"
                    className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gold rounded-lg text-white font-semibold hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FileText size={20} />
                    <span>View Plan Documents</span>
                    <ArrowRight size={20} />
                  </Link>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Access SOB, EOC, ANOC, and formulary documents for all {activeCarrier.name} plans
                  </p>
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
