import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight, ArrowLeft, Loader2, Download } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { UserAvatarDropdown } from "@/components/UserAvatarDropdown";
import { useCarrierDirectory, useAgentCarriers } from "@/hooks/useCarrierDirectory";

// State codes and display names - MVP: Kentucky only
const STATES = [
  { code: 'KY', name: 'Kentucky' },
];

const CarrierResourcesPage = () => {
  const { profile } = useProfile();
  const [selectedCarrierCode, setSelectedCarrierCode] = useState<string>('');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('KY');

  const { carriers: supportedCarriers, loading: carriersLoading } = useAgentCarriers();
  const { carriers, loading, error } = useCarrierDirectory(selectedStateCode);

  // Set default carrier to first in list once loaded
  useEffect(() => {
    if (!carriersLoading && supportedCarriers.length > 0 && !selectedCarrierCode) {
      setSelectedCarrierCode(supportedCarriers[0].code);
    }
  }, [carriersLoading, supportedCarriers, selectedCarrierCode]);

  // Find the active carrier from the fetched data
  const activeCarrier = carriers.find(c => c.code === selectedCarrierCode);

  // Check if there's any data for this carrier/state
  const hasData = activeCarrier && (
    activeCarrier.contacts.length > 0 ||
    activeCarrier.links.length > 0 ||
    activeCarrier.documents.length > 0
  );

  // Get display names
  const selectedStateName = STATES.find(s => s.code === selectedStateCode)?.name || selectedStateCode;
  const selectedCarrierName = supportedCarriers.find(c => c.code === selectedCarrierCode)?.name || selectedCarrierCode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold text-[#292524]">TIG</span>
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
          {/* Header */}
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-serif font-semibold text-[#292524]">
                Carrier Resources
              </h1>
              <div className="flex items-center gap-3">
                {/* Plan Documents button */}
                <Link
                  to={`/carrier-resources/plans?carrier=${selectedCarrierCode}&state=${selectedStateCode}`}
                  className="bg-blue-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Plan Documents
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Left: Carrier Sidebar (3 cols) */}
            <div className="col-span-3">
              <div className="bg-white border border-[#e8e4dd] rounded-xl overflow-hidden">
                {supportedCarriers.map((carrier) => (
                  <button
                    key={carrier.code}
                    onClick={() => setSelectedCarrierCode(carrier.code)}
                    className={`w-full px-3 py-3 text-left text-sm flex items-center gap-3 border-b border-[#e8e4dd] last:border-0 transition-all ${
                      selectedCarrierCode === carrier.code
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-50 text-[#292524]'
                    }`}
                  >
                    {/* Logo container */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedCarrierCode === carrier.code
                        ? 'bg-white/20 p-1'
                        : ''
                    }`}>
                      <img
                        src={carrier.logo}
                        alt={carrier.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className={`font-medium ${
                      selectedCarrierCode === carrier.code ? 'text-white' : 'text-[#292524]'
                    }`}>
                      {carrier.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Stacked Content Sections (9 cols) */}
            <div className="col-span-9 space-y-3">
              {/* Loading State */}
              {(loading || carriersLoading) && (
                <div className="bg-white border border-[#e8e4dd] rounded-xl p-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-[#5c5552]">Loading...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-600">Failed to load. Please try again.</p>
                </div>
              )}

              {/* No Data State */}
              {!loading && !carriersLoading && !error && !hasData && selectedCarrierCode && (
                <div className="bg-white border border-[#e8e4dd] rounded-xl p-6 text-center">
                  <p className="text-sm text-[#5c5552]">
                    No data available for {selectedCarrierName} in {selectedStateName} yet.
                  </p>
                </div>
              )}

              {/* Content when data exists */}
              {!loading && !carriersLoading && !error && hasData && activeCarrier && (
                <>
                  {/* CONTACTS CARD */}
                  <div className="bg-white border border-[#e8e4dd] rounded-xl p-5">
                    <h3 className="text-xs font-medium text-[#5c5552] uppercase tracking-wider mb-4">Contacts</h3>
                    {activeCarrier.contacts.length > 0 ? (
                      <div className="grid grid-cols-4 gap-4">
                        {activeCarrier.contacts.map((contact) => (
                          <div key={contact.id} className="text-sm">
                            <p className="font-medium text-[#292524]">{contact.name}</p>
                            {contact.title && (
                              <p className="text-xs text-[#5c5552]">{contact.title}</p>
                            )}
                            {contact.region && (
                              <p className="text-xs text-[#5c5552] mb-1">{contact.region}</p>
                            )}
                            {!contact.title && !contact.region && (
                              <p className="text-xs text-[#5c5552] mb-1">&nbsp;</p>
                            )}
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="text-xs text-blue-600 hover:underline block">
                                {contact.phone}
                              </a>
                            )}
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 hover:underline block truncate">
                                {contact.email}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#5c5552] italic">No contacts available for this carrier.</p>
                    )}
                  </div>

                  {/* PORTALS + DOWNLOADS ROW */}
                  <div className="grid grid-cols-2 gap-3 items-stretch">
                    {/* Portals & Links */}
                    <div className="bg-white border border-[#e8e4dd] rounded-xl p-4 flex flex-col">
                      <h3 className="text-xs font-medium text-[#5c5552] uppercase tracking-wider mb-3">Portals & Links</h3>
                      <div className="space-y-2 flex-1">
                        {activeCarrier.links.length > 0 ? (
                          activeCarrier.links.map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
                            >
                              <div>
                                <span className="text-sm text-[#292524] group-hover:text-blue-600 transition-colors">{link.name}</span>
                                {link.description && <span className="text-xs text-[#5c5552] ml-2">({link.description})</span>}
                              </div>
                              <ExternalLink className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                            </a>
                          ))
                        ) : (
                          <p className="text-sm text-[#5c5552] italic">No links available for this carrier.</p>
                        )}
                      </div>
                    </div>

                    {/* Downloads */}
                    <div className="bg-white border border-[#e8e4dd] rounded-xl p-4 flex flex-col">
                      <h3 className="text-xs font-medium text-[#5c5552] uppercase tracking-wider mb-3">Quick Downloads</h3>
                      <div className="space-y-2 flex-1">
                        {activeCarrier.documents.length > 0 ? (
                          activeCarrier.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
                            >
                              <span className="text-sm text-[#292524] group-hover:text-blue-600 transition-colors truncate pr-2">{doc.name}</span>
                              <Download className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            </a>
                          ))
                        ) : (
                          <p className="text-sm text-[#5c5552] italic">No downloads available for this carrier.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
};

export default CarrierResourcesPage;
