import { useState, useRef, useEffect } from 'react';

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
  const [localDoctors, setLocalDoctors] = useState<Doctor[]>(doctors);
  const [localMeds, setLocalMeds] = useState<Medication[]>(medications);
  const [localPharmacy, setLocalPharmacy] = useState(pharmacy);
  const [activePCP, setActivePCP] = useState<string | null>(
    doctors.find((d) => d.isPCP)?.id || null,
  );
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [showAllMeds, setShowAllMeds] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [addingMed, setAddingMed] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(false);

  const handleAddDoctor = (name: string, specialty: string) => {
    // TODO: persist to client_doctors table when created
    const newDoc: Doctor = {
      id: crypto.randomUUID(),
      name: name.trim(),
      specialty: specialty.trim(),
      isPCP: false,
    };
    setLocalDoctors((prev) => [...prev, newDoc]);
    setAddingDoctor(false);
  };

  const handleRemoveDoctor = (id: string) => {
    // TODO: delete from client_doctors table when created
    setLocalDoctors((prev) => prev.filter((d) => d.id !== id));
    if (activePCP === id) setActivePCP(null);
  };

  const handleSetPCP = (id: string) => {
    // TODO: persist PCP designation to database when client_doctors table exists
    setActivePCP(id);
  };

  const handleAddMed = (name: string, dosage: string) => {
    // TODO: persist to client_medications table when created
    const newMed: Medication = {
      id: crypto.randomUUID(),
      name: name.trim(),
      dosage: dosage.trim(),
    };
    setLocalMeds((prev) => [...prev, newMed]);
    setAddingMed(false);
  };

  const handleRemoveMed = (id: string) => {
    // TODO: delete from client_medications table when created
    setLocalMeds((prev) => prev.filter((m) => m.id !== id));
  };

  const handlePharmacySave = (value: string) => {
    // TODO: persist pharmacy to clients table or dedicated field when available
    setLocalPharmacy(value.trim() || pharmacy);
    setEditingPharmacy(false);
  };

  const visibleDoctors = showAllDoctors ? localDoctors : localDoctors.slice(0, 3);
  const visibleMeds = showAllMeds ? localMeds : localMeds.slice(0, 3);

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
          maxHeight: isOpen ? 1200 : 0,
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
                onClick={() => setAddingDoctor(true)}
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

            {visibleDoctors.map((doc) => (
              <DoctorRow
                key={doc.id}
                doctor={doc}
                isActivePCP={activePCP === doc.id}
                onSetPCP={() => handleSetPCP(doc.id)}
                onRemove={() => handleRemoveDoctor(doc.id)}
              />
            ))}
            {localDoctors.length > 3 && (
              <button
                onClick={() => setShowAllDoctors(!showAllDoctors)}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--blue)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 0 0',
                  display: 'block',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#3A6FA5')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--blue)')}
              >
                {showAllDoctors ? 'Show fewer' : `Show all ${localDoctors.length} doctors`}
              </button>
            )}
            {addingDoctor && (
              <InlineAddDoctor
                onSave={handleAddDoctor}
                onCancel={() => setAddingDoctor(false)}
              />
            )}
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
                onClick={() => setAddingMed(true)}
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

            {visibleMeds.map((med) => (
              <MedRow
                key={med.id}
                medication={med}
                onRemove={() => handleRemoveMed(med.id)}
              />
            ))}
            {localMeds.length > 3 && (
              <button
                onClick={() => setShowAllMeds(!showAllMeds)}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--blue)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 0 0',
                  display: 'block',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#3A6FA5')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--blue)')}
              >
                {showAllMeds ? 'Show fewer' : `Show all ${localMeds.length} medications`}
              </button>
            )}
            {addingMed && (
              <InlineAddMed
                onSave={handleAddMed}
                onCancel={() => setAddingMed(false)}
              />
            )}

            {/* Pharmacy — editable */}
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
              {editingPharmacy ? (
                <PharmacyInput
                  value={localPharmacy}
                  onSave={handlePharmacySave}
                  onCancel={() => setEditingPharmacy(false)}
                />
              ) : (
                <strong
                  onClick={() => setEditingPharmacy(true)}
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    borderBottom: '1px dashed var(--bg-muted)',
                    transition: 'border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bg-muted)')}
                >
                  {localPharmacy}
                </strong>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Inline add form for doctors */
function InlineAddDoctor({
  onSave,
  onCancel,
}: {
  onSave: (name: string, specialty: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(name, specialty);
  };

  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        ref={nameRef}
        type="text"
        placeholder="Doctor name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        style={inlineInputStyle}
        onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--bg-muted)')}
      />
      <input
        type="text"
        placeholder="Specialty (optional)"
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        style={inlineInputStyle}
        onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--bg-muted)')}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 14px',
            borderRadius: 8,
            border: 'none',
            background: name.trim() ? 'var(--blue)' : 'var(--bg-muted)',
            color: name.trim() ? 'white' : 'var(--text-faint)',
            cursor: name.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Inline add form for medications */
function InlineAddMed({
  onSave,
  onCancel,
}: {
  onSave: (name: string, dosage: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(name, dosage);
  };

  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        ref={nameRef}
        type="text"
        placeholder="Medication name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        style={inlineInputStyle}
        onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--bg-muted)')}
      />
      <input
        type="text"
        placeholder="Dosage (optional)"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        style={inlineInputStyle}
        onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--bg-muted)')}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 14px',
            borderRadius: 8,
            border: 'none',
            background: name.trim() ? 'var(--blue)' : 'var(--bg-muted)',
            color: name.trim() ? 'white' : 'var(--text-faint)',
            cursor: name.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Inline pharmacy editor */
function PharmacyInput({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <input
      ref={ref}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onSave(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(draft);
        if (e.key === 'Escape') onCancel();
      }}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--text-primary)',
        padding: '2px 6px',
        borderRadius: 4,
        border: '1px solid var(--gold)',
        background: 'white',
        outline: 'none',
        width: '100%',
        marginTop: 2,
      }}
    />
  );
}

function DoctorRow({
  doctor,
  isActivePCP,
  onSetPCP,
  onRemove,
}: {
  doctor: Doctor;
  isActivePCP: boolean;
  onSetPCP: () => void;
  onRemove: () => void;
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
        {doctor.specialty && (
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{doctor.specialty}</div>
        )}
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
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
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

function MedRow({
  medication,
  onRemove,
}: {
  medication: Medication;
  onRemove: () => void;
}) {
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
        {medication.dosage && (
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{medication.dosage}</div>
        )}
      </div>

      {/* Remove button */}
      <button
        className="remove-btn-target"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
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

const inlineInputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12.5,
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--bg-muted)',
  background: 'white',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
};
