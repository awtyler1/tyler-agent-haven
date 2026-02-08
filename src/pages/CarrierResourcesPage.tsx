import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { useCarrierDirectory, useAgentCarriers } from '@/hooks/useCarrierDirectory';
import { CARRIER_BRAND_COLORS } from '@/config/carriers';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import { GH } from '@/config/golden-hour';
import { GlassPanel } from '@/components/ui/GlassPanel';

/* ── icon style helpers ── */

const LINK_TYPE_STYLES: Record<string, { bg: string; shadow: string }> = {
  portal:        { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: 'rgba(59,130,246,0.25)' },
  commission:    { bg: 'linear-gradient(135deg, #22c55e, #16a34a)', shadow: 'rgba(34,197,94,0.25)' },
  certification: { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: 'rgba(139,92,246,0.25)' },
  directory:     { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.25)' },
};
const DEFAULT_LINK_STYLE = { bg: GH.goldGrad, shadow: 'rgba(139,105,20,0.25)' };

function linkIconStyle(linkType: string) {
  return LINK_TYPE_STYLES[linkType] || DEFAULT_LINK_STYLE;
}

/* ── inline SVG icons (15×15 white, for icon squares) ── */

const PortalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
  </svg>
);
const DollarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const BookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const ExternalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const FileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

function linkTypeIcon(linkType: string) {
  switch (linkType) {
    case 'portal': return <PortalIcon />;
    case 'commission': return <DollarIcon />;
    case 'certification': return <BookIcon />;
    case 'directory': return <SearchIcon />;
    default: return <ExternalIcon />;
  }
}

/* ── empty state style ── */
const emptyStyle: React.CSSProperties = {
  padding: 20,
  textAlign: 'center',
  fontSize: 13,
  color: GH.textMuted,
  fontStyle: 'italic',
};

const CarrierResourcesPage = () => {
  const { homePath } = useNavigationContext();
  const { carriers, loading: isLoading, error: directoryError } = useCarrierDirectory('KY');
  const { carriers: agentCarriers, loading: agentLoading } = useAgentCarriers();

  // Debug: log carrier loading state to help diagnose production issues
  useEffect(() => {
    if (!isLoading && !agentLoading) {
      console.log('[CarrierResources] carriers from directory:', carriers.length, carriers.map(c => c.code));
      console.log('[CarrierResources] agentCarriers:', agentCarriers.length, agentCarriers.map(c => c.code));
      if (directoryError) console.error('[CarrierResources] directory error:', directoryError);
    }
  }, [isLoading, agentLoading, carriers, agentCarriers, directoryError]);

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

  // Scrollable documents state
  const docListRef = useRef<HTMLDivElement>(null);
  const [showDocFade, setShowDocFade] = useState(false);

  const checkDocScroll = useCallback(() => {
    const el = docListRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 2;
    setShowDocFade(canScroll && !isAtBottom);
  }, []);

  // Re-check fade when documents change
  useEffect(() => {
    // Small delay to let the DOM render new doc rows
    const t = setTimeout(checkDocScroll, 50);
    return () => clearTimeout(t);
  }, [documents, checkDocScroll]);

  if (isLoading || agentLoading) {
    return (
      <div style={{ backgroundColor: '#F3EDE4', minHeight: '100vh' }}>
        <PageLoader message="Loading carrier resources..." />
      </div>
    );
  }

  // Show error state if directory failed to load
  if (directoryError || (carriers.length === 0 && agentCarriers.length === 0)) {
    return (
      <div style={{ backgroundColor: '#F3EDE4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: GH.textPrimary, fontSize: 16, fontWeight: 600 }}>Unable to load carrier resources</p>
          <p style={{ color: GH.textSecondary, fontSize: 13, marginTop: 8 }}>
            {directoryError?.message || `Carriers: ${carriers.length}, Agent carriers: ${agentCarriers.length}`}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: 13 }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3EDE4', position: 'relative' }}>
      {/* Atmospheric overlays */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 20% 0%, rgba(184,134,11,0.04) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 80% 100%, rgba(88,44,131,0.02) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />

      {/* Sticky Header — title lives in the bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(60,48,28,0.04)',
        }}
      >
        <Link
          to={homePath}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#8B6914' }}>
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: GH.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            Carrier Resources
          </span>
        </Link>
        <UserAvatarDropdown />
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '14px 24px 0', position: 'relative', zIndex: 1 }}>
        {/* Carrier Pills */}
        <GlassPanel
          style={{
            padding: '5px 6px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
          borderRadius={26}
        >
          {availableCarriers.map((carrier) => {
            const isSelected = selectedCarrierCode === carrier.code;
            const color = CARRIER_BRAND_COLORS[carrier.code] || '#3B82F6';
            return (
              <button
                key={carrier.code}
                onClick={() => setSearchParams({ carrier: carrier.code })}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  ...(isSelected
                    ? {
                        backgroundColor: color,
                        color: '#fff',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }
                    : {
                        backgroundColor: 'rgba(60,48,28,0.05)',
                        color: GH.textSecondary,
                        fontWeight: 400,
                      }),
                }}
              >
                {carrier.name}
              </button>
            );
          })}
        </GlassPanel>

        {/* Single glass panel for all content */}
        <GlassPanel style={{ padding: '18px 20px 16px' }}>

          {/* ── Contacts Section ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: GH.textMuted,
                }}
              >
                Contacts
              </span>
              <span style={{ fontFamily: GH.serif, fontSize: 10, color: GH.textFaint }}>
                {contacts.length}
              </span>
            </div>

            {contacts.length === 0 ? (
              <div style={emptyStyle}>No contacts available</div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 12,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(60,48,28,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Left: Avatar + Name/Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: brandColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: GH.textPrimary, lineHeight: 1.2 }}>
                        {contact.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11.5, color: GH.textSecondary, lineHeight: 1.2 }}>
                        {contact.title}{contact.region && ` · ${contact.region}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Phone + Email */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/\D/g, '')}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12.5,
                          color: GH.textSecondary,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = GH.textPrimary; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = GH.textSecondary; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{contact.phone}</span>
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12.5,
                          color: GH.textSecondary,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = GH.textPrimary; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = GH.textSecondary; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
                        </svg>
                        <span>{contact.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(60,48,28,0.06)', margin: '14px 0' }} />

          {/* ── Bottom 2-col grid: Links + Documents ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Quick Links */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: GH.textMuted,
                  }}
                >
                  Portals & Links
                </span>
                <span style={{ fontFamily: GH.serif, fontSize: 10, color: GH.textFaint }}>
                  {quickLinks.length}
                </span>
              </div>
              {quickLinks.length === 0 ? (
                <div style={emptyStyle}>No portal links available</div>
              ) : (
                quickLinks.map((link) => {
                  const ls = linkIconStyle(link.link_type);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 8px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = GH.tileHover;
                        const chev = e.currentTarget.querySelector<SVGElement>('[data-chevron]');
                        if (chev) { chev.style.color = GH.textMuted; chev.style.transform = 'rotate(180deg) translateX(-2px)'; }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        const chev = e.currentTarget.querySelector<SVGElement>('[data-chevron]');
                        if (chev) { chev.style.color = GH.textFaint; chev.style.transform = 'rotate(180deg)'; }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: ls.bg,
                            boxShadow: `0 2px 6px ${ls.shadow}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {linkTypeIcon(link.link_type)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: GH.textPrimary }}>{link.name}</span>
                      </div>
                      <svg
                        data-chevron=""
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{
                          color: GH.textFaint,
                          transform: 'rotate(180deg)',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                      >
                        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  );
                })
              )}
            </section>

            {/* Documents */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: GH.textMuted,
                  }}
                >
                  Documents
                </span>
                <span style={{ fontFamily: GH.serif, fontSize: 10, color: GH.textFaint }}>
                  {documents.length}
                </span>
              </div>
              {documents.length === 0 ? (
                <div style={emptyStyle}>No documents available</div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div
                    ref={docListRef}
                    onScroll={checkDocScroll}
                    style={{
                      maxHeight: 144,
                      overflowY: 'auto',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(60,48,28,0.20) transparent',
                    }}
                  >
                    {documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 8px',
                          borderRadius: 10,
                          textDecoration: 'none',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = GH.tileHover;
                          const dl = e.currentTarget.querySelector<SVGElement>('[data-dl]');
                          if (dl) dl.style.color = GH.gold;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          const dl = e.currentTarget.querySelector<SVGElement>('[data-dl]');
                          if (dl) dl.style.color = GH.textFaint;
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                              boxShadow: '0 2px 6px rgba(239,68,68,0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <FileIcon />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: GH.textPrimary, lineHeight: 1.2 }}>
                              {doc.name}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: GH.textMuted, marginTop: 1, lineHeight: 1.2 }}>
                              PDF · Updated Jan 2026
                            </p>
                          </div>
                        </div>
                        <svg
                          data-dl=""
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: GH.textFaint, transition: 'all 0.15s ease', flexShrink: 0 }}
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                    ))}
                  </div>
                  {/* Fade hint overlay */}
                  {showDocFade && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 28,
                        background: 'linear-gradient(to top, rgba(243,237,228,0.9), rgba(243,237,228,0))',
                        pointerEvents: 'none',
                        borderRadius: '0 0 10px 10px',
                      }}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
        </GlassPanel>
      </main>
    </div>
  );
};

export default CarrierResourcesPage;
