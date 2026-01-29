interface DashboardGreetingProps {
  firstName: string;
  growthStreak: number;
  newThisMonth: number;
  totalClients: number;
  isCompact?: boolean;
}

/**
 * DashboardGreeting - Contextual, personalized greeting
 *
 * Adapts headline based on agent performance:
 * - New agent (< 10 clients): "Let's build your book"
 * - Growth streak >= 3: "You're on fire"
 * - Has growth this month: "Momentum building"
 * - Default: "Welcome back"
 */
export function DashboardGreeting({
  firstName,
  growthStreak,
  newThisMonth,
  totalClients,
  isCompact = false,
}: DashboardGreetingProps) {
  const getHeadline = () => {
    if (totalClients < 10) {
      return `Let's build your book, ${firstName}.`;
    }
    if (growthStreak >= 3) {
      return `You're on fire, ${firstName}.`;
    }
    if (newThisMonth > 0) {
      return `Momentum building, ${firstName}.`;
    }
    return `Welcome back, ${firstName}.`;
  };

  // Get current month and year
  const currentDate = new Date();
  const dateLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={isCompact ? 'mb-3' : 'mb-5'}>
      <p className="text-slate-500 text-sm">{dateLabel}</p>
      <h1 className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold text-slate-800 mt-1`}>
        {getHeadline()}
      </h1>
    </div>
  );
}
