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
