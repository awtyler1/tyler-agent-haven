import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBookImport } from '@/hooks/useBookImport';
import { useImportStatus } from '@/hooks/useImportStatus';
import { carrierImportGuides } from '@/config/carrierImportGuides';

// ── Helpers ─────────────────────────────────────────────────

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function getNextMilestone(clients: number): number {
  if (clients < 100) return Math.ceil((clients + 1) / 25) * 25;
  if (clients < 500) return Math.ceil((clients + 1) / 50) * 50;
  if (clients < 1000) return Math.ceil((clients + 1) / 100) * 100;
  return Math.ceil((clients + 1) / 250) * 250;
}

function formatSyncDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── SVG Icons (inline, Lucide-style) ────────────────────────

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const UploadIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CheckIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const FileSmallIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const BookOpenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Processing Steps ────────────────────────────────────────

const PROCESSING_STEPS = [
  'Reading file',
  'Detecting format',
  'Matching records',
  'Building summary',
];

// ── CSS Keyframes (injected once) ───────────────────────────

const KEYFRAMES = `
@keyframes importFadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes importPopIn {
  from { opacity: 0; transform: scale(0.3); }
  60% { transform: scale(1.05); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes importSpin {
  to { transform: rotate(360deg); }
}
@keyframes importStepFadeIn {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}
`;

// ── Main Component ──────────────────────────────────────────

export default function BookImportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'Agent';

  const {
    mode, setMode, isUploading, isCommitting, batch, error,
    uploadStartedAt, preImportClientCount, setPreImportClientCount,
    startUpload, retryUpload, commitImport, cancelImport, resumeImport, acceptMismatch, reset,
  } = useBookImport();

  const { carriers, pendingBatch, isLoading: statusLoading, refetch: refetchStatus } = useImportStatus();

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById('import-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'import-keyframes';
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // ── Processing step animation ──
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    if (mode !== 'processing') { setActiveStep(0); return; }
    setActiveStep(0);
    const t1 = setTimeout(() => setActiveStep(1), 500);
    const t2 = setTimeout(() => setActiveStep(2), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mode]);

  // When upload completes (mode changes from processing), mark all steps done
  const allStepsDone = mode !== 'processing' && activeStep >= 2;

  // ── Count-up animation for success ──
  const [displayCount, setDisplayCount] = useState(0);
  const [bounce, setBounce] = useState(false);
  const animRef = useRef(0);

  useEffect(() => {
    if (mode !== 'success' || !batch) return;
    const target = preImportClientCount + batch.newRecords;
    if (target === 0) { setDisplayCount(0); return; }

    const delay = setTimeout(() => {
      const duration = 1000;
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        setDisplayCount(Math.round(easeOutQuart(t) * target));
        if (t < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          setBounce(true);
          setTimeout(() => setBounce(false), 300);
        }
      };
      animRef.current = requestAnimationFrame(tick);
    }, 400);

    return () => { clearTimeout(delay); cancelAnimationFrame(animRef.current); };
  }, [mode, batch, preImportClientCount]);

  // ── Drag state for carrier tiles ──
  const [dragOverCarrier, setDragOverCarrier] = useState<string | null>(null);
  const [dragOverBulk, setDragOverBulk] = useState(false);

  // ── File input refs (one per carrier + one for bulk) ──
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const bulkFileRef = useRef<HTMLInputElement | null>(null);

  // ── Guide expansion state ──
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  // ── Skip details expansion ──
  const [showSkipDetails, setShowSkipDetails] = useState(false);

  // ── Drop error (file validation) ──
  const [dropError, setDropError] = useState<string | null>(null);

  // ── Timeout indicator — show message after 30s of uploading ──
  const [showTimeout, setShowTimeout] = useState(false);
  useEffect(() => {
    if (!isUploading || !uploadStartedAt) { setShowTimeout(false); return; }
    const timer = setTimeout(() => setShowTimeout(true), 30000);
    return () => clearTimeout(timer);
  }, [isUploading, uploadStartedAt]);

  // Sync progress stats
  const syncedCount = carriers.filter(c => c.isSyncedThisMonth).length;
  const totalCarriers = carriers.length;
  const syncProgress = totalCarriers > 0 ? (syncedCount / totalCarriers) * 100 : 0;

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  // Is this likely the first import? (no carriers with clients)
  const isFirstImport = carriers.length === 0 || carriers.every(c => c.clientCount === 0);

  // Total client count for success screen
  const totalClientCount = useMemo(() => {
    return carriers.reduce((sum, c) => sum + c.clientCount, 0);
  }, [carriers]);

  // Set pre-import count when entering the page
  useEffect(() => {
    setPreImportClientCount(totalClientCount);
  }, [totalClientCount, setPreImportClientCount]);

  // ── File handler ──
  const handleFile = useCallback((file: File, carrierId?: string, carrierCode?: string, carrierName?: string) => {
    setDropError(null);
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setDropError(`"${file.name}" isn't a supported format. Use .csv, .xlsx, or .xls.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDropError('File is too large (max 10 MB). Try exporting a smaller date range.');
      return;
    }
    startUpload(file, carrierId, carrierCode, carrierName);
  }, [startUpload]);

  const handleDrop = useCallback((e: React.DragEvent, carrierId?: string, carrierCode?: string, carrierName?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCarrier(null);
    setDragOverBulk(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, carrierId, carrierCode, carrierName);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // ── Fade-up helper ──
  const fadeUp = (delay: string): React.CSSProperties => ({
    opacity: 0, animation: `importFadeUp 0.5s var(--ease) forwards ${delay}`,
  });

  // ── Back button helper ──
  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        width: 32, height: 32, borderRadius: 8,
        border: '1px solid var(--bg-muted)', background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all var(--fast) var(--ease)',
        color: 'var(--text-muted)', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
    >
      <ChevronLeft />
    </button>
  );

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <div style={{
      flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0,
      fontFamily: "'Outfit', sans-serif",
    }}>

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODE: CARRIER GRID                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      {mode === 'carrier-grid' && (
        <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
          {/* Header */}
          <div style={{ padding: '20px 32px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <BackButton onClick={() => navigate('/book')} />
            <span style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
              Import
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <ClockIcon />
                {monthLabel}
              </span>
            </div>
          </div>

          {/* Sync progress strip */}
          {totalCarriers > 0 && (
            <div style={{
              padding: '14px 32px', background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--bg-muted)',
              display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Monthly Sync</span>
              <div style={{ flex: 1, maxWidth: 200, height: 4, background: 'var(--bg-muted)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: 'linear-gradient(90deg, var(--green), #8BAF5A)',
                  width: `${syncProgress}%`,
                  transition: 'width 0.8s var(--ease)',
                }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                <strong style={{ color: 'var(--green)', fontWeight: 600 }}>{syncedCount}</strong> of {totalCarriers} carriers synced
              </span>
            </div>
          )}

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
            <div style={{ height: 20 }} />

            {/* Resume banner */}
            {pendingBatch && (
              <div
                style={{
                  marginBottom: 20, padding: '14px 20px', borderRadius: 12,
                  background: 'rgba(184,148,74,0.06)', border: '1px solid rgba(184,148,74,0.15)',
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}
                onClick={() => resumeImport(pendingBatch)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(184,148,74,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileIcon />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Resume pending import
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {pendingBatch.fileName} &middot; {pendingBatch.totalRecords} records ready
                  </div>
                </div>
                <ChevronRight />
              </div>
            )}

            {/* Carrier grid */}
            {carriers.length > 0 && (
              <>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
                }}>
                  Your Carriers
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12, marginBottom: 28,
                }}>
                  {carriers.map((carrier, carrierIndex) => {
                    const isDragOver = dragOverCarrier === carrier.carrierId;
                    const guide = carrierImportGuides[carrier.carrierCode?.toLowerCase()];
                    const isGuideExpanded = expandedGuide === carrier.carrierId;

                    return (
                      <div
                        key={carrier.carrierId}
                        style={{
                          background: 'var(--bg-card)', borderRadius: 12,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          padding: '18px 18px 16px', cursor: 'pointer',
                          transition: 'all var(--med) var(--ease)',
                          border: `2px solid ${isDragOver ? 'var(--gold)' : carrier.isSyncedThisMonth ? 'rgba(107,138,66,0.2)' : 'transparent'}`,
                          position: 'relative', overflow: 'hidden',
                          transform: isDragOver ? 'scale(1.02)' : undefined,
                          opacity: 0, animation: `importFadeUp 0.35s var(--ease) forwards ${0.05 * carrierIndex}s`,
                        }}
                        onDragOver={e => { handleDragOver(e); setDragOverCarrier(carrier.carrierId); }}
                        onDragLeave={() => setDragOverCarrier(null)}
                        onDrop={e => handleDrop(e, carrier.carrierId, carrier.carrierCode, carrier.carrierName)}
                        onClick={() => {
                          const ref = fileInputRefs.current[carrier.carrierId];
                          if (ref && !carrier.isSyncedThisMonth) ref.click();
                        }}
                      >
                        {/* Green top bar for synced */}
                        {carrier.isSyncedThisMonth && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                            background: 'linear-gradient(90deg, var(--green), rgba(107,138,66,0.3))',
                          }} />
                        )}

                        {/* Hidden file input */}
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          style={{ display: 'none' }}
                          ref={el => { fileInputRefs.current[carrier.carrierId] = el; }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file, carrier.carrierId, carrier.carrierCode, carrier.carrierName);
                            e.target.value = '';
                          }}
                        />

                        {/* Tile top: carrier name + status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 10, height: 10, borderRadius: '50%',
                              background: carrier.brandColor,
                            }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {carrier.carrierName}
                            </span>
                          </div>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: carrier.isSyncedThisMonth ? 'var(--green-bg)' : 'var(--bg)',
                          }}>
                            {carrier.isSyncedThisMonth ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Client count */}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                          <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{carrier.clientCount}</strong> clients
                          {!carrier.isSyncedThisMonth && carrier.lastSyncDate && (
                            <span> &middot; last synced {formatSyncDate(carrier.lastSyncDate)}</span>
                          )}
                        </div>

                        {/* Synced info or drop zone */}
                        {carrier.isSyncedThisMonth ? (
                          <div style={{ paddingTop: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
                              <span>+{carrier.lastSyncStats?.newRecords || 0} new</span>
                              <strong style={{ color: 'var(--green)', fontWeight: 600 }}>Synced</strong>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 6 }}>
                              Uploaded {formatSyncDate(carrier.lastSyncDate)}
                            </div>
                            {carrier.lastSyncFileName && (
                              <div style={{
                                fontSize: 10, color: 'var(--text-faint)', marginTop: 2,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {carrier.lastSyncFileName}
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: 10.5, fontWeight: 600, color: 'var(--blue)', cursor: 'pointer',
                                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 3,
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                const ref = fileInputRefs.current[carrier.carrierId];
                                if (ref) ref.click();
                              }}
                            >
                              <RefreshIcon /> Re-sync
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            padding: 14,
                            border: `1.5px dashed ${isDragOver ? 'var(--gold)' : 'var(--bg-muted)'}`,
                            borderRadius: 8, textAlign: 'center',
                            transition: 'all var(--fast) var(--ease)',
                            background: isDragOver ? 'rgba(201,168,76,0.02)' : 'var(--bg)',
                          }}>
                            <UploadIcon size={16} />
                            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 500, marginTop: 4 }}>
                              Drop report or <span style={{ color: 'var(--blue)', fontWeight: 600 }}>browse</span>
                            </div>
                          </div>
                        )}

                        {/* Guide link */}
                        {guide && (
                          <div style={{ marginTop: 10 }}>
                            <div
                              style={{ fontSize: 10, color: 'var(--text-faint)', cursor: 'pointer' }}
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedGuide(isGuideExpanded ? null : carrier.carrierId);
                              }}
                            >
                              {isGuideExpanded ? '▾' : '▸'} How to download
                            </div>
                            {isGuideExpanded && (
                              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, lineHeight: 1.5 }}>
                                {guide.steps}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty state when no carriers */}
            {carriers.length === 0 && !statusLoading && (
              <div style={{
                textAlign: 'center', padding: '40px 0 20px',
                color: 'var(--text-muted)', fontSize: 13,
              }}>
                No carrier data yet. Import a file to get started.
              </div>
            )}

            {/* Bulk import card */}
            <div style={{
              fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
            }}>
              Other
            </div>
            <div
              style={{
                background: 'var(--bg-card)', borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer', transition: 'all var(--fast) var(--ease)',
                border: '1px solid transparent',
              }}
              onClick={() => setMode('bulk-upload')}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--bg-muted)';
                e.currentTarget.style.background = '#FEFEFE';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(74,127,181,0.1), rgba(74,127,181,0.04))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FileIcon />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Import from file
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  SunFire export, Connecture report, or your own spreadsheet
                </div>
              </div>
              <div style={{ color: 'var(--text-faint)' }}>
                <ChevronRight />
              </div>
            </div>
          </div>

          {/* Error toast */}
          {(error || dropError) && (
            <div style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              padding: '10px 20px', borderRadius: 8,
              background: dropError ? 'var(--amber)' : 'var(--red)', color: 'white',
              fontSize: 13, fontWeight: 500, zIndex: 100,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              animation: 'importFadeUp 0.3s var(--ease) forwards',
            }}>
              {dropError || error}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODE: BULK UPLOAD                                     */}
      {/* ══════════════════════════════════════════════════════ */}
      {mode === 'bulk-upload' && (
        <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
          <div style={{ padding: '20px 32px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <BackButton onClick={() => setMode('carrier-grid')} />
            <span style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
              Import from File
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px 40px' }}>
            <div style={{
              width: '100%', maxWidth: 540, background: 'var(--bg-card)',
              borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
            }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0EBE2' }}>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Upload your file
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  SunFire export, Connecture report, or your own spreadsheet. We'll figure out the format and match against your book.
                </div>
              </div>

              {/* Drop zone */}
              <div
                style={{
                  margin: '20px 24px', padding: '40px 24px',
                  border: `2px dashed ${dragOverBulk ? 'var(--gold)' : 'var(--bg-muted)'}`,
                  borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                  transition: 'all var(--med) var(--ease)',
                  background: dragOverBulk ? 'rgba(201,168,76,0.03)' : 'var(--bg)',
                }}
                onDragOver={e => { handleDragOver(e); setDragOverBulk(true); }}
                onDragLeave={() => setDragOverBulk(false)}
                onDrop={e => handleDrop(e)}
                onClick={() => bulkFileRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  ref={bulkFileRef}
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = '';
                  }}
                />
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <UploadIcon />
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Drop your file here or <span style={{ color: 'var(--blue)', fontWeight: 600 }}>browse</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                  .csv, .xlsx — up to 10 MB
                </div>
              </div>

              {/* Drop error */}
              {dropError && (
                <div style={{
                  margin: '-8px 24px 12px', padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(184,148,74,0.06)', border: '1px solid rgba(184,148,74,0.15)',
                  fontSize: 12, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ flexShrink: 0 }}><AlertTriangleIcon /></span> {dropError}
                </div>
              )}

              {/* Format strip */}
              <div style={{
                padding: '16px 24px 20px', display: 'flex', alignItems: 'center', gap: 8,
                borderTop: '1px solid #F0EBE2', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>
                  Auto-detects
                </span>
                {['SunFire', 'Connecture', 'Carrier Reports', 'CSV / Excel'].map(f => (
                  <span key={f} style={{
                    fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20,
                    border: '1px solid rgba(107,138,66,0.25)', background: 'white',
                    color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODE: PROCESSING                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      {mode === 'processing' && (
        <div style={{
          flex: '1 1 0%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', gap: 32,
        }}>
          {/* Spinner or error icon */}
          {error ? (
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(196,74,63,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--red)',
              opacity: 0, animation: 'importPopIn 0.4s var(--ease) forwards 0.1s',
            }}>
              <XIcon size={26} />
            </div>
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid var(--bg-muted)',
              borderTopColor: 'var(--gold)',
              animation: 'importSpin 0.8s linear infinite',
            }} />
          )}

          <div style={{ textAlign: 'center' }}>
            {error ? (
              <>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  We couldn't read this file
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.5 }}>
                  {error}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Reading your book...
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  This usually takes a few seconds
                </div>
              </>
            )}
          </div>

          {/* Step list — only when actively uploading */}
          {!error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 240 }}>
              {PROCESSING_STEPS.map((step, i) => {
                const isDone = i < activeStep || (!isUploading && i <= activeStep);
                const isActive = i === activeStep && isUploading;
                const isVisible = i <= activeStep || !isUploading;
                return (
                  <div
                    key={step}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      opacity: isVisible ? undefined : 0,
                      animation: isVisible ? `importStepFadeIn 0.3s var(--ease) forwards` : undefined,
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'var(--green-bg)' : isActive ? 'rgba(201,168,76,0.15)' : 'var(--bg-subtle)',
                      transition: 'all var(--med) var(--ease)',
                    }}>
                      {isDone ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : isActive ? (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                      ) : (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg-muted)' }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: isDone || isActive ? 600 : 400,
                      color: isDone ? 'var(--green)' : isActive ? 'var(--text-primary)' : 'var(--text-faint)',
                      transition: 'color var(--fast) var(--ease)',
                    }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Timeout indicator */}
          {!error && showTimeout && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Large files can take a moment…{' '}
              <span
                onClick={() => { reset(); }}
                style={{ color: 'var(--blue)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </span>
            </div>
          )}

          {/* Error actions */}
          {error && (
            <div style={{ display: 'flex', gap: 10, ...fadeUp('0.3s') }}>
              <button
                onClick={retryUpload}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '10px 24px', borderRadius: 8,
                  border: 'none', background: 'var(--blue)', color: 'white', cursor: 'pointer',
                  transition: 'all var(--fast) var(--ease)',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => { reset(); }}
                style={{
                  fontSize: 13, fontWeight: 500, padding: '10px 24px', borderRadius: 8,
                  border: '1px solid var(--bg-muted)', background: 'var(--bg-card)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  transition: 'all var(--fast) var(--ease)',
                }}
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODE: MISMATCH                                        */}
      {/* ══════════════════════════════════════════════════════ */}
      {mode === 'mismatch' && batch && (
        <div style={{
          flex: '1 1 0%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', padding: '0 32px 40px',
        }}>
          <div style={{
            width: '100%', maxWidth: 480, padding: '28px 28px 24px', borderRadius: 12,
            background: 'rgba(184,148,74,0.04)', border: '1px solid rgba(184,148,74,0.2)',
            opacity: 0, animation: 'importFadeUp 0.4s var(--ease) forwards 0.1s',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
              <div style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }}>
                <AlertTriangleIcon />
              </div>
              <div>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  This looks like a {batch.mismatchDetectedCarrier || 'different carrier'} report
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  You uploaded to <strong>{batch.expectedCarrierName || 'a carrier'}</strong>, but the file format looks like it's from{' '}
                  <strong>{batch.mismatchDetectedCarrier}</strong>. Would you like to continue anyway?
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => acceptMismatch(true)}
                style={{
                  flex: 1, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'var(--blue)', color: 'white', border: 'none', cursor: 'pointer',
                }}
              >
                Use as {batch.mismatchDetectedCarrier}
              </button>
              <button
                onClick={() => acceptMismatch(false)}
                style={{
                  flex: 1, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--bg-muted)', cursor: 'pointer',
                }}
              >
                Continue anyway
              </button>
            </div>
            <button
              onClick={cancelImport}
              style={{
                display: 'block', width: '100%', marginTop: 10, padding: '8px',
                fontSize: 12, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Cancel import
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODE: SUMMARY                                         */}
      {/* ══════════════════════════════════════════════════════ */}
      {mode === 'summary' && batch && (
        <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
          <div style={{ padding: '20px 32px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <BackButton onClick={cancelImport} />
            <span style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
              Import
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px 40px' }}>
            <div style={{
              width: '100%', maxWidth: 520, background: 'var(--bg-card)',
              borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
              opacity: 0, animation: 'importFadeUp 0.4s var(--ease) forwards 0.1s',
            }}>
              {/* Summary header */}
              <div style={{
                padding: '24px 28px 20px',
                background: batch.totalRecords === 0 || (batch.skippedRecords === batch.totalRecords && batch.totalRecords > 0)
                  ? 'var(--bg-card)'
                  : 'linear-gradient(180deg, var(--bg-warm-glow) 0%, var(--bg-card) 100%)',
                borderBottom: '2px solid transparent',
                borderImage: batch.totalRecords === 0 || (batch.skippedRecords === batch.totalRecords && batch.totalRecords > 0)
                  ? undefined
                  : 'linear-gradient(90deg, var(--gold) 0%, rgba(201,168,76,0.15) 100%) 1',
                textAlign: 'center',
              }}>
                {batch.totalRecords === 0 ? (
                  <>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                      color: 'var(--text-faint)',
                    }}>
                      <FileIcon />
                    </div>
                    <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      No records found
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      This file appears to be empty or doesn't contain client data we can recognize.
                    </div>
                  </>
                ) : batch.skippedRecords === batch.totalRecords && batch.totalRecords > 0 ? (
                  <>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: 'rgba(184,148,74,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                      color: 'var(--amber)',
                    }}>
                      <AlertTriangleIcon />
                    </div>
                    <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      All rows skipped
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      We found {batch.totalRecords} records, but none could be imported. See details below.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: 'var(--green-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                    }}>
                      <CheckIcon />
                    </div>
                    <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Ready to import
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      We matched this report against your book.
                    </div>
                  </>
                )}
                {batch.fileName && (
                  <div style={{
                    fontSize: 11, color: 'var(--text-faint)', marginTop: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>
                    <FileSmallIcon />
                    {batch.fileName}
                    {batch.detectedFormat && ` \u00B7 ${batch.detectedFormat} format`}
                  </div>
                )}
              </div>

              {/* Stats grid */}
              {batch.totalRecords > 0 && (
                <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 10, background: 'var(--bg)', ...fadeUp('0.25s') }}>
                    <div style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4, color: 'var(--green)' }}>
                      {batch.newRecords}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      New clients
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 10, background: 'var(--bg)', ...fadeUp('0.35s') }}>
                    <div style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4, color: 'var(--blue)' }}>
                      {batch.updatedRecords}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Updated
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 10, background: 'var(--bg)', ...fadeUp('0.45s') }}>
                    <div style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4, color: 'var(--text-faint)' }}>
                      {batch.termedRecords > 0 ? batch.termedRecords : batch.skippedRecords}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {batch.termedRecords > 0 ? 'Termed' : 'Skipped'}
                    </div>
                  </div>
                </div>
              )}

              {/* Skip details (expandable) */}
              {batch.skipDetails.length > 0 && (
                <div style={{ margin: '0 28px 16px', padding: '12px 16px', borderRadius: 8, background: 'rgba(184,148,74,0.06)', border: '1px solid rgba(184,148,74,0.15)' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => setShowSkipDetails(!showSkipDetails)}
                  >
                    <div style={{ color: 'var(--amber)', flexShrink: 0 }}>
                      <AlertTriangleIcon />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{batch.skipDetails.length} rows skipped</strong>
                      {' '}&mdash; click to see details
                    </div>
                  </div>
                  {(showSkipDetails || (batch.skippedRecords === batch.totalRecords && batch.totalRecords > 0)) && (
                    <div style={{ marginTop: 10, maxHeight: 120, overflowY: 'auto' }}>
                      {batch.skipDetails.map((d, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--text-faint)', padding: '3px 0' }}>
                          Row {d.row}: {d.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ margin: '0 28px 16px', padding: '10px 16px', borderRadius: 8, background: 'rgba(196,74,63,0.06)', border: '1px solid rgba(196,74,63,0.15)', fontSize: 12, color: 'var(--red)' }}>
                  {error}
                </div>
              )}

              {/* Actions */}
              {(() => {
                const canCommit = batch.totalRecords > 0 && batch.skippedRecords < batch.totalRecords;
                return (
                  <div style={{
                    padding: '16px 28px 20px', borderTop: '1px solid #F0EBE2',
                    display: 'flex', alignItems: 'center', justifyContent: canCommit ? 'space-between' : 'center',
                  }}>
                    <button
                      onClick={cancelImport}
                      style={{
                        fontSize: 13, fontWeight: canCommit ? 500 : 600, color: canCommit ? 'var(--text-muted)' : 'var(--blue)',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      {canCommit ? 'Cancel' : 'Try another file'}
                    </button>
                    {canCommit && (
                      <button
                        onClick={commitImport}
                        disabled={isCommitting}
                        style={{
                          fontSize: 13, fontWeight: 600, padding: '10px 28px', borderRadius: 8,
                          border: 'none', background: isCommitting ? 'var(--bg-muted)' : 'var(--blue)', color: 'white',
                          cursor: isCommitting ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          transition: 'all var(--fast) var(--ease)',
                          opacity: isCommitting ? 0.7 : 1,
                        }}
                      >
                        {isCommitting ? 'Importing...' : `Import ${batch.totalRecords} records`}
                        {!isCommitting && <ChevronRight />}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODE: SUCCESS                                         */}
      {/* ══════════════════════════════════════════════════════ */}
      {mode === 'success' && batch && (
        isFirstImport ? (
          /* ── First-time success ── */
          <div style={{
            flex: '1 1 0%', display: 'flex', flexDirection: 'column',
            background: 'radial-gradient(ellipse 60% 50% at 50% 42%, var(--bg-warm-glow) 0%, var(--bg) 70%)',
            overflow: 'hidden',
          }}>
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '0 32px 20px',
            }}>
              {/* Confetti check */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--green), #5A7A35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 8px 32px rgba(107,138,66,0.25)',
                opacity: 0, transform: 'scale(0.3)',
                animation: 'importPopIn 0.5s var(--ease) forwards 0.2s',
              }}>
                <CheckIcon size={32} />
              </div>

              {/* Welcome text */}
              <div style={{
                fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 400,
                color: 'var(--text-muted)', marginBottom: 4,
                ...fadeUp('0.45s'),
              }}>
                Your book is here, <em style={{ color: 'var(--gold-dark)' }}>{firstName}</em>
              </div>

              {/* Hero number */}
              <div style={{
                fontFamily: "'Lora', serif", fontSize: 'min(110px, 12vh)',
                fontWeight: 700, lineHeight: 0.85, letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                transform: bounce ? 'scale(1.012)' : 'scale(1)',
                transition: 'transform 0.3s var(--ease)',
                ...fadeUp('0.55s'),
              }}>
                {displayCount}
              </div>

              <div style={{
                fontSize: 17, color: 'var(--text-muted)', marginTop: 8,
                ...fadeUp('0.7s'),
              }}>
                clients ready to go
              </div>

              <div style={{
                fontSize: 14, color: 'var(--green)', fontWeight: 600, marginTop: 14,
                background: 'var(--green-bg)', padding: '6px 20px', borderRadius: 20,
                ...fadeUp('0.8s'),
              }}>
                Your book is home
              </div>

              <div style={{ marginTop: 32, ...fadeUp('1s') }}>
                <button
                  onClick={() => navigate('/book')}
                  style={{
                    fontSize: 14, fontWeight: 600, padding: '12px 32px', borderRadius: 8,
                    border: 'none', background: 'var(--blue)', color: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all var(--fast) var(--ease)',
                  }}
                >
                  <BookOpenIcon /> View My Book
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Monthly sync success ── */
          <div style={{
            flex: '1 1 0%', display: 'flex', flexDirection: 'column',
            background: 'radial-gradient(ellipse 50% 50% at 50% 45%, var(--bg-warm-glow) 0%, var(--bg) 70%)',
            overflow: 'hidden',
          }}>
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '0 32px 20px',
            }}>
              {/* Check circle */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--green), #5A7A35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
                opacity: 0, transform: 'scale(0.3)',
                animation: 'importPopIn 0.5s var(--ease) forwards 0.2s',
              }}>
                <CheckIcon size={28} />
              </div>

              {/* Hero number */}
              <div style={{
                fontFamily: "'Lora', serif", fontSize: 'min(96px, 10vh)',
                fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                transform: bounce ? 'scale(1.012)' : 'scale(1)',
                transition: 'transform 0.3s var(--ease)',
                ...fadeUp('0.4s'),
              }}>
                {displayCount}
              </div>

              <div style={{
                fontSize: 16, color: 'var(--text-muted)', fontWeight: 400, marginTop: 8,
                ...fadeUp('0.55s'),
              }}>
                clients in your book
              </div>

              {/* Delta pill */}
              {batch.newRecords > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12,
                  fontSize: 14, fontWeight: 600, color: 'var(--green)',
                  background: 'var(--green-bg)', padding: '6px 18px', borderRadius: 20,
                  ...fadeUp('0.65s'),
                }}>
                  <ArrowUpIcon />
                  {batch.newRecords} new{batch.expectedCarrierName ? ` from ${batch.expectedCarrierName}` : ''}
                </div>
              )}

              {/* Breakdown */}
              <div style={{
                display: 'flex', gap: 24, marginTop: 28,
                ...fadeUp('0.75s'),
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 700, lineHeight: 1, color: 'var(--green)' }}>
                    {batch.newRecords}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                    New
                  </div>
                </div>
                <div style={{ width: 1, background: 'var(--bg-muted)', alignSelf: 'stretch' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 700, lineHeight: 1, color: 'var(--blue)' }}>
                    {batch.updatedRecords}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                    Updated
                  </div>
                </div>
              </div>

              {/* Milestone bar */}
              {(() => {
                const total = preImportClientCount + batch.newRecords;
                const milestone = getNextMilestone(total);
                const remaining = milestone - total;
                const progress = Math.min((total / milestone) * 100, 100);
                return (
                  <div style={{
                    width: 'min(360px, 50%)', marginTop: 28,
                    ...fadeUp('0.85s'),
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Next Milestone
                      </span>
                      <span style={{ fontSize: 12, color: '#8A7B68', fontWeight: 600 }}>
                        {total} / {milestone}
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                      <MilestoneBar progress={progress} />
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center' }}>
                      <strong style={{ color: 'var(--gold-dark)', fontWeight: 700 }}>{remaining} more</strong> to your next milestone
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div style={{
                marginTop: 32, display: 'flex', gap: 10,
                ...fadeUp('0.95s'),
              }}>
                <button
                  onClick={() => { reset(); refetchStatus(); }}
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '10px 24px', borderRadius: 8,
                    border: 'none', background: 'var(--blue)', color: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all var(--fast) var(--ease)',
                  }}
                >
                  <ChevronLeft /> Back to Import
                </button>
                <button
                  onClick={() => navigate('/book')}
                  style={{
                    fontSize: 13, fontWeight: 500, padding: '10px 24px', borderRadius: 8,
                    border: '1px solid var(--bg-muted)', background: 'var(--bg-card)',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    transition: 'all var(--fast) var(--ease)',
                  }}
                >
                  View My Book
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── Animated milestone fill ─────────────────────────────────

function MilestoneBar({ progress }: { progress: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current) ref.current.style.width = `${progress}%`;
    }, 600);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div
      ref={ref}
      style={{
        width: '0%', height: '100%', borderRadius: 3,
        background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
        transition: 'width 1.2s var(--ease)',
      }}
    />
  );
}
