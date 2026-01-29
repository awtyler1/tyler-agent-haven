import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, Star, Heart, ArrowRight, X } from 'lucide-react';
import {
  KENTUCKY_COUNTIES,
  getPlansForCounty,
  getCountyFromZip,
  type MAPlan
} from '@/data/kentucky-plans-2026';
import { PlanComparison } from '@/components/medicare/PlanComparison';

// Star rating display
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

// Plan card component
const PlanCard = ({
  plan,
  onCompare,
  isInCompare
}: {
  plan: MAPlan;
  onCompare: (plan: MAPlan) => void;
  isInCompare: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

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
                <span className="text-xs text-muted-foreground">{plan.id}</span>
              </div>
              <h3 className="font-semibold text-foreground truncate">{plan.planName}</h3>
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
              <span className="font-medium text-foreground">{plan.benefits.pcpCopay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Specialist</span>
              <span className="font-medium text-foreground">{plan.benefits.specialistCopay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emergency</span>
              <span className="font-medium text-foreground">{plan.benefits.emergencyCopay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inpatient</span>
              <span className="font-medium text-foreground truncate max-w-[120px]" title={plan.benefits.inpatientCopay}>
                {plan.benefits.inpatientCopay}
              </span>
            </div>
          </div>
        </div>

        {/* Extra Benefits Summary */}
        <div className="px-5 py-3 flex flex-wrap gap-2">
          {plan.benefits.dental && (
            <Badge variant="outline" className="text-xs bg-background">✓ Dental</Badge>
          )}
          {plan.benefits.vision && (
            <Badge variant="outline" className="text-xs bg-background">✓ Vision</Badge>
          )}
          {plan.benefits.hearing && (
            <Badge variant="outline" className="text-xs bg-background">✓ Hearing</Badge>
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
                        {[plan.benefits.drugTier1, plan.benefits.drugTier2, plan.benefits.drugTier3,
                          plan.benefits.drugTier4, plan.benefits.drugTier5][i]}
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
                      <div>Preventive: {plan.benefits.dental.preventive}</div>
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
                      <div>Exam: {plan.benefits.vision.examCopay}</div>
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
                      <div>Exam: {plan.benefits.hearing.examCopay}</div>
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
          <Button variant="link" className="px-0 text-gold" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show Less' : 'View Details'}
          </Button>
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

export default function PlanFinderPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<{ code: string; name: string } | null>(null);
  const [comparePlans, setComparePlans] = useState<MAPlan[]>([]);
  const [view, setView] = useState<'finder' | 'compare'>('finder');
  const [filters, setFilters] = useState({
    planType: 'all',
    premium: 'all',
    snpOnly: false,
  });
  const [sortBy, setSortBy] = useState<'premium' | 'moop' | 'rating'>('premium');

  // Get plans for selected county
  const plans = useMemo(() => {
    if (!selectedCounty) return [];
    return getPlansForCounty(selectedCounty.code);
  }, [selectedCounty]);

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    let result = [...plans];

    if (filters.planType !== 'all') {
      result = result.filter(p => p.planType === filters.planType);
    }
    if (filters.premium === 'zero') {
      result = result.filter(p => p.premium === 0);
    } else if (filters.premium === 'low') {
      result = result.filter(p => p.premium <= 30);
    }
    if (filters.snpOnly) {
      result = result.filter(p => p.snpType !== null);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'premium': return a.premium - b.premium;
        case 'moop': return a.moop - b.moop;
        case 'rating': return (b.starRating || 0) - (a.starRating || 0);
        default: return 0;
      }
    });

    return result;
  }, [plans, filters, sortBy]);

  // Handle search
  const handleSearch = () => {
    const input = searchInput.trim().toLowerCase();
    if (!input) return;

    if (/^\d{5}$/.test(input)) {
      // Zip code lookup
      const county = getCountyFromZip(input);
      if (county) {
        setSelectedCounty({ code: county.countyCode, name: county.countyName });
      } else {
        // Default to Jefferson County if ZIP not found
        setSelectedCounty({ code: '18550', name: 'Jefferson' });
      }
    } else {
      // County name search
      const match = KENTUCKY_COUNTIES.find(c =>
        c.name.toLowerCase().includes(input)
      );
      if (match) {
        setSelectedCounty({ code: match.code, name: match.name });
      }
    }
  };

  // Handle compare
  const handleCompare = (plan: MAPlan) => {
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
            <Button onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Quick County Select */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-2 py-1">Popular:</span>
            {KENTUCKY_COUNTIES.slice(0, 6).map(county => (
              <Button
                key={county.code}
                variant={selectedCounty?.code === county.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCounty({ code: county.code, name: county.name })}
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
                {filteredPlans.length} Plans in {selectedCounty.name} County
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
                </SelectContent>
              </Select>

              <Select value={filters.premium} onValueChange={(v) => setFilters(f => ({ ...f, premium: v }))}>
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

          {/* Plan Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onCompare={handleCompare}
                isInCompare={isInCompare(plan.id)}
              />
            ))}
          </div>

          {filteredPlans.length === 0 && (
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
                  <span className="truncate max-w-[150px]">{plan.planName}</span>
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
    </AdminLayout>
  );
}
