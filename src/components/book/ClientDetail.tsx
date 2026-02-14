import { useState } from 'react';
import type { BookClientWithMeta } from '@/hooks/useBookClients';
import { useClientDetail } from '@/hooks/useClientDetail';
import { formatPhone, titleCase } from '@/lib/utils';
import { JournalZone } from './JournalZone';
import { ClientInfoSection } from './ClientInfoSection';
import { DoctorsMedsSection } from './DoctorsMedsSection';
import { LeadInfoSection } from './LeadInfoSection';

// Map carrier names to Homestead CSS variables
const CARRIER_CSS_VARS: Record<string, string> = {
  humana: 'var(--carrier-humana)',
  aetna: 'var(--carrier-aetna)',
  anthem: 'var(--carrier-anthem)',
  uhc: 'var(--carrier-uhc)',
  'united healthcare': 'var(--carrier-uhc)',
  wellcare: 'var(--carrier-wellcare)',
  devoted: 'var(--carrier-devoted)',
};

function getCarrierCSSVar(carrierName: string): string {
  const key = carrierName.toLowerCase();
  for (const [pattern, cssVar] of Object.entries(CARRIER_CSS_VARS)) {
    if (key.includes(pattern)) return cssVar;
  }
  return 'var(--text-muted)';
}

const SOURCE_LABELS: Record<string, string> = {
  referral: 'Referral',
  phone_call: 'Phone Call',
  community_event: 'Community Event',
  walk_in: 'Walk-in',
  other: 'Other',
};

interface ClientDetailProps {
  client: BookClientWithMeta;
  onPrev?: () => void;
  onNext?: () => void;
  onEnroll?: () => void;
}

export function ClientDetail({ client, onPrev, onNext, onEnroll }: ClientDetailProps) {
  const { data: detail } = useClientDetail(client.id);
  const [editAllFields, setEditAllFields] = useState(false);

  const isLead = client.status === 'lead';

  // Use detail data when available, fall back to list data
  const primaryPolicy = detail?.policies
    ?.filter((p) => p.status === 'active')
    ?.sort((a, b) => (b.effective_date || '').localeCompare(a.effective_date || ''))[0];

  const carrierName = primaryPolicy?.carrier?.name || client.carrier_name || '';
  const planName = primaryPolicy?.plan_name || client.plan_name || '';
  const effectiveDate = primaryPolicy?.effective_date || client.effective_date || '';
  const carrierCSSVar = getCarrierCSSVar(carrierName);

  const carrierChipLabel = planName
    ? planName.toLowerCase().includes(carrierName.toLowerCase())
      ? planName
      : `${carrierName} ${planName}`
    : carrierName;

  const effDisplay = effectiveDate ? formatEffDate(effectiveDate) : null;

  // Lead-specific meta
  const sourceLabel = client.lead_source ? SOURCE_LABELS[client.lead_source] || client.lead_source : null;
  const addedDisplay = client.created_at ? formatAddedDate(client.created_at) : null;

  return (
    <div
      style={{
        flex: 1,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* ===== Header Shelf ===== */}
      <div
        style={{
          padding: '20px 24px 16px',
          flexShrink: 0,
          background: isLead
            ? 'linear-gradient(180deg, rgba(74,127,181,0.04) 0%, var(--bg) 100%)'
            : 'linear-gradient(180deg, var(--bg-warm-glow) 0%, var(--bg) 100%)',
          borderBottom: '2px solid transparent',
          borderImage: isLead
            ? 'linear-gradient(90deg, var(--blue) 0%, rgba(74,127,181,0.1) 100%) 1'
            : 'linear-gradient(90deg, var(--gold) 0%, rgba(201,168,76,0.15) 100%) 1',
          position: 'relative',
        }}
      >
        {/* Top row: name + actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {/* Lead badge */}
            {isLead && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--blue)',
                  background: 'rgba(74,127,181,0.08)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  display: 'inline-block',
                  marginBottom: 6,
                }}
              >
                LEAD
              </span>
            )}
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {titleCase(client.first_name)} {titleCase(client.last_name)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setEditAllFields(!editAllFields)}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                fontWeight: 500,
                padding: '4px 12px',
                borderRadius: 6,
                border: `1px solid ${editAllFields ? 'var(--gold)' : 'var(--bg-muted)'}`,
                background: editAllFields ? 'rgba(201,168,76,0.06)' : 'white',
                color: editAllFields ? 'var(--gold-dark)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {editAllFields ? 'Done' : 'Edit'}
            </button>
            {isLead && onEnroll ? (
              <button
                onClick={onEnroll}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--green)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Enroll
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={onPrev}
                  disabled={!onPrev}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid var(--bg-muted)',
                    background: 'white',
                    color: onPrev ? 'var(--text-muted)' : 'var(--text-faint)',
                    cursor: onPrev ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: onPrev ? 1 : 0.5,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={onNext}
                  disabled={!onNext}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid var(--bg-muted)',
                    background: 'white',
                    color: onNext ? 'var(--text-muted)' : 'var(--text-faint)',
                    cursor: onNext ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: onNext ? 1 : 0.5,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Meta chips row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            flexWrap: 'wrap',
          }}
        >
          {/* Zip chip — gold-tinted, always first */}
          {(detail?.address_zip || client.carrier_name) && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--gold-dark)',
                padding: '4px 11px',
                borderRadius: 6,
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.3)',
                letterSpacing: '0.03em',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {detail?.address_zip || '\u2014'}
            </span>
          )}

          {/* For clients: carrier chip, eff date */}
          {!isLead && carrierName && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--text-primary)',
                padding: '4px 11px',
                borderRadius: 6,
                background: 'white',
                border: '1px solid var(--bg-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: carrierCSSVar,
                  flexShrink: 0,
                }}
              />
              {carrierChipLabel}
            </span>
          )}

          {!isLead && effDisplay && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: 'var(--text-muted)',
                padding: '4px 11px',
                borderRadius: 6,
                background: 'white',
                border: '1px solid var(--bg-muted)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {effDisplay}
            </span>
          )}

          {/* For leads: source chip, date added chip */}
          {isLead && sourceLabel && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: 'var(--text-muted)',
                padding: '4px 11px',
                borderRadius: 6,
                background: 'white',
                border: '1px solid var(--bg-muted)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {sourceLabel}
            </span>
          )}

          {isLead && addedDisplay && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: 'var(--text-muted)',
                padding: '4px 11px',
                borderRadius: 6,
                background: 'white',
                border: '1px solid var(--bg-muted)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {addedDisplay}
            </span>
          )}

          {/* Phone chip — always shown */}
          {client.phone && (
            <a
              href={`tel:+1${client.phone.replace(/\D/g, '').replace(/^1/, '')}`}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: 'var(--blue)',
                padding: '4px 11px',
                borderRadius: 6,
                background: 'white',
                border: '1px solid var(--bg-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(74,127,181,0.06)';
                e.currentTarget.style.borderColor = 'rgba(74,127,181,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = 'var(--bg-muted)';
              }}
            >
              {formatPhone(client.phone)}
            </a>
          )}
        </div>
      </div>

      {/* ===== Scrollable Body ===== */}
      <div
        className="detail-body-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0 0 20px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--bg-muted) transparent',
        }}
      >
        {/* Conversion banner (leads only) */}
        {isLead && onEnroll && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '14px 18px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(107,138,66,0.08) 0%, rgba(201,168,76,0.06) 100%)',
              border: '1px solid rgba(107,138,66,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                Ready to enroll <strong>{titleCase(client.first_name)}</strong>?
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>
                Add their plan info to convert this lead to a client.
              </div>
            </div>
            <button
              onClick={onEnroll}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--green)',
                color: 'white',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Enroll
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </div>
        )}

        {/* Journal Zone */}
        <div style={{ margin: '16px 24px 0' }}>
          <JournalZone clientId={client.id} firstName={titleCase(client.first_name)} isLead={isLead} />
        </div>

        <div style={{ height: 4 }} />

        {/* Sections differ for leads vs clients */}
        <div style={{ padding: '0 24px' }}>
          {isLead ? (
            <LeadInfoSection
              clientId={client.id}
              leadSource={detail?.lead_source ?? client.lead_source ?? null}
              dateOfBirth={detail?.date_of_birth ?? client.date_of_birth}
              email={detail?.email ?? client.email}
              editAll={editAllFields}
            />
          ) : (
            <>
              <ClientInfoSection
                clientId={client.id}
                dateOfBirth={detail?.date_of_birth ?? client.date_of_birth}
                age={client.age}
                phone={detail?.phone ?? client.phone}
                email={detail?.email ?? client.email}
                medicareNumber={detail?.medicare_number}
                addressLine1={detail?.address_line1}
                addressCity={detail?.address_city}
                addressState={detail?.address_state}
                addressZip={detail?.address_zip}
                editAll={editAllFields}
              />
              <DoctorsMedsSection />
            </>
          )}
        </div>
      </div>

      {/* Custom scrollbar + hover styles */}
      <style>{`
        .detail-body-scroll::-webkit-scrollbar { width: 4px; }
        .detail-body-scroll::-webkit-scrollbar-thumb { background: var(--bg-muted); border-radius: 2px; }
        .detail-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .doctor-row-hover:hover .remove-btn-target,
        .med-row-hover:hover .remove-btn-target { opacity: 1 !important; }
        .remove-btn-target:hover { background: rgba(196,74,63,0.08) !important; color: var(--red) !important; }
      `}</style>
    </div>
  );
}

function formatEffDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `Eff ${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return `Eff ${dateStr}`;
  }
}

function formatAddedDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Added ${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return '';
  }
}
