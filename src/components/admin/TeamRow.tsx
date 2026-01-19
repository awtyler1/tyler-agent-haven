import { ChevronRight } from 'lucide-react';

interface TeamRowProps {
  id: string;
  name: string;
  email?: string;
  teamSize: number;
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

export function TeamRow({ id, name, email, teamSize, onClick }: TeamRowProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-[#E5E2DB]"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/10 text-gold font-medium flex items-center justify-center">
          {getInitials(name)}
        </div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          {email && <p className="text-sm text-muted-foreground">{email}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{teamSize} people</span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}
