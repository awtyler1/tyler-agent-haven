import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import {
  Loader2,
  FileText,
  Building2,
  Shield,
  GraduationCap,
  User,
  X,
  ArrowRight,
  AlertTriangle,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import sunfireLogo from '@/assets/sunfire-logo.png';
import connect4Logo from '@/assets/connect4insurance-logo.png';

export default function Index() {
  const { profile, loading } = useProfile();
  const [alertDismissed, setAlertDismissed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c5552]" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Agent';
  const currentYear = new Date().getFullYear();

  // Check if profile has AHIP certification for current year
  const hasAhipForCurrentYear = profile?.ahip_cert_year === currentYear;
  const showAhipAlert = !hasAhipForCurrentYear && !alertDismissed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold text-[#292524]">TIG</span>
            <span className="text-[#e8e4dd]">|</span>
            <span className="text-sm text-[#5c5552]">Agent Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[#5c5552] hidden sm:block">{profile?.full_name || 'Agent'}</span>
            <UserAvatarDropdown />
          </div>
        </div>
      </header>

      <main className="pt-6 pb-14 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-3">
            <h1 className="text-2xl lg:text-3xl font-serif font-semibold text-[#292524]">
              Welcome back, {firstName}
            </h1>
            <p className="text-[#5c5552] text-sm">
              Everything you need to serve your clients.
            </p>
          </div>

          {/* AHIP Alert Banner */}
          {showAhipAlert && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-medium">{currentYear} AHIP Certification Required</span>
                  <span className="hidden sm:inline"> — </span>
                  <Link
                    to="/contracting-hub"
                    className="font-medium underline underline-offset-2 hover:text-amber-900"
                  >
                    Upload now
                  </Link>
                </p>
              </div>
              <button
                onClick={() => setAlertDismissed(true)}
                className="text-amber-600 hover:text-amber-800 transition-colors p-0.5"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Row 1: Carrier Resources (2/3) + Forms (1/3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Carrier Resources - Hero Card */}
            <Link
              to="/carrier-resources"
              className="md:col-span-2 group bg-blue-50 border border-blue-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-serif font-semibold text-[#292524] mb-1">
                Carrier Resources
              </h2>
              <p className="text-sm text-[#5c5552] leading-relaxed max-w-sm">
                Contacts, portals, plan documents, and marketing materials.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-blue-600 text-sm font-medium group-hover:text-blue-700 group-hover:gap-3 transition-all">
                View carriers
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Forms Card */}
            <Link
              to="/forms-library"
              className="group bg-white border border-[#e8e4dd] rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-serif font-semibold text-[#292524] mb-1">
                Forms Library
              </h2>
              <p className="text-sm text-[#5c5552] leading-relaxed mb-3 flex-1">
                SOA, enrollment forms, and compliance documents.
              </p>
              <div className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium group-hover:text-blue-700 group-hover:gap-3 transition-all">
                Browse forms
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>

          {/* Quick Quote Section */}
          <div className="mb-3">
            <h2 className="text-xs font-medium text-[#292524] uppercase tracking-wider mb-2">
              Quick Quote
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* SunFire */}
              <a
                href="https://www.sunfirematrix.com/app/agent/pfs"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-[#e8e4dd] rounded-xl px-4 py-3 hover:border-orange-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                    <img
                      src={sunfireLogo}
                      alt="SunFire"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#292524] group-hover:text-orange-600 transition-colors">
                      SunFire
                    </h3>
                    <p className="text-xs text-[#5c5552]">
                      Quoting & Enrollment
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-orange-500 flex-shrink-0" />
                </div>
              </a>

              {/* Connect4Insurance */}
              <a
                href="https://pinnacle7.destinationrx.com/PC/Agent/Account/Login"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-[#e8e4dd] rounded-xl px-4 py-3 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <img
                      src={connect4Logo}
                      alt="Connect4Insurance"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#292524] group-hover:text-blue-600 transition-colors">
                      Connect4Insurance
                    </h3>
                    <p className="text-xs text-[#5c5552]">
                      Quoting & Enrollment
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                </div>
              </a>
            </div>
          </div>

          {/* Your Business Section */}
          <div className="mt-4">
            <h2 className="text-xs font-medium text-[#292524] uppercase tracking-wider mb-2">
              Your Business
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Certifications Card */}
              <Link
                to="/contracting-hub"
                className="group bg-white border border-[#e8e4dd] rounded-xl px-4 py-3 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#292524] group-hover:text-blue-600 transition-colors">
                      Certifications
                    </h3>
                    <p className="text-xs text-[#5c5552]">
                      Ready to sell status
                    </p>
                  </div>
                </div>
              </Link>

              {/* Compliance Card - Coming Soon */}
              <div
                className="relative bg-white border border-[#e8e4dd] rounded-xl px-4 py-3 opacity-60 cursor-default"
              >
                <span className="absolute top-2 right-2 text-xs bg-stone-200 text-[#5c5552] px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#292524]">
                      Compliance
                    </h3>
                    <p className="text-xs text-[#5c5552]">
                      CMS guidelines
                    </p>
                  </div>
                </div>
              </div>

              {/* Training Card */}
              <Link
                to="/training"
                className="group bg-white border border-[#e8e4dd] rounded-xl px-4 py-3 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#292524] group-hover:text-blue-600 transition-colors">
                      Training
                    </h3>
                    <p className="text-xs text-[#5c5552]">
                      Videos & resources
                    </p>
                  </div>
                </div>
              </Link>

              {/* Profile Card */}
              <Link
                to="/my-profile"
                className="group bg-white border border-[#e8e4dd] rounded-xl px-4 py-3 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#292524] group-hover:text-blue-600 transition-colors">
                      My Profile
                    </h3>
                    <p className="text-xs text-[#5c5552]">
                      Account & settings
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
        <p className="text-xs text-[#5c5552]/50">
          Powered by <span className="text-[#5c5552]/70">Tyler Insurance Group</span>
        </p>
      </footer>
    </div>
  );
}
