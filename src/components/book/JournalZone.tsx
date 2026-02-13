import { useState } from 'react';
import { useCreateInteraction } from '@/hooks/useClientInteractions';
import { useClientDetail } from '@/hooks/useClientDetail';

type InteractionType = 'note' | 'call' | 'text' | 'email' | 'meeting';
type CallOutcome = 'reached' | 'voicemail' | 'no_answer';

const TYPE_OPTIONS: { label: string; value: InteractionType }[] = [
  { label: 'Note', value: 'note' },
  { label: 'Call', value: 'call' },
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Meeting', value: 'meeting' },
];

const OUTCOME_OPTIONS: { label: string; value: CallOutcome }[] = [
  { label: 'Reached', value: 'reached' },
  { label: 'Voicemail', value: 'voicemail' },
  { label: 'No Answer', value: 'no_answer' },
];

// Dot color classes for timeline entries
const DOT_STYLES: Record<string, { bg: string; shadow: string }> = {
  call: { bg: 'var(--blue)', shadow: '0 0 0 2px rgba(74,127,181,0.15)' },
  note: { bg: 'var(--text-muted)', shadow: '0 0 0 2px rgba(168,154,132,0.15)' },
  plan: { bg: 'var(--amber)', shadow: '0 0 0 2px rgba(184,148,74,0.15)' },
  email: { bg: 'var(--green)', shadow: '0 0 0 2px rgba(107,138,66,0.15)' },
  text: { bg: 'var(--blue)', shadow: '0 0 0 2px rgba(74,127,181,0.15)' },
  meeting: { bg: 'var(--amber)', shadow: '0 0 0 2px rgba(184,148,74,0.15)' },
};

// Type badge styles
const TYPE_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  call: { bg: 'rgba(74,127,181,0.1)', color: 'var(--blue)' },
  note: { bg: 'var(--bg-muted)', color: 'var(--text-muted)' },
  email: { bg: 'rgba(107,138,66,0.1)', color: 'var(--green)' },
  plan: { bg: 'rgba(184,148,74,0.12)', color: 'var(--amber)' },
  text: { bg: 'rgba(74,127,181,0.1)', color: 'var(--blue)' },
  meeting: { bg: 'rgba(184,148,74,0.12)', color: 'var(--amber)' },
};

interface JournalZoneProps {
  clientId: string;
  firstName: string;
}

export function JournalZone({ clientId, firstName }: JournalZoneProps) {
  const [selectedType, setSelectedType] = useState<InteractionType>('note');
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>('reached');
  const [noteText, setNoteText] = useState('');
  const [timelineOpen, setTimelineOpen] = useState(false);

  const createInteraction = useCreateInteraction();
  const { data: detail } = useClientDetail(clientId);

  const interactions = detail?.interactions || [];
  const entryCount = interactions.length;
  const lastContactDate = interactions[0]?.created_at
    ? formatDateShort(interactions[0].created_at)
    : null;

  const getPlaceholder = () => {
    switch (selectedType) {
      case 'call':
        return `What did you discuss with ${firstName}?`;
      case 'text':
        return `What did you text ${firstName} about?`;
      case 'email':
        return `What did you email ${firstName} about?`;
      case 'meeting':
        return `What happened in the meeting with ${firstName}?`;
      default:
        return `Add a note about ${firstName}…`;
    }
  };

  const handleSave = () => {
    if (!noteText.trim()) return;
    createInteraction.mutate(
      {
        client_id: clientId,
        interaction_type: selectedType,
        outcome: selectedType === 'call' ? selectedOutcome : null,
        notes: noteText.trim(),
      },
      {
        onSuccess: () => {
          setNoteText('');
        },
      },
    );
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        borderLeft: '3px solid var(--gold)',
        overflow: 'hidden',
      }}
    >
      {/* Write area */}
      <div
        style={{
          padding: '14px 18px',
          background: 'linear-gradient(180deg, rgba(201,168,76,0.04) 0%, transparent 100%)',
          borderBottom: '1px solid #F0EBE2',
        }}
      >
        {/* Type pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <button
            onClick={() => setSelectedType('note')}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: selectedType === 'note' ? 600 : 500,
              padding: '4px 10px',
              borderRadius: 14,
              border: 'none',
              background: selectedType === 'note' ? 'var(--text-primary)' : 'transparent',
              color: selectedType === 'note' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Note
          </button>
          {/* Separator */}
          <div
            style={{
              width: 1,
              height: 14,
              background: 'var(--bg-muted)',
              margin: '0 4px',
            }}
          />
          {TYPE_OPTIONS.filter((t) => t.value !== 'note').map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                fontWeight: selectedType === t.value ? 600 : 500,
                padding: '4px 10px',
                borderRadius: 14,
                border: 'none',
                background: selectedType === t.value ? 'var(--text-primary)' : 'transparent',
                color: selectedType === t.value ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {t.label}
            </button>
          ))}

          {/* Outcome pills — only visible when Call is selected */}
          {selectedType === 'call' && (
            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
              {OUTCOME_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setSelectedOutcome(o.value)}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 10,
                    fontWeight: selectedOutcome === o.value ? 600 : 500,
                    padding: '3px 9px',
                    borderRadius: 12,
                    border: `1px solid ${selectedOutcome === o.value ? 'var(--green)' : 'var(--bg-muted)'}`,
                    background: selectedOutcome === o.value ? 'var(--green-bg)' : 'white',
                    color: selectedOutcome === o.value ? 'var(--green)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input + Save */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && noteText.trim()) handleSave();
            }}
            placeholder={getPlaceholder()}
            style={{
              flex: 1,
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              padding: '9px 14px',
              border: '1px solid var(--bg-muted)',
              borderRadius: 8,
              background: 'white',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--bg-muted)')}
          />
          <button
            onClick={handleSave}
            disabled={!noteText.trim() || createInteraction.isPending}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: noteText.trim() ? 'var(--blue)' : 'var(--bg-muted)',
              color: noteText.trim() ? 'white' : 'var(--text-faint)',
              cursor: noteText.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              opacity: createInteraction.isPending ? 0.7 : 1,
            }}
          >
            {createInteraction.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Timeline toggle */}
      <div
        onClick={() => setTimelineOpen(!timelineOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 18px',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: timelineOpen ? '1px solid #F0EBE2' : 'none',
          transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.03)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-faint)"
          strokeWidth="2"
          style={{
            flexShrink: 0,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: timelineOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </strong>
          {lastContactDate && ` · Last contact ${lastContactDate}`}
        </span>
      </div>

      {/* Collapsible timeline entries */}
      <div
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: timelineOpen ? 1200 : 0,
          opacity: timelineOpen ? 1 : 0,
        }}
      >
        {interactions.length > 0 ? (
          <div style={{ position: 'relative', paddingLeft: 26 }}>
            {/* Spine line */}
            <div
              style={{
                position: 'absolute',
                left: 18,
                top: 20,
                bottom: 20,
                width: 1.5,
                background: 'var(--bg-muted)',
              }}
            />

            {interactions.slice(0, 6).map((entry) => {
              const dotStyle = DOT_STYLES[entry.interaction_type] || DOT_STYLES.note;
              const badgeStyle = TYPE_BADGE_STYLES[entry.interaction_type] || TYPE_BADGE_STYLES.note;

              return (
                <div
                  key={entry.id}
                  style={{
                    padding: '14px 18px 14px 0',
                    position: 'relative',
                    borderTop: '1px solid #F5F0E8',
                  }}
                >
                  {/* Spine dot */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -26,
                      top: 18,
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      border: '2px solid var(--bg-card)',
                      background: dotStyle.bg,
                      boxShadow: dotStyle.shadow,
                      zIndex: 1,
                    }}
                  />

                  {/* Entry content */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                        }}
                      >
                        {entry.interaction_type}
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                        {formatDateFull(entry.created_at)}
                      </span>
                      {entry.outcome && (
                        <span
                          style={{
                            fontSize: 10.5,
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                          }}
                        >
                          · {formatOutcome(entry.outcome)}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                      }}
                    >
                      {entry.notes || `${entry.interaction_type} logged`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: '20px 18px',
              fontSize: 12.5,
              color: 'var(--text-muted)',
            }}
          >
            No activity yet. Start by adding a note above.
          </div>
        )}

        {interactions.length > 6 && (
          <button
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11.5,
              fontWeight: 500,
              color: 'var(--blue)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 18px',
              display: 'block',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Show older activity
          </button>
        )}
      </div>
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatOutcome(outcome: string): string {
  return outcome.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
