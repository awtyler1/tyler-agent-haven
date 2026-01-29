import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Star, ChevronDown, Printer, X } from 'lucide-react';
import { type MAPlan } from '@/data/kentucky-plans-2026';

interface ComparisonCategory {
  name: string;
  items: {
    label: string;
    getValue: (plan: MAPlan) => string | number | null;
    format?: (value: any) => string;
    highlight?: 'low' | 'high' | 'zero';
  }[];
}

const COMPARISON_CATEGORIES: ComparisonCategory[] = [
  {
    name: 'Costs',
    items: [
      { label: 'Monthly Premium', getValue: (p) => p.premium, format: (v) => v === 0 ? '$0' : `$${v}/mo`, highlight: 'low' },
      { label: 'Medical Deductible', getValue: (p) => p.deductible, format: (v) => v === 0 ? '$0' : `$${v}`, highlight: 'low' },
      { label: 'Max Out-of-Pocket', getValue: (p) => p.moop, format: (v) => `$${v.toLocaleString()}`, highlight: 'low' },
      { label: 'Drug Deductible', getValue: (p) => p.drugDeductible ?? 0, format: (v) => v === 0 ? '$0' : `$${v}`, highlight: 'low' },
    ]
  },
  {
    name: 'Medical Services',
    items: [
      { label: 'Primary Care Visit', getValue: (p) => p.benefits.pcpCopay, highlight: 'zero' },
      { label: 'Specialist Visit', getValue: (p) => p.benefits.specialistCopay },
      { label: 'Inpatient Hospital', getValue: (p) => p.benefits.inpatientCopay },
      { label: 'Outpatient Surgery', getValue: (p) => p.benefits.outpatientCopay },
      { label: 'Emergency Room', getValue: (p) => p.benefits.emergencyCopay },
      { label: 'Urgent Care', getValue: (p) => p.benefits.urgentCareCopay },
      { label: 'Telehealth', getValue: (p) => p.benefits.telehealth ?? 'Not covered', highlight: 'zero' },
    ]
  },
  {
    name: 'Prescription Drugs',
    items: [
      { label: 'Tier 1 (Preferred Generic)', getValue: (p) => p.benefits.drugTier1, highlight: 'zero' },
      { label: 'Tier 2 (Generic)', getValue: (p) => p.benefits.drugTier2 },
      { label: 'Tier 3 (Preferred Brand)', getValue: (p) => p.benefits.drugTier3 },
      { label: 'Tier 4 (Non-Preferred)', getValue: (p) => p.benefits.drugTier4 },
      { label: 'Tier 5 (Specialty)', getValue: (p) => p.benefits.drugTier5 },
    ]
  },
  {
    name: 'Dental',
    items: [
      { label: 'Preventive', getValue: (p) => p.benefits.dental?.preventive ?? 'Not covered', highlight: 'zero' },
      { label: 'Comprehensive', getValue: (p) => p.benefits.dental?.comprehensive ?? 'Not covered' },
      { label: 'Annual Maximum', getValue: (p) => p.benefits.dental?.maxCoverage ?? null, format: (v) => v ? `$${v.toLocaleString()}` : 'N/A', highlight: 'high' },
    ]
  },
  {
    name: 'Vision',
    items: [
      { label: 'Eye Exam', getValue: (p) => p.benefits.vision?.examCopay ?? 'Not covered', highlight: 'zero' },
      { label: 'Eyewear Allowance', getValue: (p) => p.benefits.vision?.eyewearAllowance ?? null, format: (v) => v ? `$${v}/year` : 'N/A', highlight: 'high' },
    ]
  },
  {
    name: 'Hearing',
    items: [
      { label: 'Hearing Exam', getValue: (p) => p.benefits.hearing?.examCopay ?? 'Not covered', highlight: 'zero' },
      { label: 'Hearing Aid Allowance', getValue: (p) => p.benefits.hearing?.aidAllowance ?? null, format: (v) => v ? `$${v}/year` : 'N/A', highlight: 'high' },
    ]
  },
  {
    name: 'Additional Benefits',
    items: [
      { label: 'OTC Allowance', getValue: (p) => p.benefits.otcAllowance ?? null, format: (v) => v ? `$${v}/month` : 'None', highlight: 'high' },
      { label: 'Fitness Program', getValue: (p) => p.benefits.fitness ?? 'None' },
      { label: 'Transportation', getValue: (p) => p.benefits.transportation ?? 'None' },
      { label: 'Post-Hospital Meals', getValue: (p) => p.benefits.meals ?? 'None' },
    ]
  },
];

// Star rating display
const StarRating = ({ rating }: { rating: number | null }) => {
  if (!rating) return <span className="text-muted-foreground">Not rated</span>;

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

// Helper to determine best value for highlighting
function getBestValueIndex(
  values: (string | number | null)[],
  highlight?: 'low' | 'high' | 'zero'
): number | null {
  if (!highlight) return null;

  const numericValues = values.map(v => {
    if (v === null) return null;
    if (typeof v === 'number') return v;
    const match = String(v).match(/\$?(\d+)/);
    return match ? parseInt(match[1]) : null;
  });

  const validIndices = numericValues
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v !== null);

  if (validIndices.length === 0) return null;

  if (highlight === 'zero') {
    const zeroIndex = numericValues.findIndex(v => v === 0);
    return zeroIndex >= 0 ? zeroIndex : null;
  }

  if (highlight === 'low') {
    const min = Math.min(...validIndices.map(({ v }) => v as number));
    return numericValues.findIndex(v => v === min);
  }

  if (highlight === 'high') {
    const max = Math.max(...validIndices.map(({ v }) => v as number));
    return numericValues.findIndex(v => v === max);
  }

  return null;
}

interface PlanComparisonProps {
  plans: MAPlan[];
  onRemovePlan?: (planId: string) => void;
}

export function PlanComparison({ plans, onRemovePlan }: PlanComparisonProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    COMPARISON_CATEGORIES.map(c => c.name)
  );
  const printRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No plans selected for comparison</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={printRef}>
      {/* Header with Print Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-serif font-medium text-foreground">Side-by-Side Comparison</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing {plans.length} plan{plans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={handlePrint} className="print:hidden">
          <Printer className="w-4 h-4 mr-2" />
          Print Comparison
        </Button>
      </div>

      {/* Plan Headers */}
      <Card className="mb-4 overflow-hidden">
        <div className="flex">
          <div className="w-48 flex-shrink-0 p-4 bg-muted/50 border-r border-border">
            <span className="text-sm font-medium text-muted-foreground">Plan Details</span>
          </div>

          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`flex-1 p-4 ${index < plans.length - 1 ? 'border-r border-border' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">{plan.organizationName}</div>
                  <div className="font-semibold text-foreground truncate" title={plan.planName}>
                    {plan.planName}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={plan.planType === 'HMO' ? 'default' : 'secondary'} className="text-xs">
                      {plan.planType}
                    </Badge>
                    {plan.snpType && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        {plan.snpType}
                      </Badge>
                    )}
                  </div>
                </div>

                {onRemovePlan && (
                  <button
                    onClick={() => onRemovePlan(plan.id)}
                    className="p-1 hover:bg-muted rounded transition-colors print:hidden"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground">Premium</div>
                  <div className={`font-bold text-lg ${plan.premium === 0 ? 'text-green-600' : 'text-foreground'}`}>
                    {plan.premium === 0 ? '$0' : `$${plan.premium}`}
                    <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Star Rating</div>
                  <StarRating rating={plan.starRating} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Comparison Categories */}
      <div className="space-y-3">
        {COMPARISON_CATEGORIES.map(category => {
          const isExpanded = expandedCategories.includes(category.name);

          return (
            <Card key={category.name} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.name)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 print:hover:bg-transparent">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">{category.name}</CardTitle>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform print:hidden ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent className="print:block">
                  <CardContent className="p-0">
                    {category.items.map((item, itemIndex) => {
                      const values = plans.map(p => item.getValue(p));
                      const bestIndex = getBestValueIndex(values, item.highlight);

                      return (
                        <div
                          key={item.label}
                          className={`flex ${itemIndex < category.items.length - 1 ? 'border-b border-border' : ''}`}
                        >
                          <div className="w-48 flex-shrink-0 px-4 py-3 bg-muted/30 border-r border-border">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                          </div>

                          {plans.map((plan, planIndex) => {
                            const value = values[planIndex];
                            const displayValue = item.format ? item.format(value) : String(value ?? 'N/A');
                            const isBest = bestIndex === planIndex;

                            return (
                              <div
                                key={plan.id}
                                className={`
                                  flex-1 px-4 py-3 text-sm
                                  ${planIndex < plans.length - 1 ? 'border-r border-border' : ''}
                                  ${isBest ? 'bg-green-50 dark:bg-green-950/20' : ''}
                                `}
                              >
                                <span className={`
                                  ${isBest ? 'text-green-700 dark:text-green-400 font-medium' : 'text-foreground'}
                                  ${displayValue === 'None' || displayValue === 'Not covered' || displayValue === 'N/A' ? 'text-muted-foreground' : ''}
                                `}>
                                  {displayValue}
                                </span>
                                {isBest && item.highlight && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    ✓ Best
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Disclaimer */}
      <Card className="mt-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Important Information</p>
              <p>
                This comparison is based on 2026 plan benefit data and is for informational purposes only.
                Benefits, costs, and availability may vary. Always verify details with the plan's official
                Summary of Benefits or Evidence of Coverage before enrolling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-border text-center text-sm text-muted-foreground">
        <p>Generated by TIG Platform • Tyler Insurance Group</p>
        <p>Comparison created on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default PlanComparison;
