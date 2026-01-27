/**
 * Activity logging utility for audit tracking.
 *
 * Logs user actions to the activity_logs table for security auditing,
 * debugging, and compliance. Logging failures are silent to prevent
 * breaking main application functionality.
 *
 * @example
 * // Log a simple action
 * await logActivity('login');
 *
 * @example
 * // Log with entity reference
 * await logActivity('contracting_submitted', 'contracting_application', applicationId);
 *
 * @example
 * // Log with metadata
 * await logActivity('carrier_approved', 'carrier_status', carrierId, {
 *   carrier_name: 'Aetna',
 *   approved_by: adminName,
 * });
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Standard action types for consistency across the application.
 * Use these constants instead of raw strings when possible.
 */
export const ActivityAction = {
  // Auth events
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',

  // Contracting events
  CONTRACTING_STARTED: 'contracting_started',
  CONTRACTING_STEP_COMPLETED: 'contracting_step_completed',
  CONTRACTING_SUBMITTED: 'contracting_submitted',
  CONTRACTING_DELETED: 'contracting_deleted',

  // Admin actions
  AGENT_APPROVED: 'agent_approved',
  AGENT_REJECTED: 'agent_rejected',
  SENT_TO_PINNACLE: 'sent_to_pinnacle',
  QUEUE_STATUS_CHANGED: 'queue_status_changed',
  CARRIER_STATUS_UPDATED: 'carrier_status_updated',
  SETUP_LINK_SENT: 'setup_link_sent',

  // Document events
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  PDF_GENERATED: 'pdf_generated',
} as const;

export type ActivityActionType = typeof ActivityAction[keyof typeof ActivityAction] | string;

/**
 * Standard entity types for consistency.
 */
export const EntityType = {
  CONTRACTING_APPLICATION: 'contracting_application',
  CARRIER_STATUS: 'carrier_status',
  PROFILE: 'profile',
  CERTIFICATION: 'certification',
  DOCUMENT: 'document',
} as const;

export type EntityTypeValue = typeof EntityType[keyof typeof EntityType] | string;

/**
 * Log an activity to the activity_logs table.
 *
 * This function is designed to be fire-and-forget safe - it will never throw
 * errors or break the calling code. Failures are logged to console.error
 * and the function returns false.
 *
 * @param action_type - What action was performed (use ActivityAction constants)
 * @param entity_type - Optional: What kind of entity was affected
 * @param entity_id - Optional: UUID of the specific record affected
 * @param metadata - Optional: Additional context to store as JSON
 * @returns Promise<boolean> - true if logged successfully, false otherwise
 *
 * @example
 * // In an auth handler
 * const success = await logActivity(ActivityAction.LOGIN);
 *
 * @example
 * // When submitting contracting
 * await logActivity(
 *   ActivityAction.CONTRACTING_SUBMITTED,
 *   EntityType.CONTRACTING_APPLICATION,
 *   application.id,
 *   { agent_name: application.full_legal_name }
 * );
 */
export async function logActivity(
  action_type: ActivityActionType,
  entity_type?: EntityTypeValue | null,
  entity_id?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<boolean> {
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[ActivityLogger] No authenticated user:', authError?.message || 'User not found');
      return false;
    }

    // Get the user's profile ID (activity_logs.user_id references profiles.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[ActivityLogger] Could not find profile:', profileError?.message || 'Profile not found');
      return false;
    }

    // Insert the activity log
    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: profile.id,
        action_type,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        metadata: metadata || null,
        // ip_address intentionally omitted - will add later if needed
      });

    if (insertError) {
      console.error('[ActivityLogger] Failed to insert log:', insertError.message);
      return false;
    }

    return true;
  } catch (error) {
    // Catch any unexpected errors to ensure logging never breaks the app
    console.error('[ActivityLogger] Unexpected error:', error);
    return false;
  }
}

/**
 * Log activity for a specific user (admin use case).
 *
 * Use this when an admin is performing an action that affects another user's
 * record and you want to log who performed the action.
 *
 * @param actor_profile_id - Profile ID of the user performing the action
 * @param action_type - What action was performed
 * @param entity_type - Optional: What kind of entity was affected
 * @param entity_id - Optional: UUID of the specific record affected
 * @param metadata - Optional: Additional context to store as JSON
 * @returns Promise<boolean> - true if logged successfully, false otherwise
 *
 * @example
 * // Admin approving an agent
 * await logActivityForUser(
 *   adminProfile.id,
 *   ActivityAction.AGENT_APPROVED,
 *   EntityType.PROFILE,
 *   agentProfileId,
 *   { agent_name: agentName }
 * );
 */
export async function logActivityForUser(
  actor_profile_id: string,
  action_type: ActivityActionType,
  entity_type?: EntityTypeValue | null,
  entity_id?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<boolean> {
  try {
    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: actor_profile_id,
        action_type,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        metadata: metadata || null,
      });

    if (insertError) {
      console.error('[ActivityLogger] Failed to insert log for user:', insertError.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ActivityLogger] Unexpected error in logActivityForUser:', error);
    return false;
  }
}
