import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Phone, Mail, ExternalLink, Download, ArrowLeft, ChevronLeft } from 'lucide-react';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { useCarrierDirectory, useAgentCarriers } from '@/hooks/useCarrierDirectory';
import { CARRIER_BRAND_COLORS } from '@/config/carriers';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { PageLoader } from '@/components/ui/PageLoader';

const CarrierResourcesPage = () => {
  const { homePath } = useNavigationContext();
  const { carriers, loading: isLoading } = useCarrierDirectory('KY');
  const { carriers: agentCarriers, loading: agentLoading } = useAgentCarriers();

  // Filter to only show carriers the agent is certified with
  const availableCarriers = carriers.filter(c =>
    agentCarriers.some(ac => ac.code === c.code)
  );

  // Persist selected carrier in URL for bookmarking and tab-switching
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCarrierCode = searchParams.get('carrier') || '';

  // Set initial carrier when data loads (if not already in URL)
  useEffect(() => {
    if (availableCarriers.length > 0 && !selectedCarrierCode) {
      setSearchParams({ carrier: availableCarriers[0].code }, { replace: true });
    }
  }, [availableCarriers, selectedCarrierCode, setSearchParams]);

  const selectedCarrier = availableCarriers.find(c => c.code === selectedCarrierCode);
  const brandColor = CARRIER_BRAND_COLORS[selectedCarrierCode] || '#3B82F6';

  // Filter links to only show portals
  const quickLinks = selectedCarrier?.links.filter(l =>
    ['portal', 'certification', 'commission'].includes(l.link_type)
  ) || [];

  const documents = selectedCarrier?.documents || [];
  const contacts = selectedCarrier?.contacts || [];

  if (isLoading || agentLoading) {
    return <PageLoader message="Loading carrier resources..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-6">
          <Link to={homePath} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <UserAvatarDropdown />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-8 pt-6">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Carrier Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">Contacts, portals, and documents</p>
        </div>

        {/* Carrier Pills */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex flex-wrap justify-center bg-white rounded-full p-1.5 shadow-lg shadow-gray-200/50 gap-1">
            {availableCarriers.map((carrier) => {
              const isSelected = selectedCarrierCode === carrier.code;
              const color = CARRIER_BRAND_COLORS[carrier.code] || '#3B82F6';
              return (
                <button
                  key={carrier.code}
                  onClick={() => setSearchParams({ carrier: carrier.code })}
                  style={isSelected ? { backgroundColor: color } : {}}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {carrier.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Contacts */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Contacts</h2>
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/80 divide-y divide-gray-100">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No contacts available for this carrier.
                </div>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="px-5 py-3 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl flex items-center justify-between">
                    {/* Left: Avatar + Name/Title */}
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: brandColor }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                      >
                        {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-xs text-gray-500">
                          {contact.title}{contact.region && ` · ${contact.region}`}
                        </p>
                      </div>
                    </div>

                    {/* Right: Phone + Email inline */}
                    <div className="flex items-center gap-4">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone.replace(/\D/g, '')}`}
                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 transition-colors"
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                          <span>{contact.phone}</span>
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>{contact.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick Links & Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Links */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Quick Links</h2>
              <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/80 p-1">
                {quickLinks.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No links available.
                  </div>
                ) : (
                  quickLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="font-medium text-gray-900 text-sm">{link.name}</p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-gray-400 rotate-180 group-hover:translate-x-0.5 transition-all" />
                    </a>
                  ))
                )}
              </div>
            </section>

            {/* Documents */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Documents</h2>
              <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/80 p-1">
                {documents.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No documents available.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <Download className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                      </div>
                      <Download className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </a>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CarrierResourcesPage;
