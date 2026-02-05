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
  AlertCircle,
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
  email: string | null;
  npn?: string | null;
  manager_id?: string | null;
  onboarding_status: string;
  is_active: boolean;
  is_test?: boolean | null;
  ahip_cert_year?: number | null;
  setup_link_sent_at?: string | null;
  password_created_at?: string | null;
  ownership_group?: string | null;
}

interface ManagerInfo {
  id: string;
  full_name: string | null;
}

interface AgentProfileHeaderProps {
  profile: AgentProfile;
  manager: ManagerInfo | null;
  teamSize: number;
  hasAhip: boolean;
  hasEo: boolean;
  isLicensed: boolean;
  onUpdateProfile: (field: string, value: string) => Promise<void>;
  onOpenManagerModal: () => void;
  onSendSetupLink: () => Promise<void>;
  onResetContracting: () => Promise<void>;
  onOpenDeactivateModal: () => void;
  isAdmin: boolean;
  isSelfView: boolean;
}

const CURRENT_AHIP_YEAR = 2026;

export const AgentProfileHeader: React.FC<AgentProfileHeaderProps> = ({
  profile,
  manager,
  teamSize,
  hasAhip,
  hasEo,
  isLicensed,
  onUpdateProfile,
  onOpenManagerModal,
  onSendSetupLink,
  onResetContracting,
  onOpenDeactivateModal,
  isAdmin,
  isSelfView,
}) => {
  const [sendingSetupLink, setSendingSetupLink] = useState(false);

  // Inline edit hooks - fixed to use correct interface
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

  const emailEdit = useInlineEdit<string>({
    initialValue: profile.email || '',
    onSave: async (value) => {
      await onUpdateProfile('email', value);
    },
    validate: (value) => {
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
      return null;
    },
  });

  const npnEdit = useInlineEdit<string>({
    initialValue: profile.npn || '',
    onSave: async (value) => {
      await onUpdateProfile('npn', value);
    },
    validate: (value) => {
      if (value && !/^\d+$/.test(value)) return 'NPN must be numeric';
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
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-lg font-semibold shadow-lg shadow-amber-500/20 flex-shrink-0">
            {initials}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            {/* Name + Badges */}
            <div className="flex items-center gap-2 flex-wrap">
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

            {/* Email */}
            <div className="mt-1 text-sm text-stone-500">
              {emailEdit.isEditing ? (
                <input
                  ref={emailEdit.inputRef as React.RefObject<HTMLInputElement>}
                  type="email"
                  value={emailEdit.draftValue}
                  onChange={(e) => emailEdit.setDraft(e.target.value)}
                  onBlur={emailEdit.handlers.onBlur}
                  onKeyDown={emailEdit.handlers.onKeyDown}
                  className="px-2 py-0.5 border border-amber-300 rounded bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              ) : (
                <span
                  onClick={canEdit ? emailEdit.startEdit : undefined}
                  className={
                    canEdit
                      ? 'group cursor-pointer hover:bg-stone-100 rounded px-1 -mx-1 transition-colors inline-flex items-center gap-1'
                      : ''
                  }
                >
                  {profile.email || '—'}
                  {canEdit && (
                    <Pencil className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </span>
              )}
              {emailEdit.saveStatus === 'saved' && <span className="text-xs text-green-600 ml-2">Saved</span>}
              {emailEdit.error && <span className="text-xs text-red-600 ml-2">{emailEdit.error}</span>}
            </div>

            {/* Meta Row */}
            <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
              {/* NPN */}
              <div className="text-stone-500">
                NPN:{' '}
                {npnEdit.isEditing ? (
                  <input
                    ref={npnEdit.inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={npnEdit.draftValue}
                    onChange={(e) => npnEdit.setDraft(e.target.value)}
                    onBlur={npnEdit.handlers.onBlur}
                    onKeyDown={npnEdit.handlers.onKeyDown}
                    className="font-mono px-2 py-0.5 border border-amber-300 rounded bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-24"
                  />
                ) : (
                  <span
                    onClick={canEdit ? npnEdit.startEdit : undefined}
                    className={`font-mono text-stone-700 ${
                      canEdit
                        ? 'group cursor-pointer hover:bg-stone-100 rounded px-1 -mx-1 transition-colors inline-flex items-center gap-1'
                        : ''
                    }`}
                  >
                    {profile.npn || '—'}
                    {canEdit && (
                      <Pencil className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </span>
                )}
                {npnEdit.saveStatus === 'saved' && <span className="text-xs text-green-600 ml-1">Saved</span>}
              </div>

              {/* Manager */}
              <button
                onClick={canEdit ? onOpenManagerModal : undefined}
                className={`text-stone-500 ${canEdit ? 'hover:text-stone-700 transition-colors group' : ''}`}
                disabled={!canEdit}
              >
                Manager:{' '}
                <span className={canEdit ? 'text-blue-600 group-hover:underline' : 'text-stone-700'}>
                  {manager?.full_name || (profile.ownership_group === 'a_and_a' ? 'A&A Team' : 'Direct to TIG')}
                </span>
                {canEdit && (
                  <Pencil className="w-3 h-3 inline ml-1 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>

              {/* Team Size */}
              {teamSize > 0 && (
                <span className="text-stone-500">
                  Team: <span className="text-stone-700">{teamSize} agents</span>
                </span>
              )}
            </div>
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

      {/* Compliance Strip */}
      <div className="border-t border-stone-100 px-5 py-2.5 flex items-center gap-5 bg-stone-50/50">
        <ComplianceItem label={`AHIP ${CURRENT_AHIP_YEAR}`} valid={hasAhip} />
        <ComplianceItem label="E&O Valid" valid={hasEo} />
        <ComplianceItem label="Licensed" valid={isLicensed} />
      </div>
    </div>
  );
};

const ComplianceItem: React.FC<{ label: string; valid: boolean }> = ({ label, valid }) => (
  <span className="flex items-center gap-1.5 text-sm text-stone-600">
    {valid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
    {label}
  </span>
);

export default AgentProfileHeader;
