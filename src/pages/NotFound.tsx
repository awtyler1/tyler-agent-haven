import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <div className="text-center bg-gradient-to-b from-white to-[#FEFDFB] border border-[#E5E2DB] rounded-2xl p-12 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_-6px_rgba(0,0,0,0.12)]">
        <h1 className="mb-4 text-5xl font-serif font-medium tracking-tight text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground leading-relaxed">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-b from-[hsl(43,56%,45%)] to-[hsl(43,56%,38%)] text-white text-sm font-medium rounded-lg shadow-[0_2px_8px_-2px_rgba(163,133,41,0.4)] hover:shadow-[0_4px_12px_-2px_rgba(163,133,41,0.5)] transition-all duration-200">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
