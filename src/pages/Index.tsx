import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, FileText, Building2, LayoutGrid, Award, ExternalLink, AlertTriangle } from 'lucide-react';

const QUICK_LINKS = [
  {
    title: 'Carrier Resources',
    description: 'Contacts, documents, and links',
    href: '/carrier-resources',
    icon: Building2,
  },
  {
    title: 'Carrier Portals',
    description: 'Quick access to broker portals',
    href: '/carrier-portals',
    icon: ExternalLink,
  },
  {
    title: 'Forms Library',
    description: 'Enrollment and scope forms',
    href: '/forms-library',
    icon: FileText,
  },
  {
    title: 'My Certifications',
    description: 'AHIP and carrier certs',
    href: '/my-certifications',
    icon: Award,
  },
];

export default function Index() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Agent';
  const currentYear = new Date().getFullYear();
  const hasAhipForCurrentYear = profile?.ahip_cert_year === currentYear;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome, {firstName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Your Agent Hub dashboard
            </p>
          </div>

          {/* Certification Warning */}
          {!hasAhipForCurrentYear && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  AHIP Certification Required
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Complete your {currentYear} AHIP certification to sell Medicare products.
                </p>
                <Link
                  to="/my-certifications"
                  className="text-sm font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2 mt-2 inline-block"
                >
                  Upload certification
                </Link>
              </div>
            </div>
          )}

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="group bg-white rounded-xl shadow-sm border border-border/50 p-5 hover:shadow-md hover:border-border transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <link.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {link.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {link.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Additional Tools Section */}
          <div className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              More Tools
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
              <Link
                to="/agent-tools"
                className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-b border-border/30 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Quote Tools & Calculators</span>
                </div>
                <span className="text-xs text-muted-foreground">View all</span>
              </Link>
              <Link
                to="/book-of-business"
                className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-b border-border/30 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Book of Business</span>
                </div>
                <span className="text-xs text-muted-foreground">View</span>
              </Link>
              <Link
                to="/training"
                className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Training Library</span>
                </div>
                <span className="text-xs text-muted-foreground">View</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
