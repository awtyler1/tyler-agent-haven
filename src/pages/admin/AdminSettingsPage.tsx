import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { CreateAdminDialog } from '@/components/admin/CreateAdminDialog';
import { OutlookConnectButton } from '@/components/admin/OutlookConnectButton';
import { TestEmailButton } from '@/components/admin/TestEmailButton';

export default function AdminSettingsPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout showBackButton backLabel="Dashboard" onBack={() => navigate('/admin')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">User management</p>
        </div>
        <CreateAdminDialog />
      </div>

      {/* Outlook Connect Button - Temporary for testing */}
      <div className="mb-8 bg-white rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Outlook Integration</h2>
        <OutlookConnectButton />
        <div className="mt-4 pt-4 border-t border-border">
          <TestEmailButton />
        </div>
      </div>

      {/* User Management */}
      <UserManagementTable />
    </AdminLayout>
  );
}
