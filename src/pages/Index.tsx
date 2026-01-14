import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import {
  Rocket,
  FileText,
  Award,
  Wrench,
  Building2,
  FolderOpen,
  Building,
  GraduationCap,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const primaryTools = [
  {
    title: "Contracting Hub",
    description: "Submit documents and track carrier appointments",
    icon: FileText,
    link: "/contracting-hub"
  },
  {
    title: "Certifications",
    description: "AHIP and carrier certification links",
    icon: Award,
    link: "/certifications"
  },
  {
    title: "Agent Tools",
    description: "Quoting, CRM, and enrollment platforms",
    icon: Wrench,
    link: "/agent-tools"
  },
  {
    title: "Training",
    description: "Medicare fundamentals and sales training",
    icon: GraduationCap,
    link: "/training"
  },
];

const secondaryTools = [
  {
    title: "Forms Library",
    description: "SOA, applications, and compliance forms",
    icon: FolderOpen,
    link: "/forms-library"
  },
  {
    title: "Carrier Portals",
    description: "Direct access to carrier systems",
    icon: Building,
    link: "/carrier-portals"
  },
  {
    title: "Carrier Resources",
    description: "Plan documents and contacts",
    icon: Building2,
    link: "/carrier-resources"
  },
  {
    title: "Onboarding",
    description: "Getting started guide",
    icon: Rocket,
    link: "/start-here"
  },
];

const quickLinks = [
  { name: "SunFire", url: "https://www.sunfirematrix.com/", external: true },
  { name: "Connecture", url: "https://www.connecture.com/", external: true },
  { name: "Medicare.gov", url: "https://www.medicare.gov/", external: true },
];

function ToolCard({ tool, compact = false }: { tool: typeof primaryTools[0]; compact?: boolean }) {
  if (compact) {
    return (
      <Link
        to={tool.link}
        className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200"
      >
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-[#b8860b]/10 transition-colors duration-200">
          <tool.icon className="w-4 h-4 text-slate-500 group-hover:text-[#b8860b] transition-colors duration-200" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#b8860b] transition-colors duration-200">
            {tool.title}
          </p>
          <p className="text-xs text-slate-500 truncate">{tool.description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors duration-200" />
      </Link>
    );
  }

  return (
    <Link
      to={tool.link}
      className="group bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-lg hover:border-[#b8860b]/30 hover:scale-[1.02] transition-all duration-200"
    >
      <div className="w-12 h-12 rounded-xl bg-[#b8860b]/15 flex items-center justify-center mb-4">
        <tool.icon className="w-6 h-6 text-[#b8860b]" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{tool.title}</h3>
      <p className="text-sm text-slate-600">{tool.description}</p>
    </Link>
  );
}

const Index = () => {
  const { profile, isAuthenticated } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Navigation />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-[#1a1a1a]">
              {isAuthenticated && firstName ? `${getGreeting()}, ${firstName}` : getGreeting()}
            </h1>
            <p className="text-slate-500 mt-1">What would you like to do today?</p>
          </div>

          {/* Primary Tools */}
          <div className="mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {primaryTools.map((tool) => (
                <ToolCard key={tool.title} tool={tool} />
              ))}
            </div>
          </div>

          {/* Secondary Tools */}
          <div className="mb-8">
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 px-1">
              More Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {secondaryTools.map((tool) => (
                <ToolCard key={tool.title} tool={tool} compact />
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 px-1">
              Quick Links
            </h2>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-[#b8860b] bg-white border border-slate-200 rounded-full hover:border-[#b8860b]/30 transition-all duration-200"
                >
                  {link.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            © 2025 Tyler Insurance Group
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-200">
              About
            </Link>
            <Link to="/contact" className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-200">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
