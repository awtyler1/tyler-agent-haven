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
    aidAllowance: number | null;
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
