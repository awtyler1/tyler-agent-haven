import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, Heart, ArrowRight, X, Loader2, ArrowLeft } from 'lucide-react';
import { usePlansByCounty, useCmsCounties, useFilteredPlans } from '@/hooks/useCmsPlans';
import { type CmsPlan } from '@/types/cms';
import { PlanComparison } from '@/components/medicare/PlanComparison';
import { PlanDetailModal } from '@/components/medicare/PlanDetailModal';
import { StarRating } from '@/components/medicare/StarRating';
import { getCountyFromZip } from '@/lib/zipToCounty';

// ============================================================================
// Plan Card Component
// ============================================================================
const PlanCard = ({
  plan,
  onCompare,
  isInCompare,
  onViewDetails,
}: {
  plan: CmsPlan;
  onCompare: (plan: CmsPlan) => void;
  isInCompare: boolean;
  onViewDetails: (plan: CmsPlan) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayId = `${plan.contractId}-${plan.planId}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">{plan.organizationName}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground">{displayId}</span>
              </div>
              <h3 className="font-semibold text-foreground truncate">{plan.planName || displayId}</h3>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={plan.planType === 'HMO' ? 'default' : 'secondary'} className="text-xs">
                  {plan.planType}
                </Badge>
                {plan.snpType && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    {plan.snpType}
                  </Badge>
                )}
                <StarRating rating={plan.starRating} />
              </div>
            </div>

            {/* Premium */}
            <div className="text-right flex-shrink-0">
              <div className={`text-2xl font-bold ${plan.premium === 0 ? 'text-green-600' : 'text-foreground'}`}>
                {plan.premium === 0 ? '$0' : `$${plan.premium}`}
              </div>
              <div className="text-xs text-muted-foreground">/month</div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="px-5 py-4 grid grid-cols-3 gap-4 border-b border-border bg-muted/30">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Deductible</div>
            <div className="font-semibold text-foreground">
              {plan.deductible === 0 ? '$0' : `$${plan.deductible.toLocaleString()}`}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Max Out-of-Pocket</div>
            <div className="font-semibold text-foreground">${plan.moop.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Drug Deductible</div>
            <div className="font-semibold text-foreground">
              {plan.drugDeductible === 0 || plan.drugDeductible === null ? '$0' : `$${plan.drugDeductible}`}
            </div>
          </div>
        </div>

        {/* Quick Benefits */}
        <div className="px-5 py-4 border-b border-border">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PCP Visit</span>
              <span className="font-medium text-foreground">{plan.benefits.pcpCopay || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Specialist</span>
              <span className="font-medium text-foreground">{plan.benefits.specialistCopay || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emergency</span>
              <span className="font-medium text-foreground">{plan.benefits.emergencyCopay || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inpatient</span>
              <span className="font-medium text-foreground truncate max-w-[120px]" title={plan.benefits.inpatientCopay || ''}>
                {plan.benefits.inpatientCopay || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Extra Benefits Summary */}
        <div className="px-5 py-3 flex flex-wrap gap-2">
          {plan.benefits.dental && (
            <Badge variant="outline" className="text-xs bg-background">Dental</Badge>
          )}
          {plan.benefits.vision && (
            <Badge variant="outline" className="text-xs bg-background">Vision</Badge>
          )}
          {plan.benefits.hearing && (
            <Badge variant="outline" className="text-xs bg-background">Hearing</Badge>
          )}
          {plan.benefits.otcAllowance && (
            <Badge variant="outline" className="text-xs bg-background">OTC ${plan.benefits.otcAllowance}/mo</Badge>
          )}
          {plan.benefits.fitness && (
            <Badge variant="outline" className="text-xs bg-background">{plan.benefits.fitness}</Badge>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="px-5 py-4 bg-muted/50 border-t border-border">
            <div className="space-y-4">
              {/* Drug Tiers */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Prescription Drug Copays</h4>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'].map((tier, i) => (
                    <div key={tier} className="text-center">
                      <div className="text-muted-foreground mb-1">{tier}</div>
                      <div className="font-medium">
                        {[
                          plan.benefits.drugTier1,
                          plan.benefits.drugTier2,
                          plan.benefits.drugTier3,
                          plan.benefits.drugTier4,
                          plan.benefits.drugTier5
                        ][i] || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra Benefits Detail */}
              <div className="grid grid-cols-2 gap-4">
                {plan.benefits.dental && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Dental</h4>
                    <div className="text-sm text-muted-foreground">
                      <div>Preventive: {plan.benefits.dental.preventive || 'Included'}</div>
                      {plan.benefits.dental.comprehensive && (
                        <div>Comprehensive: {plan.benefits.dental.comprehensive}</div>
                      )}
                    </div>
                  </div>
                )}
                {plan.benefits.vision && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Vision</h4>
                    <div className="text-sm text-muted-foreground">
                      <div>Exam: {plan.benefits.vision.examCopay || 'Included'}</div>
                      {plan.benefits.vision.eyewearAllowance && (
                        <div>Eyewear: ${plan.benefits.vision.eyewearAllowance}/year</div>
                      )}
                    </div>
                  </div>
                )}
                {plan.benefits.hearing && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Hearing</h4>
                    <div className="text-sm text-muted-foreground">
                      <div>Exam: {plan.benefits.hearing.examCopay || 'Included'}</div>
                      {plan.benefits.hearing.aidAllowance && (
                        <div>Aids: ${plan.benefits.hearing.aidAllowance}/year</div>
                      )}
                    </div>
                  </div>
                )}
                {plan.benefits.transportation && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Transportation</h4>
                    <div className="text-sm text-muted-foreground">{plan.benefits.transportation}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-3">
            <Button variant="link" className="px-0 text-primary" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show Less' : 'Quick View'}
            </Button>
            <Button variant="link" className="px-0" onClick={() => onViewDetails(plan)}>
              Full Details
            </Button>
          </div>
          <Button
            variant={isInCompare ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCompare(plan)}
          >
            {isInCompare ? '✓ In Compare' : 'Add to Compare'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Loading Skeleton
// ============================================================================
const PlanCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="px-5 py-4 border-b border-border">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-6 w-48 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <div className="px-5 py-4 grid grid-cols-3 gap-4 border-b border-border bg-muted/30">
        <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-5 w-12" /></div>
        <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-5 w-12" /></div>
        <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-5 w-12" /></div>
      </div>
      <div className="px-5 py-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// Popular Counties
// ============================================================================
const POPULAR_COUNTIES = [
  { fips: '21111', name: 'Jefferson' },
  { fips: '21067', name: 'Fayette' },
  { fips: '21117', name: 'Kenton' },
  { fips: '21227', name: 'Warren' },
  { fips: '21059', name: 'Daviess' },
  { fips: '21015', name: 'Boone' },
];

// ============================================================================
// Main Component
// ============================================================================
export default function PlanFinderPage() {
  // URL state persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInput = searchParams.get('q') || '';
  const countyFips = searchParams.get('county') || '';
  const view = (searchParams.get('view') as 'finder' | 'compare') || 'finder';
  const compareIds = searchParams.get('compare')?.split(',').filter(Boolean) || [];
  const sortBy = (searchParams.get('sort') as 'premium' | 'moop' | 'rating') || 'premium';

  // Read filters from URL
  const filters = {
    planType: searchParams.get('planType') || 'all',
    premium: (searchParams.get('premium') as 'all' | 'zero' | 'low') || 'all',
    snpOnly: searchParams.get('snpOnly') === 'true',
  };

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      });
      return next;
    }, { replace: true });
  };

  // Transient state (modal, doesn't need URL persistence)
  const [detailPlan, setDetailPlan] = useState<CmsPlan | null>(null);

  const { counties, isLoading: countiesLoading } = useCmsCounties('KY', 2026);

  // Derive selectedCounty from URL param
  const selectedCounty = useMemo(() => {
    if (!countyFips) return null;
    // Check popular counties first
    const popular = POPULAR_COUNTIES.find(c => c.fips === countyFips);
    if (popular) return popular;
    // Then check loaded counties
    const fromList = counties.find(c => c.fips === countyFips);
    if (fromList) return { fips: fromList.fips, name: fromList.name };
    // Fallback - return with fips only
    return { fips: countyFips, name: countyFips };
  }, [countyFips, counties]);

  const { plans, isLoading: plansLoading, error } = usePlansByCounty(
    countyFips ? 'KY' : null,
    countyFips || null,
    2026
  );

  // Derive comparePlans from URL param and loaded plans
  const comparePlans = useMemo(() => {
    if (!plans || compareIds.length === 0) return [];
    return plans.filter(p => compareIds.includes(p.id));
  }, [plans, compareIds]);

  const filteredPlans = useFilteredPlans(plans, {
    planType: filters.planType,
    premiumFilter: filters.premium,
    snpOnly: filters.snpOnly,
    sortBy,
  });

  const handleSearch = () => {
    const input = searchInput.trim().toLowerCase();
    if (!input) return;

    if (/^\d{5}$/.test(input)) {
      const county = getCountyFromZip(input);
      if (county) {
        updateParams({ county: county.fips, view: 'finder' });
      } else {
        updateParams({ county: '21111', view: 'finder' }); // Default to Jefferson
      }
    } else {
      const match = counties.find(c => c.name.toLowerCase().includes(input));
      if (match) {
        updateParams({ county: match.fips, view: 'finder' });
      }
    }
  };

  const handleCompare = (plan: CmsPlan) => {
    const currentIds = compareIds;
    let newIds: string[];
    if (currentIds.includes(plan.id)) {
      newIds = currentIds.filter(id => id !== plan.id);
    } else if (currentIds.length >= 4) {
      return; // Max 4 plans
    } else {
      newIds = [...currentIds, plan.id];
    }
    updateParams({ compare: newIds.length > 0 ? newIds.join(',') : null });
  };

  const isInCompare = (planId: string) => compareIds.includes(planId);

  // Comparison view
  if (view === 'compare' && comparePlans.length > 0) {
    return (
      <div className="px-8 py-5">
        <div className="max-w-5xl mx-auto mb-4">
          <button
            onClick={() => updateParams({ view: 'finder' })}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium">Back to Plans</span>
          </button>
        </div>
        <div className="max-w-5xl mx-auto">
          <PlanComparison
            plans={comparePlans}
            onRemovePlan={(id) => {
              const newIds = compareIds.filter(cid => cid !== id);
              if (newIds.length === 0) {
                updateParams({ view: 'finder', compare: null });
              } else {
                updateParams({ compare: newIds.join(',') });
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-5">
      <main className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Medicare Plan Finder</h1>
          </div>
          <p className="text-sm text-muted-foreground">2026 Kentucky Medicare Advantage Plans</p>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchInput}
                  onChange={(e) => updateParams({ q: e.target.value || null })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter zip code or county name..."
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={countiesLoading}>
                {countiesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2 py-1">Popular:</span>
              {POPULAR_COUNTIES.map(county => (
                <Button
                  key={county.fips}
                  variant={selectedCounty?.fips === county.fips ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateParams({ county: county.fips })}
                >
                  {county.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedCounty ? (
          <>
            {/* Results Header with Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {plansLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading plans...
                    </span>
                  ) : (
                    `${filteredPlans.length} Plans in ${selectedCounty.name} County`
                  )}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select value={filters.planType} onValueChange={(v) => updateParams({ planType: v === 'all' ? null : v })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Plan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="HMO">HMO</SelectItem>
                    <SelectItem value="PPO">PPO</SelectItem>
                    <SelectItem value="HMO-POS">HMO-POS</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.premium} onValueChange={(v) => updateParams({ premium: v === 'all' ? null : v })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Premium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Premium</SelectItem>
                    <SelectItem value="zero">$0 Premium</SelectItem>
                    <SelectItem value="low">$30 or less</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="snp"
                    checked={filters.snpOnly}
                    onCheckedChange={(checked) => updateParams({ snpOnly: checked ? 'true' : null })}
                  />
                  <label htmlFor="snp" className="text-sm text-muted-foreground cursor-pointer">
                    SNP Only
                  </label>
                </div>

                <Select value={sortBy} onValueChange={(v) => updateParams({ sort: v === 'premium' ? null : v })}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Sort: Premium</SelectItem>
                    <SelectItem value="moop">Sort: Max OOP</SelectItem>
                    <SelectItem value="rating">Sort: Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Card className="mb-4 border-red-200 bg-red-50">
                <CardContent className="py-4 text-red-700">
                  Failed to load plans: {error.message}
                </CardContent>
              </Card>
            )}

            {plansLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => <PlanCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onCompare={handleCompare}
                    isInCompare={isInCompare(plan.id)}
                    onViewDetails={setDetailPlan}
                  />
                ))}
              </div>
            )}

            {!plansLoading && filteredPlans.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No plans match your filters. Try adjusting your criteria.</p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Find Medicare Advantage Plans</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter a Kentucky zip code or county name to see available 2026 Medicare Advantage plans.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Compare Tray */}
        {comparePlans.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg p-4 z-50">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-x-auto">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">Compare:</span>
                {comparePlans.map(plan => (
                  <Badge key={plan.id} variant="secondary" className="flex items-center gap-2 py-1.5">
                    <span className="truncate max-w-[150px]">{plan.planName || `${plan.contractId}-${plan.planId}`}</span>
                    <button onClick={() => handleCompare(plan)} className="hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Button onClick={() => updateParams({ view: 'compare' })} className="flex-shrink-0">
                Compare Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {comparePlans.length > 0 && <div className="h-20" />}

        <PlanDetailModal
          plan={detailPlan}
          open={!!detailPlan}
          onClose={() => setDetailPlan(null)}
          onAddToCompare={handleCompare}
          isInCompare={detailPlan ? isInCompare(detailPlan.id) : false}
        />
      </main>
    </div>
  );
}
