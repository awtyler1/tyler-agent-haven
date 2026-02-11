import { ChevronRight, Gift, Clock, PhoneCall, AlertCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AttentionItem {
  icon: typeof Gift;
  label: string;
  count: number;
  color: string;
}

interface AttentionQueueProps {
  totalCount: number;
  items: AttentionItem[];
}

export function AttentionQueue({ totalCount, items }: AttentionQueueProps) {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-2xl p-6 cursor-pointer flex-1"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(200,190,170,0.3)',
      }}
      onClick={() => navigate('/book/clients?filter=attention')}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: '#C75A3A', animation: 'pulse 2s infinite' }}
          />
          <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#8B7E6A' }}>
            Needs Attention
          </span>
        </div>
        <ChevronRight size={16} color="#A09888" />
      </div>

      <div className="text-[32px] font-bold mb-4" style={{ color: '#2C2418' }}>
        {totalCount} client{totalCount !== 1 ? 's' : ''}
      </div>

      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 py-2"
          style={{ borderTop: '1px solid rgba(200,190,170,0.15)' }}
        >
          <item.icon size={16} color={item.color} />
          <span className="text-[14px] flex-1" style={{ color: '#5C5347' }}>
            {item.label}
          </span>
          <span className="text-[16px] font-bold" style={{ color: '#2C2418' }}>
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// Helper to categorize flags into attention items
export function buildAttentionItems(flaggedClients: { flag_type: string | null }[]): AttentionItem[] {
  const counts: Record<string, number> = {};
  flaggedClients.forEach(c => {
    if (!c.flag_type) return;
    const category = categorizeFlag(c.flag_type);
    counts[category] = (counts[category] || 0) + 1;
  });

  const items: AttentionItem[] = [];

  if (counts.birthday) {
    items.push({ icon: Gift, label: 'Birthdays this week', count: counts.birthday, color: '#B8963E' });
  }
  if (counts.overdue) {
    items.push({ icon: Clock, label: 'Overdue follow-ups', count: counts.overdue, color: '#C75A3A' });
  }
  if (counts.callback) {
    items.push({ icon: PhoneCall, label: 'Scheduled callbacks', count: counts.callback, color: '#3B6FB5' });
  }
  if (counts.attention) {
    items.push({ icon: AlertCircle, label: 'Needs attention', count: counts.attention, color: '#C75A3A' });
  }

  return items;
}

function categorizeFlag(flagType: string): string {
  if (flagType.includes('birthday') || flagType.includes('anniversary')) return 'birthday';
  if (flagType.includes('no_contact') || flagType.includes('overdue')) return 'overdue';
  if (flagType.includes('callback') || flagType.includes('follow_up')) return 'callback';
  return 'attention';
}
