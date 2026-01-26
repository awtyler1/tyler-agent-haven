import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { carriers as allCarriersData } from "@/data/carriersData";
import { useProfile } from "@/hooks/useProfile";
import { UserAvatarDropdown } from "@/components/UserAvatarDropdown";
import { useAgentCarriers } from "@/hooks/useCarrierDirectory";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, ExternalLink, FileText, Loader2 } from "lucide-react";

// State code to full name mapping - MVP: Kentucky only
const stateNameMap: Record<string, string> = {
  KY: "Kentucky",
};

const stateCodeMap: Record<string, string> = {
  Kentucky: "KY",
};

export default function CarrierPlansPage() {
  const { profile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { carriers: agentCarriers, loading: carriersLoading } = useAgentCarriers();

  // Read carrier and state from URL params
  const carrierParam = searchParams.get("carrier") || "";
  const stateParam = searchParams.get("state") || "KY";

  const [selectedCarrier, setSelectedCarrier] = useState(carrierParam);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedState, setSelectedState] = useState(stateNameMap[stateParam] || "Kentucky");
  const [expandedAccordion, setExpandedAccordion] = useState<string>("");

  // Filter carriersData to only agent's carriers
  const carriers = allCarriersData.filter(c =>
    agentCarriers.some(ac => ac.code === c.id)
  );

  // Set default carrier to first in filtered list once loaded
  useEffect(() => {
    if (!carriersLoading && carriers.length > 0 && !selectedCarrier) {
      setSelectedCarrier(carriers[0].id);
      setSearchParams({
        carrier: carriers[0].id,
        state: stateCodeMap[selectedState] || "KY"
      });
    }
  }, [carriersLoading, carriers, selectedCarrier]);

  // Sync URL params to state on mount and when params change
  useEffect(() => {
    const carrier = searchParams.get("carrier");
    const state = searchParams.get("state");

    if (carrier && carriers.find((c) => c.id === carrier)) {
      setSelectedCarrier(carrier);
    }
    if (state && stateNameMap[state]) {
      setSelectedState(stateNameMap[state]);
    }
  }, [searchParams, carriers]);

  // Update URL when carrier changes
  const handleCarrierChange = (carrierId: string) => {
    setSelectedCarrier(carrierId);
    setSearchParams({
      carrier: carrierId,
      state: stateCodeMap[selectedState] || "KY"
    });
  };

  const currentCarrier = carriers.find((c) => c.id === selectedCarrier) || carriers[0];
  const summaryData = currentCarrier?.summaryOfBenefits?.[selectedState] || {};
  const planTypes = Object.keys(summaryData);

  // Count plans per type
  const getPlanCount = (type: string) => summaryData[type]?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      {/* Header - matches Index.tsx and CarrierResourcesPage.tsx */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-[#292524]">TIG</span>
            </Link>
            <span className="text-[#e8e4dd]">|</span>
            <span className="text-sm text-[#5c5552]">Agent Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#5c5552] hidden sm:block">{profile?.full_name || 'Agent'}</span>
            <UserAvatarDropdown />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Row */}
          <div className="mb-4">
            <Link
              to="/carrier-resources"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Carrier Resources
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-serif font-semibold text-[#292524]">
                Plan Documents
              </h1>
              <div className="flex items-center gap-3">
                {/* Year Selector */}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-8 w-[100px] text-sm text-[#292524] border-[#e8e4dd] rounded-lg bg-white focus:ring-1 focus:ring-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50 rounded-lg border-[#e8e4dd]">
                    <SelectItem value="2026" className="text-sm">2026</SelectItem>
                    <SelectItem value="2027" disabled className="text-sm">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Left: Carrier Sidebar */}
            <div className="col-span-3">
              <div className="bg-white border border-[#e8e4dd] rounded-xl overflow-hidden">
                {carriersLoading ? (
                  <div className="p-4 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : carriers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-[#5c5552]">
                    No carriers available
                  </div>
                ) : (
                  carriers.map((carrier) => (
                    <button
                      key={carrier.id}
                      onClick={() => handleCarrierChange(carrier.id)}
                      className={`w-full px-3 py-3 text-left text-sm flex items-center gap-3 border-b border-[#e8e4dd] last:border-0 transition-all ${
                        selectedCarrier === carrier.id
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-50 text-[#292524]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedCarrier === carrier.id ? "bg-white/20 p-1" : ""
                        }`}
                      >
                        <img
                          src={carrier.logo}
                          alt={carrier.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <span
                        className={`font-medium ${
                          selectedCarrier === carrier.id ? "text-white" : "text-[#292524]"
                        }`}
                      >
                        {carrier.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Plan Documents */}
            {!currentCarrier ? (
              <div className="col-span-9">
                <div className="bg-white border border-[#e8e4dd] rounded-xl p-8 text-center">
                  <FileText className="w-12 h-12 text-[#e8e4dd] mx-auto mb-3" />
                  <p className="text-sm text-[#5c5552]">Select a carrier to view plan documents</p>
                </div>
              </div>
            ) : (
              <div className="col-span-9">
                <div className="bg-white border border-[#e8e4dd] rounded-xl p-5">
                  {/* Carrier Header */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e8e4dd]">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#e8e4dd] flex items-center justify-center overflow-hidden p-1">
                      <img
                        src={currentCarrier.logo}
                        alt={currentCarrier.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#292524]">{currentCarrier.name}</h2>
                      <p className="text-xs text-[#5c5552]">
                        {selectedYear} Plans &bull; {selectedState}
                      </p>
                    </div>
                  </div>

                  {/* Plan Type Accordions */}
                  {planTypes.length > 0 ? (
                    <Accordion
                      type="single"
                      collapsible
                      value={expandedAccordion}
                      onValueChange={setExpandedAccordion}
                      className="space-y-2"
                    >
                      {planTypes.map((planType) => (
                        <AccordionItem
                          key={planType}
                          value={planType}
                          className="border border-[#e8e4dd] rounded-xl overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors hover:no-underline [&[data-state=open]]:bg-gray-100">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-[#292524]">{planType}</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {getPlanCount(planType)} plans
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 pt-3 border-t border-[#e8e4dd]">
                            <div className="space-y-3">
                              {summaryData[planType]?.map((plan: any, idx: number) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="font-medium text-sm text-[#292524]">
                                      {plan.planName}
                                    </p>
                                    {plan.nonCommissionable && (
                                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex-shrink-0 ml-2">
                                        Non-Comm
                                      </span>
                                    )}
                                  </div>
                                  {/* Labels if any */}
                                  {plan.labels && plan.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {plan.labels.map((label: any, labelIdx: number) => (
                                        <span
                                          key={labelIdx}
                                          className={`text-xs px-2 py-0.5 rounded ${
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
                                  )}
                                  <div className="flex flex-wrap gap-2">
                                    {plan.documents?.map((doc: any, docIdx: number) => (
                                      <a
                                        key={docIdx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs bg-white border border-[#e8e4dd] hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-blue-600 transition-all flex items-center gap-1.5"
                                      >
                                        {doc.isExternal ? (
                                          <ExternalLink className="w-3 h-3" />
                                        ) : (
                                          <Download className="w-3 h-3" />
                                        )}
                                        {doc.type}
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
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-[#e8e4dd] mx-auto mb-3" />
                      <p className="text-sm text-[#5c5552]">
                        No plan documents available for {currentCarrier.name} in {selectedState}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
        <p className="text-xs text-[#5c5552]/50">
          Powered by <span className="text-[#5c5552]/70">Tyler Insurance Group</span>
        </p>
      </footer>
    </div>
  );
}
