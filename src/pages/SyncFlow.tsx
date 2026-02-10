/**
 * Smart Sync Flow
 *
 * Three user journeys:
 * 1. New Agent (no RTS): See all 4 MVP carriers as fallback
 * 2. First Sync (has RTS): See RTS carriers (enabled selectable, others "coming soon")
 * 3. Returning Sync: See last synced carriers with one-click proceed + option to add more
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Building2,
  Check,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  RotateCcw,
  Clock,
  Lock,
  Plus,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAgentRTSCarriers } from '@/hooks/useAgentRTSCarriers';
import { useSyncPreferences } from '@/hooks/useSyncPreferences';
import { CARRIERS, CarrierConfig, getCarriersByIds } from '@/config/carriers';
import {
  detectCarrierFromFile,
  checkFileTypeMatch,
  getExpectedFileType,
  SupportedCarrier,
} from '@/lib/carrier-detection';
import { getNextSyncDate, checkAndAwardMilestones } from '@/lib/sync';
import { GH } from '@/config/golden-hour';

// ============================================================
// TYPES
// ============================================================

type SyncPhase = 'loading' | 'select' | 'confirm' | 'addMore' | 'upload' | 'done';

interface ParseResult {
  total: number;
  new: number;
}

interface UploadedCarrier {
  carrierId: string;
  clientCount: number;
  newClients: number;
  termedClients: number;
  fileName: string;
}

interface CarrierMismatchInfo {
  expectedCarrier: string;
  detectedCarrier: string;
  fileName: string;
}

// Storage key for persisting sync progress
const SYNC_STORAGE_KEY = 'tig-sync-progress';

interface SyncProgress {
  phase: SyncPhase;
  selectedCarriers: string[];
  uploadedCarriers: UploadedCarrier[];
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function getCurrentMonth(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long' });
}

function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Parse effective date from various formats:
 * - YYYY-MM-DD (ISO)
 * - MM/DD/YYYY
 * - MM-DD-YYYY
 * - M/D/YYYY or M/D/YY
 *
 * IMPORTANT: Uses local timezone to avoid UTC offset issues.
 * e.g., "2026-01-01" should be January 1st regardless of timezone.
 */
function parseEffectiveDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Try ISO format first (YYYY-MM-DD) - parse manually to avoid UTC issues
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month - 1, day); // month - 1 because Date uses 0-indexed months
    if (!isNaN(d.getTime())) return d;
  }

  // Try MM/DD/YYYY or M/D/YYYY format
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10);
    const day = parseInt(slashMatch[2], 10);
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000; // Convert 2-digit year
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Try MM-DD-YYYY format
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dashMatch) {
    const month = parseInt(dashMatch[1], 10);
    const day = parseInt(dashMatch[2], 10);
    let year = parseInt(dashMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Check if a date falls within the current sync month
 */
function isSameMonth(date: Date, targetYear: number, targetMonth: number): boolean {
  return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
}

/**
 * Convert Excel serial date number to JavaScript Date
 * Excel dates are stored as days since January 1, 1900
 */
function excelDateToJSDate(serial: number): Date {
  // Excel incorrectly counts Feb 29, 1900, so subtract 1 for dates after that
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  return new Date(utcValue);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SyncFlow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { displayCarriers, comingSoonRTSCarriers, hasRTSData, loading: rtsLoading } = useAgentRTSCarriers();
  const { preferredCarriers, lastSyncDate, isFirstSync, loading: prefsLoading } = useSyncPreferences();

  // Determine initial phase
  const [phase, setPhase] = useState<SyncPhase>('loading');
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  const [uploadedCarriers, setUploadedCarriers] = useState<UploadedCarrier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [finalNewClients, setFinalNewClients] = useState<number>(0);

  // File validation states
  const [processingCarrier, setProcessingCarrier] = useState<string | null>(null);
  const [mismatchInfo, setMismatchInfo] = useState<CarrierMismatchInfo | null>(null);
  const [detectionFailed, setDetectionFailed] = useState<{ carrier: string; fileName: string } | null>(null);
  const pendingFileRef = useRef<{ file: File; carrier: string } | null>(null);
  const hasInitializedRef = useRef(false);
  const hasRestoredRef = useRef(false);

  // ============================================================
  // STATE PERSISTENCE
  // ============================================================

  // Save progress to sessionStorage
  const saveProgress = useCallback((
    currentPhase: SyncPhase,
    selected: string[],
    uploaded: UploadedCarrier[]
  ) => {
    // Only save meaningful progress (not loading/done states)
    if (currentPhase === 'loading' || currentPhase === 'done') {
      try {
        sessionStorage.removeItem(SYNC_STORAGE_KEY);
      } catch (e) {
        // Ignore storage errors
      }
      return;
    }

    try {
      const progress: SyncProgress = {
        phase: currentPhase,
        selectedCarriers: selected,
        uploadedCarriers: uploaded,
      };
      sessionStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      // Storage quota exceeded or other error - fail silently
    }
  }, []);

  // Save on state changes
  useEffect(() => {
    // Don't save during initial load or before restoration check
    if (!hasInitializedRef.current) return;
    saveProgress(phase, selectedCarriers, uploadedCarriers);
  }, [phase, selectedCarriers, uploadedCarriers, saveProgress]);

  // Initialize phase based on loaded data (only once)
  useEffect(() => {
    // Keep loading until both hooks complete
    if (rtsLoading || prefsLoading) {
      return;
    }

    // Only initialize once to prevent flashing
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    // Check for saved progress first
    try {
      const saved = sessionStorage.getItem(SYNC_STORAGE_KEY);
      if (saved) {
        const progress: SyncProgress = JSON.parse(saved);
        // Only restore if we have meaningful progress
        if (progress.uploadedCarriers.length > 0 || progress.selectedCarriers.length > 0) {
          // Filter out carriers that no longer exist
          const validSelected = progress.selectedCarriers.filter(id =>
            CARRIERS.find(c => c.id === id)?.enabled
          );
          if (validSelected.length > 0) {
            setSelectedCarriers(validSelected);
            setUploadedCarriers(progress.uploadedCarriers);
            setPhase(progress.phase);
            hasRestoredRef.current = true;
            return;
          }
        }
        // Invalid or empty progress - clear it
        sessionStorage.removeItem(SYNC_STORAGE_KEY);
      }
    } catch (e) {
      // Invalid JSON or storage error - clear and continue
      try {
        sessionStorage.removeItem(SYNC_STORAGE_KEY);
      } catch (_) {}
    }

    // No saved progress - use default initialization
    if (!isFirstSync && preferredCarriers.length > 0) {
      // Returning user - show confirm with last sync carriers
      const enabledPreferred = preferredCarriers.filter(id =>
        CARRIERS.find(c => c.id === id)?.enabled
      );
      setSelectedCarriers(enabledPreferred);
      setPhase('confirm');
    } else {
      // First sync or new agent - show selection
      setPhase('select');
    }
  }, [rtsLoading, prefsLoading, isFirstSync, preferredCarriers]);

  // ============================================================
  // CARRIER SELECTION
  // ============================================================

  const toggleCarrier = useCallback((carrierId: string) => {
    const carrier = CARRIERS.find(c => c.id === carrierId);
    if (!carrier?.enabled) return;

    setSelectedCarriers(prev =>
      prev.includes(carrierId)
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    );
  }, []);

  // ============================================================
  // FILE UPLOAD & VALIDATION
  // ============================================================

  const processUpload = useCallback(async (carrierId: string, file: File) => {
    if (!profile?.id) {
      setProcessingCarrier(null);
      return;
    }

    setProcessingCarrier(carrierId);

    try {
      // Step 1: Client-side parse for instant counts
      const fastCounts = await parseFileForClientCount(file, carrierId);

      // Step 2: Show results immediately and clear spinner
      setUploadedCarriers(prev => [
        ...prev.filter(u => u.carrierId !== carrierId),
        {
          carrierId,
          clientCount: fastCounts.total,
          newClients: fastCounts.new,
          termedClients: 0,
          fileName: file.name,
        },
      ]);
      setProcessingCarrier(null);

      // Step 3: Background reconciliation — edge function + RPC for accurate counts
      // Fires without blocking the UI; silently updates state when done
      const profileId = profile.id;
      (async () => {
        try {
          const base64Content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const { data, error: fnError } = await supabase.functions.invoke('parse-production-report', {
            body: {
              file: base64Content,
              carrier_code: carrierId,
              profile_id: profileId,
            },
          });

          if (fnError || data?.error) {
            console.error('Background edge function error:', fnError || data?.error);
            return;
          }

          const { data: carrierRecord } = await supabase
            .from('carriers')
            .select('id')
            .eq('code', carrierId)
            .single();

          const dbCarrierId = carrierRecord?.id;
          if (!dbCarrierId) return;

          const now = new Date();
          const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const nextMonth = now.getMonth() === 11
            ? `${now.getFullYear() + 1}-01-01`
            : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`;

          const { data: stats, error: rpcError } = await supabase.rpc('get_carrier_book_stats', {
            p_profile_id: profileId,
            p_carrier_id: dbCarrierId,
            p_month_start: monthStart,
            p_month_end: nextMonth,
          });

          if (rpcError) {
            console.error('Background RPC error:', rpcError);
            return;
          }

          const bookStats = stats as { active_count: number; new_count: number; termed_count: number } | null;

          // Silently update with accurate counts from the DB
          setUploadedCarriers(prev =>
            prev.map(u =>
              u.carrierId === carrierId
                ? {
                    ...u,
                    clientCount: bookStats?.active_count ?? u.clientCount,
                    newClients: bookStats?.new_count ?? u.newClients,
                    termedClients: bookStats?.termed_count ?? 0,
                  }
                : u
            )
          );
        } catch (err) {
          console.error('Background reconciliation error:', err);
        }
      })();
    } catch (err) {
      console.error('Upload processing error:', err);
      setProcessingCarrier(null);
    }
  }, [profile?.id]);

  const handleFileSelect = useCallback(async (carrierId: string, file: File) => {
    setProcessingCarrier(carrierId);
    setMismatchInfo(null);
    setDetectionFailed(null);

    try {
      // Validate file type
      const carrier = CARRIERS.find(c => c.id === carrierId);
      if (carrier && !checkFileTypeMatch(file, carrierId as SupportedCarrier)) {
        setDetectionFailed({
          carrier: carrier.name,
          fileName: file.name,
        });
        setProcessingCarrier(null);
        return;
      }

      // Detect carrier from file
      const result = await detectCarrierFromFile(file);

      if (!result.detected || !result.carrier) {
        // Can't detect - let user confirm
        pendingFileRef.current = { file, carrier: carrierId };
        setDetectionFailed({
          carrier: carrier?.name || carrierId,
          fileName: file.name,
        });
        setProcessingCarrier(null);
        return;
      }

      if (result.carrier !== carrierId) {
        // Mismatch detected
        pendingFileRef.current = { file, carrier: carrierId };
        setMismatchInfo({
          expectedCarrier: carrier?.name || carrierId,
          detectedCarrier: CARRIERS.find(c => c.id === result.carrier)?.name || result.carrier,
          fileName: file.name,
        });
        setProcessingCarrier(null);
        return;
      }

      // File matches - process it
      await processUpload(carrierId, file);
    } catch (err) {
      console.error('File validation error:', err);
      setProcessingCarrier(null);
    }
  }, [processUpload]);

  const confirmMismatchUpload = useCallback(() => {
    if (pendingFileRef.current) {
      const { file, carrier } = pendingFileRef.current;
      processUpload(carrier, file);
      pendingFileRef.current = null;
    }
    setMismatchInfo(null);
  }, [processUpload]);

  const confirmDetectionFailedUpload = useCallback(() => {
    if (pendingFileRef.current) {
      const { file, carrier } = pendingFileRef.current;
      processUpload(carrier, file);
      pendingFileRef.current = null;
    }
    setDetectionFailed(null);
  }, [processUpload]);

  const cancelUpload = useCallback(() => {
    pendingFileRef.current = null;
    setMismatchInfo(null);
    setDetectionFailed(null);
  }, []);

  const replaceUpload = useCallback((carrierId: string) => {
    setUploadedCarriers(prev => prev.filter(u => u.carrierId !== carrierId));
  }, []);

  // ============================================================
  // FILE PARSING
  // ============================================================

  async function parseFileForClientCount(file: File, carrierId?: string): Promise<ParseResult> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      return parseCsvClientCount(file, carrierId);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return parseXlsxClientCount(file, carrierId);
    }

    return { total: 0, new: 0 };
  }

  // Helper function to parse CSV line handling quoted fields
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  async function parseCsvClientCount(file: File, carrierId?: string): Promise<ParseResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
          resolve({ total: 0, new: 0 });
          return;
        }

        // Normalize line endings: \r\n -> \n, \r -> \n
        const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = normalizedText.split('\n').filter(line => line.trim());

        // Find header row
        let headerIndex = -1;
        let headers: string[] = [];

        for (let i = 0; i < Math.min(lines.length, 5); i++) {
          const line = lines[i].toLowerCase();
          // Skip obvious title/report rows
          if (line.includes('list of clients') ||
              line.includes('as of') ||
              line.includes('report date')) {
            continue;
          }

          // This is likely the header row
          headers = parseCSVLine(lines[i]);
          if (headers.length >= 5) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex === -1) {
          const total = lines.length > 1 ? lines.length - 1 : 0;
          resolve({ total, new: 0 });
          return;
        }

        // Get data rows
        const dataLines = lines.slice(headerIndex + 1);

        // Find effective date column - check exact names first, then partial matches
        const lowerHeaders = headers.map(h => h.toLowerCase().trim());

        // Exact column name matches (order matters - most specific first)
        const exactEffDateNames = [
          'coverage effective date',  // Aetna
          'effective date',
          'eff date',
          'start date',
          'effective_date',
          'coverage_effective_date',
          'effectivedate',
          'effdate',
        ];

        let effectiveDateIdx = -1;
        for (const name of exactEffDateNames) {
          const idx = lowerHeaders.indexOf(name);
          if (idx !== -1) {
            effectiveDateIdx = idx;
            break;
          }
        }

        // Fallback: partial match if no exact match found
        if (effectiveDateIdx === -1) {
          effectiveDateIdx = lowerHeaders.findIndex(h =>
            h.includes('effective') || h.includes('eff date')
          );
        }

        // Check if this is an Anthem file (has Market and Status columns)
        const marketIdx = lowerHeaders.indexOf('market');
        const statusIdx = lowerHeaders.indexOf('status');

        // Current month for new client detection (sync month = current month)
        const now = new Date();
        const syncYear = now.getFullYear();
        const syncMonth = now.getMonth(); // 0-indexed: January = 0

        // Debug: log sync target and column detection
        console.log(`[SyncFlow] Sync target: { year: ${syncYear}, month: ${syncMonth}, monthName: "${now.toLocaleString('default', { month: 'long' })}" }`);
        console.log(`[SyncFlow] Carrier: ${carrierId}, Eff Date Column: ${effectiveDateIdx}, Name: "${headers[effectiveDateIdx] || 'NOT FOUND'}"`);

        // Anthem files need filtering: Senior + Active only
        if (marketIdx !== -1 && statusIdx !== -1) {
          let total = 0;
          let newCount = 0;

          for (const line of dataLines) {
            if (!line.trim()) continue;
            const values = parseCSVLine(line);
            const market = values[marketIdx]?.trim() || '';
            const status = values[statusIdx]?.trim() || '';
            if (market === 'Senior' && status === 'Active') {
              total++;
              // Check if this is a new client (effective date in sync month)
              if (effectiveDateIdx !== -1 && values[effectiveDateIdx]) {
                const effDate = parseEffectiveDate(values[effectiveDateIdx]);
                if (effDate) {
                  const isMatch = effDate.getFullYear() === syncYear && effDate.getMonth() === syncMonth;
                  if (isMatch) {
                    console.log(`[SyncFlow] New client - Raw: "${values[effectiveDateIdx]}", Parsed: ${effDate.toLocaleDateString()}`);
                    newCount++;
                  } else if (total <= 3) {
                    // Log first few non-matches for debugging
                    console.log(`[SyncFlow] Not new - Raw: "${values[effectiveDateIdx]}", Parsed: ${effDate.toLocaleDateString()}, Year: ${effDate.getFullYear()}, Month: ${effDate.getMonth()}`);
                  }
                }
              }
            }
          }
          console.log(`[SyncFlow] Anthem result - Total: ${total}, New: ${newCount}`);
          resolve({ total, new: newCount });
          return;
        }

        // For other carriers, count all data rows and check effective dates
        let total = 0;
        let newCount = 0;

        for (const line of dataLines) {
          if (!line.trim()) continue;
          total++;

          if (effectiveDateIdx !== -1) {
            const values = parseCSVLine(line);
            if (values[effectiveDateIdx]) {
              const effDate = parseEffectiveDate(values[effectiveDateIdx]);
              if (effDate) {
                const isMatch = effDate.getFullYear() === syncYear && effDate.getMonth() === syncMonth;
                if (isMatch) {
                  console.log(`[SyncFlow] New client - Raw: "${values[effectiveDateIdx]}", Parsed: ${effDate.toLocaleDateString()}`);
                  newCount++;
                } else if (total <= 3) {
                  // Log first few non-matches for debugging
                  console.log(`[SyncFlow] Not new - Raw: "${values[effectiveDateIdx]}", Parsed: ${effDate.toLocaleDateString()}, Year: ${effDate.getFullYear()}, Month: ${effDate.getMonth()}`);
                }
              }
            }
          }
        }

        console.log(`[SyncFlow] Result - Total: ${total}, New: ${newCount}`);
        resolve({ total, new: newCount });
      };
      reader.onerror = () => resolve({ total: 0, new: 0 });
      reader.readAsText(file);
    });
  }

  async function parseXlsxClientCount(file: File, carrierId?: string): Promise<ParseResult> {
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];

      const total = data.length;
      if (total === 0) return { total: 0, new: 0 };

      // Find effective date column - check exact names first
      const firstRow = data[0];
      const keys = Object.keys(firstRow);
      const lowerKeys = keys.map(k => k.toLowerCase().trim());

      // Exact column name matches (order matters - most specific first)
      const exactEffDateNames = [
        'coverage effective date',  // Aetna
        'effective date',
        'eff date',
        'start date',
        'effective_date',
        'coverage_effective_date',
        'effectivedate',
        'effdate',
      ];

      let effectiveDateKey: string | undefined;
      for (const name of exactEffDateNames) {
        const idx = lowerKeys.indexOf(name);
        if (idx !== -1) {
          effectiveDateKey = keys[idx]; // Use original key (preserves case)
          break;
        }
      }

      // Fallback: partial match if no exact match found
      if (!effectiveDateKey) {
        effectiveDateKey = keys.find(k => {
          const lower = k.toLowerCase();
          return lower.includes('effective') || lower.includes('eff date');
        });
      }

      // Current month for new client detection (sync month = current month)
      const now = new Date();
      const syncYear = now.getFullYear();
      const syncMonth = now.getMonth(); // 0-indexed: January = 0

      // Debug: log sync target and column detection
      console.log(`[SyncFlow XLSX] Sync target: { year: ${syncYear}, month: ${syncMonth}, monthName: "${now.toLocaleString('default', { month: 'long' })}" }`);
      console.log(`[SyncFlow XLSX] Carrier: ${carrierId}, Eff Date Column: "${effectiveDateKey || 'NOT FOUND'}"`);

      if (!effectiveDateKey) {
        return { total, new: 0 };
      }

      let newCount = 0;
      let rowIdx = 0;

      for (const row of data) {
        rowIdx++;
        const effValue = row[effectiveDateKey];
        if (!effValue) continue;

        let effDate: Date | null = null;

        // Handle Excel serial date number
        if (typeof effValue === 'number') {
          effDate = excelDateToJSDate(effValue);
        }
        // Handle string date
        else if (typeof effValue === 'string') {
          effDate = parseEffectiveDate(effValue);
        }
        // Handle Date object (if xlsx parsed it)
        else if (effValue instanceof Date) {
          effDate = effValue;
        }

        if (effDate) {
          const isMatch = effDate.getFullYear() === syncYear && effDate.getMonth() === syncMonth;
          if (isMatch) {
            console.log(`[SyncFlow XLSX] New client - Raw: "${effValue}", Parsed: ${effDate.toLocaleDateString()}`);
            newCount++;
          } else if (rowIdx <= 3) {
            // Log first few non-matches for debugging
            console.log(`[SyncFlow XLSX] Not new - Raw: "${effValue}", Parsed: ${effDate.toLocaleDateString()}, Year: ${effDate.getFullYear()}, Month: ${effDate.getMonth()}`);
          }
        }
      }

      console.log(`[SyncFlow XLSX] Result - Total: ${total}, New: ${newCount}`);
      return { total, new: newCount };
    } catch (err) {
      console.error('[SyncFlow XLSX] Parse error:', err);
      return { total: 0, new: 0 };
    }
  }

  // ============================================================
  // SYNC COMPLETION
  // ============================================================

  const handleCompleteSync = useCallback(async () => {
    if (!profile?.id || uploadedCarriers.length === 0) return;

    setIsSubmitting(true);

    try {
      const totalClients = uploadedCarriers.reduce((sum, u) => sum + u.clientCount, 0);
      const month = getStartOfMonth();

      // 1. Upsert monthly_syncs record
      const { data: sync, error: syncError } = await supabase
        .from('monthly_syncs')
        .upsert({
          profile_id: profile.id,
          month,
          status: 'complete',
          completed_at: new Date().toISOString(),
          total_clients: totalClients,
        }, {
          onConflict: 'profile_id,month',
        })
        .select()
        .single();

      if (syncError) throw syncError;

      // 2. Get carrier IDs from carrier codes
      const { data: carrierRecords } = await supabase
        .from('carriers')
        .select('id, code')
        .in('code', uploadedCarriers.map(u => u.carrierId));

      const carrierCodeToId = new Map(
        carrierRecords?.map(c => [c.code, c.id]) || []
      );

      // 3. Upsert sync_carrier_uploads
      const carrierUploads = uploadedCarriers
        .map(u => ({
          sync_id: sync.id,
          carrier_id: carrierCodeToId.get(u.carrierId),
          client_count: u.clientCount,
          new_clients: u.newClients,
          termed_clients: u.termedClients,
          uploaded_at: new Date().toISOString(),
        }))
        .filter(u => u.carrier_id); // Only include if we found the carrier

      if (carrierUploads.length > 0) {
        const { error: uploadError } = await supabase
          .from('sync_carrier_uploads')
          .upsert(carrierUploads, {
            onConflict: 'sync_id,carrier_id',
          });

        if (uploadError) {
          console.error('Error saving carrier uploads:', uploadError);
        }
      }

      // Recalculate totals from ALL carrier uploads for this sync (not just current session)
      // Per-carrier policy counts are kept in sync_carrier_uploads for carrier breakdown views
      const { data: allUploads } = await supabase
        .from('sync_carrier_uploads')
        .select('client_count, new_clients, termed_clients')
        .eq('sync_id', sync.id);

      const actualNewClients = allUploads?.reduce((sum, u) => sum + (u.new_clients || 0), 0) || 0;
      const actualTermedClients = allUploads?.reduce((sum, u) => sum + (u.termed_clients || 0), 0) || 0;
      const actualNetChange = actualNewClients - actualTermedClients;

      // Count unique active clients (not policies) — a client with 2 carriers counts once
      const { data: activeClientIds } = await supabase
        .from('policies')
        .select('client_id')
        .eq('profile_id', profile.id)
        .eq('status', 'active');
      const uniqueActiveClients = activeClientIds
        ? new Set(activeClientIds.map(p => p.client_id)).size
        : 0;

      // Update monthly_syncs with correct totals
      await supabase
        .from('monthly_syncs')
        .update({
          total_clients: uniqueActiveClients,
          new_clients: actualNewClients,
          termed_clients: actualTermedClients,
          net_change: actualNetChange,
        })
        .eq('id', sync.id);

      setFinalTotal(uniqueActiveClients);
      setFinalNewClients(actualNewClients);

      // Update profile's last_sync_at timestamp
      await supabase
        .from('profiles')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', profile.id);

      // Check and award milestones
      await checkAndAwardMilestones(profile.id, uniqueActiveClients, sync.id);

      // Invalidate dashboard + admin caches so fresh data loads immediately
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agents-book'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-book'] });

      // Clear saved progress on successful completion
      try {
        sessionStorage.removeItem(SYNC_STORAGE_KEY);
      } catch (e) {
        // Ignore storage errors
      }

      setPhase('done');
    } catch (err) {
      console.error('Sync completion error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [profile?.id, uploadedCarriers]);

  // ============================================================
  // RENDER HELPERS
  // ============================================================

  const canFinishUpload = uploadedCarriers.length > 0;
  const totalClients = uploadedCarriers.reduce((sum, u) => sum + u.clientCount, 0);
  const totalNewClients = uploadedCarriers.reduce((sum, u) => sum + u.newClients, 0);
  const totalTermedClients = uploadedCarriers.reduce((sum, u) => sum + u.termedClients, 0);
  const totalNetChange = totalNewClients - totalTermedClients;

  // Get carrier configs for selected carriers (only enabled)
  const selectedCarrierConfigs = getCarriersByIds(selectedCarriers).filter(c => c.enabled);

  // For returning flow: carriers not in last sync that could be added
  // Only show enabled carriers from last sync (disabled ones go to "coming soon")
  const lastSyncCarrierConfigs = getCarriersByIds(preferredCarriers).filter(c => c.enabled);
  // Additional enabled RTS carriers not in last sync
  const additionalRTSCarriers = displayCarriers.filter(
    c => c.enabled && !preferredCarriers.includes(c.id)
  );

  // ============================================================
  // RENDER PHASES
  // ============================================================

  // LOADING
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: GH.pageBg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GH.gold }} />
      </div>
    );
  }

  // SELECT CARRIERS (First sync or new agent)
  if (phase === 'select') {
    return (
      <div className="min-h-screen p-6" style={{ background: GH.pageBg }}>
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="text-sm" style={{ color: GH.textSecondary }}
            >
              Cancel
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(139,105,20,0.1)' }}>
              <Upload className="w-8 h-8" style={{ color: GH.gold }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: GH.textPrimary }}>
              Which carriers do you want to sync?
            </h1>
            <p style={{ color: GH.textSecondary }}>
              Select the carriers you have production reports for
            </p>
          </div>

          {/* Enabled Carriers */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {displayCarriers.map(carrier => (
              <CarrierSelectTile
                key={carrier.id}
                carrier={carrier}
                selected={selectedCarriers.includes(carrier.id)}
                onToggle={() => toggleCarrier(carrier.id)}
              />
            ))}
          </div>

          {/* Coming Soon Carriers (only show if agent has RTS data) */}
          {hasRTSData && comingSoonRTSCarriers.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wide mb-2 mt-6" style={{ color: GH.textMuted }}>
                Coming Soon
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {comingSoonRTSCarriers.map(carrier => (
                  <CarrierComingSoonTile key={carrier.id} carrier={carrier} />
                ))}
              </div>
            </>
          )}

          {/* Note for new agents without RTS */}
          {!hasRTSData && (
            <p className="text-center text-sm mb-6" style={{ color: GH.textMuted }}>
              More carriers will appear once your certifications are processed
            </p>
          )}

          {/* Continue Button */}
          <button
            onClick={() => setPhase('upload')}
            disabled={selectedCarriers.length === 0}
            className="w-full py-4 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 hover:brightness-110 disabled:cursor-not-allowed"
            style={{ background: selectedCarriers.length === 0 ? 'rgba(60,48,28,0.15)' : GH.goldGrad, boxShadow: selectedCarriers.length > 0 ? '0 2px 8px rgba(139,105,20,0.2)' : 'none' }}
          >
            Continue with {selectedCarriers.length} {selectedCarriers.length === 1 ? 'carrier' : 'carriers'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // CONFIRM (Returning user)
  if (phase === 'confirm') {
    return (
      <div className="min-h-screen p-6" style={{ background: GH.pageBg }}>
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="text-sm" style={{ color: GH.textSecondary }}
            >
              Cancel
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(139,105,20,0.1)' }}>
              <RotateCcw className="w-8 h-8" style={{ color: GH.gold }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: GH.textPrimary }}>
              Sync your usual carriers?
            </h1>
            <p style={{ color: GH.textSecondary }}>
              Upload new reports for the same carriers as last time
            </p>
          </div>

          {/* Last Sync Summary */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: GH.glass, backdropFilter: `blur(${GH.glassBlur})`, WebkitBackdropFilter: `blur(${GH.glassBlur})`, border: `1px solid ${GH.glassBorder}`, boxShadow: GH.glassShadow }}>
            <div className="flex items-center gap-2 text-sm mb-4" style={{ color: GH.textSecondary }}>
              <Clock className="w-4 h-4" />
              Last synced {formatDate(lastSyncDate)}
            </div>

            <div className="flex flex-wrap gap-2">
              {lastSyncCarrierConfigs.map(carrier => (
                <div
                  key={carrier.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: `${carrier.color}15` }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: carrier.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: GH.textPrimary }}>{carrier.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Action */}
          <button
            onClick={() => setPhase('upload')}
            className="w-full py-4 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 mb-3 hover:brightness-110"
            style={{ background: GH.goldGrad, boxShadow: '0 2px 8px rgba(139,105,20,0.2)' }}
          >
            Sync These {lastSyncCarrierConfigs.length} Carriers
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Add More - only show if there are more RTS carriers */}
          {(additionalRTSCarriers.length > 0 || comingSoonRTSCarriers.length > 0) && (
            <button
              onClick={() => setPhase('addMore')}
              className="w-full py-4 border-2 font-medium rounded-2xl transition-all flex items-center justify-center gap-2"
              style={{ borderColor: GH.border, color: GH.textPrimary }}
              onMouseEnter={e => { e.currentTarget.style.background = GH.tileHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Plus className="w-5 h-5" />
              Add More Carriers
            </button>
          )}

        </div>
      </div>
    );
  }

  // ADD MORE CARRIERS
  if (phase === 'addMore') {
    return (
      <div className="min-h-screen p-6" style={{ background: GH.pageBg }}>
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setPhase('confirm')}
              className="flex items-center gap-1" style={{ color: GH.textSecondary }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <h1 className="text-xl font-bold mb-2" style={{ color: GH.textPrimary }}>Add more carriers</h1>
          <p className="mb-6" style={{ color: GH.textSecondary }}>Select additional carriers to sync this month</p>

          {/* Already Selected (from last sync) */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: GH.textMuted }}>Your usual carriers</p>
            <div className="flex flex-wrap gap-2">
              {lastSyncCarrierConfigs.map(carrier => (
                <div
                  key={carrier.id}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{carrier.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional RTS Carriers */}
          {additionalRTSCarriers.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: GH.textMuted }}>Also sync</p>
              <div className="grid grid-cols-2 gap-3">
                {additionalRTSCarriers.map(carrier => (
                  <CarrierSelectTile
                    key={carrier.id}
                    carrier={carrier}
                    selected={selectedCarriers.includes(carrier.id)}
                    onToggle={() => toggleCarrier(carrier.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Coming Soon */}
          {comingSoonRTSCarriers.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: GH.textMuted }}>Coming soon</p>
              <div className="grid grid-cols-2 gap-3">
                {comingSoonRTSCarriers.map(carrier => (
                  <CarrierComingSoonTile key={carrier.id} carrier={carrier} compact />
                ))}
              </div>
            </div>
          )}

          {/* Continue */}
          <button
            onClick={() => {
              // Merge enabled preferred carriers with newly selected
              const enabledPreferred = preferredCarriers.filter(id =>
                CARRIERS.find(c => c.id === id)?.enabled
              );
              setSelectedCarriers(prev => [...new Set([...enabledPreferred, ...prev])]);
              setPhase('upload');
            }}
            className="w-full py-4 text-white font-semibold rounded-2xl transition-all hover:brightness-110"
            style={{ background: GH.goldGrad, boxShadow: '0 2px 8px rgba(139,105,20,0.2)' }}
          >
            Continue with {lastSyncCarrierConfigs.length + selectedCarriers.filter(id => !preferredCarriers.includes(id)).length} carriers
          </button>
        </div>
      </div>
    );
  }

  // UPLOAD PHASE
  if (phase === 'upload') {
    return (
      <div className="min-h-screen p-6" style={{ background: GH.pageBg }}>
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setPhase(isFirstSync ? 'select' : 'confirm')}
              className="flex items-center gap-1" style={{ color: GH.textSecondary }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-sm" style={{ color: GH.textSecondary }}>
              {uploadedCarriers.length} of {selectedCarriers.length}
            </span>
          </div>

          <h1 className="text-xl font-bold mb-1" style={{ color: GH.textPrimary }}>
            Upload {getCurrentMonth()} reports
          </h1>
          <p className="mb-6" style={{ color: GH.textSecondary }}>Drop in your production files</p>

          {/* Upload List */}
          <div className="space-y-3 mb-6">
            {selectedCarrierConfigs.map(carrier => {
              const uploaded = uploadedCarriers.find(u => u.carrierId === carrier.id);
              const isProcessing = processingCarrier === carrier.id;

              return (
                <CarrierUploadRow
                  key={carrier.id}
                  carrier={carrier}
                  uploaded={uploaded}
                  isProcessing={isProcessing}
                  onFileSelect={(file) => handleFileSelect(carrier.id, file)}
                  onReplace={() => replaceUpload(carrier.id)}
                />
              );
            })}
          </div>

          {/* Finish Button */}
          <button
            onClick={handleCompleteSync}
            disabled={!canFinishUpload || isSubmitting}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
            style={(!canFinishUpload || isSubmitting) ? { background: 'rgba(60,48,28,0.15)' } : undefined}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Syncing...
              </>
            ) : (
              'Complete Sync'
            )}
          </button>
        </div>

        {/* Mismatch Dialog */}
        {mismatchInfo && (
          <MismatchDialog
            expected={mismatchInfo.expectedCarrier}
            detected={mismatchInfo.detectedCarrier}
            fileName={mismatchInfo.fileName}
            onConfirm={confirmMismatchUpload}
            onCancel={cancelUpload}
          />
        )}

        {/* Detection Failed Dialog */}
        {detectionFailed && (
          <DetectionFailedDialog
            carrierName={detectionFailed.carrier}
            fileName={detectionFailed.fileName}
            onConfirm={confirmDetectionFailedUpload}
            onCancel={cancelUpload}
          />
        )}
      </div>
    );
  }

  // DONE PHASE
  if (phase === 'done') {
    const nextSyncFormatted = getNextSyncDate();

    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: GH.pageBg }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: GH.textPrimary }}>
            {getCurrentMonth()} synced!
          </h1>
          <p className="text-xl mb-2" style={{ color: GH.textSecondary }}>{finalTotal.toLocaleString()} active clients</p>
          {(totalNewClients > 0 || totalTermedClients > 0) && (
            <div className="flex items-center justify-center gap-3 mb-2">
              {totalNewClients > 0 && (
                <span className="text-emerald-600 font-medium">+{totalNewClients} new</span>
              )}
              {totalTermedClients > 0 && (
                <span className="text-amber-500 font-medium">-{totalTermedClients} termed</span>
              )}
              {totalNewClients > 0 || totalTermedClients > 0 ? (
                <span className="font-semibold" style={{ color: totalNetChange > 0 ? '#059669' : totalNetChange < 0 ? '#d97706' : GH.textSecondary }}>
                  (net {totalNetChange > 0 ? '+' : ''}{totalNetChange})
                </span>
              ) : null}
            </div>
          )}
          <p className="mb-8" style={{ color: GH.textMuted }}>from {uploadedCarriers.length} carriers</p>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-2xl transition-all hover:brightness-110"
            style={{ background: GH.goldGrad, boxShadow: '0 2px 8px rgba(139,105,20,0.2)' }}
          >
            Go to Dashboard <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-sm mt-6" style={{ color: GH.textMuted }}>
            We'll remind you to sync again around {nextSyncFormatted}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface CarrierSelectTileProps {
  carrier: CarrierConfig;
  selected: boolean;
  onToggle: () => void;
  compact?: boolean;
}

function CarrierSelectTile({ carrier, selected, onToggle, compact }: CarrierSelectTileProps) {
  return (
    <button
      onClick={onToggle}
      className="relative p-4 rounded-2xl border-2 transition-all text-left"
      style={selected
        ? { borderColor: GH.gold, background: 'rgba(139,105,20,0.06)' }
        : { borderColor: GH.border, background: GH.glass }
      }
    >
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: GH.goldGrad }}>
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center mb-2`}
        style={{ backgroundColor: `${carrier.color}20` }}
      >
        <Building2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: carrier.color }} />
      </div>
      <p className={`font-medium ${compact ? 'text-sm' : ''}`} style={{ color: GH.textPrimary }}>{carrier.name}</p>
    </button>
  );
}

interface CarrierComingSoonTileProps {
  carrier: CarrierConfig;
  compact?: boolean;
}

function CarrierComingSoonTile({ carrier, compact }: CarrierComingSoonTileProps) {
  return (
    <div className="relative p-4 rounded-2xl border-2 opacity-60 cursor-not-allowed" style={{ borderColor: GH.border, background: GH.tileBg }}>
      <div className="absolute top-3 right-3">
        <Lock className="w-4 h-4" style={{ color: GH.textMuted }} />
      </div>
      <div
        className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center mb-2`}
        style={{ backgroundColor: `${carrier.color}15` }}
      >
        <Building2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: carrier.color }} />
      </div>
      <p className={`font-medium ${compact ? 'text-sm' : ''}`} style={{ color: GH.textSecondary }}>{carrier.name}</p>
      {!compact && <p className="text-xs" style={{ color: GH.textMuted }}>Coming soon</p>}
    </div>
  );
}

interface CarrierUploadRowProps {
  carrier: CarrierConfig;
  uploaded?: UploadedCarrier;
  isProcessing: boolean;
  onFileSelect: (file: File) => void;
  onReplace: () => void;
}

function CarrierUploadRow({ carrier, uploaded, isProcessing, onFileSelect, onReplace }: CarrierUploadRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    onFileSelect(file);
    setExpanded(false);
    // Reset input so same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Already uploaded state
  if (uploaded) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium" style={{ color: GH.textPrimary }}>{carrier.name}</p>
            <p className="text-sm text-emerald-600">{uploaded.clientCount.toLocaleString()} active clients</p>
            {(uploaded.newClients > 0 || uploaded.termedClients > 0) && (
              <p className="text-xs" style={{ color: GH.textSecondary }}>
                {uploaded.newClients > 0 && <span className="text-emerald-500">+{uploaded.newClients} new</span>}
                {uploaded.newClients > 0 && uploaded.termedClients > 0 && ' · '}
                {uploaded.termedClients > 0 && <span className="text-amber-500">-{uploaded.termedClients} termed</span>}
              </p>
            )}
          </div>
          <button
            onClick={onReplace}
            className="text-sm" style={{ color: GH.textSecondary }}
          >
            Replace
          </button>
        </div>
      </div>
    );
  }

  // Not uploaded - show expandable upload box
  return (
    <div className="rounded-2xl p-4" style={{ background: GH.glass, backdropFilter: `blur(${GH.glassBlur})`, WebkitBackdropFilter: `blur(${GH.glassBlur})`, border: `1px solid ${GH.glassBorder}`, boxShadow: GH.glassShadow }}>
      {/* Header row - always visible */}
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${carrier.color}20` }}
        >
          <Building2 className="w-5 h-5" style={{ color: carrier.color }} />
        </div>
        <div className="flex-1">
          <p className="font-medium" style={{ color: GH.textPrimary }}>{carrier.name}</p>
          <a
            href={carrier.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline flex items-center gap-1" style={{ color: GH.gold }}
          >
            Open portal <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: GH.gold }} />
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-all"
            style={expanded
              ? { background: GH.tileBg, color: GH.textSecondary }
              : { background: GH.goldGrad, color: 'white', boxShadow: '0 2px 8px rgba(139,105,20,0.2)' }
            }
          >
            {expanded ? 'Cancel' : 'Upload'}
          </button>
        )}
      </div>

      {/* Expandable drop zone */}
      {expanded && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
          style={dragOver
            ? { borderColor: GH.gold, background: 'rgba(139,105,20,0.06)' }
            : { borderColor: GH.textMuted }
          }
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: GH.textMuted }} />
          <p className="text-sm font-medium" style={{ color: GH.textPrimary }}>
            Drop your {carrier.name} report here
          </p>
          <p className="text-xs mt-1" style={{ color: GH.textSecondary }}>
            or click to browse (.csv, .xlsx)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

interface MismatchDialogProps {
  expected: string;
  detected: string;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function MismatchDialog({ expected, detected, fileName, onConfirm, onCancel }: MismatchDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: GH.textPrimary }}>Carrier mismatch</h3>
            <p className="text-sm" style={{ color: GH.textSecondary }}>{fileName}</p>
          </div>
        </div>

        <p className="mb-6" style={{ color: GH.textSecondary }}>
          This file looks like it's from <strong>{detected}</strong>, but you're uploading to <strong>{expected}</strong>. Upload anyway?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 font-medium rounded-xl transition-colors"
            style={{ border: `1px solid ${GH.border}`, color: GH.textPrimary }}
            onMouseEnter={e => { e.currentTarget.style.background = GH.tileHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-white font-medium rounded-xl transition-all hover:brightness-110"
            style={{ background: GH.goldGrad, boxShadow: '0 2px 8px rgba(139,105,20,0.2)' }}
          >
            Upload Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

interface DetectionFailedDialogProps {
  carrierName: string;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DetectionFailedDialog({ carrierName, fileName, onConfirm, onCancel }: DetectionFailedDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: GH.tileBg }}>
            <AlertTriangle className="w-6 h-6" style={{ color: GH.textSecondary }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: GH.textPrimary }}>Couldn't detect carrier</h3>
            <p className="text-sm" style={{ color: GH.textSecondary }}>{fileName}</p>
          </div>
        </div>

        <p className="mb-6" style={{ color: GH.textSecondary }}>
          We couldn't automatically detect the carrier from this file. Is this a <strong>{carrierName}</strong> production report?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 font-medium rounded-xl transition-colors"
            style={{ border: `1px solid ${GH.border}`, color: GH.textPrimary }}
            onMouseEnter={e => { e.currentTarget.style.background = GH.tileHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            No, cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-white font-medium rounded-xl transition-all hover:brightness-110"
            style={{ background: GH.goldGrad, boxShadow: '0 2px 8px rgba(139,105,20,0.2)' }}
          >
            Yes, upload
          </button>
        </div>
      </div>
    </div>
  );
}
