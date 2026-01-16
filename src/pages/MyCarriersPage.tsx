import { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  Download,
  Lock,
  ChevronDown,
  Upload,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, Profile } from '@/hooks/useProfile';
import { carriers as carriersData } from '@/data/carriersData';
import { cn } from '@/lib/utils';

// Short product labels
const PRODUCT_SHORT: Record<string, string> = {
  MA: 'MA',
  MAPD: 'MAPD',
  PDP: 'PDP',
  MEDIGAP: 'Medigap',
  ALL_ANCILLARY: 'Ancillary',
};

interface CarrierCertStatus {
  carrierName: string;
  products: string[];
  isComplete: boolean;
  portalUrl?: string;
}

interface ContractingItem {
  carrierName: string;
  sentDate: string;
}

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

// AHIP Section Component
function AHIPSection({
  complete,
  year,
  profile,
  onUploadSuccess
}: {
  complete: boolean;
  year: number;
  profile: Profile | null;
  onUploadSuccess: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploading(true);
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/ahip_${year}.${fileExt}`;
      const filePath = `ahip-certificates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agent-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ahip_cert_year: year,
          ahip_cert_uploaded_at: new Date().toISOString(),
          ahip_cert_file_path: filePath,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('AHIP certificate uploaded successfully');
      onUploadSuccess(); // Refresh profile data

    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload certificate');
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleView = async () => {
    if (!profile?.ahip_cert_file_path) return;

    const { data } = await supabase.storage
      .from('agent-documents')
      .createSignedUrl(profile.ahip_cert_file_path, 60); // 60 second URL

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const hasUpload = profile?.ahip_cert_year === year && profile?.ahip_cert_file_path;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step 1</span>
        <h2 className="text-sm font-semibold text-slate-900">AHIP Certification</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        {complete ? (
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-slate-900">AHIP {year} Complete</span>
            </div>

            {hasUpload && profile?.ahip_cert_uploaded_at && (
              <div className="mt-3 ml-7 flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  Certificate uploaded {new Date(profile.ahip_cert_uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={handleView}>
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Replace'}
                </Button>
              </div>
            )}

            {!hasUpload && (
              <div className="mt-3 ml-7">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Upload Certificate
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Circle className="h-5 w-5 text-slate-300" />
              <span className="font-medium text-slate-900">AHIP {year} Required</span>
            </div>
            <p className="text-sm text-slate-500 mb-3 ml-7">
              Complete AHIP, then upload your certificate to unlock carrier certifications.
            </p>
            <div className="ml-7 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => window.open('https://www.ahipmedicaretraining.com', '_blank')}
              >
                Start AHIP
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3 mr-1" />
                    Upload Certificate
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleUpload}
        />
      </div>
    </section>
  );
}

// Carrier Certifications Section Component
function CarrierCertsSection({
  carriers,
  completedCount,
  totalCount,
  ahipComplete,
}: {
  carriers: CarrierCertStatus[];
  completedCount: number;
  totalCount: number;
  ahipComplete: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 6;
  const displayedCarriers = showAll ? carriers : carriers.slice(0, displayLimit);
  const hasMore = carriers.length > displayLimit;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step 2</span>
          <h2 className="text-sm font-semibold text-slate-900">Carrier Certifications</h2>
        </div>
        {totalCount > 0 && (
          <span className="text-sm text-slate-500">{completedCount} of {totalCount} complete</span>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {!ahipComplete ? (
          <div className="p-6 text-center">
            <Lock className="h-5 w-5 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Complete AHIP first to start carrier certifications</p>
          </div>
        ) : carriers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">No carrier certifications found. Contact your upline if this is an error.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {displayedCarriers.map(carrier => (
                <div key={carrier.carrierName} className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {carrier.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium text-slate-900">{carrier.carrierName}</span>
                      <span className="text-sm text-slate-500 truncate">{carrier.products.join(', ')}</span>
                    </div>
                  </div>

                  {carrier.portalUrl && carrier.isComplete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-slate-500 hover:text-slate-900 flex-shrink-0"
                      onClick={() => window.open(carrier.portalUrl, '_blank')}
                    >
                      Portal
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
              >
                {showAll ? 'Show less' : `Show ${carriers.length - displayLimit} more`}
                <ChevronDown className={cn("h-4 w-4 inline ml-1 transition-transform", showAll && "rotate-180")} />
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// Contracting In Progress Section Component
function ContractingSection({ items }: { items: ContractingItem[] }) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-slate-900">Contracting In Progress</h2>
        <span className="text-xs text-slate-500">({items.length})</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg divide-y divide-blue-100">
        {items.map(item => (
          <div key={item.carrierName} className="flex items-center justify-between py-3 px-4">
            <span className="font-medium text-slate-900">{item.carrierName}</span>
            <span className="text-sm text-blue-600">
              Sent to Pinnacle {item.sentDate ? new Date(item.sentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Resources Section Component
function ResourcesSection() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-900">Resources</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        <button className="w-full flex items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-700">2026 Recertification Guide</span>
          </div>
          <Download className="h-4 w-4 text-slate-400" />
        </button>
        <button className="w-full flex items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-700">Carrier Portal Logins</span>
          </div>
          <Download className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </section>
  );
}

export default function MyCarriersPage() {
  const { profile, refetch: refetchProfile } = useProfile();
  const [certifications, setCertifications] = useState<Array<{
    carrier_name: string;
    product_type: string;
    certification_year: number;
  }>>([]);
  const [carrierStatuses, setCarrierStatuses] = useState<Array<{
    carrier_name: string;
    contracting_status: string;
    issue_description: string | null;
    created_at: string;
  }>>([]);
  const [ahipStatus, setAhipStatus] = useState<{ year: number; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [carrierNameMap, setCarrierNameMap] = useState<Record<string, string>>({});
  const [nameMapReady, setNameMapReady] = useState(false);

  // Fetch carrier name map on mount (for normalizing RTS names)
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

      setLoading(true);
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
          .select('contracting_status, issue_description, carrier_id, created_at')
          .eq('user_id', profile.user_id)
          .in('contracting_status', ['in_progress', 'issue']);

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

        setCertifications(certs || []);
        setCarrierStatuses(
          (statuses || []).map(s => ({
            carrier_name: carrierNames[s.carrier_id] || 'Unknown Carrier',
            contracting_status: s.contracting_status,
            issue_description: s.issue_description,
            created_at: s.created_at,
          }))
        );
      } catch (err) {
        console.error('Failed to fetch carrier data:', err);
      } finally {
        setLoading(false);
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

  // AHIP complete = has uploaded cert for current year OR has AHIP record OR has any carrier certification for current year
  const ahipComplete = useMemo(() => {
    // Check profile for uploaded AHIP cert
    if (profile?.ahip_cert_year === currentCertYear && profile?.ahip_cert_file_path) {
      return true;
    }
    // Check ahip_certifications table
    if (ahipStatus && ahipStatus.year === currentCertYear && ahipStatus.status === 'completed') {
      return true;
    }
    // Fallback: if they have any carrier cert for current year, they must have done AHIP
    return certifications.some(c => c.certification_year === currentCertYear);
  }, [certifications, currentCertYear, ahipStatus, profile?.ahip_cert_year, profile?.ahip_cert_file_path]);

  // Build carrier certification statuses (checklist)
  const carrierCertStatuses = useMemo(() => {
    const carriers: Record<string, CarrierCertStatus> = {};

    for (const cert of certifications) {
      // Skip certification_year = 0 (no relationship)
      if (cert.certification_year === 0) continue;

      const name = normalizeCarrierName(cert.carrier_name);
      const productLabel = PRODUCT_SHORT[cert.product_type] || cert.product_type;

      if (!carriers[name]) {
        carriers[name] = {
          carrierName: name,
          products: [],
          isComplete: false,
          portalUrl: getPortalUrl(name),
        };
      }

      // Add product if not already listed
      if (!carriers[name].products.includes(productLabel)) {
        carriers[name].products.push(productLabel);
      }

      // Mark complete if current year
      if (cert.certification_year === currentCertYear) {
        carriers[name].isComplete = true;
      }
    }

    // Sort: incomplete first, then alphabetical
    return Object.values(carriers).sort((a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
      return a.carrierName.localeCompare(b.carrierName);
    });
  }, [certifications, currentCertYear, carrierNameMap]);

  const completedCount = carrierCertStatuses.filter(c => c.isComplete).length;
  const totalCount = carrierCertStatuses.length;

  // Contracting in progress (exclude carriers already RTS)
  const contractingInProgress = useMemo(() => {
    const rtsCarriers = new Set(
      carrierCertStatuses.filter(c => c.isComplete).map(c => c.carrierName.toLowerCase())
    );

    return carrierStatuses
      .filter(s => s.contracting_status === 'in_progress')
      .filter(s => !rtsCarriers.has(normalizeCarrierName(s.carrier_name).toLowerCase()))
      .map(s => ({
        carrierName: normalizeCarrierName(s.carrier_name),
        sentDate: s.created_at,
      }));
  }, [carrierStatuses, carrierCertStatuses, carrierNameMap]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">My Carriers</h1>
            <p className="text-slate-500">{currentCertYear} Certification Year</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading carrier data...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Step 1: AHIP */}
              <AHIPSection
                complete={ahipComplete}
                year={currentCertYear}
                profile={profile}
                onUploadSuccess={refetchProfile}
              />

              {/* Step 2: Carrier Certs */}
              <CarrierCertsSection
                carriers={carrierCertStatuses}
                completedCount={completedCount}
                totalCount={totalCount}
                ahipComplete={ahipComplete}
              />

              {/* Contracting In Progress - only if items exist */}
              {contractingInProgress.length > 0 && (
                <ContractingSection items={contractingInProgress} />
              )}

              {/* Resources */}
              <ResourcesSection />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
