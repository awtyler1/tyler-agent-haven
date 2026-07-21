import { useEffect } from 'react';
import { KentuckyMarketReport } from '@/components/reports/KentuckyMarketReport';

// ============================================================================
// PUBLIC report page — /kentucky-medicare-market-report
// The GEO / digital-PR citation asset (prerendered, Report/Article schema).
// Renders the full public report: marketing nav, recruiting CTA, and footer.
// The in-shell agent version lives in AgentMarketReportPage (embedded).
// ============================================================================

export default function KentuckyReportPage() {
  useEffect(() => {
    document.title = 'The Kentucky Medicare Market: An Agent’s 2026 Report | Tyler Insurance Group';
  }, []);

  return <KentuckyMarketReport />;
}
