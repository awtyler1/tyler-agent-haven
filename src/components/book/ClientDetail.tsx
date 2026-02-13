import type { BookClientWithMeta } from '@/hooks/useBookClients';
import { useClientDetail } from '@/hooks/useClientDetail';
import { formatPhone, titleCase } from '@/lib/utils';
import { JournalZone } from './JournalZone';
import { ClientInfoSection } from './ClientInfoSection';
import { DoctorsMedsSection } from './DoctorsMedsSection';

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

interface ClientDetailProps {
  client: BookClientWithMeta;
  onPrev?: () => void;
  onNext?: () => void;
}

export function ClientDetail({ client, onPrev, onNext }: ClientDetailProps) {
  const { data: detail } = useClientDetail(client.id);

  // Use detail data when available, fall back to list data
  const primaryPolicy = detail?.policies
    ?.filter((p) => p.status === 'active')
    ?.sort((a, b) => (b.effective_date || '').localeCompare(a.effective_date || ''))[0];

  const carrierName = primaryPolicy?.carrier?.name || client.carrier_name || '';
  const planName = primaryPolicy?.plan_name || client.plan_name || '';
  const effectiveDate = primaryPolicy?.effective_date || client.effective_date || '';
  const carrierCSSVar = getCarrierCSSVar(carrierName);

  // Build carrier chip label: show planName only if it already includes the carrier,
  // otherwise prefix with carrier name. Avoids "Aetna Aetna Medicare Signature…" duplication.
  const carrierChipLabel = planName
    ? planName.toLowerCase().includes(carrierName.toLowerCase())
      ? planName
      : `${carrierName} ${planName}`
    : carrierName;

  // Format effective date as "Eff MM/YYYY"
  const effDisplay = effectiveDate ? formatEffDate(effectiveDate) : null;

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
      {/* ===== Warm Header Shelf ===== */}
      <div
        style={{
          padding: '20px 24px 16px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, var(--bg-warm-glow) 0%, var(--bg) 100%)',
          borderBottom: '2px solid transparent',
          borderImage: 'linear-gradient(90deg, var(--gold) 0%, rgba(201,168,76,0.15) 100%) 1',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                fontWeight: 500,
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid var(--bg-muted)',
                background: 'white',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Edit
            </button>
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
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
          {/* Zip chip — gold-tinted, placed first */}
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
            {/* Show zip from detail or placeholder */}
            {/* TODO: wire to real zip from client data */}
            40502
          </span>

          {/* Carrier chip */}
          {carrierName && (
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

          {/* Effective date chip */}
          {effDisplay && (
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

          {/* Phone chip */}
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
          padding: '16px 24px 20px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--bg-muted) transparent',
        }}
      >
        {/* Journal Zone */}
        <div style={{ marginBottom: 20 }}>
          <JournalZone clientId={client.id} firstName={titleCase(client.first_name)} />
        </div>

        {/* 4px spacer */}
        <div style={{ height: 4 }} />

        {/* Personal Information */}
        <ClientInfoSection
          dateOfBirth={client.date_of_birth}
          age={client.age}
          phone={client.phone}
          email={client.email}
        />

        {/* Doctors & Medications */}
        <DoctorsMedsSection />
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
