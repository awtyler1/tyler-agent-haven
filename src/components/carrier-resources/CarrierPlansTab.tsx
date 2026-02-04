import { useState } from 'react';
import { MapPin, Loader2, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useCmsPlans, useCmsCounties, useFilteredPlans } from '@/hooks/useCmsPlans';
import { type CmsPlan } from '@/types/cms';
import { PlanCard, PlanCardSkeleton } from '@/components/medicare/PlanCard';
import { PlanFilters, type PlanFilterValues } from '@/components/medicare/PlanFilters';
import { PlanDetailModal } from '@/components/medicare/PlanDetailModal';
import { PlanComparison } from '@/components/medicare/PlanComparison';
import { getCountyFromZip } from '@/lib/zipToCounty';

interface CarrierPlansTabProps {
  carrierId: string | null;
  carrierName: string;
  stateCode?: string;
}

const POPULAR_COUNTIES = [
  { fips: '21111', name: 'Jefferson' },
  { fips: '21067', name: 'Fayette' },
  { fips: '21117', name: 'Kenton' },
  { fips: '21227', name: 'Warren' },
];

export function CarrierPlansTab({
  carrierId,
  carrierName,
  stateCode = 'KY'
}: CarrierPlansTabProps) {
  const [zipInput, setZipInput] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<{ fips: string; name: string } | null>(null);
  const [comparePlans, setComparePlans] = useState<CmsPlan[]>([]);
  const [detailPlan, setDetailPlan] = useState<CmsPlan | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [filters, setFilters] = useState<PlanFilterValues>({
    planType: 'all',
    premium: 'all',
    snpOnly: false,
    sortBy: 'premium',
  });

  const { counties, isLoading: countiesLoading } = useCmsCounties(stateCode, 2026);

  const { plans, isLoading: plansLoading, error } = useCmsPlans({
    carrierId: carrierId || undefined,
    stateCode: selectedCounty ? stateCode : undefined,
    countyFips: selectedCounty?.fips,
    year: 2026,
  });

  const filteredPlans = useFilteredPlans(plans, {
    planType: filters.planType,
    premiumFilter: filters.premium,
    snpOnly: filters.snpOnly,
    sortBy: filters.sortBy,
  });

  const handleZipSearch = () => {
    const county = getCountyFromZip(zipInput);
    if (county) {
      setSelectedCounty(county);
    }
  };

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

  if (showComparison && comparePlans.length > 0) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowComparison(false)}
          className="mb-4"
        >
          ← Back to Plans
        </Button>
        <PlanComparison
          plans={comparePlans}
          onRemovePlan={(id) => {
            const updated = comparePlans.filter(p => p.id !== id);
            if (updated.length === 0) setShowComparison(false);
            setComparePlans(updated);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* County Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-3">
            <Select
              value={selectedCounty?.fips || ''}
              onValueChange={(fips) => {
                const county = counties.find(c => c.fips === fips);
                if (county) setSelectedCounty(county);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select county..." />
              </SelectTrigger>
              <SelectContent>
                {counties.map(county => (
                  <SelectItem key={county.fips} value={county.fips}>
                    {county.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleZipSearch()}
                placeholder="Or enter ZIP..."
                className="w-[140px]"
              />
              <Button variant="outline" onClick={handleZipSearch}>
                Go
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground py-1">Popular:</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              <h2 className="text-lg font-semibold text-foreground">
                {plansLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading plans...
                  </span>
                ) : (
                  `${filteredPlans.length} ${carrierName} Plans in ${selectedCounty.name} County`
                )}
              </h2>
            </div>
            <PlanFilters filters={filters} onChange={setFilters} compact />
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-4 text-red-700">
                Failed to load plans: {error.message}
              </CardContent>
            </Card>
          )}

          {plansLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => <PlanCardSkeleton key={i} />)}
            </div>
          ) : filteredPlans.length > 0 ? (
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
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No {carrierName} plans match your filters in {selectedCounty.name} County.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Find {carrierName} Plans
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a county or enter a ZIP code to see available {carrierName} plans.
            </p>
          </CardContent>
        </Card>
      )}

      {comparePlans.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg p-4 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Compare:
              </span>
              {comparePlans.map(plan => (
                <Badge key={plan.id} variant="secondary" className="flex items-center gap-2 py-1.5">
                  <span className="truncate max-w-[150px]">
                    {plan.planName || `${plan.contractId}-${plan.planId}`}
                  </span>
                  <button
                    onClick={() => handleCompare(plan)}
                    className="hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button onClick={() => setShowComparison(true)} className="flex-shrink-0">
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
    </div>
  );
}

export default CarrierPlansTab;
