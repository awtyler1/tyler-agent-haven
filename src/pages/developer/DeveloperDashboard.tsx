import { Link } from 'react-router-dom';
import { 
  Code, 
  Flag, 
  Database, 
  FileText, 
  Activity,
  Settings,
  ArrowRight,
  Shield,
  TestTube,
  Map,
  UserPlus
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

interface DevToolCard {
  title: string;
  description: string;
  icon: typeof Code;
  href: string;
  status?: 'stable' | 'beta' | 'new';
}

export default function DeveloperDashboard() {
  const { profile } = useAuth();

  const devTools: DevToolCard[] = [
    {
      title: 'Feature Flags',
      description: 'Toggle features on/off without deploying code',
      icon: Flag,
      href: '/developer/feature-flags',
      status: 'new',
    },
    {
      title: 'PDF Field Audit',
      description: 'Analyze form fields in the contracting PDF template',
      icon: FileText,
      href: '/developer/pdf-audit',
      status: 'stable',
    },
    {
      title: 'PDF Field Mapper',
      description: 'Map PDF form fields to application data',
      icon: Database,
      href: '/developer/pdf-mapper',
      status: 'stable',
    },
    {
      title: 'PDF Field Extractor',
      description: 'Extract field names from any fillable PDF',
      icon: FileText,
      href: '/developer/pdf-extractor',
      status: 'stable',
    },
    {
      title: 'System Health',
      description: 'Monitor Supabase connection, Edge Functions, storage',
      icon: Activity,
      href: '/developer/system-health',
      status: 'beta',
    },
    {
      title: 'Platform Map',
      description: 'Visual overview of all platform pages and routes',
      icon: Map,
      href: '/developer/platform-map',
      status: 'stable',
    },
    {
      title: 'Test Data Seeder',
      description: 'Create fake contracting submissions for testing',
      icon: UserPlus,
      href: '/developer/test-seeder',
      status: 'new',
    },
  ];

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const styles: Record<string, string> = {
      stable: 'bg-green-100 text-green-700',
      beta: 'bg-amber-100 text-amber-700',
      new: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 pt-28 pb-16">
        <div className="container-narrow mx-auto px-6 md:px-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Code className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Developer Mode</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Developer Dashboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Internal tools for testing, debugging, and platform configuration
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-sm text-muted-foreground">Access Level</p>
              <p className="text-lg font-semibold text-foreground">Developer</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <p className="text-lg font-semibold text-foreground">Production</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground">Feature Flags</p>
              <p className="text-lg font-semibold text-foreground">5 Active</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TestTube className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-sm text-muted-foreground">Test Mode</p>
              <p className="text-lg font-semibold text-foreground">Off</p>
            </div>
          </div>

          {/* Dev Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {devTools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.href}
                className="group bg-card border border-border rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <tool.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    {getStatusBadge(tool.status)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    {tool.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-purple-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    <span>
                      Open <ArrowRight className="inline h-4 w-4 ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Back to Admin Link */}
          <div className="text-center">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
