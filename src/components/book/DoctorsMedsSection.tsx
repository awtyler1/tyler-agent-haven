import { useState } from 'react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  isPCP: boolean;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
}

interface DoctorsMedsSectionProps {
  doctors?: Doctor[];
  medications?: Medication[];
  pharmacy?: string;
}

// Sample data for UI chrome — will be replaced with real data later
const SAMPLE_DOCTORS: Doctor[] = [
  { id: '1', name: 'Dr. Robert Kim', specialty: 'Primary Care', isPCP: true },
  { id: '2', name: 'Dr. Sarah Patel', specialty: 'Cardiology', isPCP: false },
  { id: '3', name: 'Dr. Michael Lee', specialty: 'Endocrinology', isPCP: false },
];

const SAMPLE_MEDS: Medication[] = [
  { id: '1', name: 'Metformin', dosage: '500mg · 2x daily' },
  { id: '2', name: 'Lisinopril', dosage: '10mg · 1x daily' },
  { id: '3', name: 'Atorvastatin', dosage: '20mg · 1x daily' },
];

export function DoctorsMedsSection({
  doctors = SAMPLE_DOCTORS,
  medications = SAMPLE_MEDS,
  pharmacy = 'CVS — 1234 Richmond Rd',
}: DoctorsMedsSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activePCP, setActivePCP] = useState<string | null>(
    doctors.find((d) => d.isPCP)?.id || null,
  );

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
        Doctors & Medications
      </div>

      {/* Collapsible body */}
      <div
        style={{
          overflow: 'hidden',
          transition:
            'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: isOpen ? 800 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {/* Doctors card */}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Doctors
              </div>
              <button
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--blue)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                + Add
              </button>
            </div>

            {doctors.map((doc) => (
              <DoctorRow
                key={doc.id}
                doctor={doc}
                isActivePCP={activePCP === doc.id}
                onSetPCP={() => setActivePCP(doc.id)}
              />
            ))}
          </div>

          {/* Medications card */}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Medications
              </div>
              <button
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--blue)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                + Add
              </button>
            </div>

            {medications.map((med) => (
              <MedRow key={med.id} medication={med} />
            ))}

            {pharmacy && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: '1px solid var(--bg-muted)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                Preferred pharmacy:{' '}
                <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {pharmacy}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorRow({
  doctor,
  isActivePCP,
  onSetPCP,
}: {
  doctor: Doctor;
  isActivePCP: boolean;
  onSetPCP: () => void;
}) {
  const initials = doctor.name
    .replace(/^Dr\.\s*/, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="doctor-row-hover"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        position: 'relative',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(74,127,181,0.1)',
          color: 'var(--blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Name + specialty */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          {doctor.name}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{doctor.specialty}</div>
      </div>

      {/* PCP badge */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSetPCP();
        }}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 9,
          fontWeight: isActivePCP ? 700 : 600,
          letterSpacing: '0.03em',
          padding: '3px 8px',
          borderRadius: 4,
          border: `1px solid ${isActivePCP ? 'rgba(74,127,181,0.25)' : 'var(--bg-muted)'}`,
          background: isActivePCP ? 'rgba(74,127,181,0.1)' : 'transparent',
          color: isActivePCP ? 'var(--blue)' : 'var(--text-faint)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        PCP
      </button>

      {/* Remove button */}
      <button
        className="remove-btn-target"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-faint)',
          fontSize: 15,
          lineHeight: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: 0,
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        ×
      </button>
    </div>
  );
}

function MedRow({ medication }: { medication: Medication }) {
  return (
    <div
      className="med-row-hover"
      style={{
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          {medication.name}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{medication.dosage}</div>
      </div>

      {/* Remove button */}
      <button
        className="remove-btn-target"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-faint)',
          fontSize: 15,
          lineHeight: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: 0,
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        ×
      </button>
    </div>
  );
}
