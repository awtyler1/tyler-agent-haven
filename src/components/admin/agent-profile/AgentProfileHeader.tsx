import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil,
  MoreVertical,
  Send,
  RotateCcw,
  Activity,
  UserX,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import { toast } from 'sonner';

interface AgentProfile {
  id: string;
  user_id?: string | null;
  full_name: string | null;
  onboarding_status: string;
  is_active: boolean;
  is_test?: boolean | null;
  setup_link_sent_at?: string | null;
  password_created_at?: string | null;
}

interface AgentProfileHeaderProps {
  profile: AgentProfile;
  onUpdateProfile: (field: string, value: string) => Promise<void>;
  onSendSetupLink: () => Promise<void>;
  onResetContracting: () => Promise<void>;
  onOpenDeactivateModal: () => void;
  isAdmin: boolean;
  isSelfView: boolean;
}

export const AgentProfileHeader: React.FC<AgentProfileHeaderProps> = ({
  profile,
  onUpdateProfile,
  onSendSetupLink,
  onResetContracting,
  onOpenDeactivateModal,
  isAdmin,
  isSelfView,
}) => {
  const [sendingSetupLink, setSendingSetupLink] = useState(false);

  const nameEdit = useInlineEdit<string>({
    initialValue: profile.full_name || '',
    onSave: async (value) => {
      await onUpdateProfile('full_name', value);
    },
    validate: (value) => {
      if (!value.trim()) return 'Name is required';
      return null;
    },
  });

  const canEdit = isAdmin && !isSelfView;
  const initials = (profile.full_name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSendSetupLink = async () => {
    setSendingSetupLink(true);
    try {
      await onSendSetupLink();
      toast.success('Setup link sent successfully');
    } catch (error) {
      toast.error('Failed to send setup link');
    } finally {
      setSendingSetupLink(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      CONTRACTING_REQUIRED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Contracting Required' },
      CONTRACTING_SUBMITTED: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Contracting Submitted' },
      APPOINTED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Appointed' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
    };

    const config = statusConfig[profile.onboarding_status] || statusConfig.CONTRACTING_REQUIRED;
    return (
      <span className={`px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text} rounded-full`}>
        {config.label}
      </span>
    );
  };

  const getSetupLinkButton = () => {
    if (profile.password_created_at) {
      return (
        <Button variant="outline" size="sm" disabled className="gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Password Set
        </Button>
      );
    }

    const buttonText = profile.setup_link_sent_at ? 'Resend Setup Link' : 'Send Setup Link';

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSendSetupLink}
        disabled={sendingSetupLink}
        className="gap-1.5"
      >
        {sendingSetupLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {buttonText}
      </Button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200/50 overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-base font-semibold shadow-lg shadow-amber-500/20 flex-shrink-0">
            {initials}
          </div>

          {/* Name + Badges */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            {nameEdit.isEditing ? (
              <input
                ref={nameEdit.inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={nameEdit.draftValue}
                onChange={(e) => nameEdit.setDraft(e.target.value)}
                onBlur={nameEdit.handlers.onBlur}
                onKeyDown={nameEdit.handlers.onKeyDown}
                className="text-xl font-serif font-medium px-2 py-0.5 border border-amber-300 rounded bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            ) : (
              <h1
                onClick={canEdit ? nameEdit.startEdit : undefined}
                className={`text-xl font-serif font-medium text-stone-900 ${
                  canEdit
                    ? 'group cursor-pointer hover:bg-stone-100 rounded px-1 -mx-1 transition-colors inline-flex items-center gap-2'
                    : ''
                }`}
              >
                {profile.full_name || 'Unnamed Agent'}
                {canEdit && (
                  <Pencil className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </h1>
            )}
            {nameEdit.saveStatus === 'saved' && <span className="text-xs text-green-600">Saved</span>}

            {getStatusBadge()}

            {!profile.is_active && (
              <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Inactive</span>
            )}

            {profile.is_test && (
              <span className="px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                Test
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && profile.user_id && getSetupLinkButton()}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onResetContracting}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Contracting
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/admin/activity-log?user=${profile.user_id}`}>
                      <Activity className="w-4 h-4 mr-2" />
                      View Activity Log
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onOpenDeactivateModal}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    {profile.is_active ? 'Deactivate Agent' : 'Reactivate Agent'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfileHeader;
