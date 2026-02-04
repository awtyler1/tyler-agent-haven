import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { UserAvatarDropdown } from "@/components/UserAvatarDropdown";
import { useNavigationContext } from "@/hooks/useNavigationContext";

interface TrainingLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function TrainingLayout({ sidebar, content }: TrainingLayoutProps) {
  const { homePath } = useNavigationContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-6">
          <Link to={homePath} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <UserAvatarDropdown />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
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
