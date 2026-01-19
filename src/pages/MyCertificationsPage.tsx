import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Award, Filter } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAgentCertifications } from '@/hooks/useAgentCertifications';
import { cn } from '@/lib/utils';

// Product type display names
const PRODUCT_LABELS: Record<string, string> = {
  MA: 'Medicare Advantage',
  MAPD: 'MA + Part D',
  PDP: 'Part D',
  MEDIGAP: 'Medigap',
  ALL_ANCILLARY: 'Ancillary',
};

export default function MyCertificationsPage() {
  const { certifications, loading } = useAgentCertifications({ fetchCurrentUser: true });
  const [showRTSOnly, setShowRTSOnly] = useState(false);

  // Group certifications by carrier
  const certificationsByCarrier = useMemo(() => {
    const grouped: Record<string, typeof certifications> = {};

    for (const cert of certifications) {
      if (!grouped[cert.carrier_name]) {
        grouped[cert.carrier_name] = [];
      }
      grouped[cert.carrier_name].push(cert);
    }

    // Sort carriers alphabetically
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [certifications]);

  // Filter for RTS only (2026 certified)
  const filteredCertifications = useMemo(() => {
    if (!showRTSOnly) return certificationsByCarrier;

    const filtered: Record<string, typeof certifications> = {};
    for (const [carrier, certs] of Object.entries(certificationsByCarrier)) {
      const rtsCerts = certs.filter(c => c.certification_year === 2026);
      if (rtsCerts.length > 0) {
        filtered[carrier] = rtsCerts;
      }
    }
    return filtered;
  }, [certificationsByCarrier, showRTSOnly]);

  // Count RTS carriers (any carrier with at least one 2026 certification)
  const rtsCarrierCount = useMemo(() => {
    const carriersWithRTS = new Set<string>();
    for (const cert of certifications) {
      if (cert.certification_year === 2026) {
        carriersWithRTS.add(cert.carrier_name);
      }
    }
    return carriersWithRTS.size;
  }, [certifications]);

  const carrierNames = Object.keys(filteredCertifications);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="pt-28 pb-12 px-6 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-4">
              <Award className="h-8 w-8 text-gold" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              My Certifications
            </h1>
            <p className="text-slate-600">
              Your Ready to Sell certification status from Pinnacle RTS
            </p>
          </div>

          {/* Summary Card */}
          {!loading && certifications.length > 0 && (
            <Card className="mb-6 border-gold/30 bg-gradient-to-r from-gold/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <p className="text-lg font-semibold text-slate-900">
                    You are Ready to Sell with{' '}
                    <span className="text-gold">{rtsCarrierCount} carrier{rtsCarrierCount !== 1 ? 's' : ''}</span>
                    {' '}for 2026
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter Toggle */}
          {!loading && certifications.length > 0 && (
            <div className="flex items-center justify-end gap-3 mb-4">
              <Filter className="h-4 w-4 text-slate-400" />
              <Label htmlFor="rts-filter" className="text-sm text-slate-600 cursor-pointer">
                Show RTS only
              </Label>
              <Switch
                id="rts-filter"
                checked={showRTSOnly}
                onCheckedChange={setShowRTSOnly}
              />
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4" />
              <p className="text-slate-500">Loading certifications...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && certifications.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No Certifications Found
                </h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Your certification status will appear here once your RTS data has been imported from Pinnacle.
                  Contact your manager if you believe this is an error.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Certifications Grid */}
          {!loading && carrierNames.length > 0 && (
            <div className="grid gap-4">
              {carrierNames.map((carrierName) => {
                const carrierCerts = filteredCertifications[carrierName];
                const hasRTS = carrierCerts.some(c => c.certification_year === 2026);

                return (
                  <Card
                    key={carrierName}
                    className={cn(
                      "transition-all",
                      hasRTS
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          {carrierName}
                        </CardTitle>
                        {hasRTS && (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            RTS 2026
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {carrierCerts.map((cert) => {
                          const isCertified = cert.certification_year === 2026;
                          const isPreviousYear = cert.certification_year === 2025;

                          return (
                            <div
                              key={cert.id}
                              className={cn(
                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                                isCertified
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isPreviousYear
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {isCertified ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              <span className="font-medium">
                                {PRODUCT_LABELS[cert.product_type] || cert.product_type}
                              </span>
                              {isCertified && (
                                <span className="text-xs opacity-75">2026</span>
                              )}
                              {isPreviousYear && (
                                <span className="text-xs opacity-75">2025 only</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Help Text */}
          {!loading && certifications.length > 0 && (
            <p className="text-center text-sm text-slate-500 mt-8">
              Certification data is imported from Pinnacle RTS reports.
              Contact your manager for questions about your status.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
