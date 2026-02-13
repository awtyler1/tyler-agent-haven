import { useState } from 'react';
import { formatPhone } from '@/lib/utils';

interface ClientInfoSectionProps {
  dateOfBirth: string | null;
  age: number | null;
  phone: string | null;
  email: string | null;
  // These fields aren't in the current schema but we show placeholders for them
  medicareNumber?: string | null;
  partAEffective?: string | null;
  partBEffective?: string | null;
  homePhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export function ClientInfoSection({
  dateOfBirth,
  age,
  phone,
  email,
  medicareNumber,
  partAEffective,
  partBEffective,
  homePhone,
  address,
  city,
  state,
  zip,
}: ClientInfoSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Section title — collapsible */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 13,
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          marginBottom: 10,
          letterSpacing: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            flexShrink: 0,
            color: 'var(--text-faint)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
        Personal Information
      </div>

      {/* Collapsible body */}
      <div
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: isOpen ? 800 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 20px',
            }}
          >
            <InfoField label="Date of Birth" value={formatDOBWithAge(dateOfBirth, age)} />
            <InfoField label="Medicare #" value={medicareNumber || '—'} />
            <InfoField label="Part A Effective" value={partAEffective || '—'} />
            <InfoField label="Part B Effective" value={partBEffective || '—'} />
            <InfoField label="Cell Phone" value={formatPhone(phone)} />
            <InfoField label="Home Phone" value={formatPhone(homePhone)} />
            <InfoField label="Email" value={email ? email.toLowerCase() : '—'} fullWidth />
            <InfoField label="Street Address" value={address || '—'} fullWidth />
            <InfoField label="City" value={city || '—'} />
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <InfoField label="State" value={state || '—'} />
                <InfoField label="Zip" value={zip || '—'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontWeight: 500,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          fontWeight: 500,
          padding: '5px 10px',
          borderRadius: 6,
          border: '1px solid var(--bg-muted)',
          background: 'white',
          cursor: 'pointer',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          lineHeight: 1.4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--gold)';
          e.currentTarget.style.background = '#FFFDF8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--bg-muted)';
          e.currentTarget.style.background = 'white';
        }}
      >
        {value}
      </div>
    </div>
  );
}

function formatDOBWithAge(dob: string | null, age: number | null): string {
  if (!dob) return '—';
  try {
    const d = new Date(dob);
    const formatted = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
    return age !== null ? `${formatted} (${age})` : formatted;
  } catch {
    return dob;
  }
}
