import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SystemStatusCard } from '@/components/admin/SystemStatusCard';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { DevOpsDocumentation } from '@/components/admin/DevOpsDocumentation';

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="heading-display mb-2">Super Admin Dashboard</h1>
            <p className="text-body max-w-xl mx-auto">
              Platform control center for user management and system configuration
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mx-auto mt-4"></div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* System Status - Sidebar */}
            <div className="lg:col-span-1">
              <SystemStatusCard />
            </div>

            {/* User Management - Main Content */}
            <div className="lg:col-span-3">
              <UserManagementTable />
            </div>
          </div>

          {/* DevOps Section - Full Width */}
          <div className="mt-8">
            <DevOpsDocumentation />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
