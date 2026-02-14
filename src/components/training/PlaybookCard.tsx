import { Playbook } from '@/data/trainingData';

const ICON_STYLES: Record<string, { bg: string; color: string }> = {
  red: { bg: 'rgba(196,74,63,0.08)', color: 'var(--red)' },
  blue: { bg: 'rgba(74,127,181,0.08)', color: 'var(--blue)' },
  green: { bg: 'rgba(107,138,66,0.08)', color: 'var(--green)' },
  amber: { bg: 'rgba(184,148,74,0.08)', color: 'var(--amber)' },
};

// Per-playbook icons to match the HTML mockup
const PLAYBOOK_ICONS: Record<string, React.ReactNode> = {
  p1: ( // MA vs. Medigap — file icon
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  p2: ( // T65 Checklist — clipboard with checkmark
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <polyline points="9 14 11 16 15 12" />
    </svg>
  ),
  p3: ( // Objection Scripts — chat bubble
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  p4: ( // AEP Timeline — info circle
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  p5: ( // SOA Rules — shield
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

// Default fallback icon
const DEFAULT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

interface PlaybookCardProps {
  playbook: Playbook;
}

export function PlaybookCard({ playbook }: PlaybookCardProps) {
  const style = ICON_STYLES[playbook.iconColor];
  const icon = PLAYBOOK_ICONS[playbook.id] || DEFAULT_ICON;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        padding: 14,
        textAlign: 'center' as const,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.07)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
      }}
    >
      {/* Icon square */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          margin: '0 auto 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: style.bg,
          color: style.color,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          marginBottom: 2,
        }}
      >
        {playbook.title}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 500 }}>
        PDF · {playbook.pages} page{playbook.pages !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
