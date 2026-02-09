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
