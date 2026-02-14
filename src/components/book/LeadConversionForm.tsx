import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClientDetail } from '@/hooks/useClientDetail';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { titleCase } from '@/lib/utils';

interface LeadConversionFormProps {
  clientId: string;
  clientName: string;
  onCancel: () => void;
  onConverted: (clientId: string) => void;
}

const PLAN_TYPES = [
  { label: 'MA', value: 'MA' },
  { label: 'MAPD', value: 'MAPD' },
  { label: 'PDP', value: 'PDP' },
  { label: 'Medigap', value: 'MEDIGAP' },
] as const;

interface CarrierOption {
  id: string;
  name: string;
}

export function LeadConversionForm({ clientId, clientName, onCancel, onConverted }: LeadConversionFormProps) {
  const { profile } = useAuth();
  const { data: detail } = useClientDetail(clientId);
  const queryClient = useQueryClient();

  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [carrierId, setCarrierId] = useState('');
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState('MAPD');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [medicareNumber, setMedicareNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  // Load carriers from DB
  useEffect(() => {
    supabase
      .from('carriers')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setCarriers(data);
      });
  }, []);

  // Pre-fill from existing detail data
  useEffect(() => {
    if (!detail) return;
    if (detail.medicare_number) setMedicareNumber(detail.medicare_number);
    if (detail.address_line1) setAddressLine1(detail.address_line1);
    if (detail.address_city) setAddressCity(detail.address_city);
    if (detail.address_state) setAddressState(detail.address_state);
    if (detail.address_zip) setAddressZip(detail.address_zip);
  }, [detail]);

  // Escape to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    setSaveError(null);
  };

  const handleConvert = useCallback(async () => {
    if (!profile?.id) return;

    // Validate required fields
    const missing = new Set<string>();
    if (!carrierId) missing.add('carrier');
    if (!planName.trim()) missing.add('plan_name');
    if (!effectiveDate) missing.add('effective_date');
    if (missing.size > 0) {
      setErrors(missing);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Create policy
      const { error: policyError } = await supabase.from('policies').insert({
        client_id: clientId,
        carrier_id: carrierId,
        plan_name: planName.trim(),
        plan_type: planType,
        effective_date: effectiveDate,
        profile_id: profile.id,
        status: 'active',
      });
      if (policyError) throw policyError;

      // 2. Update client: status → active + any additional fields
      const clientUpdate: Record<string, string | null> = { status: 'active' };
      if (medicareNumber.trim()) clientUpdate.medicare_number = medicareNumber.trim();
      if (addressLine1.trim()) clientUpdate.address_line1 = addressLine1.trim();
      if (addressCity.trim()) clientUpdate.address_city = addressCity.trim();
      if (addressState.trim()) clientUpdate.address_state = addressState.trim();
      if (addressZip.trim()) clientUpdate.address_zip = addressZip.trim();

      const { error: clientError } = await supabase
        .from('clients')
        .update(clientUpdate)
        .eq('id', clientId);
      if (clientError) throw clientError;

      // 3. Log conversion in timeline
      await supabase.from('client_interactions').insert({
        client_id: clientId,
        profile_id: profile.id,
        interaction_type: 'note',
        notes: `Enrolled — converted from lead to client.`,
      });

      // 4. Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] });
      queryClient.invalidateQueries({ queryKey: ['book-clients'] });

      onConverted(clientId);
    } catch (err) {
      console.error('Conversion failed:', err);
      setSaveError("Couldn't complete enrollment — try again");
    } finally {
      setIsSaving(false);
    }
  }, [profile?.id, clientId, carrierId, planName, planType, effectiveDate, medicareNumber, addressLine1, addressCity, addressState, addressZip, queryClient, onConverted]);

  const labelStyle = (key?: string): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 600,
    color: key && errors.has(key) ? 'var(--red)' : 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 3,
  });

  const inputStyle = (key?: string): React.CSSProperties => ({
    width: '100%',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    padding: '8px 12px',
    border: `1px solid ${key && errors.has(key) ? 'var(--red)' : 'var(--bg-muted)'}`,
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
      {/* ===== Green Header Shelf ===== */}
      <div
        style={{
          padding: '20px 24px 16px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgba(107,138,66,0.06) 0%, var(--bg) 100%)',
          borderBottom: '2px solid transparent',
          borderImage: 'linear-gradient(90deg, var(--green) 0%, rgba(107,138,66,0.1) 100%) 1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--green)',
                background: 'rgba(107,138,66,0.08)',
                padding: '4px 10px',
                borderRadius: 6,
                display: 'inline-block',
                marginBottom: 6,
              }}
            >
              ENROLLMENT
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
              Enroll {titleCase(clientName)}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                marginTop: 4,
              }}
            >
              Add their plan info to convert this lead to an active client.
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
              onClick={handleConvert}
              disabled={isSaving}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: 8,
                border: 'none',
                background: isSaving ? 'var(--text-muted)' : 'var(--green)',
                color: 'white',
                cursor: isSaving ? 'default' : 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Enrolling…' : 'Complete Enrollment'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Scrollable Form Body ===== */}
      <div
        className="convert-lead-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 24px 24px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--bg-muted) transparent',
        }}
      >
        {/* Section 1: Plan Info */}
        {sectionTitle('Plan Information')}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            borderLeft: '3px solid var(--green)',
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Carrier */}
            <div>
              <div style={labelStyle('carrier')}>Carrier{requiredMark}</div>
              <select
                value={carrierId}
                onChange={(e) => {
                  setCarrierId(e.target.value);
                  clearFieldError('carrier');
                }}
                style={{
                  ...inputStyle('carrier'),
                  appearance: 'none' as const,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A89A84' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  paddingRight: 28,
                  cursor: 'pointer',
                }}
              >
                <option value="">Select carrier…</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Type */}
            <div>
              <div style={labelStyle()}>Plan Type</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {PLAN_TYPES.map((pt) => {
                  const isActive = planType === pt.value;
                  return (
                    <button
                      key={pt.value}
                      onClick={() => setPlanType(pt.value)}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        fontWeight: isActive ? 600 : 500,
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: `1px solid ${isActive ? 'var(--green)' : 'var(--bg-muted)'}`,
                        background: isActive ? 'rgba(107,138,66,0.06)' : 'white',
                        color: isActive ? 'var(--green)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        flex: 1,
                      }}
                    >
                      {pt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan Name */}
            <div>
              <div style={labelStyle('plan_name')}>Plan Name{requiredMark}</div>
              <input
                type="text"
                value={planName}
                onChange={(e) => {
                  setPlanName(e.target.value);
                  clearFieldError('plan_name');
                }}
                placeholder="e.g. Humana Gold Plus"
                style={inputStyle('plan_name')}
                onFocus={(e) => { if (!errors.has('plan_name')) e.currentTarget.style.borderColor = 'var(--green)'; }}
                onBlur={(e) => { if (!errors.has('plan_name')) e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>

            {/* Effective Date */}
            <div>
              <div style={labelStyle('effective_date')}>Effective Date{requiredMark}</div>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => {
                  setEffectiveDate(e.target.value);
                  clearFieldError('effective_date');
                }}
                style={inputStyle('effective_date')}
                onFocus={(e) => { if (!errors.has('effective_date')) e.currentTarget.style.borderColor = 'var(--green)'; }}
                onBlur={(e) => { if (!errors.has('effective_date')) e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Additional Info */}
        {sectionTitle('Additional Information')}
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
              <div style={labelStyle()}>Medicare #</div>
              <input
                type="text"
                value={medicareNumber}
                onChange={(e) => setMedicareNumber(e.target.value)}
                placeholder="1EG4-TE5-MK72"
                style={inputStyle()}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
            <div>
              <div style={labelStyle()}>ZIP</div>
              <input
                type="text"
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
                placeholder="40502"
                style={{ ...inputStyle(), maxWidth: 120 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle()}>Street Address</div>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="123 Main Street"
                style={inputStyle()}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
            <div>
              <div style={labelStyle()}>City</div>
              <input
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                placeholder="Lexington"
                style={inputStyle()}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
            <div>
              <div style={labelStyle()}>State</div>
              <input
                type="text"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                placeholder="KY"
                style={{ ...inputStyle(), maxWidth: 80 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
              />
            </div>
          </div>
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
            maxWidth: 240,
            lineHeight: 1.3,
          }}
        >
          This will create a policy and move {titleCase(clientName)} to your active client list.
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
              {saveError}
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
            onClick={handleConvert}
            disabled={isSaving}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: isSaving ? 'var(--text-muted)' : 'var(--green)',
              color: 'white',
              cursor: isSaving ? 'default' : 'pointer',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Enrolling…' : 'Complete Enrollment'}
          </button>
        </div>
      </div>

      <style>{`
        .convert-lead-scroll::-webkit-scrollbar { width: 4px; }
        .convert-lead-scroll::-webkit-scrollbar-thumb { background: var(--bg-muted); border-radius: 2px; }
        .convert-lead-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
