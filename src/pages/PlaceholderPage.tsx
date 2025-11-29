import { useLocation, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

const pageNames: Record<string, string> = {
  "/contracting": "Contracting Hub",
  "/training": "Training Portal",
  "/resources": "Resources & Downloads",
  "/support": "Support & Contact",
};

const PlaceholderPage = () => {
  const location = useLocation();
  const pageName = pageNames[location.pathname] || "Page";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center pt-20 section-padding">
        <div className="text-center max-w-md">
          <h1 className="heading-section mb-4">{pageName}</h1>
          <p className="text-body mb-8">
            This page is coming soon. Check back for updates.
          </p>
          <Link
            to="/"
            className="btn-outline-gold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlaceholderPage;
