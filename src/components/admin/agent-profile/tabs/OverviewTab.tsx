import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface AgentProfile {
  id: string;
  user_id?: string | null;
  full_name: string | null;
  email: string | null;
  npn?: string | null;
  manager_id?: string | null;
  onboarding_status: string;
  is_active: boolean;
  created_at?: string | null;
  ahip_cert_year?: number | null;
}

interface ManagerInfo {
  id: string;
  full_name: string | null;
}

interface OverviewTabProps {
  profile: AgentProfile;
  manager: ManagerInfo | null;
  ownershipGroup?: string | null;
  lastLogin?: string;
  hasAhip: boolean;
  hasEo: boolean;
  eoExpiration?: string;
  isLicensed: boolean;
  licensedStates?: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  profile,
  manager,
  ownershipGroup,
  lastLogin,
  hasAhip,
  hasEo,
  eoExpiration,
  isLicensed,
  licensedStates = 0,
}) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CONTRACTING_REQUIRED: 'Contracting Required',
      CONTRACTING_SUBMITTED: 'Contracting Submitted',
      APPOINTED: 'Appointed',
      SUSPENDED: 'Suspended',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CONTRACTING_REQUIRED: 'text-red-600',
      CONTRACTING_SUBMITTED: 'text-amber-600',
      APPOINTED: 'text-green-600',
      SUSPENDED: 'text-red-600',
    };
    return colors[status] || 'text-stone-600';
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200/50 p-5">
        <h3 className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-4">Contact Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Email</span>
            <span className="text-stone-900">{profile.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">NPN</span>
            <span className="text-stone-900 font-mono">{profile.npn || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Manager</span>
            {manager ? (
              <span className="text-blue-600">{manager.full_name}</span>
            ) : ownershipGroup === 'a_and_a' ? (
              <span className="text-stone-700">A&A Team</span>
            ) : (
              <span className="text-stone-700">Direct to TIG</span>
            )}
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200/50 p-5">
        <h3 className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-4">Account Status</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Onboarding</span>
            <span className={`font-medium ${getStatusColor(profile.onboarding_status)}`}>
              {getStatusLabel(profile.onboarding_status)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Account Created</span>
            <span className="text-stone-900">{formatDate(profile.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Last Login</span>
            {lastLogin ? (
              <span className="text-stone-900">{formatDate(lastLogin)}</span>
            ) : (
              <span className="text-red-600">Never</span>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Status - Full Width */}
      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-stone-200/50 p-5">
        <h3 className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-4">Compliance Status</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* AHIP */}
          <ComplianceCard label="AHIP 2026" status={hasAhip ? 'Complete' : 'Required'} valid={hasAhip} />

          {/* E&O Insurance */}
          <ComplianceCard
            label="E&O Insurance"
            status={hasEo ? (eoExpiration ? `Valid until ${eoExpiration}` : 'Valid') : 'Required'}
            valid={hasEo}
          />

          {/* Licensing */}
          <ComplianceCard
            label="Licensing"
            status={isLicensed ? `${licensedStates} state${licensedStates !== 1 ? 's' : ''} active` : 'Required'}
            valid={isLicensed}
          />
        </div>
      </div>
    </div>
  );
};

interface ComplianceCardProps {
  label: string;
  status: string;
  valid: boolean;
}

const ComplianceCard: React.FC<ComplianceCardProps> = ({ label, status, valid }) => (
  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center ${
        valid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
      }`}
    >
      {valid ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
    </div>
    <div>
      <p className="font-medium text-stone-900 text-sm">{label}</p>
      <p className="text-xs text-stone-500">{status}</p>
    </div>
  </div>
);

export default OverviewTab;
