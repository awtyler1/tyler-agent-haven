# Sprint Context: Carrier Plans Tab

**Generated:** 2026-02-03
**Purpose:** Context for Claude.ai sprint collaboration

---

## Directory Listings

### src/components/medicare/
```
PlanComparison.tsx
PlanDetailModal.tsx
```

### src/hooks/
```
use-mobile.tsx
use-toast.ts
useDarkMode.ts
useFormValidation.ts
useSendEmail.ts
useAgentCertifications.ts
useRoadmapGenerator.ts
useContractingPdf.ts
useForms.ts
useCarrierDirectory.ts        # exports useAgentCarriers
useAuth.ts
useProfile.ts
useRole.ts
useNavigationContext.ts
useContractingApplication.ts
useCommissions.ts
useDashboardData.ts
useAgentRTSCarriers.ts
useSyncPreferences.ts
useCmsPlans.ts                 # exports useCmsCounties
```

### src/pages/
```
ContractingPage.tsx
IndustryUpdatesPage.tsx
NotFound.tsx
DocumentManagementPage.tsx
CarrierPortalsPage.tsx
StartHerePage.tsx
MyProfilePage.tsx
TrainingPage.tsx
AuthPage.tsx
CarrierPlansPage.tsx
CompliancePage.tsx
AgentToolsPage.tsx
CarrierResourcesPage.tsx
Index.old.tsx
ContractingHubPage.tsx
FormsLibraryPage.tsx
Index.tsx
T65ReviewPage.tsx
SyncFlow.tsx
```

### src/pages/admin/
```
AgentsPage.tsx
NewAgentPage.tsx
RTSImportPage.tsx
RoadmapGeneratorPage.tsx
ActivityLogPage.tsx
AgentProfilePage.tsx
AdminDashboard.tsx
ContractingQueuePage.tsx
PdfBuilderPage.tsx
AgentBookDetailPage.tsx
AgentsBookPage.tsx
UserDetailPage.tsx
LabsPage.tsx
PlanFinderPage.tsx
```

---

## 1. src/pages/admin/PlanFinderPage.tsx

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
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
import { Search, MapPin, Star, Heart, ArrowRight, X, Loader2 } from 'lucide-react';
import { usePlansByCounty, useCmsCounties, useFilteredPlans } from '@/hooks/useCmsPlans';
import { type CmsPlan } from '@/types/cms';
import { PlanComparison } from '@/components/medicare/PlanComparison';
import { PlanDetailModal } from '@/components/medicare/PlanDetailModal';

// ============================================================================
// ZIP Code to County FIPS Lookup (Kentucky)
// Uses correct FIPS codes (21XXX format)
// ============================================================================
const ZIP_TO_COUNTY: Record<string, { fips: string; name: string }> = {
  // Louisville area (Jefferson County)
  '400': { fips: '21111', name: 'Jefferson' },
  '401': { fips: '21111', name: 'Jefferson' },
  '402': { fips: '21111', name: 'Jefferson' },
  // Lexington area (Fayette County)
  '403': { fips: '21067', name: 'Fayette' },
  '404': { fips: '21067', name: 'Fayette' },
  '405': { fips: '21067', name: 'Fayette' },
  // Northern KY - Covington/Newport (Kenton County)
  '410': { fips: '21117', name: 'Kenton' },
  '411': { fips: '21117', name: 'Kenton' },
  // Bowling Green (Warren County)
  '421': { fips: '21227', name: 'Warren' },
  // Owensboro (Daviess County)
  '423': { fips: '21059', name: 'Daviess' },
  // Ashland (Boyd County)
  '411': { fips: '21019', name: 'Boyd' },
  '416': { fips: '21019', name: 'Boyd' },
  // Paducah (McCracken County)
  '420': { fips: '21145', name: 'McCracken' },
  // Elizabethtown (Hardin County)
  '427': { fips: '21093', name: 'Hardin' },
  // Frankfort (Franklin County)
  '406': { fips: '21073', name: 'Franklin' },
};

function getCountyFromZip(zipCode: string): { fips: string; name: string } | null {
  const prefix = zipCode.slice(0, 3);
  return ZIP_TO_COUNTY[prefix] || null;
}

// ============================================================================
// Star Rating Component
// ============================================================================
const StarRating = ({ rating }: { rating: number | null }) => {
  if (!rating) return <span className="text-muted-foreground text-sm">Not rated</span>;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
};

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

  // Helper to get display ID
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
            <Button variant="link" className="px-0 text-gold" onClick={() => setExpanded(!expanded)}>
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
// Popular Counties (for quick selection)
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
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<{ fips: string; name: string } | null>(null);
  const [comparePlans, setComparePlans] = useState<CmsPlan[]>([]);
  const [view, setView] = useState<'finder' | 'compare'>('finder');
  const [detailPlan, setDetailPlan] = useState<CmsPlan | null>(null);
  const [filters, setFilters] = useState({
    planType: 'all',
    premium: 'all' as 'all' | 'zero' | 'low',
    snpOnly: false,
  });
  const [sortBy, setSortBy] = useState<'premium' | 'moop' | 'rating'>('premium');

  // Load counties for dropdown/search
  const { counties, isLoading: countiesLoading } = useCmsCounties('KY', 2026);

  // Load plans for selected county
  const { plans, isLoading: plansLoading, error } = usePlansByCounty(
    selectedCounty ? 'KY' : null,
    selectedCounty?.fips || null,
    2026
  );

  // Client-side filtering and sorting
  const filteredPlans = useFilteredPlans(plans, {
    planType: filters.planType,
    premiumFilter: filters.premium,
    snpOnly: filters.snpOnly,
    sortBy,
  });

  // Handle search
  const handleSearch = () => {
    const input = searchInput.trim().toLowerCase();
    if (!input) return;

    if (/^\d{5}$/.test(input)) {
      // ZIP code lookup
      const county = getCountyFromZip(input);
      if (county) {
        setSelectedCounty(county);
      } else {
        // Default to Jefferson County if ZIP not found
        setSelectedCounty({ fips: '21111', name: 'Jefferson' });
      }
    } else {
      // County name search
      const match = counties.find(c =>
        c.name.toLowerCase().includes(input)
      );
      if (match) {
        setSelectedCounty({ fips: match.fips, name: match.name });
      }
    }
  };

  // Handle compare
  const handleCompare = (plan: CmsPlan) => {
    setComparePlans(prev => {
      if (prev.some(p => p.id === plan.id)) {
        return prev.filter(p => p.id !== plan.id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, plan];
    });
  };

  const isInCompare = (planId: string) => comparePlans.some(p => p.id === planId);

  // Comparison view
  if (view === 'compare' && comparePlans.length > 0) {
    return (
      <AdminLayout showBackButton backLabel="Plan Finder" onBack={() => setView('finder')}>
        <PlanComparison
          plans={comparePlans}
          onRemovePlan={(id) => {
            const updated = comparePlans.filter(p => p.id !== id);
            if (updated.length === 0) setView('finder');
            setComparePlans(updated);
          }}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout showBackButton backLabel="Labs" onBack={() => navigate('/admin/labs')}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-gold" />
          <h1 className="text-2xl font-serif font-medium text-foreground">Medicare Plan Finder</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          2026 Kentucky Medicare Advantage Plans
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter zip code or county name..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={countiesLoading}>
              {countiesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Quick County Select */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-2 py-1">Popular:</span>
            {POPULAR_COUNTIES.map(county => (
              <Button
                key={county.fips}
                variant={selectedCounty?.fips === county.fips ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCounty(county)}
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
              <MapPin className="w-4 h-4 text-gold" />
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
              <Select value={filters.planType} onValueChange={(v) => setFilters(f => ({ ...f, planType: v }))}>
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

              <Select value={filters.premium} onValueChange={(v) => setFilters(f => ({ ...f, premium: v as typeof filters.premium }))}>
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
                  onCheckedChange={(checked) => setFilters(f => ({ ...f, snpOnly: !!checked }))}
                />
                <label htmlFor="snp" className="text-sm text-muted-foreground cursor-pointer">
                  SNP Only
                </label>
              </div>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
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

          {/* Error State */}
          {error && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="py-4 text-red-700">
                Failed to load plans: {error.message}
              </CardContent>
            </Card>
          )}

          {/* Plan Grid */}
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
        /* Empty State */
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gold" />
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
            <Button onClick={() => setView('compare')} className="flex-shrink-0">
              Compare Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Bottom padding when compare tray is visible */}
      {comparePlans.length > 0 && <div className="h-20" />}

      {/* Plan Detail Modal */}
      <PlanDetailModal
        plan={detailPlan}
        open={!!detailPlan}
        onClose={() => setDetailPlan(null)}
        onAddToCompare={handleCompare}
        isInCompare={detailPlan ? isInCompare(detailPlan.id) : false}
      />
    </AdminLayout>
  );
}
```

---

## 2. src/pages/CarrierResourcesPage.tsx

```tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight, ArrowLeft, Loader2, Download } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { UserAvatarDropdown } from "@/components/UserAvatarDropdown";
import { useCarrierDirectory, useAgentCarriers } from "@/hooks/useCarrierDirectory";

// State codes and display names - MVP: Kentucky only
const STATES = [
  { code: 'KY', name: 'Kentucky' },
];

const CarrierResourcesPage = () => {
  const { profile } = useProfile();
  const { homePath, isDualRole, viewMode, toggleMode } = useNavigationContext();
  const [selectedCarrierCode, setSelectedCarrierCode] = useState<string>('');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('KY');

  const { carriers: supportedCarriers, loading: carriersLoading } = useAgentCarriers();
  const { carriers, loading, error } = useCarrierDirectory(selectedStateCode);

  // Set default carrier to first in list once loaded
  useEffect(() => {
    if (!carriersLoading && supportedCarriers.length > 0 && !selectedCarrierCode) {
      setSelectedCarrierCode(supportedCarriers[0].code);
    }
  }, [carriersLoading, supportedCarriers, selectedCarrierCode]);

  // Find the active carrier from the fetched data
  const activeCarrier = carriers.find(c => c.code === selectedCarrierCode);

  // Check if there's any data for this carrier/state
  const hasData = activeCarrier && (
    activeCarrier.contacts.length > 0 ||
    activeCarrier.links.length > 0 ||
    activeCarrier.documents.length > 0
  );

  // Get display names
  const selectedStateName = STATES.find(s => s.code === selectedStateCode)?.name || selectedStateCode;
  const selectedCarrierName = supportedCarriers.find(c => c.code === selectedCarrierCode)?.name || selectedCarrierCode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Link to={homePath} className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-[#292524]">TIG</span>
              <span className="text-[#e8e4dd]">|</span>
              <span className="text-sm text-[#5c5552]">Agent Portal</span>
            </Link>
            {/* Mode indicator for dual-role users - clickable to toggle */}
            {isDualRole && (
              <button
                onClick={toggleMode}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-80 ${
                  viewMode === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}
                title={`Click to switch to ${viewMode === 'admin' ? 'Agent' : 'Admin'} View`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  viewMode === 'admin' ? 'bg-purple-500' : 'bg-green-500'
                }`} />
                {viewMode === 'admin' ? 'Admin View' : 'Agent View'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[#5c5552] hidden sm:block">{profile?.full_name || 'Agent'}</span>
            <UserAvatarDropdown />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-serif font-semibold text-[#292524]">
                Carrier Resources
              </h1>
              <div className="flex items-center gap-3">
                {/* Plan Documents button */}
                <Link
                  to={`/carrier-resources/plans?carrier=${selectedCarrierCode}&state=${selectedStateCode}`}
                  className="bg-blue-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Plan Documents
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Left: Carrier Sidebar (3 cols) */}
            <div className="col-span-3">
              <div className="bg-white border border-[#e8e4dd] rounded-xl overflow-hidden">
                {supportedCarriers.map((carrier) => (
                  <button
                    key={carrier.code}
                    onClick={() => setSelectedCarrierCode(carrier.code)}
                    className={`w-full px-3 py-3 text-left text-sm flex items-center gap-3 border-b border-[#e8e4dd] last:border-0 transition-all ${
                      selectedCarrierCode === carrier.code
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-50 text-[#292524]'
                    }`}
                  >
                    {/* Logo container */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedCarrierCode === carrier.code
                        ? 'bg-white/20 p-1'
                        : ''
                    }`}>
                      <img
                        src={carrier.logo}
                        alt={carrier.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className={`font-medium ${
                      selectedCarrierCode === carrier.code ? 'text-white' : 'text-[#292524]'
                    }`}>
                      {carrier.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Stacked Content Sections (9 cols) */}
            <div className="col-span-9 space-y-3">
              {/* Loading State */}
              {(loading || carriersLoading) && (
                <div className="bg-white border border-[#e8e4dd] rounded-xl p-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-[#5c5552]">Loading...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-600">Failed to load. Please try again.</p>
                </div>
              )}

              {/* No Data State */}
              {!loading && !carriersLoading && !error && !hasData && selectedCarrierCode && (
                <div className="bg-white border border-[#e8e4dd] rounded-xl p-6 text-center">
                  <p className="text-sm text-[#5c5552]">
                    No data available for {selectedCarrierName} in {selectedStateName} yet.
                  </p>
                </div>
              )}

              {/* Content when data exists */}
              {!loading && !carriersLoading && !error && hasData && activeCarrier && (
                <>
                  {/* CONTACTS CARD */}
                  <div className="bg-white border border-[#e8e4dd] rounded-xl p-5">
                    <h3 className="text-xs font-medium text-[#5c5552] uppercase tracking-wider mb-4">Contacts</h3>
                    {activeCarrier.contacts.length > 0 ? (
                      <div className="grid grid-cols-4 gap-4">
                        {activeCarrier.contacts.map((contact) => (
                          <div key={contact.id} className="text-sm">
                            <p className="font-medium text-[#292524]">{contact.name}</p>
                            {contact.title && (
                              <p className="text-xs text-[#5c5552]">{contact.title}</p>
                            )}
                            {contact.region && (
                              <p className="text-xs text-[#5c5552] mb-1">{contact.region}</p>
                            )}
                            {!contact.title && !contact.region && (
                              <p className="text-xs text-[#5c5552] mb-1">&nbsp;</p>
                            )}
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="text-xs text-blue-600 hover:underline block">
                                {contact.phone}
                              </a>
                            )}
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 hover:underline block truncate">
                                {contact.email}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#5c5552] italic">No contacts available for this carrier.</p>
                    )}
                  </div>

                  {/* PORTALS + DOWNLOADS ROW */}
                  <div className="grid grid-cols-2 gap-3 items-stretch">
                    {/* Portals & Links */}
                    <div className="bg-white border border-[#e8e4dd] rounded-xl p-4 flex flex-col">
                      <h3 className="text-xs font-medium text-[#5c5552] uppercase tracking-wider mb-3">Portals & Links</h3>
                      <div className="space-y-2 flex-1">
                        {activeCarrier.links.length > 0 ? (
                          activeCarrier.links.map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
                            >
                              <div>
                                <span className="text-sm text-[#292524] group-hover:text-blue-600 transition-colors">{link.name}</span>
                                {link.description && <span className="text-xs text-[#5c5552] ml-2">({link.description})</span>}
                              </div>
                              <ExternalLink className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                            </a>
                          ))
                        ) : (
                          <p className="text-sm text-[#5c5552] italic">No links available for this carrier.</p>
                        )}
                      </div>
                    </div>

                    {/* Downloads */}
                    <div className="bg-white border border-[#e8e4dd] rounded-xl p-4 flex flex-col">
                      <h3 className="text-xs font-medium text-[#5c5552] uppercase tracking-wider mb-3">Quick Downloads</h3>
                      <div className="space-y-2 flex-1">
                        {activeCarrier.documents.length > 0 ? (
                          activeCarrier.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
                            >
                              <span className="text-sm text-[#292524] group-hover:text-blue-600 transition-colors truncate pr-2">{doc.name}</span>
                              <Download className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            </a>
                          ))
                        ) : (
                          <p className="text-sm text-[#5c5552] italic">No downloads available for this carrier.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
        <p className="text-xs text-[#5c5552]/50">
          Powered by <span className="text-[#5c5552]/70">Tyler Insurance Group</span>
        </p>
      </footer>
    </div>
  );
};

export default CarrierResourcesPage;
```

---

## 3. src/hooks/useCmsPlans.ts

```ts
/**
 * CMS Plans Hooks
 *
 * Hooks for querying Medicare Advantage plan data from Supabase.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  type CmsPlan,
  type CmsCounty,
  type PlanFilters,
  type CmsPlanRow,
  transformCmsPlanRow,
} from '@/types/cms';

const DEFAULT_YEAR = 2026;

// ============================================================================
// useCmsPlans - Query plans with filters
// ============================================================================

interface UseCmsPlansResult {
  plans: CmsPlan[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCmsPlans(filters: PlanFilters = {}): UseCmsPlansResult {
  const [plans, setPlans] = useState<CmsPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    year = DEFAULT_YEAR,
    stateCode,
    countyFips,
    planTypes,
    snpTypes,
    maxPremium,
    carrierId,
    isActive = true,
  } = filters;

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('cms_plans')
        .select('*')
        .eq('year', year);

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      if (planTypes && planTypes.length > 0) {
        query = query.in('plan_type', planTypes);
      }

      if (snpTypes && snpTypes.length > 0) {
        query = query.in('snp_type', snpTypes);
      }

      if (maxPremium !== undefined) {
        query = query.lte('monthly_premium', maxPremium);
      }

      if (carrierId) {
        query = query.eq('carrier_id', carrierId);
      }

      // If filtering by county, we need to get plan IDs from service areas first
      if (countyFips && stateCode) {
        const { data: serviceAreas, error: saError } = await supabase
          .from('cms_service_areas')
          .select('cms_plan_id')
          .eq('county_fips', countyFips)
          .eq('state_code', stateCode)
          .eq('year', year);

        if (saError) throw saError;

        const planIds = [...new Set(serviceAreas?.map((sa) => sa.cms_plan_id) || [])];
        if (planIds.length === 0) {
          setPlans([]);
          return;
        }

        query = query.in('id', planIds);
      }

      query = query.order('monthly_premium', { ascending: true });

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const transformed = (data as CmsPlanRow[]).map(transformCmsPlanRow);
      setPlans(transformed);
    } catch (err) {
      console.error('Error fetching CMS plans:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
    } finally {
      setIsLoading(false);
    }
  }, [year, stateCode, countyFips, planTypes, snpTypes, maxPremium, carrierId, isActive]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, isLoading, error, refetch: fetchPlans };
}

// ============================================================================
// usePlansByCounty - Get plans for a specific county
// ============================================================================

interface UsePlansByCountyResult {
  plans: CmsPlan[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePlansByCounty(
  stateCode: string | null,
  countyFips: string | null,
  year: number = DEFAULT_YEAR
): UsePlansByCountyResult {
  const [plans, setPlans] = useState<CmsPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!stateCode || !countyFips) {
      setPlans([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First get plan IDs from service areas
      const { data: serviceAreas, error: saError } = await supabase
        .from('cms_service_areas')
        .select('cms_plan_id')
        .eq('county_fips', countyFips)
        .eq('state_code', stateCode)
        .eq('year', year);

      if (saError) throw saError;

      const planIds = [...new Set(serviceAreas?.map((sa) => sa.cms_plan_id) || [])];

      if (planIds.length === 0) {
        setPlans([]);
        return;
      }

      // Then get the plans
      const { data: planData, error: planError } = await supabase
        .from('cms_plans')
        .select('*')
        .in('id', planIds)
        .eq('year', year)
        .eq('is_active', true)
        .order('monthly_premium', { ascending: true });

      if (planError) throw planError;

      const transformed = (planData as CmsPlanRow[]).map(transformCmsPlanRow);
      setPlans(transformed);
    } catch (err) {
      console.error('Error fetching plans by county:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
    } finally {
      setIsLoading(false);
    }
  }, [stateCode, countyFips, year]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, isLoading, error, refetch: fetchPlans };
}

// ============================================================================
// useCmsCounties - Get unique counties from service areas
// ============================================================================

interface UseCmsCountiesResult {
  counties: CmsCounty[];
  isLoading: boolean;
  error: Error | null;
}

export function useCmsCounties(
  stateCode: string = 'KY',
  year: number = DEFAULT_YEAR
): UseCmsCountiesResult {
  const [counties, setCounties] = useState<CmsCounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCounties = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('cms_service_areas')
          .select('county_fips, county_name')
          .eq('state_code', stateCode)
          .eq('year', year)
          .order('county_name');

        if (queryError) throw queryError;

        // Deduplicate counties
        const uniqueCounties = new Map<string, CmsCounty>();
        for (const row of data || []) {
          if (row.county_fips && row.county_name && !uniqueCounties.has(row.county_fips)) {
            uniqueCounties.set(row.county_fips, {
              fips: row.county_fips,
              name: row.county_name,
            });
          }
        }

        // Sort by name
        const sorted = Array.from(uniqueCounties.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setCounties(sorted);
      } catch (err) {
        console.error('Error fetching counties:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch counties'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounties();
  }, [stateCode, year]);

  return { counties, isLoading, error };
}

// ============================================================================
// usePlanById - Get a single plan by ID
// ============================================================================

interface UsePlanByIdResult {
  plan: CmsPlan | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePlanById(planId: string | null): UsePlanByIdResult {
  const [plan, setPlan] = useState<CmsPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!planId) {
      setPlan(null);
      setIsLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('cms_plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (queryError) throw queryError;

        setPlan(data ? transformCmsPlanRow(data as CmsPlanRow) : null);
      } catch (err) {
        console.error('Error fetching plan:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch plan'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  return { plan, isLoading, error };
}

// ============================================================================
// useFilteredPlans - Client-side filtering and sorting for already-loaded plans
// ============================================================================

interface FilterAndSortOptions {
  planType?: string;
  premiumFilter?: 'all' | 'zero' | 'low';
  snpOnly?: boolean;
  sortBy?: 'premium' | 'moop' | 'rating';
}

export function useFilteredPlans(
  plans: CmsPlan[],
  options: FilterAndSortOptions
): CmsPlan[] {
  const { planType, premiumFilter, snpOnly, sortBy = 'premium' } = options;

  return useMemo(() => {
    let result = [...plans];

    // Filter by plan type
    if (planType && planType !== 'all') {
      result = result.filter((p) => p.planType === planType);
    }

    // Filter by premium
    if (premiumFilter === 'zero') {
      result = result.filter((p) => p.premium === 0);
    } else if (premiumFilter === 'low') {
      result = result.filter((p) => p.premium <= 30);
    }

    // Filter SNP only
    if (snpOnly) {
      result = result.filter((p) => p.snpType !== null);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'premium':
          return a.premium - b.premium;
        case 'moop':
          return a.moop - b.moop;
        case 'rating':
          return (b.starRating || 0) - (a.starRating || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [plans, planType, premiumFilter, snpOnly, sortBy]);
}
```

---

## 4. src/hooks/useCarrierDirectory.ts (contains useAgentCarriers)

```ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import type {
  Carrier,
  CarrierContact,
  CarrierLink,
  CarrierDocument,
  CarrierWithResources
} from '@/types/carrierDirectory';

// Import carrier logos statically
import aetnaLogo from '@/assets/aetna-logo.png';
import anthemLogo from '@/assets/anthem-logo.jpg';
import devotedLogo from '@/assets/devoted-logo.png';
import humanaLogo from '@/assets/humana-logo.png';
import uhcLogo from '@/assets/uhc-logo.png';
import wellcareLogo from '@/assets/wellcare-logo.jpg';

// Map carrier codes to their logo imports
const CARRIER_LOGOS: Record<string, string> = {
  aetna: aetnaLogo,
  anthem: anthemLogo,
  devoted: devotedLogo,
  humana: humanaLogo,
  uhc: uhcLogo,
  wellcare: wellcareLogo,
};

export interface CarrierDirectoryData {
  carriers: CarrierWithResources[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch carriers with their contacts, links, and documents for a given state.
 * Includes items where state_code matches OR state_code is NULL (nationwide).
 */
export function useCarrierDirectory(stateCode: string = 'KY'): CarrierDirectoryData {
  const [carriers, setCarriers] = useState<CarrierWithResources[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active carriers that have logos (our 6 main carriers)
      const { data: carriersData, error: carriersError } = await supabase
        .from('carriers')
        .select('id, code, name, display_name, is_active')
        .eq('is_active', true)
        .in('code', ['aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare'])
        .order('name');

      if (carriersError) throw carriersError;

      // Fetch contacts for state (including nationwide)
      const { data: contactsData, error: contactsError } = await supabase
        .from('carrier_contacts')
        .select('*')
        .or(`state_code.eq.${stateCode},state_code.is.null`);

      if (contactsError) throw contactsError;

      // Fetch links for state (including nationwide)
      const { data: linksData, error: linksError } = await supabase
        .from('carrier_links')
        .select('*')
        .or(`state_code.eq.${stateCode},state_code.is.null`)
        .order('display_order');

      if (linksError) throw linksError;

      // Fetch documents for state (including nationwide)
      const { data: documentsData, error: documentsError } = await supabase
        .from('carrier_documents')
        .select('*')
        .or(`state_code.eq.${stateCode},state_code.is.null`)
        .order('display_order');

      if (documentsError) throw documentsError;

      // Combine data - attach resources to each carrier
      const carriersWithResources: CarrierWithResources[] = (carriersData || []).map((carrier) => ({
        ...carrier,
        logo: CARRIER_LOGOS[carrier.code] || '',
        contacts: (contactsData || []).filter((c) => c.carrier_id === carrier.id) as CarrierContact[],
        links: (linksData || []).filter((l) => l.carrier_id === carrier.id) as CarrierLink[],
        documents: (documentsData || []).filter((d) => d.carrier_id === carrier.id) as CarrierDocument[],
      }));

      setCarriers(carriersWithResources);
    } catch (err) {
      console.error('Error fetching carrier directory:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch carrier directory'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [stateCode]);

  return {
    carriers,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Get the logo for a carrier by code
 */
export function getCarrierLogo(code: string): string {
  return CARRIER_LOGOS[code] || '';
}

/**
 * List of supported carriers with their display info
 */
export function useSupportedCarriers() {
  const carriers = [
    { code: 'aetna', name: 'Aetna', logo: aetnaLogo },
    { code: 'anthem', name: 'Anthem', logo: anthemLogo },
    { code: 'devoted', name: 'Devoted', logo: devotedLogo },
    { code: 'humana', name: 'Humana', logo: humanaLogo },
    { code: 'uhc', name: 'United Healthcare', logo: uhcLogo },
    { code: 'wellcare', name: 'Wellcare', logo: wellcareLogo },
  ];

  return carriers;
}

// All carriers with RTS name mapping
const ALL_CARRIERS = [
  { code: 'aetna', name: 'Aetna', logo: aetnaLogo, rtsName: 'Aetna' },
  { code: 'anthem', name: 'Anthem', logo: anthemLogo, rtsName: 'Anthem' },
  { code: 'devoted', name: 'Devoted', logo: devotedLogo, rtsName: 'Devoted Health' },
  { code: 'humana', name: 'Humana', logo: humanaLogo, rtsName: 'Humana' },
  { code: 'uhc', name: 'United Healthcare', logo: uhcLogo, rtsName: 'UHC' },
  { code: 'wellcare', name: 'Wellcare', logo: wellcareLogo, rtsName: 'Wellcare' },
];

/**
 * Get carriers the current agent is certified with (from RTS data in agent_certifications).
 * Falls back to all carriers if agent has no certifications or on error.
 */
export function useAgentCarriers() {
  const { profile } = useProfile();
  const [carriers, setCarriers] = useState<Array<{ code: string; name: string; logo: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentCarriers = async () => {
      if (!profile?.id) {
        // No profile yet - show all carriers as fallback
        setCarriers(ALL_CARRIERS.map(({ code, name, logo }) => ({ code, name, logo })));
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('agent_certifications')
          .select('carrier_name')
          .eq('profile_id', profile.id);

        if (error) throw error;

        if (!data || data.length === 0) {
          // No certifications - show all carriers
          setCarriers(ALL_CARRIERS.map(({ code, name, logo }) => ({ code, name, logo })));
        } else {
          // Filter to only carriers agent is certified with
          const agentCarrierNames = new Set(data.map(d => d.carrier_name));

          const filtered = ALL_CARRIERS
            .filter(c => agentCarrierNames.has(c.rtsName))
            .map(({ code, name, logo }) => ({ code, name, logo }));

          // If no matches found, fall back to all carriers
          setCarriers(filtered.length > 0 ? filtered : ALL_CARRIERS.map(({ code, name, logo }) => ({ code, name, logo })));
        }
      } catch (err) {
        console.error('Error fetching agent carriers:', err);
        // On error, show all carriers
        setCarriers(ALL_CARRIERS.map(({ code, name, logo }) => ({ code, name, logo })));
      } finally {
        setLoading(false);
      }
    };

    fetchAgentCarriers();
  }, [profile?.id]);

  return { carriers, loading };
}
```

---

## 5. src/types/cms.ts

```ts
/**
 * CMS Plan Types
 *
 * Types for Medicare Advantage plan data from the cms_plans and cms_service_areas tables.
 */

import type { Tables } from '@/integrations/supabase/types';

// Database row types
export type CmsPlanRow = Tables<'cms_plans'>;
export type CmsServiceAreaRow = Tables<'cms_service_areas'>;

/**
 * CMS Plan with computed fields for display
 */
export interface CmsPlan {
  id: string;
  contractId: string;
  planId: string;
  segmentId: string | null;
  organizationName: string;
  planName: string | null;
  planType: string;
  snpType: string | null;

  // Costs
  premium: number;
  deductible: number;
  moop: number;
  drugDeductible: number | null;
  starRating: number | null;

  // Carrier link
  carrierId: string | null;

  // Benefits (flattened for easy access)
  benefits: CmsPlanBenefits;

  // Metadata
  year: number;
  isActive: boolean;
  isCommissionable: boolean;
}

export interface CmsPlanBenefits {
  pcpCopay: string | null;
  specialistCopay: string | null;
  inpatientCopay: string | null;
  outpatientCopay: string | null;
  emergencyCopay: string | null;
  urgentCareCopay: string | null;
  telehealthCopay: string | null;

  // Drug tiers
  drugTier1: string | null;
  drugTier2: string | null;
  drugTier3: string | null;
  drugTier4: string | null;
  drugTier5: string | null;

  // Supplemental
  dental: {
    preventive: string | null;
    comprehensive: string | null;
    maxCoverage: number | null;
  } | null;
  vision: {
    examCopay: string | null;
    eyewearAllowance: number | null;
  } | null;
  hearing: {
    examCopay: string | null;
    aidAllowance: string | null; // TEXT: "$2,000" or "$699 copay/aid"
  } | null;
  otcAllowance: number | null;
  fitness: string | null;
  transportation: string | null;
  meals: string | null;
}

/**
 * Service area record
 */
export interface CmsServiceArea {
  id: string;
  cmsPlanId: string;
  contractId: string;
  planId: string;
  stateCode: string;
  countyFips: string;
  countyName: string | null;
  year: number;
}

/**
 * County for dropdown
 */
export interface CmsCounty {
  fips: string;
  name: string;
}

/**
 * Filters for plan queries
 */
export interface PlanFilters {
  year?: number;
  stateCode?: string;
  countyFips?: string;
  planTypes?: string[];
  snpTypes?: string[];
  maxPremium?: number;
  carrierId?: string;
  isActive?: boolean;
}

/**
 * Transform database row to CmsPlan interface
 */
export function transformCmsPlanRow(row: CmsPlanRow): CmsPlan {
  const hasDental = row.dental_preventive || row.dental_comprehensive || row.dental_max_coverage;
  const hasVision = row.vision_exam_copay || row.vision_allowance;
  const hasHearing = row.hearing_exam_copay || row.hearing_aid_allowance;

  return {
    id: row.id,
    contractId: row.contract_id,
    planId: row.plan_id,
    segmentId: row.segment_id,
    organizationName: row.organization_name,
    planName: row.marketing_name,
    planType: row.plan_type,
    snpType: row.snp_type,

    premium: row.monthly_premium ?? 0,
    deductible: row.annual_deductible ?? 0,
    moop: row.moop_in_network ?? 0,
    drugDeductible: row.drug_deductible,
    starRating: row.star_rating,

    carrierId: row.carrier_id,

    benefits: {
      pcpCopay: row.pcp_copay,
      specialistCopay: row.specialist_copay,
      inpatientCopay: row.inpatient_copay,
      outpatientCopay: row.outpatient_copay,
      emergencyCopay: row.er_copay,
      urgentCareCopay: row.urgent_care_copay,
      telehealthCopay: row.telehealth_copay,

      drugTier1: row.drug_tier1,
      drugTier2: row.drug_tier2,
      drugTier3: row.drug_tier3,
      drugTier4: row.drug_tier4,
      drugTier5: row.drug_tier5,

      dental: hasDental ? {
        preventive: row.dental_preventive,
        comprehensive: row.dental_comprehensive,
        maxCoverage: row.dental_max_coverage,
      } : null,
      vision: hasVision ? {
        examCopay: row.vision_exam_copay,
        eyewearAllowance: row.vision_allowance,
      } : null,
      hearing: hasHearing ? {
        examCopay: row.hearing_exam_copay,
        aidAllowance: row.hearing_aid_allowance,
      } : null,
      otcAllowance: row.otc_allowance,
      fitness: row.fitness_benefit,
      transportation: row.transportation_notes,
      meals: row.meal_benefit,
    },

    year: row.year,
    isActive: row.is_active ?? true,
    isCommissionable: row.is_commissionable ?? true,
  };
}
```

---

## 6. DESIGN_SYSTEM.md

```md
# TIG Platform Design System

**Last Updated:** January 21, 2026
**Philosophy:** Apple/Google-inspired - clean, spacious, clear hierarchy

---

## Core Principles

1. **Hierarchy over density** - Not everything is equally important. Establish clear visual levels.
2. **Whitespace is design** - Generous padding creates calm. Don't cram.
3. **Quiet until needed** - Elements stay subtle until they need attention (hover states, errors, warnings).
4. **Consistency builds trust** - Same patterns everywhere reduce cognitive load.
5. **The interface teaches itself** - Disabled buttons, subtle icons, and clear states communicate without labels.

---

## Color System

### Brand (Identity)
```css
--brand: hsl(43, 56%, 41%)     /* Gold - avatars, logo only */
```
Usage: `bg-brand`, `text-brand`

### Primary (Interactive)
```css
--primary: hsl(217, 91%, 50%)  /* Blue - links, buttons, focus */
```
Usage: `bg-primary`, `text-primary`

### Semantic (Fixed meaning)
| Color | Usage | Tailwind |
|-------|-------|----------|
| Green | Success, complete, valid | `text-green-500`, `bg-green-500` |
| Amber | Warning, pending, attention | `text-amber-500`, `bg-amber-500` |
| Red | Error, destructive, urgent | `text-red-500`, `bg-red-500` |
| Gray | Neutral, disabled, secondary | `text-muted-foreground` |

### Hierarchy (Text)
| Level | Usage | Class |
|-------|-------|-------|
| Primary | Names, titles, important values | `text-foreground` |
| Secondary | Descriptions, metadata | `text-muted-foreground` |
| Tertiary | Timestamps, hints, placeholders | `text-muted-foreground/60` |

---

## Card Pattern

All content cards follow this structure:

```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
  {/* Header */}
  <div className="px-5 py-4 flex items-center justify-between">
    <h2 className="font-semibold text-foreground">{title}</h2>
    {/* Optional: count, action, etc */}
  </div>

  {/* Content */}
  <div className="border-t border-border/50">
    {/* Rows, lists, or content */}
  </div>

  {/* Optional Footer */}
  <div className="px-5 py-3 border-t border-border/50">
    {/* Action link or secondary info */}
  </div>
</div>
```

### Card Variants

**Standard Card** (most common)
- Header with title
- Content area
- Optional footer

**Profile/Entity Card** (for people, companies)
- Avatar + name/email stacked
- Meta row below
- Optional compliance/status footer strip

**Empty State Card**
- Centered content
- Icon (subtle, not huge)
- Primary text (what's happening)
- Secondary text (what to do next)
- Optional action button

---

## List Row Pattern

For any list of items (carriers, documents, agents, etc.):

```tsx
<div className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0 group cursor-pointer">
  {/* Left: Status + Label */}
  <div className="flex items-center gap-3">
    {/* Status indicator */}
    <div className="w-2 h-2 rounded-full bg-green-500" />
    {/* Or checkmark/circle for completion */}

    <div>
      <span className="text-sm text-foreground">{label}</span>
      {/* Optional secondary line */}
      <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
    </div>
  </div>

  {/* Right: Action or metadata */}
  <span className="text-xs text-muted-foreground">{date}</span>
  {/* Or icon that appears on hover */}
  <Eye className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
</div>
```

### Status Indicators

**Dot pattern** (for status that doesn't need a label):
```tsx
<div className={`w-2 h-2 rounded-full ${
  status === 'complete' ? 'bg-green-500' :
  status === 'pending' ? 'bg-amber-500' :
  status === 'error' ? 'bg-red-500' : 'bg-gray-300'
}`} />
```

**Checkmark pattern** (for completion):
```tsx
{isComplete ? (
  <CheckCircle2 className="w-4 h-4 text-green-500" />
) : (
  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />
)}
```

---

## Avatar Pattern

```tsx
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/80 to-brand text-white flex items-center justify-center text-lg font-semibold shadow-sm">
  {initials}
</div>
```

Sizes:
- Small: `w-8 h-8 text-sm` (lists, compact views)
- Medium: `w-10 h-10 text-base` (cards, tables)
- Large: `w-14 h-14 text-lg` (profile headers)

---

## Button Patterns

**Primary Action:**
```tsx
<Button className="bg-primary hover:bg-primary/90 text-white">
  Save Changes
</Button>
```

**Secondary Action:**
```tsx
<Button variant="outline">
  Cancel
</Button>
```

**Destructive:**
```tsx
<Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
  Delete
</Button>
```

**Text/Link Action (in cards):**
```tsx
<button className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">
  Request carrier
</button>
```

---

## Empty States

Structure:
```tsx
<div className="px-5 py-12 text-center">
  {/* Icon - subtle, not huge */}
  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-3" />

  {/* Primary message - what's happening */}
  <p className="text-sm font-medium text-foreground">All set.</p>

  {/* Secondary message - context */}
  <p className="text-sm text-muted-foreground mt-1">
    We're getting you contracted with your carriers.
  </p>

  {/* Tertiary - timeline or hint */}
  <p className="text-xs text-muted-foreground/60 mt-2">
    Usually takes 3–4 business days.
  </p>

  {/* Optional action */}
  <Button variant="outline" size="sm" className="mt-4">
    Get Started
  </Button>
</div>
```

Messaging tone:
- Positive framing ("All set" not "Nothing here")
- Clear next step when applicable
- Warm, not robotic

---

## Form Patterns

**Inline Edit (click to edit):**
```tsx
<span
  onClick={handleEdit}
  className="group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors inline-flex items-center"
>
  {value}
  <Pencil className="h-3 w-3 ml-2 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
</span>
```

**Dialog/Modal:**
- Use shadcn Dialog
- max-w-md for simple forms
- max-w-lg for forms with more fields
- max-w-4xl for complex layouts (side-by-side)

**Required fields:**
- Don't use asterisks or "required" labels
- Disable submit button until valid (Apple pattern)

---

## Spacing Scale

Consistent spacing creates rhythm:

| Token | Value | Usage |
|-------|-------|-------|
| px-5 py-4 | 20px / 16px | Card headers |
| px-5 py-3 | 20px / 12px | List rows, card footers |
| gap-3 | 12px | Icon + label |
| gap-5 | 20px | Compliance items, meta items |
| gap-6 | 24px | Meta row items |
| mt-1 | 4px | Secondary text below primary |
| mt-0.5 | 2px | Tertiary text (expiration dates) |

---

## Typography

| Element | Classes |
|---------|---------|
| Page title | `text-xl font-semibold text-foreground` |
| Card title | `font-semibold text-foreground` |
| Section label | `text-xs font-medium text-muted-foreground uppercase tracking-wide` |
| Body text | `text-sm text-foreground` |
| Secondary text | `text-sm text-muted-foreground` |
| Tertiary text | `text-xs text-muted-foreground` |
| Hint/placeholder | `text-xs text-muted-foreground/60` |

---

## Animation & Transitions

Keep it subtle:

```tsx
// Standard transition for interactive elements
className="transition-colors"

// For hover reveals (icons appearing)
className="opacity-0 group-hover:opacity-100 transition-opacity"

// For loading states
<Loader2 className="h-4 w-4 animate-spin" />
```

Avoid:
- Bouncing
- Sliding panels (unless absolutely necessary)
- Anything that delays the user

---

## Do / Don't

| Do | Don't |
|----|-------|
| Use whitespace generously | Cram everything together |
| Let disabled states communicate | Add "required" labels |
| Use dots/checkmarks for status | Use badges for everything |
| Keep text short and warm | Use jargon or robotic language |
| Show icons on hover | Show all icons all the time |
| Use blue for interactive, green for success | Use brand color for everything |
| Use sentence case | USE ALL CAPS (except rare section labels) |

---

## Claude Code Usage

When prompting Claude Code for new features, include:

```
Follow the TIG Platform design system:
- Cards: rounded-xl, shadow-sm, border-border/50, overflow-hidden
- Headers: px-5 py-4, font-semibold
- List rows: px-5 py-3, hover:bg-muted/30, border-t border-border/30 first:border-t-0
- Status dots: w-2 h-2 rounded-full (green/amber/red/gray)
- Empty states: centered, icon + primary text + secondary text
- Interactive text: text-primary, font-medium
- Refer to DESIGN_SYSTEM.md for full patterns
```

---

## File Reference

This system is implemented in:
- `src/pages/admin/AgentProfilePage.tsx` - Profile card, carriers card, notes
- `src/components/admin/AgentDocumentsSection.tsx` - Documents card
- `src/index.css` - Color variables
- `tailwind.config.ts` - Color definitions
```

---

## 7. src/components/medicare/PlanDetailModal.tsx (StarRating section, lines 45-89)

```tsx
interface PlanDetailModalProps {
  plan: CmsPlan | null;
  open: boolean;
  onClose: () => void;
  onAddToCompare?: (plan: CmsPlan) => void;
  isInCompare?: boolean;
}

// ============================================================================
// Star Rating Component
// ============================================================================

const StarRating = ({ rating }: { rating: number | null }) => {
  if (!rating) return <span className="text-muted-foreground">Not rated</span>;

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

// ============================================================================
// Benefit Row Component
// ============================================================================

const BenefitRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number | null | undefined;
  highlight?: boolean;
}) => {
  const displayValue = value === null || value === undefined ? 'N/A' : String(value);
  const isNotCovered = displayValue === 'N/A' || displayValue === 'Not covered' || displayValue === 'None';

  return (
    // ... continues
```

---

## Notes for Sprint

- **useCmsCounties** is exported from `useCmsPlans.ts` (not a separate file)
- **useAgentCarriers** is exported from `useCarrierDirectory.ts` (not a separate file)
- CarrierResourcesPage already has a "Plan Documents" button linking to `/carrier-resources/plans`
- CmsPlan type includes `carrierId` which can be used to filter plans by carrier
- Star ratings use amber-400 color with fill for active stars
- Plan types: HMO, PPO, HMO-POS
- SNP types shown as amber badge
- Premium $0 shown in green-600
