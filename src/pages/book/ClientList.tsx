import { useState, useMemo } from 'react';
import { useBookClients } from '@/hooks/useBookClients';
import { ClientListPanel } from '@/components/book/ClientListPanel';
import { ClientDetail } from '@/components/book/ClientDetail';
import { AddClientForm } from '@/components/book/AddClientForm';
import { AddLeadForm } from '@/components/book/AddLeadForm';
import { LeadConversionForm } from '@/components/book/LeadConversionForm';


const ITEMS_PER_PAGE = 25;

type Mode = 'view' | 'add-client' | 'add-lead' | 'convert-lead';

export default function ClientList() {
  const {
    clients: filteredClients,
    flaggedClients,
    isLoading,
    availableCarriers,
    searchQuery,
    setSearchQuery,
    selectedCarriers,
    setSelectedCarriers,
    refetch,
  } = useBookClients();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [currentPage, setCurrentPage] = useState(1);
  const [birthdayFilter, setBirthdayFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'termed' | 'lead' | 'all'>('active');
  const [effDateFilter, setEffDateFilter] = useState<string>('');

  // Single-carrier filter bridged to the array interface
  const selectedCarrier = selectedCarriers[0] || '';
  const setSelectedCarrier = (carrierId: string) => {
    setSelectedCarriers(carrierId ? [carrierId] : []);
  };

  // Split all filtered clients into leads and non-leads
  const allLeads = useMemo(
    () => (filteredClients || []).filter((c) => c.status === 'lead'),
    [filteredClients],
  );
  const allNonLeads = useMemo(
    () => (filteredClients || []).filter((c) => c.status !== 'lead'),
    [filteredClients],
  );

  // Compose display list (non-lead clients): flagged first, then regular — with birthday/status/eff filters
  const displayClients = useMemo(() => {
    let list = allNonLeads;

    // Status filter (for policy-level status)
    if (statusFilter === 'active') {
      list = list.filter((c) => c.policy_status === 'active' || !c.policy_status);
    } else if (statusFilter === 'termed') {
      list = list.filter((c) => c.policy_status === 'termed');
    }
    // 'lead' and 'all' don't filter non-lead clients out

    // Effective date year filter
    if (effDateFilter) {
      list = list.filter((c) => {
        if (!c.effective_date) return false;
        const year = new Date(c.effective_date).getFullYear().toString();
        return year === effDateFilter;
      });
    }

    // Birthday filter — within next 30 days
    if (birthdayFilter) {
      list = list.filter((c) => {
        if (!c.date_of_birth) return false;
        const dob = new Date(c.date_of_birth);
        const now = new Date();
        const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        if (birthdayThisYear < now) birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
        const diffDays = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      });
    }

    // Sort: flagged first, then alphabetical
    return [...list].sort((a, b) => {
      const aFlagged = a.flag_type ? 1 : 0;
      const bFlagged = b.flag_type ? 1 : 0;
      if (aFlagged !== bFlagged) return bFlagged - aFlagged;
      return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
    });
  }, [allNonLeads, birthdayFilter, statusFilter, effDateFilter]);

  // Sorted leads (alphabetical)
  const displayLeads = useMemo(
    () => [...allLeads].sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)),
    [allLeads],
  );

  // Combined list for selection navigation (leads + clients in display order)
  const allDisplayed = useMemo(() => {
    if (statusFilter === 'lead') return displayLeads;
    if (statusFilter === 'active' || statusFilter === 'termed') return displayClients;
    return [...displayLeads, ...displayClients];
  }, [displayLeads, displayClients, statusFilter]);

  // Pagination (applies to client rows only)
  const totalPages = Math.ceil(displayClients.length / ITEMS_PER_PAGE);
  const paginatedClients = displayClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useMemo(() => setCurrentPage(1), [searchQuery, selectedCarrier, birthdayFilter, statusFilter, effDateFilter]);

  // Auto-select first client/lead if none selected
  const selectedClient =
    allDisplayed.find((c) => selectedClientId != null && String(c.id) === String(selectedClientId)) || allDisplayed[0] || null;

  // Stats for header badges
  const totalCount = displayClients.length;
  const leadCount = allLeads.length;
  const attentionCount = flaggedClients?.filter(c => c.flag_type !== 'birthday_upcoming').length || 0;
  const birthdayCount = useMemo(() => {
    if (!filteredClients) return 0;
    const now = new Date();
    return filteredClients.filter((c) => {
      if (!c.date_of_birth) return false;
      const dob = new Date(c.date_of_birth);
      const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (birthdayThisYear < now) birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
      const diffDays = Math.ceil(
        (birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays >= 0 && diffDays <= 30;
    }).length;
  }, [filteredClients]);

  // Navigate between clients with arrow buttons
  const selectedIndex = allDisplayed.findIndex((c) => selectedClient && String(c.id) === String(selectedClient.id));
  const handlePrevClient = () => {
    if (selectedIndex > 0) setSelectedClientId(String(allDisplayed[selectedIndex - 1].id));
  };
  const handleNextClient = () => {
    if (selectedIndex < allDisplayed.length - 1)
      setSelectedClientId(String(allDisplayed[selectedIndex + 1].id));
  };

  if (isLoading) {
    return (
      <div
        style={{
          flex: '1 1 0%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="animate-pulse"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "var(--font-sans)",
            fontSize: 14,
          }}
        >
          Loading your book…
        </div>
      </div>
    );
  }

  // Determine what to render in the right panel
  const renderRightPanel = () => {
    switch (mode) {
      case 'add-client':
        return (
          <AddClientForm
            onCancel={() => setMode('view')}
            onSaved={(clientId) => {
              setMode('view');
              setSelectedClientId(clientId);
              refetch();
            }}
          />
        );
      case 'add-lead':
        return (
          <AddLeadForm
            onCancel={() => setMode('view')}
            onSaved={(clientId) => {
              setMode('view');
              setSelectedClientId(clientId);
              refetch();
            }}
          />
        );
      case 'convert-lead':
        if (selectedClient) {
          return (
            <LeadConversionForm
              clientId={String(selectedClient.id)}
              clientName={`${selectedClient.first_name} ${selectedClient.last_name}`}
              onCancel={() => setMode('view')}
              onConverted={(clientId) => {
                setMode('view');
                setSelectedClientId(clientId);
                refetch();
              }}
            />
          );
        }
        return null;
      default:
        if (selectedClient) {
          const isLead = selectedClient.status === 'lead';
          return (
            <ClientDetail
              client={selectedClient}
              onPrev={selectedIndex > 0 ? handlePrevClient : undefined}
              onNext={selectedIndex < allDisplayed.length - 1 ? handleNextClient : undefined}
              onEnroll={isLead ? () => setMode('convert-lead') : undefined}
            />
          );
        }
        return (
          <div
            style={{
              flex: 1,
              background: 'var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
              fontFamily: "var(--font-sans)",
            }}
          >
            Select a client to view their file
          </div>
        );
    }
  };

  return (
    <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Split Panel — starts immediately */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 0,
          margin: '14px 28px 14px',
          minHeight: 0,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <ClientListPanel
          clients={paginatedClients}
          leads={displayLeads}
          selectedClientId={selectedClient ? String(selectedClient.id) : null}
          onSelectClient={(id: string) => {
            setSelectedClientId(String(id));
            setMode('view');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableCarriers={availableCarriers}
          selectedCarrier={selectedCarrier}
          onCarrierChange={setSelectedCarrier}
          birthdayFilter={birthdayFilter}
          onBirthdayToggle={() => setBirthdayFilter(!birthdayFilter)}
          birthdayCount={birthdayCount}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          effDateFilter={effDateFilter}
          onEffDateChange={setEffDateFilter}
          currentPage={currentPage}
          totalPages={totalPages}
          totalClients={displayClients.length}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalCount={totalCount}
          leadCount={leadCount}
          attentionCount={attentionCount}
          onAddClient={() => setMode('add-client')}
          onAddLead={() => setMode('add-lead')}
        />
        {renderRightPanel()}
      </div>
    </div>
  );
}
