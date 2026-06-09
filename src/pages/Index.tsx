import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  hubEvents,
  hubUpdates,
  hubContacts,
  type EventType,
} from '@/data/hubContent';

// ── Helpers ─────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function fadeUp(delay: string): React.CSSProperties {
  return { opacity: 0, animation: `fadeUp 0.5s var(--ease) forwards ${delay}` };
}

function formatEventDate(iso: string): { month: string; day: string } {
  const d = new Date(iso + 'T00:00:00');
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.toLocaleDateString('en-US', { day: 'numeric' }),
  };
}

function formatUpdateDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const EVENT_STYLES: Record<EventType, { color: string; label: string }> = {
  training: { color: 'var(--blue)', label: 'Training' },
  deadline: { color: 'var(--red)', label: 'Deadline' },
  enrollment: { color: 'var(--gold)', label: 'Enrollment' },
  meeting: { color: 'var(--green)', label: 'Meeting' },
  event: { color: 'var(--text-muted)', label: 'Event' },
};

// Quick links into the rest of the hub
const quickLinks = [
  { label: 'Contracting', path: '/contracting-hub' },
  { label: 'Training', path: '/training' },
  { label: 'Carriers', path: '/carrier-resources' },
  { label: 'Forms', path: '/forms-library' },
  { label: 'Compliance', path: '/compliance' },
  { label: 'Tools', path: '/agent-tools' },
] as const;

// ── Shared card styles ──────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  overflow: 'hidden',
};
const cardHeaderStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid var(--bg-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const cardTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary)',
};
const cardActionStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--blue)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};
const emptyStyle: React.CSSProperties = {
  padding: '24px 18px',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--text-muted)',
  textAlign: 'center',
};

// ── Dashboard ───────────────────────────────────────────────
export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(' ')[0] || 'Agent';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const todayKey = now.toISOString().slice(0, 10);

  // Upcoming events (future-dated, soonest first)
  const upcoming = [...hubEvents]
    .filter((e) => e.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // Latest updates (newest first)
  const updates = [...hubUpdates]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  // AEP countdown
  const AEP_START_MONTH = 10;
  const AEP_START_DAY = 15;
  const AEP_END_MONTH = 12;
  const AEP_END_DAY = 7;
  const AEP_PRESEASON_DAYS = 30;

  const currentYear = now.getFullYear();
  const aepStart = new Date(currentYear, AEP_START_MONTH - 1, AEP_START_DAY);
  const aepEnd = new Date(currentYear, AEP_END_MONTH - 1, AEP_END_DAY);
  const preseasonStart = new Date(aepStart.getTime() - AEP_PRESEASON_DAYS * 86_400_000);

  const daysUntilAep = Math.ceil((aepStart.getTime() - now.getTime()) / 86_400_000);
  const daysLeftInAep = Math.ceil((aepEnd.getTime() - now.getTime()) / 86_400_000);

  type AepPhase = 'off' | 'pre' | 'during';
  let aepPhase: AepPhase = 'off';
  if (now >= preseasonStart && now < aepStart) aepPhase = 'pre';
  else if (now >= aepStart && now <= aepEnd) aepPhase = 'during';

  return (
    <div
      style={{
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, var(--bg-warm-glow) 0%, var(--bg) 60%)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '20px 32px 0',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          ...fadeUp('0s'),
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>
            {dateStr}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)', fontSize: 25, fontWeight: 400,
              color: 'var(--text-primary)', marginTop: 2,
            }}
          >
            Good {getGreeting()},{' '}
            <em style={{ color: 'var(--gold-dark)' }}>{firstName}</em>
          </div>
        </div>

        {/* AEP countdown pill */}
        {aepPhase !== 'off' && (
          <div
            role="status"
            aria-label={
              aepPhase === 'pre'
                ? `Annual Enrollment Period opens in ${daysUntilAep} days`
                : daysLeftInAep > 0
                  ? `${daysLeftInAep} days left in Annual Enrollment Period`
                  : 'Last day of Annual Enrollment Period'
            }
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 20,
              background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              fontFamily: 'var(--font-sans)', fontSize: 12.5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {aepPhase === 'pre' ? (
              <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                AEP opens in{' '}
                <span style={{ fontWeight: 700, color: 'var(--gold-dark)' }}>{daysUntilAep}</span> days
              </span>
            ) : daysLeftInAep <= 0 ? (
              <span style={{ fontWeight: 600, color: 'var(--red)' }}>Last day of AEP</span>
            ) : (
              <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                <span style={{
                  fontWeight: 700,
                  color: daysLeftInAep > 10 ? 'var(--gold-dark)' : daysLeftInAep >= 4 ? 'var(--amber)' : 'var(--red)',
                }}>
                  {daysLeftInAep}
                </span>{' '}
                {daysLeftInAep === 1 ? 'day' : 'days'} left in AEP
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Hub grid ── */}
      <div
        style={{
          padding: '22px 32px 32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ── Main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Latest Updates */}
          <section style={{ ...cardStyle, ...fadeUp('0.1s') }}>
            <div style={cardHeaderStyle}>
              <span style={cardTitleStyle}>Latest Updates</span>
              <button style={cardActionStyle} onClick={() => navigate('/industry-updates')}>
                View all
              </button>
            </div>
            {updates.length === 0 ? (
              <div style={emptyStyle}>No updates right now.</div>
            ) : (
              <div>
                {updates.map((u, i) => (
                  <article
                    key={u.id}
                    onClick={() => u.url && window.open(u.url, '_blank', 'noopener,noreferrer')}
                    style={{
                      padding: '14px 18px',
                      borderBottom: i < updates.length - 1 ? '1px solid var(--bg-muted)' : 'none',
                      cursor: u.url ? 'pointer' : 'default',
                      transition: 'background var(--fast) var(--ease)',
                    }}
                    onMouseEnter={(e) => { if (u.url) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{
                        fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-dark)',
                      }}>
                        {u.category}
                      </span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatUpdateDate(u.date)}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                      color: 'var(--text-primary)', marginBottom: 3,
                    }}>
                      {u.title}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-muted)',
                      lineHeight: 1.45,
                    }}>
                      {u.excerpt}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming */}
          <section style={{ ...cardStyle, ...fadeUp('0.2s') }}>
            <div style={cardHeaderStyle}>
              <span style={cardTitleStyle}>Upcoming</span>
            </div>
            {upcoming.length === 0 ? (
              <div style={emptyStyle}>No upcoming events.</div>
            ) : (
              <div>
                {upcoming.map((ev, i) => {
                  const { month, day } = formatEventDate(ev.date);
                  const style = EVENT_STYLES[ev.type];
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 18px',
                        borderBottom: i < upcoming.length - 1 ? '1px solid var(--bg-muted)' : 'none',
                      }}
                    >
                      {/* Date block */}
                      <div style={{
                        flexShrink: 0, width: 44, textAlign: 'center',
                        background: 'var(--bg-subtle)', borderRadius: 8, padding: '6px 0',
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)',
                        }}>
                          {month}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 700,
                          color: 'var(--text-primary)', lineHeight: 1.1,
                        }}>
                          {day}
                        </div>
                      </div>
                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}>
                          {ev.title}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2,
                          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.color, flexShrink: 0 }} />
                            {style.label}
                          </span>
                          {ev.time && <span>· {ev.time}</span>}
                          {ev.location && <span>· {ev.location}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Side column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick links */}
          <section style={{ ...cardStyle, ...fadeUp('0.15s') }}>
            <div style={cardHeaderStyle}>
              <span style={cardTitleStyle}>Quick Links</span>
            </div>
            <div style={{ padding: '6px 0' }}>
              {quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '9px 18px', border: 'none', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                    color: 'var(--text-primary)', transition: 'background var(--fast) var(--ease)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {link.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </section>

          {/* Your TIG Team */}
          <section style={{ ...cardStyle, ...fadeUp('0.25s') }}>
            <div style={cardHeaderStyle}>
              <span style={cardTitleStyle}>Your TIG Team</span>
            </div>
            {hubContacts.length === 0 ? (
              <div style={emptyStyle}>Contacts coming soon.</div>
            ) : (
              <div>
                {hubContacts.map((c, i) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '12px 18px',
                      borderBottom: i < hubContacts.length - 1 ? '1px solid var(--bg-muted)' : 'none',
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                    }}>
                      {c.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1,
                    }}>
                      {c.role}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}
                        >
                          {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a
                          href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                          style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
                        >
                          {c.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
