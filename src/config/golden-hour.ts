export const GH = {
  // Page
  pageBg: '#F3EDE4',

  // Hero (dark card)
  heroBg: 'linear-gradient(145deg, #1a1611, #0f0d09)',
  heroGlow: 'rgba(184,134,11,0.08)',
  heroBorder: 'rgba(184,134,11,0.08)',

  // Glass panels
  glass: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.7)',
  glassShadow: '0 2px 12px rgba(60,48,28,0.04)',
  glassBlur: '20px',

  // Text (warm brown scale)
  textPrimary: 'rgba(60,48,28,0.85)',
  textSecondary: 'rgba(60,48,28,0.55)',
  textMuted: 'rgba(60,48,28,0.35)',
  textFaint: 'rgba(60,48,28,0.20)',

  // Text on dark hero
  heroText: 'rgba(255,245,230,0.95)',
  heroTextMuted: 'rgba(255,245,230,0.30)',

  // Gold brand
  gold: '#8B6914',
  goldGrad: 'linear-gradient(135deg, #b8860b, #d4a017)',

  // Borders
  border: 'rgba(60,48,28,0.06)',
  borderLight: 'rgba(60,48,28,0.04)',

  // Tiles
  tileBg: 'rgba(60,48,28,0.015)',
  tileHover: 'rgba(60,48,28,0.03)',

  // Typography
  serif: 'Georgia, "Times New Roman", serif',

  // Atmospheric background gradients (very faint overlays)
  atmosphereGold: 'radial-gradient(ellipse at 20% 0%, rgba(184,134,11,0.04) 0%, transparent 60%)',
  atmospherePurple: 'radial-gradient(ellipse at 80% 100%, rgba(88,44,131,0.02) 0%, transparent 60%)',
} as const;

export type GHTokens = typeof GH;

// Section header style helper
export const sectionHeaderStyle = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  color: GH.textMuted,
};

// Common glass panel inline style (for use without the component)
export const glassPanelStyle = {
  background: GH.glass,
  backdropFilter: `blur(${GH.glassBlur})`,
  WebkitBackdropFilter: `blur(${GH.glassBlur})`,
  border: `1px solid ${GH.glassBorder}`,
  boxShadow: GH.glassShadow,
  borderRadius: '18px',
};
