import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export interface PlanFilterValues {
  planType: string;
  premium: 'all' | 'zero' | 'low';
  snpOnly: boolean;
  sortBy: 'premium' | 'moop' | 'rating';
}

interface PlanFiltersProps {
  filters: PlanFilterValues;
  onChange: (filters: PlanFilterValues) => void;
  compact?: boolean;
}

export function PlanFilters({ filters, onChange, compact = false }: PlanFiltersProps) {
  const update = (key: keyof PlanFilterValues, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${compact ? '' : 'mb-4'}`}>
      {/* Plan Type */}
      <Select
        value={filters.planType}
        onValueChange={(v) => update('planType', v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Plan Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="HMO">HMO</SelectItem>
          <SelectItem value="PPO">PPO</SelectItem>
          <SelectItem value="HMO-POS">HMO-POS</SelectItem>
        </SelectContent>
      </Select>

      {/* Premium */}
      <Select
        value={filters.premium}
        onValueChange={(v) => update('premium', v as PlanFilterValues['premium'])}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Premium" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Premium</SelectItem>
          <SelectItem value="zero">$0 Premium</SelectItem>
          <SelectItem value="low">$30 or less</SelectItem>
        </SelectContent>
      </Select>

      {/* SNP Only */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="snp-filter"
          checked={filters.snpOnly}
          onCheckedChange={(checked) => update('snpOnly', !!checked)}
        />
        <label
          htmlFor="snp-filter"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          SNP Only
        </label>
      </div>

      {/* Sort */}
      <Select
        value={filters.sortBy}
        onValueChange={(v) => update('sortBy', v as PlanFilterValues['sortBy'])}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="premium">Sort: Premium</SelectItem>
          <SelectItem value="moop">Sort: Max OOP</SelectItem>
          <SelectItem value="rating">Sort: Rating</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default PlanFilters;
