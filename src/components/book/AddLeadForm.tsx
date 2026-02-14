import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateClient } from '@/hooks/useCreateClient';
import { supabase } from '@/integrations/supabase/client';

interface AddLeadFormProps {
  onCancel: () => void;
  onSaved: (clientId: string) => void;
}

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  phone: '',
  address_zip: '',
};

type FormKey = keyof typeof EMPTY_FORM;

const REQUIRED_FIELDS: FormKey[] = ['first_name', 'last_name', 'phone', 'address_zip'];

const SOURCE_OPTIONS = [
  { label: 'Referral', value: 'referral' },
  { label: 'Phone Call', value: 'phone_call' },
  { label: 'Community Event', value: 'community_event' },
  { label: 'Walk-in', value: 'walk_in' },
  { label: 'Other', value: 'other' },
] as const;

export function AddLeadForm({ onCancel, onSaved }: AddLeadFormProps) {
  const { profile } = useAuth();
  const createClient = useCreateClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [leadSource, setLeadSource] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Set<FormKey>>(new Set());
  const [saveError, setSaveError] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Auto-focus first name on mount
  useEffect(() => {
    requestAnimationFrame(() => firstNameRef.current?.focus());
  }, []);

  // Escape to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  const setField = useCallback((key: FormKey, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setSaveError(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile?.id) return;

    // Validate required fields
    const missing = new Set<FormKey>();
    for (const key of REQUIRED_FIELDS) {
      if (!form[key].trim()) missing.add(key);
    }
    if (missing.size > 0) {
      setErrors(missing);
      return;
    }

    setSaveError(false);
    try {
      const result = await createClient.mutateAsync({
        profile_id: profile.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        address_zip: form.address_zip.trim(),
        status: 'lead',
        lead_source: leadSource,
      });

      // If notes were provided, create an initial journal entry
      if (notes.trim()) {
        await supabase.from('client_interactions').insert({
          client_id: result.id,
          profile_id: profile.id,
          interaction_type: 'note',
          notes: notes.trim(),
        });
      }

      onSaved(result.id);
    } catch {
      setSaveError(true);
    }
  }, [profile?.id, form, leadSource, notes, createClient, onSaved]);

  const labelStyle = (key?: FormKey): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 600,
    color: key && errors.has(key) ? 'var(--red)' : 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 3,
  });

  const inputStyle = (key: FormKey): React.CSSProperties => ({
    width: '100%',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    padding: '8px 12px',
    border: `1px solid ${errors.has(key) ? 'var(--red)' : 'var(--bg-muted)'}`,
    borderRadius: 8,
    background: 'white',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const sectionTitle = (text: string) => (
    <div
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 13,
        fontWeight: 400,
        fontStyle: 'italic',
        color: 'var(--text-muted)',
        marginBottom: 10,
        letterSpacing: 0,
      }}
    >
      {text}
    </div>
  );

  const requiredMark = <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>;
  const isPending = createClient.isPending;

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
      {/* ===== Blue Header Shelf ===== */}
      <div
        style={{
          padding: '20px 24px 16px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgba(74,127,181,0.04) 0%, var(--bg) 100%)',
          borderBottom: '2px solid transparent',
          borderImage: 'linear-gradient(90deg, var(--blue) 0%, rgba(74,127,181,0.1) 100%) 1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {/* Lead badge */}
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
              NEW LEAD
            </span>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Add a Lead
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                marginTop: 4,
              }}
            >
              Someone you've talked to but hasn't enrolled yet.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onCancel}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: 8,
                border: '1px solid var(--bg-muted)',
                background: 'white',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: 8,
                border: 'none',
                background: isPending ? 'var(--text-muted)' : 'var(--blue)',
                color: 'white',
                cursor: isPending ? 'default' : 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? 'Saving…' : 'Save Lead'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Scrollable Form Body ===== */}
      <div
        className="add-lead-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 24px 24px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--bg-muted) transparent',
        }}
      >
        {/* Section 1: Who are they? */}
        {sectionTitle('Who are they?')}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={labelStyle('first_name')}>First Name{requiredMark}</div>
              <input
                ref={firstNameRef}
                type="text"
                value={form.first_name}
                onChange={e => setField('first_name', e.target.value)}
                placeholder="Jane"
                style={inputStyle('first_name')}
                onFocus={e => { if (!errors.has('first_name')) e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { if (!errors.has('first_name')) e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
            <div>
              <div style={labelStyle('last_name')}>Last Name{requiredMark}</div>
              <input
                type="text"
                value={form.last_name}
                onChange={e => setField('last_name', e.target.value)}
                placeholder="Smith"
                style={inputStyle('last_name')}
                onFocus={e => { if (!errors.has('last_name')) e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { if (!errors.has('last_name')) e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
            <div>
              <div style={labelStyle('phone')}>Phone{requiredMark}</div>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="(555) 555-0100"
                style={inputStyle('phone')}
                onFocus={e => { if (!errors.has('phone')) e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { if (!errors.has('phone')) e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
            <div>
              <div style={labelStyle('address_zip')}>ZIP{requiredMark}</div>
              <input
                type="text"
                value={form.address_zip}
                onChange={e => setField('address_zip', e.target.value)}
                placeholder="40502"
                style={{ ...inputStyle('address_zip'), maxWidth: 120 }}
                onFocus={e => { if (!errors.has('address_zip')) e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { if (!errors.has('address_zip')) e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: How did you meet? */}
        {sectionTitle('How did you meet?')}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SOURCE_OPTIONS.map(opt => {
              const isActive = leadSource === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setLeadSource(isActive ? null : opt.value)}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    padding: '6px 14px',
                    borderRadius: 20,
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

        {/* Section 3: Notes */}
        {sectionTitle('Notes')}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            borderLeft: '3px solid var(--blue)',
            padding: '14px 16px',
          }}
        >
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything to remember — their situation, what they're looking for, when to follow up…"
            style={{
              width: '100%',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              padding: '8px 12px',
              border: '1px solid var(--bg-muted)',
              borderRadius: 8,
              background: 'white',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
              minHeight: 80,
              resize: 'vertical',
              transition: 'border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
            }}
          />
        </div>
      </div>

      {/* ===== Sticky Footer ===== */}
      <div
        style={{
          flexShrink: 0,
          background: 'var(--bg-subtle)',
          borderTop: '1px solid var(--bg-muted)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-faint)',
            fontFamily: 'var(--font-sans)',
            maxWidth: 220,
            lineHeight: 1.3,
          }}
        >
          Leads appear in your book with a blue tag until they enroll.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saveError && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--red)',
                fontFamily: 'var(--font-sans)',
                marginRight: 4,
              }}
            >
              Couldn't save — try again
            </span>
          )}
          <button
            onClick={onCancel}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid var(--bg-muted)',
              background: 'white',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: isPending ? 'var(--text-muted)' : 'var(--blue)',
              color: 'white',
              cursor: isPending ? 'default' : 'pointer',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Saving…' : 'Save Lead'}
          </button>
        </div>
      </div>

      <style>{`
        .add-lead-scroll::-webkit-scrollbar { width: 4px; }
        .add-lead-scroll::-webkit-scrollbar-thumb { background: var(--bg-muted); border-radius: 2px; }
        .add-lead-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
