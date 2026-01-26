import { Link } from 'react-router-dom';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import connect4Logo from '@/assets/connect4insurance-logo.png';
import sunfireLogo from '@/assets/sunfire-logo.png';

const AgentToolsPage = () => {
  const { profile } = useProfile();

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

      <main className="flex-1 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#5c5552] hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-serif font-semibold text-[#292524] mb-1">
              Quote Tools
            </h1>
            <p className="text-sm text-[#5c5552] leading-relaxed">
              Plan comparisons, drug lookups, and enrollment platforms.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SunFire */}
            <a
              href="https://www.sunfirematrix.com/app/agent/pfs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#e8e4dd] hover:border-orange-300 hover:shadow-lg rounded-xl overflow-hidden transition-all group"
            >
              <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <img
                    src={sunfireLogo}
                    alt="SunFire"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="font-serif text-lg font-semibold text-[#292524] group-hover:text-orange-600 mb-1">
                  SunFire
                </div>
                <div className="text-sm text-[#5c5552] mb-4">Quoting & Enrollment</div>
                <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                  Launch <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </a>

            {/* Connect4Insurance */}
            <a
              href="https://pinnacle7.destinationrx.com/PC/Agent/Account/Login"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#e8e4dd] hover:border-blue-300 hover:shadow-lg rounded-xl overflow-hidden transition-all group"
            >
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-500"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <img
                    src={connect4Logo}
                    alt="Connect4Insurance"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="font-serif text-lg font-semibold text-[#292524] group-hover:text-blue-600 mb-1">
                  Connect4Insurance
                </div>
                <div className="text-sm text-[#5c5552] mb-4">Quoting & E-Apps</div>
                <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                  Launch <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </a>
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
};

export default AgentToolsPage;
