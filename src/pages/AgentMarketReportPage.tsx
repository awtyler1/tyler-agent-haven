import { useEffect } from 'react';
import { KentuckyMarketReport } from '@/components/reports/KentuckyMarketReport';

// ============================================================================
// AGENT report page — /market-report (inside the agent shell)
// Renders the Kentucky Medicare Market Report embedded: no public nav, no
// recruiting CTA, no public footer. The agent stays in the hub while reading.
// ============================================================================

export default function AgentMarketReportPage() {
  useEffect(() => {
    document.title = 'Kentucky Medicare Market Report | Tyler Insurance Group';
  }, []);

  return <KentuckyMarketReport embedded />;
}
