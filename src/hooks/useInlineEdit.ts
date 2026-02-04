import { useState, useRef, useEffect, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseInlineEditOptions<T> {
  /** Current value from the data source */
  initialValue: T;
  /** Async function to persist the new value */
  onSave: (value: T) => Promise<void>;
  /** Optional validation - returns error message or null if valid */
  validate?: (value: T) => string | null;
  /** Duration to show "saved" status (default: 2000ms) */
  savedDuration?: number;
}

export interface UseInlineEditReturn<T> {
  // State
  /** Current committed value (optimistically updated) */
  value: T;
  /** Draft value being edited */
  draftValue: T;
  /** Whether currently in edit mode */
  isEditing: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Current save status */
  saveStatus: SaveStatus;
  /** Error message from validation or save failure */
  error: string | null;

  // Refs
  /** Ref to attach to input/textarea for focus management */
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;

  // Actions
  /** Enter edit mode */
  startEdit: () => void;
  /** Exit edit mode without saving */
  cancelEdit: () => void;
  /** Update draft value */
  setDraft: (value: T) => void;
  /** Manually trigger save */
  save: () => Promise<void>;

  // Event handlers
  /** Ready to spread onto input element */
  handlers: {
    onKeyDown: (e: React.KeyboardEvent) => void;
    onBlur: () => void;
  };
}

/**
 * Reusable hook for inline editing with optimistic updates.
 *
 * @example
 * const nameEdit = useInlineEdit({
 *   initialValue: profile.full_name || '',
 *   onSave: async (value) => {
 *     await supabase.from('profiles').update({ full_name: value }).eq('id', profile.id);
 *   },
 *   validate: (value) => value.trim() ? null : 'Name is required',
 * });
 *
 * // In JSX:
 * {nameEdit.isEditing ? (
 *   <input
 *     ref={nameEdit.inputRef}
 *     value={nameEdit.draftValue}
 *     onChange={(e) => nameEdit.setDraft(e.target.value)}
 *     {...nameEdit.handlers}
 *   />
 * ) : (
 *   <span onClick={nameEdit.startEdit}>{nameEdit.value}</span>
 * )}
 */
export function useInlineEdit<T>({
  initialValue,
  onSave,
  validate,
  savedDuration = 2000,
}: UseInlineEditOptions<T>): UseInlineEditReturn<T> {
  // Core state
  const [value, setValue] = useState<T>(initialValue);
  const [draftValue, setDraftValue] = useState<T>(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isCancelingRef = useRef(false);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external value changes (e.g., data refetch)
  useEffect(() => {
    setValue(initialValue);
    // Only update draft if not currently editing
    if (!isEditing) {
      setDraftValue(initialValue);
    }
  }, [initialValue, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text for easy replacement
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const startEdit = useCallback(() => {
    setDraftValue(value);
    setIsEditing(true);
    setSaveStatus('idle');
    setError(null);
    isCancelingRef.current = false;
  }, [value]);

  const cancelEdit = useCallback(() => {
    isCancelingRef.current = true;
    setIsEditing(false);
    setDraftValue(value);
    setSaveStatus('idle');
    setError(null);
  }, [value]);

  const setDraft = useCallback((newValue: T) => {
    setDraftValue(newValue);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  const save = useCallback(async () => {
    // Run validation if provided
    if (validate) {
      const validationError = validate(draftValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const originalValue = value;
    const newValue = draftValue;

    // Optimistic update
    setValue(newValue);
    setIsEditing(false);
    setSaveStatus('saving');
    setError(null);

    // Clear any existing saved timeout
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }

    try {
      await onSave(newValue);
      setSaveStatus('saved');

      // Return to idle after duration
      savedTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, savedDuration);
    } catch (err) {
      // Revert on error
      setValue(originalValue);
      setDraftValue(originalValue);
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [draftValue, value, onSave, validate, savedDuration]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'Enter') {
      // For textareas, allow Shift+Enter for newlines, plain Enter saves
      // For inputs, Enter always saves
      const isTextarea = e.currentTarget.tagName === 'TEXTAREA';
      if (!isTextarea || !e.shiftKey) {
        e.preventDefault();
        save();
      }
    }
  }, [cancelEdit, save]);

  const handleBlur = useCallback(() => {
    // Don't save if actively canceling (e.g., clicked cancel button)
    if (isCancelingRef.current) {
      isCancelingRef.current = false;
      return;
    }
    // Auto-save on blur
    save();
  }, [save]);

  return {
    // State
    value,
    draftValue,
    isEditing,
    isSaving: saveStatus === 'saving',
    saveStatus,
    error,

    // Refs
    inputRef,

    // Actions
    startEdit,
    cancelEdit,
    setDraft,
    save,

    // Event handlers
    handlers: {
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
    },
  };
}
