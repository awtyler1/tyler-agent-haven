import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, ExternalLink, ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { carriers } from "@/data/carriersData";

const CarrierPlansPage = () => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>(carriers[0].id);
  const activeCarrier = carriers.find(c => c.id === selectedCarrier);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {/* Carrier Selection Grid */}
        <section className="px-6 md:px-12 lg:px-20 pt-24 md:pt-28 pb-4 bg-cream border-b border-border">
          <div className="container-narrow">
            <Link
              to="/carrier-resources"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-smooth mb-4"
            >
              <ChevronLeft size={16} />
              Back to Carrier Resources
            </Link>
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

        {/* Plan Documents */}
        {activeCarrier && activeCarrier.summaryOfBenefits && (
          <section className="px-6 md:px-12 lg:px-20 py-8">
            <div className="container-narrow">
              <div className="border border-border rounded-lg p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-16 h-16 rounded-lg bg-white border border-border flex items-center justify-center p-2">
                    <img 
                      src={activeCarrier.logo} 
                      alt={`${activeCarrier.name} logo`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="heading-section">{activeCarrier.name}</h2>
                    <p className="text-sm text-muted-foreground">Plan Documents by State</p>
                  </div>
                </div>

                {Object.entries(activeCarrier.summaryOfBenefits).map(([state, markets]) => (
                  <div key={state} className="mb-6">
                    <h3 className="text-lg font-semibold text-gold mb-4 uppercase tracking-wider">
                      {state}
                    </h3>
                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(markets as Record<string, any[]>).map(([marketName, plans]) => (
                        <AccordionItem 
                          key={marketName} 
                          value={marketName}
                          className="border border-border rounded-lg px-4 data-[state=open]:bg-cream/30"
                        >
                          <AccordionTrigger className="hover:no-underline py-4">
                            <span className="text-sm font-medium text-foreground">
                              {marketName}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 pt-2">
                            <div className="space-y-4">
                              {plans.map((plan: any, planIndex: number) => (
                                <div 
                                  key={planIndex}
                                  className="pl-4 border-l-2 border-gold/20"
                                >
                                  <div className="mb-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-sm font-semibold text-foreground">
                                        {plan.planName}
                                      </h4>
                                      {plan.nonCommissionable && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded">
                                          NON-COMMISSIONABLE
                                        </span>
                                      )}
                                      {plan.labels && plan.labels.map((label: any, labelIndex: number) => (
                                        <span 
                                          key={labelIndex}
                                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                                            label.type === 'location' 
                                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                              : label.type === 'eligibility'
                                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                              : label.type === 'condition'
                                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                              : label.type === 'caution'
                                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                              : 'bg-green-50 text-green-700 border border-green-200'
                                          }`}
                                        >
                                          {label.text}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {plan.documents.map((doc: any, docIndex: number) => (
                                      <a
                                        key={docIndex}
                                        href={doc.url}
                                        target={doc.isExternal ? "_blank" : undefined}
                                        rel={doc.isExternal ? "noopener noreferrer" : undefined}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-white border border-border rounded hover:border-gold hover:text-gold transition-smooth"
                                      >
                                        {doc.isExternal ? (
                                          <ExternalLink size={12} className="text-gold" />
                                        ) : (
                                          <FileText size={12} className="text-gold" />
                                        )}
                                        <span>{doc.type}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CarrierPlansPage;
