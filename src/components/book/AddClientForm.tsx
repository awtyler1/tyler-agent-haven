import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateClient } from '@/hooks/useCreateClient';

interface AddClientFormProps {
  onCancel: () => void;
  onSaved: (clientId: string) => void;
}

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  phone: '',
  address_zip: '',
  date_of_birth: '',
  medicare_number: '',
  email: '',
  address_line1: '',
  address_city: '',
  address_state: '',
};

type FormKey = keyof typeof EMPTY_FORM;

const REQUIRED_FIELDS: FormKey[] = ['first_name', 'last_name', 'phone', 'address_zip'];

export function AddClientForm({ onCancel, onSaved }: AddClientFormProps) {
  const { profile } = useAuth();
  const createClient = useCreateClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
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
        date_of_birth: form.date_of_birth || null,
        medicare_number: form.medicare_number.trim() || null,
        email: form.email.trim() || null,
        address_line1: form.address_line1.trim() || null,
        address_city: form.address_city.trim() || null,
        address_state: form.address_state.trim() || null,
      });
      onSaved(result.id);
    } catch {
      setSaveError(true);
    }
  }, [profile?.id, form, createClient, onSaved]);

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
    fontFamily: "var(--font-sans)",
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
        fontFamily: "var(--font-serif)",
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
      {/* ===== Warm Header Shelf ===== */}
      <div
        style={{
          padding: '20px 24px 16px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, var(--bg-warm-glow) 0%, var(--bg) 100%)',
          borderBottom: '2px solid transparent',
          borderImage: 'linear-gradient(90deg, var(--gold) 0%, rgba(201,168,76,0.15) 100%) 1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                fontWeight: 600,
                fontStyle: 'italic',
                color: 'var(--text-muted)',
                letterSpacing: '-0.01em',
              }}
            >
              New Client
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-faint)',
                fontFamily: "var(--font-sans)",
                marginTop: 4,
              }}
            >
              Fill in what you know — you can always add more later.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onCancel}
              style={{
                fontFamily: "var(--font-sans)",
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
                fontFamily: "var(--font-sans)",
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
              {isPending ? 'Saving…' : 'Save Client'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Scrollable Form Body ===== */}
      <div
        className="add-client-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 24px 24px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--bg-muted) transparent',
        }}
      >
        {/* Section 1: Essentials */}
        {sectionTitle('Essentials')}
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
            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Phone */}
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

            {/* ZIP */}
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

        {/* Section 2: Personal Information */}
        {sectionTitle('Personal Information')}
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
            {/* Date of Birth */}
            <div>
              <div style={labelStyle()}>Date of Birth</div>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => setField('date_of_birth', e.target.value)}
                style={inputStyle('date_of_birth')}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>

            {/* Medicare # */}
            <div>
              <div style={labelStyle()}>Medicare #</div>
              <input
                type="text"
                value={form.medicare_number}
                onChange={e => setField('medicare_number', e.target.value)}
                placeholder="1EG4-TE5-MK72"
                style={inputStyle('medicare_number')}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>

            {/* Email — full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle()}>Email</div>
              <input
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="jane.smith@email.com"
                style={inputStyle('email')}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>

            {/* Street Address — full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle()}>Street Address</div>
              <input
                type="text"
                value={form.address_line1}
                onChange={e => setField('address_line1', e.target.value)}
                placeholder="123 Main Street"
                style={inputStyle('address_line1')}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>

            {/* City */}
            <div>
              <div style={labelStyle()}>City</div>
              <input
                type="text"
                value={form.address_city}
                onChange={e => setField('address_city', e.target.value)}
                placeholder="Lexington"
                style={inputStyle('address_city')}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>

            {/* State + Zip side by side */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 8 }}>
                <div>
                  <div style={labelStyle()}>State</div>
                  <input
                    type="text"
                    value={form.address_state}
                    onChange={e => setField('address_state', e.target.value)}
                    placeholder="KY"
                    maxLength={2}
                    style={inputStyle('address_state')}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
                  />
                </div>
                <div>
                  <div style={labelStyle()}>Zip</div>
                  <input
                    type="text"
                    value={form.address_zip}
                    onChange={e => setField('address_zip', e.target.value)}
                    placeholder="40502"
                    style={inputStyle('address_zip')}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Journal placeholder */}
        {sectionTitle('Journal')}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            borderLeft: '3px solid var(--gold)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-faint)"
            strokeWidth="1.7"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          <span
            style={{
              fontSize: 12.5,
              color: 'var(--text-faint)',
              fontFamily: "var(--font-sans)",
            }}
          >
            Notes will be available after saving
          </span>
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
            fontFamily: "var(--font-sans)",
          }}
        >
          * Required fields
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saveError && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--red)',
                fontFamily: "var(--font-sans)",
                marginRight: 4,
              }}
            >
              Couldn't save — try again
            </span>
          )}
          <button
            onClick={onCancel}
            style={{
              fontFamily: "var(--font-sans)",
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
              fontFamily: "var(--font-sans)",
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
            {isPending ? 'Saving…' : 'Save Client'}
          </button>
        </div>
      </div>

      {/* Scrollbar styling */}
      <style>{`
        .add-client-scroll::-webkit-scrollbar { width: 4px; }
        .add-client-scroll::-webkit-scrollbar-thumb { background: var(--bg-muted); border-radius: 2px; }
        .add-client-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
