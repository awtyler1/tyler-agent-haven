import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AdminNote {
  id: string;
  profile_id: string;
  author_id: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
  /** Joined from profiles table */
  author_name?: string;
}

export interface UseAdminNotesOptions {
  /** Profile ID to fetch notes for */
  profileId: string;
}

export interface UseAdminNotesReturn {
  // Data
  /** List of notes, newest first */
  notes: AdminNote[];
  /** Initial loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;

  // Actions
  /** Add a new note */
  addNote: (content: string) => Promise<void>;
  /** Update an existing note (must be author) */
  updateNote: (noteId: string, content: string) => Promise<void>;
  /** Delete a note (must be author) */
  deleteNote: (noteId: string) => Promise<void>;
  /** Manually refetch notes */
  refetch: () => Promise<void>;

  // Action states
  /** Whether a note is being added */
  isAdding: boolean;
  /** ID of note being updated, or null */
  isUpdating: string | null;
  /** ID of note being deleted, or null */
  isDeleting: string | null;
}

/**
 * Hook for managing admin notes on an agent profile.
 *
 * @example
 * const { notes, isLoading, addNote, updateNote, deleteNote } = useAdminNotes({
 *   profileId: profile.id,
 * });
 *
 * // Add a note
 * await addNote('Called agent, they will submit docs by Friday');
 *
 * // Update a note
 * await updateNote(note.id, 'Updated: docs received');
 *
 * // Delete a note
 * await deleteNote(note.id);
 */
export function useAdminNotes({ profileId }: UseAdminNotesOptions): UseAdminNotesReturn {
  const { profile: currentUserProfile } = useAuth();

  // Data state
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * Fetch notes with author names joined
   */
  const fetchNotes = useCallback(async () => {
    if (!profileId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch notes with author profile joined
      const { data, error: fetchError } = await supabase
        .from('admin_notes')
        .select(`
          id,
          profile_id,
          author_id,
          content,
          created_at,
          updated_at,
          author:profiles!admin_notes_author_id_fkey(full_name)
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform to flatten author_name
      const transformedNotes: AdminNote[] = (data || []).map((note) => ({
        id: note.id,
        profile_id: note.profile_id,
        author_id: note.author_id,
        content: note.content,
        created_at: note.created_at,
        updated_at: note.updated_at,
        author_name: (note.author as { full_name: string | null } | null)?.full_name || 'Unknown',
      }));

      setNotes(transformedNotes);
    } catch (err) {
      console.error('Error fetching admin notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  // Fetch on mount and when profileId changes
  useEffect(() => {
    setIsLoading(true);
    fetchNotes();
  }, [fetchNotes]);

  /**
   * Add a new note
   */
  const addNote = useCallback(async (content: string) => {
    if (!profileId || !currentUserProfile?.id) {
      toast.error('Unable to add note: missing profile information');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('Note content cannot be empty');
      return;
    }

    setIsAdding(true);

    // Create optimistic note
    const optimisticNote: AdminNote = {
      id: `temp-${Date.now()}`,
      profile_id: profileId,
      author_id: currentUserProfile.id,
      content: trimmedContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_name: currentUserProfile.full_name || 'You',
    };

    // Optimistically add to state (at beginning since newest first)
    setNotes((prev) => [optimisticNote, ...prev]);

    try {
      const { data, error: insertError } = await supabase
        .from('admin_notes')
        .insert({
          profile_id: profileId,
          author_id: currentUserProfile.id,
          content: trimmedContent,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Replace optimistic note with real one (refetch to get author_name)
      await fetchNotes();
    } catch (err) {
      console.error('Error adding admin note:', err);
      // Revert optimistic update
      setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id));
      toast.error(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setIsAdding(false);
    }
  }, [profileId, currentUserProfile, fetchNotes]);

  /**
   * Update an existing note
   */
  const updateNote = useCallback(async (noteId: string, content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('Note content cannot be empty');
      return;
    }

    // Find the original note for potential revert
    const originalNote = notes.find((n) => n.id === noteId);
    if (!originalNote) {
      toast.error('Note not found');
      return;
    }

    setIsUpdating(noteId);

    // Optimistically update
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, content: trimmedContent, updated_at: new Date().toISOString() }
          : n
      )
    );

    try {
      const { error: updateError } = await supabase
        .from('admin_notes')
        .update({ content: trimmedContent })
        .eq('id', noteId);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('Error updating admin note:', err);
      // Revert optimistic update
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? originalNote : n))
      );
      toast.error(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setIsUpdating(null);
    }
  }, [notes]);

  /**
   * Delete a note
   */
  const deleteNote = useCallback(async (noteId: string) => {
    // Find the original note for potential revert
    const originalNote = notes.find((n) => n.id === noteId);
    if (!originalNote) {
      toast.error('Note not found');
      return;
    }

    const originalIndex = notes.findIndex((n) => n.id === noteId);
    setIsDeleting(noteId);

    // Optimistically remove
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      const { error: deleteError } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', noteId);

      if (deleteError) {
        throw deleteError;
      }
    } catch (err) {
      console.error('Error deleting admin note:', err);
      // Revert optimistic update (insert back at original position)
      setNotes((prev) => {
        const newNotes = [...prev];
        newNotes.splice(originalIndex, 0, originalNote);
        return newNotes;
      });
      toast.error(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setIsDeleting(null);
    }
  }, [notes]);

  return {
    // Data
    notes,
    isLoading,
    error,

    // Actions
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,

    // Action states
    isAdding,
    isUpdating,
    isDeleting,
  };
}
