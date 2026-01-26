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

  // Close resources dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#5c5552]" />
          <p className="text-sm text-[#5c5552]">Loading your contracting data...</p>
        </div>
      </div>
    );
  }

  const hasUpload = profile?.ahip_cert_year === currentCertYear && profile?.ahip_cert_file_path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-[#292524]">TIG</span>
            </Link>
            <span className="text-[#e8e4dd]">|</span>
            <span className="text-sm text-[#5c5552]">Agent Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#5c5552] hidden sm:block">{profile?.full_name || 'Agent'}</span>
            <UserAvatarDropdown />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          {/* Back link + Title */}
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-serif font-semibold text-[#292524]">
              Contracting Hub
            </h1>
          </div>

          {/* Progress Card */}
          <div className="bg-white border border-[#e8e4dd] rounded-xl py-3 px-4 mb-4">
            <div className="flex items-center justify-between gap-6">
              {/* Progress Section - ~50% */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-[#292524]">{readyCount}</span>
                  <span className="text-sm text-[#5c5552]">of {carrierRows.length} Ready to Sell</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${carrierRows.length > 0 ? (readyCount / carrierRows.length) * 100 : 0}%` }}
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
                    <span className="text-emerald-600">All ready!</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-12 bg-[#e8e4dd]" />

              {/* AHIP Section - ~30% */}
              <div className="flex-shrink-0">
                {ahipComplete ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-[#292524]">AHIP {currentCertYear}</span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-xs text-[#5c5552] hover:text-blue-600 mt-0.5"
                    >
                      {uploading ? 'Uploading...' : hasUpload ? 'Replace certificate' : 'Upload certificate'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -my-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-900">AHIP {currentCertYear} Required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="https://www.ahipmedicaretraining.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                      >
                        Start AHIP
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-amber-300 text-amber-700 rounded hover:bg-amber-100 transition-colors"
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
              <div className="w-px h-12 bg-[#e8e4dd]" />

              {/* Resources Dropdown - ~20% */}
              <div className="relative flex-shrink-0" ref={resourcesRef}>
                <button
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  className="flex items-center gap-1.5 text-sm text-[#5c5552] hover:text-[#292524] transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Resources</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
                </button>

                {resourcesOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#e8e4dd] rounded-lg shadow-lg py-1 z-50">
                    <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#292524] hover:bg-stone-50 transition-colors">
                      <span>2026 Recertification Guide</span>
                      <Download className="h-4 w-4 text-[#5c5552]" />
                    </button>
                    <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#292524] hover:bg-stone-50 transition-colors">
                      <span>Carrier Portal Logins</span>
                      <Download className="h-4 w-4 text-[#5c5552]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* License Bar */}
          {(licenseData.residentState || licenseData.nonResidentStates.length > 0) && (
            <div className="bg-white border border-[#e8e4dd] rounded-xl py-2 px-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#5c5552]">
                <MapPin className="h-4 w-4 text-[#5c5552]" />
                <span>
                  <span className="text-[#5c5552]">Licensed:</span>{' '}
                  {licenseData.residentState && (
                    <span className="font-medium text-[#292524]">
                      {licenseData.residentState}
                      <span className="text-[#5c5552] font-normal"> (Resident)</span>
                    </span>
                  )}
                  {licenseData.nonResidentStates.length > 0 && (
                    <>
                      {licenseData.residentState && <span className="text-[#e8e4dd] mx-1.5">•</span>}
                      <span className="text-[#292524]">
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
            </div>
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
          <div className="bg-white border border-[#e8e4dd] rounded-xl overflow-hidden">
            {!ahipComplete ? (
              <div className="p-6 text-center">
                <Lock className="h-5 w-5 text-[#5c5552] mx-auto mb-2" />
                <p className="text-sm text-[#5c5552]">Complete AHIP first to view carrier status</p>
              </div>
            ) : carrierRows.length === 0 ? (
              <div className="p-6 text-center">
                <Building2 className="h-5 w-5 text-[#5c5552] mx-auto mb-2" />
                <p className="text-sm text-[#5c5552]">No carriers found. Contact your manager to get started.</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-[#e8e4dd] bg-white">
                      <th className="text-left text-xs font-medium text-[#5c5552] uppercase tracking-wider px-4 py-3 bg-white w-[280px]">Carrier</th>
                      <th className="text-left text-xs font-medium text-[#5c5552] uppercase tracking-wider px-4 py-3 bg-white">Products</th>
                      <th className="text-center text-xs font-medium text-[#5c5552] uppercase tracking-wider px-2 py-3 bg-white w-[100px]">Contracted</th>
                      <th className="text-center text-xs font-medium text-[#5c5552] uppercase tracking-wider px-2 py-3 bg-white w-[80px]">2026</th>
                      <th className="text-center text-xs font-medium text-[#5c5552] uppercase tracking-wider px-2 py-3 bg-white w-[80px]">2027</th>
                      <th className="text-center text-xs font-medium text-[#5c5552] uppercase tracking-wider px-4 py-3 bg-white w-[140px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e4dd]">
                    {carrierRows.map(row => (
                      <tr key={row.carrierName} className="hover:bg-stone-50">
                        <td className="px-4 py-3 w-[280px]">
                          <span className="font-medium text-[#292524]">{row.carrierName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[#5c5552]">{row.products.join(', ') || '—'}</span>
                        </td>
                        <td className="px-2 py-3 text-center w-[100px]">
                          {row.contractingStatus === 'rts' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : row.contractingStatus === 'in_progress' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Pending
                            </span>
                          ) : (
                            <Circle className="h-5 w-5 text-stone-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-2 py-3 text-center w-[80px]">
                          {row.hasCertFor2026 ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : (
                            <Circle className="h-5 w-5 text-stone-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-2 py-3 text-center w-[80px]">
                          {row.hasCertFor2027 ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-xs text-[#5c5552]">Coming</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center w-[140px]">
                          {row.contractingStatus === 'rts' && row.hasCertForYear ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
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
                            <button className="text-sm text-blue-600 hover:text-blue-700 underline">
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
        <p className="text-xs text-[#5c5552]/50">
          Powered by <span className="text-[#5c5552]/70">Tyler Insurance Group</span>
        </p>
      </footer>
    </div>
  );
};

export default ContractingHubPage;
