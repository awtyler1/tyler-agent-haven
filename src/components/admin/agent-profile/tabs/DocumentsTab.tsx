import React from 'react';
import { AgentDocumentsSection } from '@/components/admin/AgentDocumentsSection';

interface DocumentsTabProps {
  profileId: string;
  isAdmin: boolean;
  canUpload: boolean;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  profileId,
  isAdmin,
  canUpload,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200/50 overflow-hidden">
      <AgentDocumentsSection
        profileId={profileId}
        isAdmin={isAdmin}
        canUpload={canUpload}
      />
    </div>
  );
};

export default DocumentsTab;
