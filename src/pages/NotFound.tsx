import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="text-center rounded-2xl p-12"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-muted)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 30px -6px rgba(0,0,0,0.12)',
        }}
      >
        <h1
          className="mb-4 text-5xl font-medium tracking-tight"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        >
          404
        </h1>
        <p className="mb-6 text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Oops! Page not found
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white rounded-lg transition-all duration-200"
          style={{
            background: 'var(--blue)',
            boxShadow: '0 2px 8px -2px rgba(74,127,181,0.4)',
          }}
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
