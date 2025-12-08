import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SystemStatusCard } from '@/components/admin/SystemStatusCard';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export default function SuperAdminDashboard() {
  // TODO: Re-enable super admin check after testing
  // const { isSuperAdmin, loading } = useAuth();
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  //     </div>
  //   );
  // }
  // if (!isSuperAdmin()) {
  //   return <Navigate to="/" replace />;
  // }

  return (
    <div className="min-h-screen flex flex-col bg-background">
        <Navigation />

        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Platform control center for user management and system configuration
              </p>
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
          </div>
        </main>

        <Footer />
      </div>
  );
}
