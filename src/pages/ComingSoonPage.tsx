import { Link, useLocation } from 'react-router-dom';

const TITLES: Record<string, { title: string; note: string }> = {
  '/calendar': {
    title: 'Calendar',
    note: "The full team calendar is on the way. For now, upcoming events are on the hub home.",
  },
  '/contacts': {
    title: 'Contacts',
    note: "The full rolodex is on the way. Until then, text Austin or Andrew with anything.",
  },
};

export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const meta = TITLES[pathname] ?? {
    title: 'Coming soon',
    note: 'This section is on the way.',
  };

  return (
    <div
      style={{
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F1E8',
        fontFamily: "'Outfit','Inter',system-ui,sans-serif",
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#A8801F', marginBottom: 10 }}>
          Coming soon
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', color: '#1b2620', margin: '0 0 10px' }}>
          {meta.title}
        </h1>
        <p style={{ fontSize: 14, color: '#6b6457', lineHeight: 1.6, margin: '0 0 22px' }}>{meta.note}</p>
        <Link
          to="/hub"
          style={{
            display: 'inline-block', fontSize: 13.5, fontWeight: 600, color: '#0E3B2E',
            background: 'linear-gradient(135deg,#e7cf86,#A8801F)', padding: '11px 20px',
            borderRadius: 10, textDecoration: 'none',
          }}
        >
          Back to the hub
        </Link>
      </div>
    </div>
  );
}
