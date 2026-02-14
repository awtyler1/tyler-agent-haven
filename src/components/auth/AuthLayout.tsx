interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'var(--bg)',
      }}
    >
      {/* Atmospheric warmth — gold only */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '-10%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(201,168,76,0.03) 0%, transparent 60%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* White card */}
      <div
        className="auth-card-enter"
        style={{
          maxWidth: 440,
          width: '100%',
          position: 'relative',
          background: 'var(--bg-card)',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        {/* Logo block */}
        <div style={{ padding: '40px 0 0', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {/* Gold gradient square with "T" */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                T
              </span>
            </div>
            {/* TIG text */}
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              TIG
            </span>
          </div>

          {/* Gradient divider */}
          <div
            style={{
              width: 60,
              height: 1,
              background: 'linear-gradient(to right, transparent, var(--bg-muted), transparent)',
              margin: '24px auto 0',
            }}
          />
        </div>

        {/* Children slot */}
        {children}
      </div>
    </div>
  );
}
