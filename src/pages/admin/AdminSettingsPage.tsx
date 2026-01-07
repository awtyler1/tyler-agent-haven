import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { CreateAdminDialog } from '@/components/admin/CreateAdminDialog';
import { OutlookConnectButton } from '@/components/admin/OutlookConnectButton';
import { TestEmailButton } from '@/components/admin/TestEmailButton';

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-serif font-semibold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">User management</p>
              </div>
            </div>

            <CreateAdminDialog />
          </div>

          {/* Outlook Connect Button - Temporary for testing */}
          <div className="mb-8 bg-white rounded-xl border border-[#E5E2DB] p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">Outlook Integration</h2>
            <OutlookConnectButton />
            <div className="mt-4 pt-4 border-t border-[#E5E2DB]">
              <TestEmailButton />
            </div>
          </div>

          {/* User Management */}
          <UserManagementTable />

        </div>
      </main>

      <Footer />
    </div>
  );
}
