# Promote-to-Admin Debug Reference

Full source code for all files involved in the promote-to-admin flow.

---

## 1. `supabase/functions/promote-to-admin/index.ts`

```ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import {
  createSupabaseAdmin,
  requireAdmin,
  isAuthError,
  getErrorStatus,
  getErrorMessage,
} from "../_shared/auth.ts";

interface PromoteRequest {
  profileId: string;
  role: "admin" | "super_admin";
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();

    // Require admin or super_admin
    const requestingUser = await requireAdmin(req, supabaseAdmin);

    const { profileId, role }: PromoteRequest = await req.json();

    if (!profileId || !role) {
      throw new Error("profileId and role are required");
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new Error("role must be 'admin' or 'super_admin'");
    }

    // Look up the target profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, full_name, email, is_active, onboarding_status")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (!profile.user_id) {
      throw new Error("Profile has no associated user account");
    }

    if (!profile.is_active) {
      throw new Error(
        "Cannot promote an inactive user. Reactivate them first."
      );
    }

    // Check existing roles
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id);

    if (rolesError) {
      throw new Error("Failed to check existing roles");
    }

    const currentRoles = existingRoles?.map((r) => r.role) || [];

    if (currentRoles.includes(role)) {
      return new Response(
        JSON.stringify({
          error: `${profile.full_name || profile.email} already has the ${role} role`,
          alreadyHasRole: true,
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(req),
          },
        }
      );
    }

    // Remove any existing admin-tier role before adding the new one
    // (e.g., if upgrading admin → super_admin, remove admin first)
    const adminTierRoles = ["admin", "super_admin"];
    const existingAdminRoles = currentRoles.filter((r) =>
      adminTierRoles.includes(r)
    );

    if (existingAdminRoles.length > 0) {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", profile.user_id)
        .in("role", existingAdminRoles);
    }

    // Add the new admin role (agent-level roles are preserved)
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: profile.user_id, role });

    if (insertError) {
      throw new Error(`Failed to assign role: ${insertError.message}`);
    }

    // Ensure onboarding_status is APPOINTED (admins should always be)
    if (profile.onboarding_status !== "APPOINTED") {
      await supabaseAdmin
        .from("profiles")
        .update({ onboarding_status: "APPOINTED" })
        .eq("id", profileId);
    }

    // Log to activity_logs
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", requestingUser.id)
      .single();

    if (callerProfile) {
      await supabaseAdmin.from("activity_logs").insert({
        user_id: callerProfile.id,
        action_type: "promote_to_admin",
        entity_type: "profile",
        entity_id: profileId,
        metadata: {
          promoted_user: profile.full_name || profile.email,
          new_role: role,
          previous_roles: currentRoles,
        },
      });
    }

    // Return the updated role set
    const { data: updatedRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${profile.full_name || profile.email} promoted to ${role}`,
        roles: updatedRoles?.map((r) => r.role) || [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(req),
        },
      }
    );
  } catch (error: unknown) {
    console.error("Promote to admin failed:", getErrorMessage(error));
    const status = isAuthError(error) ? getErrorStatus(error) : 400;
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(req),
      },
    });
  }
});
```

---

## 2. `src/components/admin/agent-profile/tabs/AdminTab.tsx`

```tsx
import React, { useState } from 'react';
import { Loader2, Trash2, MoreVertical, ShieldPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAdminNotes, type AdminNote } from '@/hooks/useAdminNotes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentProfile {
  id: string;
  user_id?: string | null;
  full_name: string | null;
  is_active: boolean;
}

interface AdminTabProps {
  profile: AgentProfile;
  role: string | null;
  onDeactivate: () => void;
  onDelete: () => void;
  onPromoted?: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  profile,
  role,
  onDeactivate,
  onDelete,
  onPromoted,
}) => {
  const { profile: currentUserProfile, isSuperAdmin, isAdmin } = useAuth();
  // Fixed: pass object with profileId property
  const {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    isAdding,
  } = useAdminNotes({ profileId: profile.id });

  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const isAlreadyAdmin = role === 'admin' || role === 'super_admin';
  const showPromote = isAdmin() && !isAlreadyAdmin;

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const { data, error } = await supabase.functions.invoke('promote-to-admin', {
        body: { profileId: profile.id, role: 'admin' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data.message || 'Promoted to admin successfully');
      setPromoteDialogOpen(false);
      onPromoted?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to promote user');
    } finally {
      setPromoting(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    await addNote(newNoteContent.trim());
    setNewNoteContent('');
  };

  const handleStartEdit = (note: AdminNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingContent.trim()) return;

    await updateNote(editingNoteId, editingContent.trim());
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleDeleteClick = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;

    await deleteNote(noteToDelete);
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  const currentUserInitials =
    currentUserProfile?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';

  return (
    <div className="space-y-4">
      {/* Admin Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200/50">
        <div className="px-4 py-3 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Admin Notes</h2>
          <p className="text-xs text-stone-500 mt-0.5">Internal notes visible only to admins</p>
        </div>

        {/* Add Note Form */}
        <div className="p-4 border-b border-stone-100">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {currentUserInitials}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                placeholder="Add a note about this agent..."
                className="w-full px-3 py-2 text-sm bg-stone-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <Button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim() || isAdding}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        </div>

        {/* Notes List */}
        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-stone-400" />
          </div>
        ) : notes.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isOwner={note.author_id === currentUserProfile?.id}
                isEditing={editingNoteId === note.id}
                editingContent={editingContent}
                onEditContentChange={setEditingContent}
                onStartEdit={() => handleStartEdit(note)}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={() => handleDeleteClick(note.id)}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-stone-500">No admin notes yet</div>
        )}
      </div>

      {/* Promote to Admin — Super Admin only, when user is not already admin */}
      {showPromote && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-900">Promote to Admin</p>
              <p className="text-xs text-stone-500 mt-1">
                Grant admin access while preserving their agent profile and data
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromoteDialogOpen(true)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <ShieldPlus className="w-4 h-4 mr-1.5" />
              Promote
            </Button>
          </div>
        </div>
      )}

      {/* Promote Confirmation Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This will give <strong>{profile.full_name || 'this agent'}</strong> admin
                  access while preserving their agent profile and all data.
                </p>
                <p>
                  They'll be able to switch between Admin and Agent views using the
                  view mode toggle.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={promoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromote}
              disabled={promoting}
            >
              {promoting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShieldPlus className="h-4 w-4 mr-2" />
              )}
              Promote to Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5">
        <h3 className="text-xs text-red-600 uppercase tracking-wide font-medium mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-900">
                {profile.is_active ? 'Deactivate Agent' : 'Reactivate Agent'}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {profile.is_active
                  ? 'Agent will lose access to the platform'
                  : 'Agent will regain access to the platform'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeactivate}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {profile.is_active ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>

          <div className="pt-4 border-t border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900">Delete Agent</p>
                <p className="text-xs text-stone-500 mt-1">
                  Permanently remove this agent and all associated data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Note Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface NoteItemProps {
  note: AdminNote;
  isOwner: boolean;
  isEditing: boolean;
  editingContent: string;
  onEditContentChange: (content: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isOwner,
  isEditing,
  editingContent,
  onEditContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const initials =
    note.author_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';

  return (
    <div className="p-4 hover:bg-stone-50/50 transition-colors">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-900">{note.author_name}</span>
              <span className="text-xs text-stone-400">{formatDate(note.created_at)}</span>
            </div>

            {isOwner && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-stone-400 hover:text-stone-600 rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onStartEdit}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editingContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                rows={2}
                autoFocus
                className="w-full p-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={onSaveEdit} className="bg-amber-500 hover:bg-amber-600">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-600 mt-1">{note.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTab;
```

---

## 3. `supabase/functions/_shared/auth.ts`

```ts
/**
 * Shared authentication utilities for edge functions.
 * Provides consistent auth patterns across all protected endpoints.
 */

import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.49.2";

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'independent_agent' | 'internal_tig_agent';

/**
 * Custom error class for authentication/authorization failures.
 * Includes HTTP status code for proper error responses.
 */
export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Create a Supabase admin client with service role key.
 * Use this for operations that require elevated permissions.
 */
export function createSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new AuthError("Missing Supabase configuration", 500);
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Extract and validate the authenticated user from request headers.
 * Throws AuthError if no valid authorization is present.
 */
export async function getAuthenticatedUser(req: Request, supabase: SupabaseClient): Promise<User> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthError("No authorization header", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("Unauthorized", 401);
  }

  return user;
}

/**
 * Verify user has one of the specified roles.
 * Throws AuthError if user doesn't have required role.
 */
export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  allowedRoles: AppRole[]
): Promise<AppRole> {
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", allowedRoles);

  if (error) {
    console.error("Error checking roles:", error);
    throw new AuthError("Failed to verify permissions", 500);
  }

  if (!roles || roles.length === 0) {
    throw new AuthError(`Required role: ${allowedRoles.join(' or ')}`, 403);
  }

  return roles[0].role as AppRole;
}

/**
 * Require admin or super_admin role.
 * Use for endpoints that any admin can access.
 */
export async function requireAdmin(req: Request, supabase: SupabaseClient): Promise<User> {
  const user = await getAuthenticatedUser(req, supabase);
  await requireRole(supabase, user.id, ['super_admin', 'admin']);
  return user;
}

/**
 * Require super_admin role only.
 * Use for sensitive operations like system configuration.
 */
export async function requireSuperAdmin(req: Request, supabase: SupabaseClient): Promise<User> {
  const user = await getAuthenticatedUser(req, supabase);
  await requireRole(supabase, user.id, ['super_admin']);
  return user;
}

/**
 * Require any authenticated user.
 * Use for endpoints that any logged-in user can access.
 */
export async function requireAuthenticated(req: Request, supabase: SupabaseClient): Promise<User> {
  return getAuthenticatedUser(req, supabase);
}

/**
 * Check if an error is an AuthError.
 * Useful for catch blocks to determine appropriate response.
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Get the appropriate HTTP status code for an error.
 * Returns AuthError's statusCode if applicable, otherwise 500.
 */
export function getErrorStatus(error: unknown): number {
  if (isAuthError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Get error message safely from unknown error type.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
```

---

## 4. `src/hooks/useAuth.ts`

```ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// ============ Types ============

export type OnboardingStatus =
  | 'CONTRACTING_REQUIRED'
  | 'CONTRACTING_SUBMITTED'
  | 'APPOINTED'
  | 'SUSPENDED';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  onboarding_status: OnboardingStatus;
  appointed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ahip_cert_year: number | null;
  ahip_cert_uploaded_at: string | null;
  ahip_cert_file_path: string | null;
}

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'internal_tig_agent' | 'independent_agent';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// ============ Hook ============

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [hasDownlineValue, setHasDownlineValue] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Prevent multiple deactivation sign-out attempts
  const isSigningOutRef = useRef(false);

  // Fetch all auth data in parallel
  const fetchAuthData = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile, roles, and downline status in PARALLEL
      const [profileResult, rolesResult, downlineResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId),
        supabase.rpc('current_user_has_downline'),
      ]);

      // Handle profile result
      if (profileResult.error) {
        throw profileResult.error;
      }

      const profileData = profileResult.data as Profile;

      // Check if account is deactivated
      if (profileData && profileData.is_active === false && !isSigningOutRef.current) {
        isSigningOutRef.current = true;
        console.log('Account deactivated, signing out...');
        await supabase.auth.signOut();
        toast.error('Your account has been deactivated. Please contact support.', {
          duration: 6000,
        });
        window.location.href = '/auth';
        return;
      }

      setProfile(profileData);

      // Handle roles result
      if (rolesResult.error) {
        console.error('Error fetching roles:', rolesResult.error);
        setRoles([]);
        setPrimaryRole(null);
      } else {
        const userRoles = (rolesResult.data as UserRole[]).map(r => r.role);
        setRoles(userRoles);

        // Determine primary role by hierarchy
        const roleHierarchy: AppRole[] = ['super_admin', 'admin', 'manager', 'internal_tig_agent', 'independent_agent'];
        const primary = roleHierarchy.find(role => userRoles.includes(role)) ?? null;
        setPrimaryRole(primary);
      }

      // Handle downline result
      if (downlineResult.error) {
        console.error('Error checking downline status:', downlineResult.error);
        setHasDownlineValue(false);
      } else {
        setHasDownlineValue(downlineResult.data === true);
      }

    } catch (err) {
      console.error('Error fetching auth data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch auth data'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Single auth state subscription
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            fetchAuthData(session.user.id).catch((err) => {
              console.error('Failed to fetch auth data on auth change:', err);
            });
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setPrimaryRole(null);
          setHasDownlineValue(false);
          setLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchAuthData(session.user.id).catch((err) => {
            console.error('Failed to fetch auth data on init:', err);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to get auth session:', err);
        setError(err instanceof Error ? err : new Error('Failed to get session'));
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [fetchAuthData]);

  // ============ Role helpers ============

  const hasRole = (role: AppRole): boolean => roles.includes(role);

  const isAdmin = (): boolean =>
    hasRole('super_admin') || hasRole('admin');

  const isSuperAdmin = (): boolean => hasRole('super_admin');

  const isAdminRole = (): boolean => hasRole('admin');

  const isManager = (): boolean => hasRole('manager');

  const isAgent = (): boolean => hasRole('independent_agent') || hasRole('internal_tig_agent');

  const isIndependentAgent = (): boolean => hasRole('independent_agent');

  const isInternalTigAgent = (): boolean => hasRole('internal_tig_agent');

  const hasDownline = (): boolean => hasDownlineValue;

  const canAccessAdmin = (): boolean => isAdmin();

  const canManageAgents = (): boolean => isAdmin();

  const canViewTeam = (): boolean => hasDownline() || isAdmin();

  // ============ Profile helpers ============

  const isAuthenticated = !!user;
  const isActive = profile?.is_active ?? true;
  const onboardingStatus = profile?.onboarding_status ?? null;
  const isAppointed = profile?.onboarding_status === 'APPOINTED';
  const isContractingRequired = profile?.onboarding_status === 'CONTRACTING_REQUIRED';
  const isContractSubmitted = profile?.onboarding_status === 'CONTRACTING_SUBMITTED';
  const isSuspended = profile?.onboarding_status === 'SUSPENDED';

  // ============ Navigation helpers ============

  const getDefaultRoute = (): string => {
    if (!isAuthenticated) {
      return '/auth';
    }

    if (isAgent() && isContractingRequired) {
      return '/contracting';
    }

    if (canAccessAdmin()) {
      return '/admin';
    }

    return '/';
  };

  const canAccessRoute = (route: string): boolean => {
    if (!isAuthenticated) {
      return route === '/auth';
    }

    if (route.startsWith('/admin')) {
      return canAccessAdmin();
    }

    if (isAgent() && isContractingRequired) {
      return route === '/contracting' || route === '/auth';
    }

    return true;
  };

  // ============ Refetch ============

  const refetch = () => {
    if (user?.id) {
      fetchAuthData(user.id).catch((err) => {
        console.error('Failed to refetch auth data:', err);
      });
    }
  };

  return {
    // User & Profile
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    isActive,
    onboardingStatus,
    isAppointed,
    isContractingRequired,
    isContractSubmitted,
    isSuspended,

    // Roles
    roles,
    primaryRole,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isAdminRole,
    isManager,
    isAgent,
    isIndependentAgent,
    isInternalTigAgent,
    hasDownline,
    canAccessAdmin,
    canManageAgents,
    canViewTeam,

    // Navigation
    getDefaultRoute,
    canAccessRoute,

    // Actions
    refetch,
  };
}
```
