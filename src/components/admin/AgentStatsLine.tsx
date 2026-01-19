interface AgentStatsLineProps {
  totalAgents: number;
  teamCount: number;
  directToTIGCount: number;
}

export function AgentStatsLine({
  totalAgents,
  teamCount,
  directToTIGCount,
}: AgentStatsLineProps) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium">{totalAgents}</span> agents ·
      <span className="font-medium">{teamCount}</span> teams ·
      <span className="font-medium">{directToTIGCount}</span> direct to TIG
    </p>
  );
}
