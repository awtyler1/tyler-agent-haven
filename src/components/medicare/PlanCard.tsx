import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { type CmsPlan } from '@/types/cms';
import { StarRating } from './StarRating';

interface PlanCardProps {
  plan: CmsPlan;
  onCompare: (plan: CmsPlan) => void;
  isInCompare: boolean;
  onViewDetails: (plan: CmsPlan) => void;
}

export function PlanCard({
  plan,
  onCompare,
  isInCompare,
  onViewDetails,
}: PlanCardProps) {
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
                <span className="text-sm font-medium text-muted-foreground">
                  {plan.organizationName}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground">{displayId}</span>
              </div>
              <h3 className="font-semibold text-foreground truncate">
                {plan.planName || displayId}
              </h3>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  variant={plan.planType === 'HMO' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {plan.planType}
                </Badge>
                {plan.snpType && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {plan.snpType}
                  </Badge>
                )}
                <StarRating rating={plan.starRating} />
              </div>
            </div>

            {/* Premium */}
            <div className="text-right flex-shrink-0">
              <div className={`text-2xl font-bold ${
                plan.premium === 0 ? 'text-green-600' : 'text-foreground'
              }`}>
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
            <div className="font-semibold text-foreground">
              ${plan.moop.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Drug Deductible</div>
            <div className="font-semibold text-foreground">
              {plan.drugDeductible === 0 || plan.drugDeductible === null
                ? '$0'
                : `$${plan.drugDeductible}`}
            </div>
          </div>
        </div>

        {/* Quick Benefits */}
        <div className="px-5 py-4 border-b border-border">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PCP Visit</span>
              <span className="font-medium text-foreground">
                {plan.benefits.pcpCopay || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Specialist</span>
              <span className="font-medium text-foreground">
                {plan.benefits.specialistCopay || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emergency</span>
              <span className="font-medium text-foreground">
                {plan.benefits.emergencyCopay || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inpatient</span>
              <span className="font-medium text-foreground truncate max-w-[120px]">
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
            <Badge variant="outline" className="text-xs bg-background">
              OTC ${plan.benefits.otcAllowance}/mo
            </Badge>
          )}
          {plan.benefits.fitness && (
            <Badge variant="outline" className="text-xs bg-background">
              {plan.benefits.fitness}
            </Badge>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="px-5 py-4 bg-muted/50 border-t border-border">
            <div className="space-y-4">
              {/* Drug Tiers */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Prescription Drug Copays
                </h4>
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
                        <div>Aids: {plan.benefits.hearing.aidAllowance}/year</div>
                      )}
                    </div>
                  </div>
                )}
                {plan.benefits.transportation && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Transportation</h4>
                    <div className="text-sm text-muted-foreground">
                      {plan.benefits.transportation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="link"
              className="px-0 text-gold"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : 'Quick View'}
            </Button>
            <Button
              variant="link"
              className="px-0"
              onClick={() => onViewDetails(plan)}
            >
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
}

// Loading Skeleton
export function PlanCardSkeleton() {
  return (
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
}

export default PlanCard;
