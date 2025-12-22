import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Loader2, 
  RefreshCw, 
  Search,
  KeyRound,
  Send,
  UserCog,
  UserX,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Circle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  hierarchy_type: string | null;
  hierarchy_entity_id: string | null;
  upline_user_id: string | null;
  hierarchy_name: string | null;
  onboarding_status: string | null;
  is_active: boolean;
  setup_link_sent_at: string | null;
  first_login_at: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  manager: { label: 'Manager', color: 'bg-indigo-100 text-indigo-700' },
  independent_agent: { label: 'Agent', color: 'bg-green-100 text-green-700' },
  internal_tig_agent: { label: 'TIG Agent', color: 'bg-teal-100 text-teal-700' },
};

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal states
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [changingRole, setChangingRole] = useState(false);
  
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch hierarchy entities for names
      const { data: entities, error: entitiesError } = await supabase
        .from('hierarchy_entities')
        .select('id, name');

      if (entitiesError) throw entitiesError;

      // Build role map
      const roleMap = (roles || []).reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>);

      // Build entity map
      const entityMap = (entities || []).reduce((acc, e) => {
        acc[e.id] = e.name;
        return acc;
      }, {} as Record<string, string>);

      // Build upline name map (for downline agents)
      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p.full_name;
        return acc;
      }, {} as Record<string, string | null>);

      // Map profiles to users
      const mappedUsers: User[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        role: roleMap[p.user_id] || null,
        hierarchy_type: p.hierarchy_type,
        hierarchy_entity_id: p.hierarchy_entity_id,
        upline_user_id: p.upline_user_id,
        hierarchy_name: p.hierarchy_entity_id 
          ? entityMap[p.hierarchy_entity_id] 
          : p.upline_user_id 
            ? profileMap[p.upline_user_id]
            : null,
        onboarding_status: p.onboarding_status,
        is_active: p.is_active !== false,
        setup_link_sent_at: p.setup_link_sent_at,
        first_login_at: p.first_login_at,
        created_at: p.created_at,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    if (user.first_login_at) {
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    }
    if (user.setup_link_sent_at) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Link Sent</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200"><Circle className="h-3 w-3 mr-1" />Created</Badge>;
  };

  const getRoleBadge = (role: string | null) => {
    const config = ROLE_LABELS[role || ''] || { label: role || 'Unknown', color: 'bg-gray-100 text-gray-600' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: resetPasswordUser.user_id,
          newPassword: newPassword,
        },
      });

      if (error) throw error;

      toast.success(`Password reset for ${resetPasswordUser.full_name || resetPasswordUser.email}`);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSendSetupEmail = async (user: User) => {
    setSendingEmailFor(user.user_id);
    try {
      const { error } = await supabase.functions.invoke('send-setup-link', {
        body: { userId: user.user_id },
      });

      if (error) throw error;

      toast.success(`Setup email sent to ${user.email}`);
      fetchUsers(); // Refresh to update setup_link_sent_at
    } catch (error: any) {
      console.error('Error sending setup email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSendingEmailFor(null);
    }
  };

  const handleChangeRole = async () => {
    if (!changeRoleUser || !newRole) return;

    setChangingRole(true);
    try {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', changeRoleUser.user_id);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: changeRoleUser.user_id, role: newRole as any });

      if (error) throw error;

      toast.success(`Role changed to ${ROLE_LABELS[newRole]?.label || newRole}`);
      setChangeRoleUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error.message || 'Failed to change role');
    } finally {
      setChangingRole(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(user.is_active ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: deleteUser.user_id },
      });

      if (error) throw error;

      toast.success(`${deleteUser.full_name || deleteUser.email} deleted`);
      setDeleteUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="independent_agent">Agent</SelectItem>
              <SelectItem value="internal_tig_agent">TIG Agent</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          {roleFilter !== 'all' && ` (${ROLE_LABELS[roleFilter]?.label || roleFilter})`}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hierarchy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || '—'}
                    </TableCell>
                    <TableCell>
                      {user.email || '—'}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {user.hierarchy_name || '—'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setResetPasswordUser(user);
                            setNewPassword('');
                          }}>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSendSetupEmail(user)}
                            disabled={sendingEmailFor === user.user_id}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendingEmailFor === user.user_id ? 'Sending...' : 'Send Setup Email'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setChangeRoleUser(user);
                            setNewRole(user.role || '');
                          }}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            <UserX className="h-4 w-4 mr-2" />
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteUser(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Dialog open={!!resetPasswordUser} onOpenChange={() => setResetPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordUser?.full_name || resetPasswordUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Share this password with the user so they can log in
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resettingPassword || !newPassword}>
              {resettingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={!!changeRoleUser} onOpenChange={() => setChangeRoleUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update role for {changeRoleUser?.full_name || changeRoleUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="independent_agent">Agent</SelectItem>
                  <SelectItem value="internal_tig_agent">TIG Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={changingRole || !newRole}>
              {changingRole && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteUser?.full_name || deleteUser?.email}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
