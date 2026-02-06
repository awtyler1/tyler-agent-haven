import React from 'react';
import { useSearchParams } from 'react-router-dom';

export type TabId = 'overview' | 'contracting' | 'documents' | 'admin';

interface Tab {
  id: TabId;
  label: string;
  adminOnly?: boolean;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'contracting', label: 'Contracting' },
  { id: 'documents', label: 'Documents' },
  { id: 'admin', label: 'Admin', adminOnly: true },
];

interface AgentProfileTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isAdmin: boolean;
}

export const AgentProfileTabs: React.FC<AgentProfileTabsProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
}) => {
  const visibleTabs = TABS.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="flex gap-1 p-1 bg-stone-200/60 rounded-xl w-fit">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Hook for managing tab state with URL sync
export const useProfileTabs = (defaultTab: TabId = 'overview') => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') as TabId) || defaultTab;

  const setActiveTab = (tab: TabId) => {
    setSearchParams({ tab });
  };

  return { activeTab, setActiveTab };
};

export default AgentProfileTabs;
