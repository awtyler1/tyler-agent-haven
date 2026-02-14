import { useState, useRef, useEffect } from 'react';
import { formatPhone } from '@/lib/utils';
import { useUpdateClient } from '@/hooks/useUpdateClient';

interface ClientInfoSectionProps {
  clientId: string;
  dateOfBirth: string | null;
  age: number | null;
  phone: string | null;
  email: string | null;
  medicareNumber?: string | null;
  partAEffective?: string | null;
  partBEffective?: string | null;
  homePhone?: string | null;
  addressLine1?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  editAll?: boolean;
}

// Map field keys to clients table column names
const FIELD_TO_COLUMN: Record<string, string> = {
  date_of_birth: 'date_of_birth',
  medicare_number: 'medicare_number',
  phone: 'phone',
  email: 'email',
  address_line1: 'address_line1',
  address_city: 'address_city',
  address_state: 'address_state',
  address_zip: 'address_zip',
};

export function ClientInfoSection({
  clientId,
  dateOfBirth,
  age,
  phone,
  email,
  medicareNumber,
  partAEffective,
  partBEffective,
  homePhone,
  addressLine1,
  addressCity,
  addressState,
  addressZip,
  editAll = false,
}: ClientInfoSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const updateClient = useUpdateClient();

  // When editAll toggles on, don't auto-focus any field — agent clicks whichever they want
  // When editAll toggles off, close any active edit
  useEffect(() => {
    if (!editAll) setEditingField(null);
  }, [editAll]);

  const handleSave = (fieldKey: string, rawValue: string) => {
    const column = FIELD_TO_COLUMN[fieldKey];
    if (!column) return;
    const value = rawValue.trim() || null;
    updateClient.mutate({ clientId, field: column, value });
    setEditingField(null);
  };

  const isEditing = (key: string) => editAll || editingField === key;

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
            <EditableField
              label="Date of Birth"
              displayValue={formatDOBWithAge(dateOfBirth, age)}
              rawValue={dateOfBirth ? toDateInputValue(dateOfBirth) : ''}
              fieldKey="date_of_birth"
              inputType="date"
              editing={isEditing('date_of_birth')}
              onStartEdit={() => setEditingField('date_of_birth')}
              onSave={handleSave}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="Medicare #"
              displayValue={medicareNumber || '—'}
              rawValue={medicareNumber || ''}
              fieldKey="medicare_number"
              inputType="text"
              editing={isEditing('medicare_number')}
              onStartEdit={() => setEditingField('medicare_number')}
              onSave={handleSave}
              onCancel={() => setEditingField(null)}
            />
            <InfoField label="Part A Effective" value={partAEffective || '—'} />
            <InfoField label="Part B Effective" value={partBEffective || '—'} />
            <EditableField
              label="Cell Phone"
              displayValue={formatPhone(phone)}
              rawValue={phone || ''}
              fieldKey="phone"
              inputType="tel"
              editing={isEditing('phone')}
              onStartEdit={() => setEditingField('phone')}
              onSave={handleSave}
              onCancel={() => setEditingField(null)}
            />
            <InfoField label="Home Phone" value={formatPhone(homePhone)} />
            <EditableField
              label="Email"
              displayValue={email ? email.toLowerCase() : '—'}
              rawValue={email || ''}
              fieldKey="email"
              inputType="email"
              fullWidth
              editing={isEditing('email')}
              onStartEdit={() => setEditingField('email')}
              onSave={handleSave}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="Street Address"
              displayValue={addressLine1 || '—'}
              rawValue={addressLine1 || ''}
              fieldKey="address_line1"
              inputType="text"
              fullWidth
              editing={isEditing('address_line1')}
              onStartEdit={() => setEditingField('address_line1')}
              onSave={handleSave}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="City"
              displayValue={addressCity || '—'}
              rawValue={addressCity || ''}
              fieldKey="address_city"
              inputType="text"
              editing={isEditing('address_city')}
              onStartEdit={() => setEditingField('address_city')}
              onSave={handleSave}
              onCancel={() => setEditingField(null)}
            />
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <EditableField
                  label="State"
                  displayValue={addressState || '—'}
                  rawValue={addressState || ''}
                  fieldKey="address_state"
                  inputType="text"
                  editing={isEditing('address_state')}
                  onStartEdit={() => setEditingField('address_state')}
                  onSave={handleSave}
                  onCancel={() => setEditingField(null)}
                />
                <EditableField
                  label="Zip"
                  displayValue={addressZip || '—'}
                  rawValue={addressZip || ''}
                  fieldKey="address_zip"
                  inputType="text"
                  editing={isEditing('address_zip')}
                  onStartEdit={() => setEditingField('address_zip')}
                  onSave={handleSave}
                  onCancel={() => setEditingField(null)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Editable field: click to edit, blur/Enter to save, Escape to cancel */
function EditableField({
  label,
  displayValue,
  rawValue,
  fieldKey,
  inputType = 'text',
  fullWidth,
  editing,
  onStartEdit,
  onSave,
  onCancel,
}: {
  label: string;
  displayValue: string;
  rawValue: string;
  fieldKey: string;
  inputType?: 'text' | 'date' | 'tel' | 'email';
  fullWidth?: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onSave: (fieldKey: string, value: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(rawValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when rawValue changes externally (e.g., after save refetch)
  useEffect(() => {
    if (!editing) setDraft(rawValue);
  }, [rawValue, editing]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (editing) {
      setDraft(rawValue);
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing]);

  const commitSave = () => {
    if (draft !== rawValue) {
      onSave(fieldKey, draft);
    } else {
      onCancel();
    }
  };

  if (editing) {
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
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitSave();
            } else if (e.key === 'Escape') {
              setDraft(rawValue);
              onCancel();
            }
          }}
          style={{
            width: '100%',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 500,
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid var(--gold)',
            background: 'white',
            color: 'var(--text-primary)',
            outline: 'none',
            lineHeight: 1.4,
            boxSizing: 'border-box',
            transition: 'border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    );
  }

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
        onClick={onStartEdit}
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
        {displayValue}
      </div>
    </div>
  );
}

/** Read-only field (for Part A/B effective which aren't in the clients table) */
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
          lineHeight: 1.4,
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

/** Convert ISO or date string to YYYY-MM-DD for <input type="date"> */
function toDateInputValue(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}
