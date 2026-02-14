import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCarrierDirectory, useAgentCarriers } from '@/hooks/useCarrierDirectory';
import { CARRIER_BRAND_COLORS } from '@/config/carriers';
import { PageLoader } from '@/components/ui/PageLoader';

/* ── helpers ── */

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

function isBrokerSupport(contactType: string) {
  return contactType === 'broker_support' || contactType === 'general';
}

/* ── inline SVG icons ── */

const PhoneIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ExternalLinkIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const DocIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const PortalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
  </svg>
);

const CertIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
  </svg>
);

const DollarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

function pillIcon(linkType: string) {
  switch (linkType) {
    case 'portal': return <PortalIcon />;
    case 'certification': return <CertIcon />;
    case 'commission': return <DollarIcon />;
    default: return <ExternalLinkIcon size={11} />;
  }
}

/* ── main component ── */

// ────────────────────────────────────────────────────────────────
// DATA SOURCE: carrier_contacts, carrier_links, carrier_documents
// tables in Supabase. All content is DB-driven, not hardcoded.
//
// FUTURE: Admin editor at /admin/carrier-resources will provide
// inline CRUD (add/edit/remove contacts, links, docs) with
// state_code scoping for multi-state support. No changes needed
// to this agent-facing page when that's built.
// ────────────────────────────────────────────────────────────────
const CarrierResourcesPage = () => {
  const { carriers, loading: isLoading, error: directoryError } = useCarrierDirectory('KY');
  const { carriers: agentCarriers, loading: agentLoading } = useAgentCarriers();

  const availableCarriers = carriers.filter(c =>
    agentCarriers.some(ac => ac.code === c.code)
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCarrierCode = searchParams.get('carrier') || '';

  useEffect(() => {
    if (availableCarriers.length > 0 && !selectedCarrierCode) {
      setSearchParams({ carrier: availableCarriers[0].code }, { replace: true });
    }
  }, [availableCarriers, selectedCarrierCode, setSearchParams]);

  const selectedCarrier = availableCarriers.find(c => c.code === selectedCarrierCode);
  const brandColor = CARRIER_BRAND_COLORS[selectedCarrierCode] || '#4A7FB5';

  const quickLinks = selectedCarrier?.links.filter(l =>
    ['portal', 'certification', 'commission'].includes(l.link_type)
  ) || [];
  const portalLink = selectedCarrier?.links.find(l => l.link_type === 'portal');
  const documents = selectedCarrier?.documents || [];
  const contacts = selectedCarrier?.contacts || [];

  // Rail hover state
  const [hoveredRail, setHoveredRail] = useState<string | null>(null);
  // Portal button hover
  const [portalHover, setPortalHover] = useState(false);
  // Pill hover
  const [hoveredPill, setHoveredPill] = useState<string | null>(null);
  // Doc row hover
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  // Contact row hover
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);

  /* ── contracted/pending counts ── */
  const contractedCount = availableCarriers.filter(c => c.contacts.length > 0 || c.links.length > 0).length;
  const pendingCount = availableCarriers.length - contractedCount;

  /* ── loading ── */
  if (isLoading || agentLoading) {
    return (
      <div style={{ flex: '1 1 0%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <PageLoader message="Loading carrier resources..." />
      </div>
    );
  }

  /* ── error / empty ── */
  if (directoryError || availableCarriers.length === 0) {
    return (
      <div
        style={{
          flex: '1 1 0%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, margin: 0 }}>
            {directoryError ? 'Unable to load carrier resources' : 'No carrier resources available'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
            {directoryError ? 'Please try again.' : 'Check back soon or contact your administrator.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--blue)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: '1 1 0%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Page Header ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Carriers
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
          {contractedCount} contracted{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
        </p>
      </div>

      {/* ── Split Layout: Rail + Detail ── */}
      <div
        style={{
          flex: '1 1 0%',
          display: 'flex',
          gap: 14,
          padding: '12px 16px 16px',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* ── Left Rail ── */}
        <div
          style={{
            width: 190,
            flexShrink: 0,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Rail header */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--bg-muted)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              My Carriers
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
              {availableCarriers.length} carrier{availableCarriers.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rail items */}
          <div
            style={{
              flex: '1 1 0%',
              overflowY: 'auto',
              padding: 4,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.12) transparent',
            }}
          >
            {availableCarriers.map((carrier) => {
              const isSelected = selectedCarrierCode === carrier.code;
              const isHovered = hoveredRail === carrier.code;
              const dotColor = CARRIER_BRAND_COLORS[carrier.code] || '#4A7FB5';

              return (
                <div
                  key={carrier.code}
                  onClick={() => setSearchParams({ carrier: carrier.code })}
                  onMouseEnter={() => setHoveredRail(carrier.code)}
                  onMouseLeave={() => setHoveredRail(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 7,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                    background: isSelected
                      ? 'rgba(201,168,76,0.07)'
                      : isHovered
                        ? 'var(--bg-subtle)'
                        : 'transparent',
                  }}
                >
                  {/* Carrier dot */}
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      flexShrink: 0,
                    }}
                  />

                  {/* Carrier name */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      color: 'var(--text-primary)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {carrier.name}
                  </span>

                  {/* Gold selection bar */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 18,
                        borderRadius: 2,
                        backgroundColor: 'var(--gold)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Detail Card ── */}
        <div
          style={{
            flex: '1 1 0%',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {selectedCarrier ? (
            <>
              {/* ── Carrier Header Bar ── */}
              <div
                style={{
                  padding: '14px 18px',
                  background: 'linear-gradient(180deg, var(--bg-warm-glow) 0%, white 100%)',
                  borderBottom: '1px solid transparent',
                  borderImage: `linear-gradient(90deg, ${brandColor} 0%, ${brandColor}14 100%) 1`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Initial square */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      backgroundColor: brandColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontFamily: 'var(--font-serif)',
                      fontSize: 16,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {selectedCarrier.name[0]}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 18,
                        fontWeight: 600,
                        color: brandColor,
                        lineHeight: 1.2,
                      }}
                    >
                      {selectedCarrier.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      {/* Status badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 9.5,
                          fontWeight: 500,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(107,138,66,0.1)',
                          color: 'var(--green)',
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} />
                        Contracted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Portal button */}
                {portalLink && (
                  <a
                    href={portalLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setPortalHover(true)}
                    onMouseLeave={() => setPortalHover(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 18px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#fff',
                      backgroundColor: brandColor,
                      textDecoration: 'none',
                      transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                      transform: portalHover ? 'translateY(-1px)' : 'none',
                      boxShadow: portalHover
                        ? `0 4px 12px ${brandColor}40`
                        : 'none',
                    }}
                  >
                    Portal
                    <ExternalLinkIcon size={13} />
                  </a>
                )}
              </div>

              {/* ── Body Grid: Contacts + Documents ── */}
              <div
                style={{
                  flex: '1 1 0%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                {/* ── Contacts Column ── */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRight: '1px solid var(--bg-muted)',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.08) transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}
                    >
                      Contacts
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-faint)',
                        background: 'var(--bg-subtle)',
                        padding: '1px 5px',
                        borderRadius: 4,
                      }}
                    >
                      {contacts.length}
                    </span>
                  </div>

                  {contacts.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No contacts available
                    </div>
                  ) : (
                    contacts.map((contact) => {
                      const isGeneric = isBrokerSupport(contact.contact_type);
                      const isHovered = hoveredContact === contact.id;
                      return (
                        <div
                          key={contact.id}
                          onMouseEnter={() => setHoveredContact(contact.id)}
                          onMouseLeave={() => setHoveredContact(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '7px 0',
                            borderBottom: '1px solid rgba(0,0,0,0.03)',
                            transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                          }}
                        >
                          {/* Avatar */}
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              backgroundColor: isGeneric
                                ? `${brandColor}1F`
                                : brandColor,
                              color: isGeneric ? brandColor : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(contact.name)}
                          </div>

                          {/* Name + Role */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {contact.name}
                            </div>
                            {contact.title && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: 'var(--text-muted)',
                                  lineHeight: 1.3,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {contact.title}{contact.region ? ` · ${contact.region}` : ''}
                              </div>
                            )}
                          </div>

                          {/* Phone (hero) */}
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone.replace(/\D/g, '')}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--blue)',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              <PhoneIcon size={11} />
                              {contact.phone}
                            </a>
                          )}

                          {/* Email tooltip on hover */}
                          {contact.email && isHovered && (
                            <a
                              href={`mailto:${contact.email}`}
                              style={{
                                fontSize: 10,
                                color: 'var(--blue)',
                                textDecoration: 'none',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                              }}
                              title={contact.email}
                            >
                              @
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* ── Documents Column ── */}
                <div
                  style={{
                    padding: '14px 18px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.08) transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}
                    >
                      Documents
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-faint)',
                        background: 'var(--bg-subtle)',
                        padding: '1px 5px',
                        borderRadius: 4,
                      }}
                    >
                      {documents.length}
                    </span>
                  </div>

                  {documents.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No documents available
                    </div>
                  ) : (
                    documents.map((doc) => {
                      const isHovered = hoveredDoc === doc.id;
                      return (
                        <a
                          key={doc.id}
                          href={doc.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onMouseEnter={() => setHoveredDoc(doc.id)}
                          onMouseLeave={() => setHoveredDoc(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '7px 0',
                            borderBottom: '1px solid rgba(0,0,0,0.03)',
                            textDecoration: 'none',
                            transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                          }}
                        >
                          {/* Doc icon */}
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              backgroundColor: 'rgba(196,74,63,0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: 'var(--red)',
                            }}
                          >
                            <DocIcon size={13} />
                          </div>

                          {/* Name */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: isHovered ? 'var(--blue)' : 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                transition: 'color 150ms',
                              }}
                            >
                              {doc.name}
                            </div>
                          </div>

                          {/* Meta */}
                          <span style={{ fontSize: 9.5, color: 'var(--text-faint)', flexShrink: 0 }}>
                            PDF
                          </span>
                        </a>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Quick Link Pills ── */}
              {quickLinks.length > 0 && (
                <div
                  style={{
                    padding: '10px 18px',
                    borderTop: '1px solid var(--bg-muted)',
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    flexShrink: 0,
                  }}
                >
                  {quickLinks.map((link) => {
                    const isHovered = hoveredPill === link.id;
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={() => setHoveredPill(link.id)}
                        onMouseLeave={() => setHoveredPill(null)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 500,
                          textDecoration: 'none',
                          transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                          backgroundColor: isHovered ? '#fff' : 'var(--bg-subtle)',
                          color: isHovered ? 'var(--text-primary)' : 'var(--text-muted)',
                          border: isHovered ? '1px solid var(--bg-muted)' : '1px solid transparent',
                        }}
                      >
                        {pillIcon(link.link_type)}
                        {link.name}
                      </a>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
                fontStyle: 'italic',
              }}
            >
              Select a carrier from the list
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarrierResourcesPage;
