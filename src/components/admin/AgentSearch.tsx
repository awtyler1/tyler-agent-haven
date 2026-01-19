import { Search } from 'lucide-react';

interface AgentSearchProps {
  totalCount: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AgentSearch({
  totalCount,
  value,
  onChange,
  placeholder,
}: AgentSearchProps) {
  const defaultPlaceholder = `Search ${totalCount} agents...`;

  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? defaultPlaceholder}
        className="w-full pl-12 pr-4 py-3 text-base bg-white border border-[#E5E2DB] rounded-lg focus:outline-none focus:border-gold focus:shadow-sm transition-colors"
      />
    </div>
  );
}
