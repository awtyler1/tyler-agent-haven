import { useState } from 'react';
import { format } from 'date-fns';
import { Send, MoreHorizontal, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateUserDialog } from './CreateUserDialog';
import { useUserManagement, type ManagedUser } from '@/hooks/useUserManagement';

type AppRole = 'super_admin' | 'contracting_admin' | 'broker_manager' | 'agent';

function getOnboardingStatus(user: ManagedUser): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } {
  if (user.first_login_at) {
    return { label: 'Active', variant: 'default' };
  }
  if (user.password_created_at) {
    return { label: 'Password Set', variant: 'secondary' };
  }
  if (user.setup_link_sent_at) {
    return { label: 'Link Sent', variant: 'outline' };
  }
  return { label: 'Created', variant: 'destructive' };
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  contracting_admin: 'Contracting Admin',
  broker_manager: 'Broker Manager',
  agent: 'Agent',
};

export function UserManagementTable() {
  const { users, loading, refetch, createUser, sendSetupLink, updateUserRole } = useUserManagement();
  const [sendingLinkFor, setSendingLinkFor] = useState<string | null>(null);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);

  const handleSendSetupLink = async (userId: string) => {
    setSendingLinkFor(userId);
    await sendSetupLink(userId);
    setSendingLinkFor(null);
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingRoleFor(userId);
    await updateUserRole(userId, newRole);
    setUpdatingRoleFor(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">User Management</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <CreateUserDialog onCreateUser={createUser} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No users found. Create your first user to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const status = getOnboardingStatus(user);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || '—'}
                      </TableCell>
                      <TableCell>
                        {updatingRoleFor === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Select
                            value={user.role || 'agent'}
                            onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value} className="text-xs">
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.setup_link_sent_at && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendSetupLink(user.user_id)}
                              disabled={sendingLinkFor === user.user_id}
                            >
                              {sendingLinkFor === user.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Send Link
                                </>
                              )}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSendSetupLink(user.user_id)}>
                                <Send className="h-4 w-4 mr-2" />
                                {user.setup_link_sent_at ? 'Resend Setup Link' : 'Send Setup Link'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
