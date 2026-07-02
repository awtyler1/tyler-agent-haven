import { useEffect, useRef } from 'react';

// ============================================================================
// Fourth of July seasonal flair — a gentle fireworks layer + a greeting card.
// ----------------------------------------------------------------------------
// Only shows during the holiday window (see isFourthOfJulyWindow). The canvas
// sits fixed over the page at low opacity with pointer-events:none, so it never
// blocks a click or gets in the way — just a quiet celebration behind the work.
// Respects prefers-reduced-motion: the fireworks are skipped, the greeting stays.
// ============================================================================

/** True from July 1–6, so the celebration brackets the 4th without lingering. */
export function isFourthOfJulyWindow(now: Date = new Date()): boolean {
  return now.getMonth() === 6 && now.getDate() >= 1 && now.getDate() <= 6;
}

const COLORS = ['#B22234', '#ffffff', '#3C5CCF', '#e7cf86', '#C9A84C'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Rocket {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
}

// Deterministic-enough randomness for visuals (Math.random is fine here — this
// is decorative and never persisted).
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rockets: Rocket[] = [];
    const particles: Particle[] = [];

    const launch = () => {
      const x = rand(width * 0.12, width * 0.88);
      rockets.push({
        x,
        y: height,
        vy: rand(-11, -8),
        targetY: rand(height * 0.15, height * 0.5),
        color: COLORS[Math.floor(rand(0, COLORS.length))],
      });
    };

    const explode = (x: number, y: number, color: string) => {
      const count = Math.floor(rand(24, 40));
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand(-0.1, 0.1);
        const speed = rand(1.5, 4.5);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: rand(45, 75),
          color,
          size: rand(1.5, 2.8),
        });
      }
    };

    let raf = 0;
    let sinceLaunch = 0;
    let launchGap = 55; // frames between launches — sparse, not a barrage

    const tick = () => {
      // Fade the previous frame instead of clearing → soft trails.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      sinceLaunch += 1;
      if (sinceLaunch >= launchGap && rockets.length < 3) {
        launch();
        sinceLaunch = 0;
        launchGap = rand(45, 90);
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy += 0.12; // gravity slows the ascent
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();
        if (r.y <= r.targetY || r.vy >= 0) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045; // gravity
        p.vx *= 0.985; // air drag
        p.vy *= 0.985;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };

    // Pause when the tab is hidden so we don't burn cycles in the background.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // A little welcome burst on login, then settle into the gentle cadence.
    launch();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="fj-canvas" aria-hidden="true" />;
}

export function FourthOfJuly() {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      <style>{CSS}</style>
      {!prefersReduced && <FireworksCanvas />}
      <div className="fj-greet" role="status">
        <span className="fj-greet__spark" aria-hidden="true">🎆</span>
        <div className="fj-greet__body">
          <div className="fj-greet__t">Happy 4th of July! 🇺🇸</div>
          <p className="fj-greet__s">
            Thank you for all you do. Go ahead and unplug for the holiday — the work will
            keep. Enjoy the fireworks, the cookout, and time with friends and family.
          </p>
        </div>
      </div>
    </>
  );
}

const CSS = `
.fj-canvas{
  position:fixed; inset:0; width:100vw; height:100vh;
  pointer-events:none; z-index:5; opacity:.55;
}
.fj-greet{
  display:flex; align-items:flex-start; gap:14px;
  background:linear-gradient(135deg,#0a2c4a 0%,#123a63 55%,#7a1f2b 100%);
  color:#fdf6ea; border-radius:16px; padding:16px 20px; margin-bottom:20px;
  position:relative; overflow:hidden; box-shadow:0 6px 20px rgba(10,44,74,.22);
}
.fj-greet:before{
  content:""; position:absolute; top:-60px; right:-40px; width:220px; height:220px;
  background:radial-gradient(circle,rgba(231,207,134,.22),transparent 62%); pointer-events:none;
}
.fj-greet__spark{ font-size:26px; line-height:1; position:relative; }
.fj-greet__body{ position:relative; min-width:0; }
.fj-greet__t{ font-size:16px; font-weight:700; letter-spacing:-.01em; }
.fj-greet__s{ font-size:13px; line-height:1.55; color:rgba(253,246,234,.86); margin:5px 0 0; max-width:66ch; }
`;
