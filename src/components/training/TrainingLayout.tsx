import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { UserAvatarDropdown } from "@/components/UserAvatarDropdown";

interface TrainingLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function TrainingLayout({ sidebar, content }: TrainingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[#292524]">TIG</span>
            <span className="text-[#5c5552]">|</span>
            <span className="text-sm text-[#5c5552]">Agent Portal</span>
          </div>
          <UserAvatarDropdown />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">{sidebar}</div>
          <div className="col-span-12 lg:col-span-9">{content}</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-[#5c5552]/50">Powered by Tyler Insurance Group</p>
      </footer>
    </div>
  );
}
