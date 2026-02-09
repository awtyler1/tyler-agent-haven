import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { UserAvatarDropdown } from "@/components/UserAvatarDropdown";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { GH } from "@/config/golden-hour";

interface TrainingLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function TrainingLayout({ sidebar, content }: TrainingLayoutProps) {
  const { homePath } = useNavigationContext();

  return (
    <div className="min-h-screen" style={{ background: GH.pageBg }}>
      {/* Atmospheric blurs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between pt-6 pb-4 px-4 sm:px-6 max-w-[1100px] mx-auto w-full">
        <Link to={homePath} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <UserAvatarDropdown />
      </header>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-12 gap-3.5">
          <div className="col-span-12 lg:col-span-3">{sidebar}</div>
          <div className="col-span-12 lg:col-span-9">{content}</div>
        </div>
      </div>
    </div>
  );
}
