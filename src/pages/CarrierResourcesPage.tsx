import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, ExternalLink, Phone, Mail, ArrowRight, Loader2 } from "lucide-react";
import { useCarrierDirectory, useSupportedCarriers } from "@/hooks/useCarrierDirectory";
import type { CarrierWithResources } from "@/types/carrierDirectory";
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

const CarrierResourcesPage = () => {
  const [selectedCarrierCode, setSelectedCarrierCode] = useState<string>('aetna');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('KY');

  const supportedCarriers = useSupportedCarriers();
  const { carriers, loading, error } = useCarrierDirectory(selectedStateCode);

  // Find the active carrier from the fetched data
  const activeCarrier = carriers.find(c => c.code === selectedCarrierCode);

  // Check if there's any data for this carrier/state
  const hasData = activeCarrier && (
    activeCarrier.contacts.length > 0 ||
    activeCarrier.links.length > 0 ||
    activeCarrier.documents.length > 0
  );

  // Get display name for selected state
  const selectedStateName = STATES.find(s => s.code === selectedStateCode)?.name || selectedStateCode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      <main>
        {/* State Selector */}
        <section className="px-6 md:px-12 lg:px-20 pt-20 md:pt-24 pb-2">
          <div className="container-narrow">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">State:</span>
              <Select value={selectedStateCode} onValueChange={setSelectedStateCode}>
                <SelectTrigger className="w-[180px] h-8 text-sm border-[#D4CFC4] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code} className="text-sm">
                      {state.name}
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
              {supportedCarriers.map((carrier) => (
                <button
                  key={carrier.code}
                  onClick={() => setSelectedCarrierCode(carrier.code)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${
                    selectedCarrierCode === carrier.code
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
                    selectedCarrierCode === carrier.code ? "text-gold" : "text-muted-foreground"
                  }`}>
                    {carrier.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Selected Carrier Details */}
        <section className="px-6 md:px-12 lg:px-20 py-4">
          <div className="container-narrow">
            {loading ? (
              <div className="border border-border rounded-lg p-6 flex items-center justify-center bg-white">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
                <span className="ml-2 text-sm text-muted-foreground">Loading carrier resources...</span>
              </div>
            ) : error ? (
              <div className="border border-red-200 rounded-lg p-6 text-center bg-red-50">
                <p className="text-sm text-red-600">Failed to load carrier resources. Please try again.</p>
              </div>
            ) : !hasData ? (
              <div className="border border-border rounded-lg p-6 text-center animate-fade-in bg-white">
                <p className="text-sm text-muted-foreground mb-1">
                  Carrier information for {supportedCarriers.find(c => c.code === selectedCarrierCode)?.name || selectedCarrierCode} in {selectedStateName} is not available yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Check back soon or select a different state.
                </p>
              </div>
            ) : activeCarrier && (
              <div className="border border-border rounded-lg p-4 md:p-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-lg bg-white border border-border flex items-center justify-center p-2">
                    <img
                      src={supportedCarriers.find(c => c.code === selectedCarrierCode)?.logo}
                      alt={`${activeCarrier.name} logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{activeCarrier.name}</h2>
                    <p className="text-xs text-muted-foreground">{selectedStateName}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-5">
                  {/* Contacts */}
                  <div>
                    <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">Contacts</h4>
                    <div className="space-y-3">
                      {activeCarrier.contacts.length > 0 ? (
                        activeCarrier.contacts.map((contact) => (
                          <div key={contact.id} className="space-y-0.5">
                            <p className="text-sm font-medium text-foreground leading-tight">{contact.name}</p>
                            {contact.title && (
                              <p className="text-xs text-muted-foreground leading-tight">
                                {contact.title}{contact.region ? ` – ${contact.region}` : ''}
                              </p>
                            )}
                            {!contact.title && contact.region && (
                              <p className="text-xs text-muted-foreground leading-tight">{contact.region}</p>
                            )}
                            <div className="flex flex-col gap-0.5 mt-1">
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth"
                                >
                                  <Phone size={12} className="text-gold" />
                                  <span>{contact.phone}</span>
                                </a>
                              )}
                              {contact.email && (
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
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No contacts available</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">Quick Links</h4>
                    <div className="space-y-2">
                      {activeCarrier.links.length > 0 ? (
                        activeCarrier.links.map((link) => (
                          <div key={link.id}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth"
                            >
                              <ExternalLink size={12} className="text-gold flex-shrink-0" />
                              <span>{link.name}</span>
                            </a>
                            {link.description && (
                              <p className="text-xs text-muted-foreground ml-[18px] mt-0.5">{link.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No links available</p>
                      )}
                    </div>
                  </div>

                  {/* Downloads */}
                  <div>
                    <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">Downloads</h4>
                    <div className="space-y-2">
                      {activeCarrier.documents.length > 0 ? (
                        activeCarrier.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-foreground hover:text-gold transition-smooth"
                          >
                            <FileText size={12} className="text-gold" />
                            <span>{doc.name}</span>
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
                    to={`/carrier-resources/plans?carrier=${selectedCarrierCode}&state=${selectedStateCode}`}
                    className="flex items-center justify-center gap-2.5 w-full px-5 py-3 bg-gold rounded-lg text-white text-sm font-semibold hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FileText size={18} />
                    <span>View Plan Documents</span>
                    <ArrowRight size={18} />
                  </Link>
                  <p className="text-[11px] text-muted-foreground text-center mt-2">
                    Access SOB, EOC, ANOC, and formulary documents for all {activeCarrier.name} plans in {selectedStateName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CarrierResourcesPage;
