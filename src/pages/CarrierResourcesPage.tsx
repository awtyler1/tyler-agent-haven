import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, ExternalLink, Phone, Mail, ArrowRight } from "lucide-react";
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

const CarrierResourcesPage = () => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>(carriers[0].id);
  const [selectedState, setSelectedState] = useState<State>("Kentucky");
  const activeCarrier = carriers.find(c => c.id === selectedCarrier);
  const stateData = activeCarrier?.stateData?.[selectedState];
  const hasStateData = stateData && (stateData.contacts.length > 0 || stateData.links.length > 0 || stateData.downloads.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      <main>
        {/* State Selector */}
        <section className="px-6 md:px-12 lg:px-20 pt-20 md:pt-24 pb-2">
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

        {/* Carrier Selection Grid */}
        <section className="px-6 md:px-12 lg:px-20 pb-3 bg-cream border-b border-border">
          <div className="container-narrow">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {carriers.map((carrier) => (
                <button
                  key={carrier.id}
                  onClick={() => setSelectedCarrier(carrier.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${
                    selectedCarrier === carrier.id
                      ? "border-gold bg-white shadow-md"
                      : "border-border bg-white/50 hover:bg-white hover:border-gold/50"
                  }`}
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                    <img 
                      src={carrier.logo} 
                      alt={`${carrier.name} logo`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className={`text-[10px] md:text-xs font-medium text-center leading-tight ${
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
          <section className="px-6 md:px-12 lg:px-20 py-4">
            <div className="container-narrow">
              {!hasStateData ? (
                <div className="border border-border rounded-lg p-6 text-center animate-fade-in bg-white">
                  <p className="text-sm text-muted-foreground mb-1">
                    Carrier information for {activeCarrier.name} in {selectedState} is not available yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Check back soon or select a different state.
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4 md:p-5 animate-fade-in">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-12 h-12 rounded-lg bg-white border border-border flex items-center justify-center p-2">
                      <img 
                        src={activeCarrier.logo} 
                        alt={`${activeCarrier.name} logo`} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{activeCarrier.name}</h2>
                      <p className="text-xs text-muted-foreground">{selectedState}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-5">
                    {/* Contacts */}
                    <div>
                      <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">Contacts</h4>
                      <div className="space-y-3">
                        {stateData.contacts.map((contact, index) => (
                        <div key={index} className="space-y-0.5">
                          {'name' in contact ? (
                            <>
                              <p className="text-sm font-medium text-foreground leading-tight">{contact.name}</p>
                              {'role' in contact && contact.role && (
                                <p className="text-xs text-muted-foreground leading-tight">{contact.role}{('region' in contact && contact.region) ? ` – ${contact.region}` : ''}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground leading-tight">{contact.type}</p>
                              {'subtitle' in contact && contact.subtitle && (
                                <p className="text-xs text-muted-foreground leading-tight">{contact.subtitle}</p>
                              )}
                            </>
                          )}
                          <div className="flex flex-col gap-0.5 mt-1">
                            {(('phone' in contact && contact.phone) || ('number' in contact && contact.number)) && (
                              <a 
                                href={`tel:${'phone' in contact ? contact.phone : contact.number}`}
                                className="flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth"
                              >
                                <Phone size={12} className="text-gold" />
                                <span>{'phone' in contact ? contact.phone : contact.number}</span>
                              </a>
                            )}
                            {'email' in contact && contact.email && (
                              <a 
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth"
                              >
                                <Mail size={12} className="text-gold" />
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
                      <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">Quick Links</h4>
                      <div className="space-y-2">
                        {stateData.links.map((link, index) => (
                        <div key={index}>
                          <a 
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth"
                          >
                            <ExternalLink size={12} className="text-gold flex-shrink-0" />
                            <span>{link.name}</span>
                          </a>
                          {'subtext' in link && link.subtext && (
                            <p className="text-xs text-muted-foreground ml-[18px] mt-0.5">{link.subtext}</p>
                          )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Downloads */}
                    <div>
                      <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">Downloads</h4>
                      <div className="space-y-2">
                        {stateData.downloads.length > 0 ? (
                          stateData.downloads.map((download, index) => (
                          <a 
                            key={index}
                            href={download.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth"
                          >
                            <FileText size={12} className="text-gold" />
                            <span>{download.name}</span>
                          </a>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No downloads available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plan Documents Button */}
                  <div className="pt-4 border-t border-border">
                    <Link
                      to={`/carrier-resources/plans?carrier=${selectedCarrier}&state=${selectedState}`}
                      className="flex items-center justify-center gap-2.5 w-full px-5 py-3 bg-gold rounded-lg text-white text-sm font-semibold hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <FileText size={18} />
                      <span>View Plan Documents</span>
                      <ArrowRight size={18} />
                    </Link>
                    <p className="text-[11px] text-muted-foreground text-center mt-2">
                      Access SOB, EOC, ANOC, and formulary documents for all {activeCarrier.name} plans in {selectedState}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CarrierResourcesPage;
