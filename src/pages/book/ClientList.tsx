import { useState, useMemo } from 'react';
import { useBookClients, type BookClientWithMeta } from '@/hooks/useBookClients';
import { ClientListPanel } from '@/components/book/ClientListPanel';
import { ClientDetail } from '@/components/book/ClientDetail';

const ITEMS_PER_PAGE = 25;

export default function ClientList() {
  const {
    clients: filteredClients,
    flaggedClients,
    regularClients,
    isLoading,
    availableCarriers,
    searchQuery,
    setSearchQuery,
    selectedCarriers,
    setSelectedCarriers,
  } = useBookClients();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [birthdayFilter, setBirthdayFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'termed' | 'all'>('active');

  // Single-carrier filter bridged to the array interface
  const selectedCarrier = selectedCarriers[0] || '';
  const setSelectedCarrier = (carrierId: string) => {
    setSelectedCarriers(carrierId ? [carrierId] : []);
  };

  // Compose display list: flagged first, then regular — with birthday/status filters
  const displayClients = useMemo(() => {
    let list = filteredClients || [];

    // Status filter
    if (statusFilter === 'active') {
      list = list.filter((c) => c.policy_status === 'active' || !c.policy_status);
    } else if (statusFilter === 'termed') {
      list = list.filter((c) => c.policy_status === 'termed');
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
  }, [filteredClients, birthdayFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(displayClients.length / ITEMS_PER_PAGE);
  const paginatedClients = displayClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useMemo(() => setCurrentPage(1), [searchQuery, selectedCarrier, birthdayFilter, statusFilter]);

  // Auto-select first client if none selected (String() guards against type mismatch)
  const selectedClient =
    displayClients.find((c) => selectedClientId != null && String(c.id) === String(selectedClientId)) || displayClients[0] || null;

  // Stats for header badges — use displayClients (post-status-filter) so badge matches pagination
  const totalCount = displayClients.length;
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
  const selectedIndex = displayClients.findIndex((c) => selectedClient && String(c.id) === String(selectedClient.id));
  const handlePrevClient = () => {
    if (selectedIndex > 0) setSelectedClientId(String(displayClients[selectedIndex - 1].id));
  };
  const handleNextClient = () => {
    if (selectedIndex < displayClients.length - 1)
      setSelectedClientId(String(displayClients[selectedIndex + 1].id));
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
          selectedClientId={selectedClient ? String(selectedClient.id) : null}
          onSelectClient={(id: string) => setSelectedClientId(String(id))}
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
          currentPage={currentPage}
          totalPages={totalPages}
          totalClients={displayClients.length}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalCount={totalCount}
          attentionCount={attentionCount}
        />
        {selectedClient ? (
          <ClientDetail
            client={selectedClient}
            onPrev={selectedIndex > 0 ? handlePrevClient : undefined}
            onNext={selectedIndex < displayClients.length - 1 ? handleNextClient : undefined}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
