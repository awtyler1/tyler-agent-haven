import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Password validation helper
const validatePassword = (password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} => {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const checks = {
    length: password.length >= minLength,
    uppercase: hasUppercase,
    lowercase: hasLowercase,
    number: hasNumber,
    special: hasSpecial,
  };

  const meetsRequirements =
    checks.length &&
    checks.uppercase &&
    checks.lowercase &&
    checks.number &&
    checks.special;

  if (!meetsRequirements) {
    return {
      isValid: false,
      message: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character.',
      strength: 'weak',
      checks,
    };
  }

  const strength = password.length >= 16 ? 'strong' : 'medium';

  return { isValid: true, message: '', strength, checks };
};
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
  Circle,
  Download,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  manager_id: string | null;
  manager_name: string | null;  // Resolved from manager's profile
  onboarding_status: string | null;
  is_active: boolean;
  setup_link_sent_at: string | null;
  first_login_at: string | null;
  created_at: string;
  has_auth_user: boolean;
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
  const [showInactive, setShowInactive] = useState(false);
  
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
  }, [users, searchQuery, roleFilter, showInactive]);

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

      // Fetch auth users to check for orphaned profiles
      const { data: authUsers, error: authError } = await supabase.rpc('get_auth_user_ids');

      // Build set of valid auth user IDs
      const validAuthUserIds = new Set<string>(
        authError ? [] : (authUsers || []).map((u: { id: string }) => u.id)
      );

      // Build role map
      const roleMap = (roles || []).reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>);

      // Build profile ID to name map (for resolving manager names)
      const profileIdToName = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p.full_name;
        return acc;
      }, {} as Record<string, string | null>);

      // Map profiles to users
      const mappedUsers: User[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        role: roleMap[p.user_id] || null,
        manager_id: p.manager_id,
        manager_name: p.manager_id ? profileIdToName[p.manager_id] : null,
        onboarding_status: p.onboarding_status,
        is_active: p.is_active !== false,
        setup_link_sent_at: p.setup_link_sent_at,
        first_login_at: p.first_login_at,
        created_at: p.created_at,
        has_auth_user: validAuthUserIds.size === 0 || validAuthUserIds.has(p.user_id),
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

    // Always exclude orphaned profiles (no auth user)
    filtered = filtered.filter(u => u.has_auth_user);

    // Active/inactive filter (default: show only active)
    if (!showInactive) {
      filtered = filtered.filter(u => u.is_active);
    }

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
      return <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
    if (user.first_login_at) {
      return <Badge variant="outline" className="text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
    if (user.setup_link_sent_at) {
      return <Badge variant="outline" className="text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1" />Link Sent</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground"><Circle className="w-3 h-3 mr-1" />Created</Badge>;
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
      fetchUsers();
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
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', changeRoleUser.user_id);

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

  const handleExport = () => {
    const exportData = filteredUsers.map(user => ({
      'Name': user.full_name || '—',
      'Email': user.email || '—',
      'Role': ROLE_LABELS[user.role || '']?.label || user.role || 'Unknown',
      'Reports To': user.manager_name || (user.manager_id === null ? 'Direct to TIG' : '—'),
      'Status': !user.is_active
        ? 'Inactive'
        : user.first_login_at
          ? 'Active'
          : user.setup_link_sent_at
            ? 'Link Sent'
            : 'Created',
      'Created': format(new Date(user.created_at), 'MMM d, yyyy'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Name
      { wch: 30 }, // Email
      { wch: 12 }, // Role
      { wch: 18 }, // Reports To
      { wch: 10 }, // Status
      { wch: 12 }, // Created
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(workbook, `TIG_Users_${timestamp}.xlsx`);
    
    toast.success(`Exported ${exportData.length} users`);
  };

  // Count inactive users for the toggle label
  const inactiveCount = users.filter(u => !u.is_active && u.has_auth_user).length;

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
              <SelectItem value="independent_agent">Agent</SelectItem>
              <SelectItem value="internal_tig_agent">TIG Agent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={showInactive ? 'all' : 'active'} onValueChange={(val) => setShowInactive(val === 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="all">All Statuses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleExport} title="Download Excel">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchUsers} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          {roleFilter !== 'all' && ` · ${ROLE_LABELS[roleFilter]?.label || roleFilter}`}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Reports To</TableHead>
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
                      <Link
                        to={`/admin/agents/${user.id}`}
                        className="hover:text-gold hover:underline transition-colors"
                      >
                        {user.full_name || '—'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {user.email || '—'}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {user.manager_name || (user.manager_id === null ? 'Direct to TIG' : '—')}
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
                placeholder="Enter a strong password"
              />

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-3 pt-2">
                  {/* Strength bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          validatePassword(newPassword).strength === 'strong'
                            ? 'w-full bg-green-500'
                            : validatePassword(newPassword).strength === 'medium'
                            ? 'w-2/3 bg-amber-500'
                            : 'w-1/3 bg-red-500'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        validatePassword(newPassword).strength === 'strong'
                          ? 'text-green-600'
                          : validatePassword(newPassword).strength === 'medium'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {validatePassword(newPassword).strength === 'strong'
                        ? 'Strong'
                        : validatePassword(newPassword).strength === 'medium'
                        ? 'Medium'
                        : 'Weak'}
                    </span>
                  </div>

                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className={`flex items-center gap-1.5 ${validatePassword(newPassword).checks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {validatePassword(newPassword).checks.length ? <Check size={14} /> : <X size={14} />}
                      <span>12+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validatePassword(newPassword).checks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {validatePassword(newPassword).checks.uppercase ? <Check size={14} /> : <X size={14} />}
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validatePassword(newPassword).checks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {validatePassword(newPassword).checks.lowercase ? <Check size={14} /> : <X size={14} />}
                      <span>Lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validatePassword(newPassword).checks.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {validatePassword(newPassword).checks.number ? <Check size={14} /> : <X size={14} />}
                      <span>Number</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${validatePassword(newPassword).checks.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {validatePassword(newPassword).checks.special ? <Check size={14} /> : <X size={14} />}
                      <span>Special character</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground pt-1">
                Share this password with the user so they can log in
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resettingPassword || !newPassword || !validatePassword(newPassword).isValid}
            >
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
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
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
