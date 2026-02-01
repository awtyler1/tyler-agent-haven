import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Star,
  ChevronDown,
  FileText,
  ExternalLink,
  DollarSign,
  Stethoscope,
  Pill,
  Eye,
  Ear,
  Sparkles,
} from 'lucide-react';
import { type CmsPlan } from '@/types/cms';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

interface PlanDocument {
  id: string;
  documentType: string;
  displayName: string | null;
  externalUrl: string | null;
  filePath: string | null;
}

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
    <div className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium ${
          highlight && !isNotCovered
            ? 'text-green-600'
            : isNotCovered
            ? 'text-muted-foreground'
            : 'text-foreground'
        }`}
      >
        {displayValue}
      </span>
    </div>
  );
};

// ============================================================================
// Collapsible Section Component
// ============================================================================

const Section = ({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{title}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 px-4">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// ============================================================================
// Document Type Labels
// ============================================================================

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  sob: 'Summary of Benefits',
  eoc: 'Evidence of Coverage',
  anoc: 'Annual Notice of Changes',
  formulary: 'Drug Formulary',
  provider_directory: 'Provider Directory',
  pharmacy_directory: 'Pharmacy Directory',
};

// ============================================================================
// Main Component
// ============================================================================

export function PlanDetailModal({
  plan,
  open,
  onClose,
  onAddToCompare,
  isInCompare = false,
}: PlanDetailModalProps) {
  const [documents, setDocuments] = useState<PlanDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Fetch documents when plan changes
  useEffect(() => {
    if (!plan || !open) {
      setDocuments([]);
      return;
    }

    const fetchDocuments = async () => {
      setDocumentsLoading(true);
      try {
        const { data, error } = await supabase
          .from('plan_documents')
          .select('id, document_type, display_name, external_url, file_path')
          .eq('cms_plan_id', plan.id)
          .eq('year', plan.year);

        if (error) throw error;

        setDocuments(
          (data || []).map((doc) => ({
            id: doc.id,
            documentType: doc.document_type,
            displayName: doc.display_name,
            externalUrl: doc.external_url,
            filePath: doc.file_path,
          }))
        );
      } catch (err) {
        console.error('Error fetching plan documents:', err);
        setDocuments([]);
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [plan?.id, plan?.year, open]);

  if (!plan) return null;

  const displayId = `${plan.contractId}-${plan.planId}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          {/* Organization and Plan ID */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>{plan.organizationName}</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-xs">{displayId}</span>
          </div>

          {/* Plan Name */}
          <DialogTitle className="text-xl font-semibold text-foreground pr-8">
            {plan.planName || displayId}
          </DialogTitle>

          {/* Badges and Rating */}
          <div className="flex items-center flex-wrap gap-3 mt-3">
            <Badge variant={plan.planType === 'HMO' ? 'default' : 'secondary'}>
              {plan.planType}
            </Badge>
            {plan.snpType && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {plan.snpType}
              </Badge>
            )}
            <StarRating rating={plan.starRating} />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-3 py-4">
          {/* Costs Overview - Always Open */}
          <Section title="Costs Overview" icon={DollarSign} defaultOpen={true}>
            <BenefitRow
              label="Monthly Premium"
              value={plan.premium === 0 ? '$0' : `$${plan.premium}/mo`}
              highlight={plan.premium === 0}
            />
            <BenefitRow
              label="Annual Deductible"
              value={plan.deductible === 0 ? '$0' : `$${plan.deductible.toLocaleString()}`}
              highlight={plan.deductible === 0}
            />
            <BenefitRow
              label="Drug Deductible"
              value={
                plan.drugDeductible === null || plan.drugDeductible === 0
                  ? '$0'
                  : `$${plan.drugDeductible}`
              }
              highlight={plan.drugDeductible === 0 || plan.drugDeductible === null}
            />
            <BenefitRow
              label="Max Out-of-Pocket (In-Network)"
              value={`$${plan.moop.toLocaleString()}`}
            />
          </Section>

          {/* Medical Services */}
          <Section title="Medical Services" icon={Stethoscope} defaultOpen={true}>
            <BenefitRow label="Primary Care Visit" value={plan.benefits.pcpCopay} />
            <BenefitRow label="Specialist Visit" value={plan.benefits.specialistCopay} />
            <BenefitRow label="Emergency Room" value={plan.benefits.emergencyCopay} />
            <BenefitRow label="Urgent Care" value={plan.benefits.urgentCareCopay} />
            <BenefitRow label="Inpatient Hospital" value={plan.benefits.inpatientCopay} />
            <BenefitRow label="Outpatient Surgery" value={plan.benefits.outpatientCopay} />
            <BenefitRow
              label="Telehealth"
              value={plan.benefits.telehealthCopay}
              highlight={plan.benefits.telehealthCopay === '$0'}
            />
          </Section>

          {/* Prescription Drugs */}
          <Section title="Prescription Drugs" icon={Pill}>
            <BenefitRow
              label="Tier 1 (Preferred Generic)"
              value={plan.benefits.drugTier1}
              highlight={plan.benefits.drugTier1 === '$0'}
            />
            <BenefitRow label="Tier 2 (Generic)" value={plan.benefits.drugTier2} />
            <BenefitRow label="Tier 3 (Preferred Brand)" value={plan.benefits.drugTier3} />
            <BenefitRow label="Tier 4 (Non-Preferred Drug)" value={plan.benefits.drugTier4} />
            <BenefitRow label="Tier 5 (Specialty)" value={plan.benefits.drugTier5} />
          </Section>

          {/* Dental Benefits */}
          <Section title="Dental Benefits" icon={() => <span className="text-sm">🦷</span>}>
            {plan.benefits.dental ? (
              <>
                <BenefitRow
                  label="Preventive"
                  value={plan.benefits.dental.preventive}
                  highlight={plan.benefits.dental.preventive === '$0'}
                />
                <BenefitRow label="Comprehensive" value={plan.benefits.dental.comprehensive} />
                <BenefitRow
                  label="Annual Maximum"
                  value={
                    plan.benefits.dental.maxCoverage
                      ? `$${plan.benefits.dental.maxCoverage.toLocaleString()}`
                      : null
                  }
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Dental benefits not included</p>
            )}
          </Section>

          {/* Vision Benefits */}
          <Section title="Vision Benefits" icon={Eye}>
            {plan.benefits.vision ? (
              <>
                <BenefitRow
                  label="Eye Exam"
                  value={plan.benefits.vision.examCopay}
                  highlight={plan.benefits.vision.examCopay === '$0'}
                />
                <BenefitRow
                  label="Eyewear Allowance"
                  value={
                    plan.benefits.vision.eyewearAllowance
                      ? `$${plan.benefits.vision.eyewearAllowance}/year`
                      : null
                  }
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Vision benefits not included</p>
            )}
          </Section>

          {/* Hearing Benefits */}
          <Section title="Hearing Benefits" icon={Ear}>
            {plan.benefits.hearing ? (
              <>
                <BenefitRow
                  label="Hearing Exam"
                  value={plan.benefits.hearing.examCopay}
                  highlight={plan.benefits.hearing.examCopay === '$0'}
                />
                <BenefitRow
                  label="Hearing Aid Allowance"
                  value={
                    plan.benefits.hearing.aidAllowance
                      ? `$${plan.benefits.hearing.aidAllowance}/year`
                      : null
                  }
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Hearing benefits not included</p>
            )}
          </Section>

          {/* Additional Benefits */}
          <Section title="Additional Benefits" icon={Sparkles}>
            <BenefitRow
              label="OTC Allowance"
              value={
                plan.benefits.otcAllowance
                  ? `$${plan.benefits.otcAllowance}/month`
                  : 'None'
              }
              highlight={!!plan.benefits.otcAllowance}
            />
            <BenefitRow label="Fitness Program" value={plan.benefits.fitness || 'None'} />
            <BenefitRow label="Transportation" value={plan.benefits.transportation || 'None'} />
            <BenefitRow label="Post-Hospital Meals" value={plan.benefits.meals || 'None'} />
          </Section>

          {/* Plan Documents */}
          <Section title="Plan Documents" icon={FileText}>
            {documentsLoading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-2 py-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.externalUrl || doc.filePath || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted transition-colors group"
                  >
                    <span className="text-sm text-foreground">
                      {doc.displayName || DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                No documents available for this plan
              </p>
            )}
          </Section>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border pt-4">
          <div className="flex items-center justify-between w-full gap-3">
            <p className="text-xs text-muted-foreground">
              {plan.year} Plan Year • {plan.isActive ? 'Active' : 'Inactive'}
            </p>
            <div className="flex gap-2">
              {onAddToCompare && (
                <Button
                  variant={isInCompare ? 'default' : 'outline'}
                  onClick={() => onAddToCompare(plan)}
                >
                  {isInCompare ? '✓ In Compare' : 'Add to Compare'}
                </Button>
              )}
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PlanDetailModal;
