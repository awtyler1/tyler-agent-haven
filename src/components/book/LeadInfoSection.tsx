import { useState, useRef, useEffect } from 'react';
import { useUpdateClient } from '@/hooks/useUpdateClient';

const SOURCE_OPTIONS = [
  { label: 'Referral', value: 'referral' },
  { label: 'Phone Call', value: 'phone_call' },
  { label: 'Community Event', value: 'community_event' },
  { label: 'Walk-in', value: 'walk_in' },
  { label: 'Other', value: 'other' },
] as const;

const FIELD_TO_COLUMN: Record<string, string> = {
  date_of_birth: 'date_of_birth',
  email: 'email',
  lead_source: 'lead_source',
};

interface LeadInfoSectionProps {
  clientId: string;
  leadSource: string | null;
  dateOfBirth: string | null;
  email: string | null;
  editAll?: boolean;
}

export function LeadInfoSection({
  clientId,
  leadSource,
  dateOfBirth,
  email,
  editAll = false,
}: LeadInfoSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const updateClient = useUpdateClient();

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

  const handleSourceChange = (value: string) => {
    updateClient.mutate({ clientId, field: 'lead_source', value: value || null });
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
        Lead Details
      </div>

      {/* Collapsible body */}
      <div
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: isOpen ? 500 : 0,
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
            {/* Source — pill selector */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Source
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SOURCE_OPTIONS.map((opt) => {
                  const isActive = leadSource === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSourceChange(isActive ? '' : opt.value)}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        fontWeight: isActive ? 600 : 500,
                        padding: '4px 12px',
                        borderRadius: 16,
                        border: `1px solid ${isActive ? 'var(--blue)' : 'var(--bg-muted)'}`,
                        background: isActive ? 'rgba(74,127,181,0.06)' : 'white',
                        color: isActive ? 'var(--blue)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date of Birth */}
            <EditableField
              label="Date of Birth"
              displayValue={dateOfBirth ? formatDOB(dateOfBirth) : '—'}
              rawValue={dateOfBirth ? toDateInputValue(dateOfBirth) : ''}
              fieldKey="date_of_birth"
              inputType="date"
              editing={isEditing('date_of_birth')}
              onStartEdit={() => setEditingField('date_of_birth')}
              onSave={handleSave}
              onCancel={() => setEditingField(null)}
            />

            {/* Email */}
            <EditableField
              label="Email"
              displayValue={email ? email.toLowerCase() : '—'}
              rawValue={email || ''}
              fieldKey="email"
              inputType="email"
              editing={isEditing('email')}
              onStartEdit={() => setEditingField('email')}
              onSave={handleSave}
              onCancel={() => setEditingField(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableField({
  label,
  displayValue,
  rawValue,
  fieldKey,
  inputType = 'text',
  editing,
  onStartEdit,
  onSave,
  onCancel,
}: {
  label: string;
  displayValue: string;
  rawValue: string;
  fieldKey: string;
  inputType?: 'text' | 'date' | 'email';
  editing: boolean;
  onStartEdit: () => void;
  onSave: (fieldKey: string, value: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(rawValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(rawValue);
  }, [rawValue, editing]);

  useEffect(() => {
    if (editing) {
      setDraft(rawValue);
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
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>
          {label}
        </div>
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitSave(); }
            else if (e.key === 'Escape') { setDraft(rawValue); onCancel(); }
          }}
          style={{
            width: '100%',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 500,
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid var(--blue)',
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
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>
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
          e.currentTarget.style.borderColor = 'var(--blue)';
          e.currentTarget.style.background = 'rgba(74,127,181,0.02)';
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

function formatDOB(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function toDateInputValue(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}
