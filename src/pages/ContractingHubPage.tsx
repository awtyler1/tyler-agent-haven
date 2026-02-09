import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle2,
  FileText,
  Building2,
  Loader2,
  ExternalLink,
  Download,
  Upload,
  Circle,
  Lock,
  ChevronDown,
  AlertTriangle,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProfile, Profile } from '@/hooks/useProfile';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { carriers as carriersData } from '@/data/carriersData';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { PageLoader } from '@/components/ui/PageLoader';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GH } from '@/config/golden-hour';

// Short product labels
const PRODUCT_SHORT: Record<string, string> = {
  MA: 'MA',
  MAPD: 'MAPD',
  PDP: 'PDP',
  MEDIGAP: 'Medigap',
  ALL_ANCILLARY: 'Ancillary',
};

// Get portal URL from carriersData
function getPortalUrl(carrierName: string): string | undefined {
  const carrier = carriersData.find(c =>
    c.name.toLowerCase() === carrierName.toLowerCase() ||
    c.id.toLowerCase() === carrierName.toLowerCase()
  );
  if (!carrier) return undefined;

  const stateData = carrier.stateData['Kentucky'] || Object.values(carrier.stateData).find(s => s.links?.length > 0);
  if (!stateData?.links) return undefined;

  const portalLink = stateData.links.find(l =>
    l.name.toLowerCase().includes('portal') ||
    l.name.toLowerCase().includes('vantage') ||
    l.name.toLowerCase() === 'agent portal' ||
    l.name.toLowerCase() === 'broker portal'
  );

  return portalLink?.url;
}

// Get certification guide URL from carriersData
function getCertGuideUrl(carrierName: string): string | undefined {
  const carrier = carriersData.find(c =>
    c.name.toLowerCase() === carrierName.toLowerCase() ||
    c.id.toLowerCase() === carrierName.toLowerCase()
  );
  if (!carrier) return undefined;

  const stateData = carrier.stateData['Kentucky'] || Object.values(carrier.stateData).find(s => s.links?.length > 0);
  if (!stateData?.links) return undefined;

  const certLink = stateData.links.find(l =>
    l.name.toLowerCase().includes('certification') ||
    l.name.toLowerCase().includes('training') ||
    l.name.toLowerCase().includes('certify')
  );

  return certLink?.url;
}

// Carrier status row type
interface CarrierRow {
  carrierName: string;
  products: string[];
  contractingStatus: 'rts' | 'in_progress' | 'not_started';
  hasCertForYear: boolean;
  hasCertFor2026: boolean;
  hasCertFor2027: boolean;
  portalUrl?: string;
  certGuideUrl?: string;
}

const ContractingHubPage = () => {
  const { profile, refetch: refetchProfile } = useProfile();
  const { homePath } = useNavigationContext();

  // AHIP upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resources dropdown state
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);

  // Carrier data state
  const [certifications, setCertifications] = useState<Array<{
    carrier_name: string;
    product_type: string;
    certification_year: number;
  }>>([]);
  const [carrierStatuses, setCarrierStatuses] = useState<Array<{
    carrier_name: string;
    contracting_status: string;
    carrier_id: string;
    created_at: string;
  }>>([]);
  const [ahipStatus, setAhipStatus] = useState<{ year: number; status: string } | null>(null);
  const [carrierNameMap, setCarrierNameMap] = useState<Record<string, string>>({});
  const [nameMapReady, setNameMapReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [licenseData, setLicenseData] = useState<{
    residentState: string | null;
    nonResidentStates: string[];
  }>({ residentState: null, nonResidentStates: [] });

  // Close resources dropdown when clicking outside or pressing ESC
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    }
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setResourcesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Fetch carrier name map
  useEffect(() => {
    async function fetchCarrierNameMap() {
      const { data: allCarriers } = await supabase
        .from('carriers')
        .select('name, rts_aliases');

      const nameMap: Record<string, string> = {};
      for (const carrier of allCarriers || []) {
        nameMap[carrier.name.toLowerCase()] = carrier.name;
        for (const alias of (carrier.rts_aliases as string[]) || []) {
          nameMap[alias.toLowerCase()] = carrier.name;
        }
      }
      setCarrierNameMap(nameMap);
      setNameMapReady(true);
    }

    fetchCarrierNameMap();
  }, []);

  // Fetch user-specific data
  useEffect(() => {
    async function fetchData() {
      if (!profile?.user_id || !profile?.id || !nameMapReady) return;

      setDataLoading(true);
      try {
        // Fetch carrier certifications
        const { data: certs } = await supabase
          .from('agent_certifications')
          .select('carrier_name, product_type, certification_year')
          .eq('profile_id', profile.id);

        // Fetch AHIP status
        const { data: ahipData } = await supabase
          .from('ahip_certifications')
          .select('certification_year, status')
          .eq('user_id', profile.user_id)
          .eq('status', 'completed')
          .order('certification_year', { ascending: false })
          .limit(1);

        if (ahipData && ahipData.length > 0) {
          setAhipStatus({ year: ahipData[0].certification_year, status: ahipData[0].status });
        }

        // Fetch carrier statuses
        const { data: statuses } = await supabase
          .from('carrier_statuses')
          .select('contracting_status, carrier_id, created_at')
          .eq('user_id', profile.user_id);

        let carrierNames: Record<string, string> = {};
        if (statuses && statuses.length > 0) {
          const carrierIds = statuses.map(s => s.carrier_id);
          const { data: carriers } = await supabase
            .from('carriers')
            .select('id, name')
            .in('id', carrierIds);

          carrierNames = (carriers || []).reduce((acc, c) => {
            acc[c.id] = c.name;
            return acc;
          }, {} as Record<string, string>);
        }

        // Fetch license data from contracting application
        const { data: appData } = await supabase
          .from('contracting_applications')
          .select('resident_state, non_resident_states')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        setCertifications(certs || []);
        setCarrierStatuses(
          (statuses || []).map(s => ({
            carrier_name: carrierNames[s.carrier_id] || 'Unknown Carrier',
            contracting_status: s.contracting_status,
            carrier_id: s.carrier_id,
            created_at: s.created_at,
          }))
        );
        setLicenseData({
          residentState: appData?.resident_state || null,
          nonResidentStates: appData?.non_resident_states || [],
        });
      } catch (err) {
        console.error('Failed to fetch carrier data:', err);
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
  }, [profile?.user_id, profile?.id, nameMapReady]);

  // Normalize carrier name using alias map
  const normalizeCarrierName = (name: string): string => {
    return carrierNameMap[name.toLowerCase()] || name;
  };

  // Derive current certification year
  const currentCertYear = useMemo(() => {
    const maxYear = Math.max(
      ...certifications.filter(c => c.certification_year > 0).map(c => c.certification_year),
      0
    );
    return maxYear > 0 ? maxYear : new Date().getFullYear();
  }, [certifications]);

  // AHIP complete logic
  const ahipComplete = useMemo(() => {
    if (profile?.ahip_cert_year === currentCertYear && profile?.ahip_cert_file_path) {
      return true;
    }
    if (ahipStatus && ahipStatus.year === currentCertYear && ahipStatus.status === 'completed') {
      return true;
    }
    return certifications.some(c => c.certification_year === currentCertYear);
  }, [certifications, currentCertYear, ahipStatus, profile?.ahip_cert_year, profile?.ahip_cert_file_path]);

  // AHIP upload handler
  const handleAHIPUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/ahip_${currentCertYear}.${fileExt}`;
      const filePath = `ahip-certificates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agent-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ahip_cert_year: currentCertYear,
          ahip_cert_uploaded_at: new Date().toISOString(),
          ahip_cert_file_path: filePath,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('AHIP certificate uploaded successfully');
      refetchProfile();

    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload certificate');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Build unified carrier rows
  const carrierRows = useMemo(() => {
    const carriers: Record<string, CarrierRow> = {};

    // First, add all carriers from certifications
    for (const cert of certifications) {
      if (cert.certification_year === 0) continue;

      const name = normalizeCarrierName(cert.carrier_name);
      const productLabel = PRODUCT_SHORT[cert.product_type] || cert.product_type;

      if (!carriers[name]) {
        carriers[name] = {
          carrierName: name,
          products: [],
          contractingStatus: 'not_started',
          hasCertForYear: false,
          hasCertFor2026: false,
          hasCertFor2027: false,
          portalUrl: getPortalUrl(name),
          certGuideUrl: getCertGuideUrl(name),
        };
      }

      if (!carriers[name].products.includes(productLabel)) {
        carriers[name].products.push(productLabel);
      }

      if (cert.certification_year === currentCertYear) {
        carriers[name].hasCertForYear = true;
      }
      if (cert.certification_year === 2026) {
        carriers[name].hasCertFor2026 = true;
      }
      if (cert.certification_year === 2027) {
        carriers[name].hasCertFor2027 = true;
      }
    }

    // Add contracting status from carrier_statuses
    for (const status of carrierStatuses) {
      const name = normalizeCarrierName(status.carrier_name);

      if (!carriers[name]) {
        carriers[name] = {
          carrierName: name,
          products: [],
          contractingStatus: 'not_started',
          hasCertForYear: false,
          hasCertFor2026: false,
          hasCertFor2027: false,
          portalUrl: getPortalUrl(name),
          certGuideUrl: getCertGuideUrl(name),
        };
      }

      if (status.contracting_status === 'rts' || status.contracting_status === 'contracted' || status.contracting_status === 'approved') {
        carriers[name].contractingStatus = 'rts';
      } else if (status.contracting_status === 'in_progress') {
        carriers[name].contractingStatus = 'in_progress';
      }
    }

    // Sort: Needs action first, ready to sell last
    return Object.values(carriers).sort((a, b) => {
      const getOrder = (row: CarrierRow) => {
        if (row.contractingStatus === 'rts' && !row.hasCertForYear) return 0;
        if (row.contractingStatus === 'in_progress') return 1;
        if (row.contractingStatus === 'not_started') return 2;
        if (row.contractingStatus === 'rts' && row.hasCertForYear) return 3;
        return 4;
      };
      const orderDiff = getOrder(a) - getOrder(b);
      if (orderDiff !== 0) return orderDiff;
      return a.carrierName.localeCompare(b.carrierName);
    });
  }, [certifications, carrierStatuses, currentCertYear, carrierNameMap]);

  // Summary counts
  const readyCount = carrierRows.filter(r => r.contractingStatus === 'rts' && r.hasCertForYear).length;
  const needCertCount = carrierRows.filter(r => r.contractingStatus === 'rts' && !r.hasCertForYear).length;
  const pendingCount = carrierRows.filter(r => r.contractingStatus === 'in_progress').length;

  const loading = dataLoading;

  if (loading) {
    return <PageLoader message="Loading your contracting data..." />;
  }

  const hasUpload = profile?.ahip_cert_year === currentCertYear && profile?.ahip_cert_file_path;

  return (
    <div className="min-h-screen flex flex-col grain-overlay" style={{ background: GH.pageBg }}>
      {/* Atmospheric blurs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between pt-6 pb-4 px-4 sm:px-6 max-w-[1100px] mx-auto w-full">
        <Link to={homePath} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <UserAvatarDropdown />
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-6">
        <div className="max-w-[1100px] mx-auto">
          {/* Title */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold" style={{ fontFamily: GH.serif, color: GH.textPrimary }}>
              Contracting Hub
            </h1>
          </div>

          {/* Progress Card */}
          <GlassPanel style={{ padding: '12px 16px', marginBottom: 16 }}>
            <div className="flex items-center justify-between gap-6">
              {/* Progress Section - ~50% */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold" style={{ color: GH.textPrimary }}>{readyCount}</span>
                  <span className="text-sm" style={{ color: GH.textSecondary }}>of {carrierRows.length} Ready to Sell</span>
                </div>
                <div className="rounded-full overflow-hidden mb-1" style={{ height: 4, background: GH.tileBg }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${carrierRows.length > 0 ? (readyCount / carrierRows.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }}
                  />
                </div>
                <div className="flex gap-3 text-xs">
                  {needCertCount > 0 && (
                    <span className="text-amber-600">{needCertCount} need cert</span>
                  )}
                  {pendingCount > 0 && (
                    <span className="text-blue-600">{pendingCount} pending</span>
                  )}
                  {needCertCount === 0 && pendingCount === 0 && readyCount === carrierRows.length && carrierRows.length > 0 && (
                    <span className="text-green-600">All ready!</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-12" style={{ background: GH.border }} />

              {/* AHIP Section - ~30% */}
              <div className="flex-shrink-0">
                {ahipComplete ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium" style={{ color: GH.textPrimary }}>AHIP {currentCertYear}</span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-xs hover:text-blue-600 mt-0.5"
                      style={{ color: GH.textSecondary }}
                    >
                      {uploading ? 'Uploading...' : hasUpload ? 'Replace certificate' : 'Upload certificate'}
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-2 -my-1" style={{ background: 'linear-gradient(135deg, rgba(184,134,11,0.06), rgba(212,160,23,0.03))', borderRadius: 16, border: '1px solid rgba(184,134,11,0.1)' }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-900">AHIP {currentCertYear} Required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="https://www.ahipmedicaretraining.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white transition-colors"
                        style={{ background: GH.goldGrad, borderRadius: 10 }}
                      >
                        Start AHIP
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                        style={{ border: '1px solid rgba(184,134,11,0.15)', borderRadius: 10 }}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3 w-3" />
                            Upload
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-12" style={{ background: GH.border }} />

              {/* Resources Dropdown - ~20% */}
              <div className="relative flex-shrink-0" ref={resourcesRef}>
                <button
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: GH.textSecondary }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = GH.textPrimary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = GH.textSecondary; }}
                >
                  <FileText className="h-4 w-4" />
                  <span>Resources</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
                </button>

                {resourcesOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 py-1 z-50" style={{ background: GH.glass, backdropFilter: `blur(${GH.glassBlur})`, WebkitBackdropFilter: `blur(${GH.glassBlur})`, border: `1px solid ${GH.glassBorder}`, borderRadius: 18, boxShadow: '0 8px 24px rgba(60,48,28,0.08)' }}>
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
                      style={{ color: GH.textPrimary }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = GH.tileHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>2026 Recertification Guide</span>
                      <Download className="h-4 w-4" style={{ color: GH.textMuted }} />
                    </button>
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
                      style={{ color: GH.textPrimary }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = GH.tileHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>Carrier Portal Logins</span>
                      <Download className="h-4 w-4" style={{ color: GH.textMuted }} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>

          {/* License Bar */}
          {(licenseData.residentState || licenseData.nonResidentStates.length > 0) && (
            <GlassPanel style={{ padding: '8px 16px', marginBottom: 16 }} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm" style={{ color: GH.textSecondary }}>
                <MapPin className="h-4 w-4" style={{ color: GH.textMuted }} />
                <span>
                  <span style={{ color: GH.textSecondary }}>Licensed:</span>{' '}
                  {licenseData.residentState && (
                    <span className="font-medium" style={{ color: GH.textPrimary }}>
                      {licenseData.residentState}
                      <span className="font-normal" style={{ color: GH.textSecondary }}> (Resident)</span>
                    </span>
                  )}
                  {licenseData.nonResidentStates.length > 0 && (
                    <>
                      {licenseData.residentState && <span className="mx-1.5" style={{ color: GH.border }}>•</span>}
                      <span style={{ color: GH.textPrimary }}>
                        {licenseData.nonResidentStates.join(' • ')}
                      </span>
                    </>
                  )}
                </span>
              </div>
              <a
                href="mailto:caroline@tylerinsurancegroup.com?subject=License%20Request"
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + Request License
              </a>
            </GlassPanel>
          )}

          {/* Hidden file input for AHIP upload */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleAHIPUpload}
          />

          {/* Carrier Table */}
          <GlassPanel padding={0} style={{ overflow: 'hidden' }}>
            {!ahipComplete ? (
              <div className="px-5 py-12 text-center">
                <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: GH.textFaint }} />
                <p className="text-sm" style={{ color: GH.textSecondary }}>Complete AHIP first to view carrier status</p>
              </div>
            ) : carrierRows.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: GH.textFaint }} />
                <p className="text-sm" style={{ color: GH.textSecondary }}>No carriers found. Contact your manager to get started.</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ borderBottom: `1px solid ${GH.border}` }}>
                      <th className="text-left uppercase px-4 py-3 w-[280px]" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted, background: GH.glass }}>Carrier</th>
                      <th className="text-left uppercase px-4 py-3" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted, background: GH.glass }}>Products</th>
                      <th className="text-center uppercase px-2 py-3 w-[100px]" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted, background: GH.glass }}>Contracted</th>
                      <th className="text-center uppercase px-2 py-3 w-[80px]" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted, background: GH.glass }}>2026</th>
                      <th className="text-center uppercase px-2 py-3 w-[80px]" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted, background: GH.glass }}>2027</th>
                      <th className="text-center uppercase px-4 py-3 w-[140px]" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted, background: GH.glass }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierRows.map((row, idx) => (
                      <tr
                        key={row.carrierName}
                        className="transition-colors"
                        style={{ borderTop: idx > 0 ? `1px solid ${GH.border}` : 'none' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = GH.tileHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="px-4 py-3 w-[280px]">
                          <span className="font-medium" style={{ color: GH.textPrimary }}>{row.carrierName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm" style={{ color: GH.textSecondary }}>{row.products.join(', ') || '—'}</span>
                        </td>
                        <td className="px-2 py-3 text-center w-[100px]">
                          {row.contractingStatus === 'rts' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : row.contractingStatus === 'in_progress' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Pending
                            </span>
                          ) : (
                            <Circle className="h-4 w-4 mx-auto" style={{ color: GH.textFaint }} />
                          )}
                        </td>
                        <td className="px-2 py-3 text-center w-[80px]">
                          {row.hasCertFor2026 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <Circle className="h-4 w-4 mx-auto" style={{ color: GH.textFaint }} />
                          )}
                        </td>
                        <td className="px-2 py-3 text-center w-[80px]">
                          {row.hasCertFor2027 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-xs" style={{ color: GH.textMuted }}>Coming</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center w-[140px]">
                          {row.contractingStatus === 'rts' && row.hasCertForYear ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : row.contractingStatus === 'rts' && !row.hasCertForYear ? (
                            <a
                              href={row.certGuideUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Certification Guide
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : row.contractingStatus === 'in_progress' ? (
                            <span className="text-sm text-blue-600">Awaiting approval</span>
                          ) : (
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                              Request Contracting
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassPanel>
        </div>
      </main>

    </div>
  );
};

export default ContractingHubPage;
