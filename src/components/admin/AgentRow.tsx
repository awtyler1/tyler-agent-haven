import { ChevronRight } from 'lucide-react';

interface AgentRowProps {
  id: string;
  name: string;
  email?: string;
  onClick: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function AgentRow({ id, name, email, onClick }: AgentRowProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-[#E5E2DB]"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center justify-center">
          {getInitials(name)}
        </div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          {email && <p className="text-sm text-muted-foreground">{email}</p>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
