import { Clock } from 'lucide-react';

interface TimelineItem {
  id: string;
  date: string;
  dateShort: string;
  description: string;
  type: 'interaction' | 'system';
  tag?: string | null;
  followUpDate?: string | null;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
}

const TAG_COLORS: Record<string, { label: string; color: string }> = {
  call: { label: 'Call', color: '#2D8B4E' },
  email: { label: 'Email', color: '#3B6FB5' },
  text: { label: 'Text', color: '#3B6FB5' },
  meeting: { label: 'Meeting', color: '#C8A951' },
  note: { label: 'Note', color: '#5C5347' },
  follow_up_scheduled: { label: 'Follow-up', color: '#3B6FB5' },
  follow_up_completed: { label: 'Completed', color: '#2D8B4E' },
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[13px]" style={{ color: '#A09888' }}>No activity yet</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item, i) => {
        const isInteraction = item.type === 'interaction';
        const tagInfo = item.tag ? TAG_COLORS[item.tag] : null;

        return (
          <div key={item.id} className="flex gap-3 mb-4">
            <div className="flex flex-col items-center">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: isInteraction ? '#3B6FB5' : i === 0 ? '#2D8B4E' : 'rgba(200,190,170,0.15)',
                  border: '2px solid #F8F5F0',
                }}
              />
              {i < items.length - 1 && (
                <div
                  className="w-px flex-1 mt-0.5"
                  style={{ background: 'rgba(200,190,170,0.15)' }}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[11px]" style={{ color: '#A09888' }}>{item.dateShort}</span>
                {tagInfo && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ color: tagInfo.color, background: `${tagInfo.color}10` }}
                  >
                    {tagInfo.label}
                  </span>
                )}
              </div>
              <div
                className="text-[13px] leading-relaxed"
                style={{
                  color: isInteraction ? '#2C2418' : '#5C5347',
                  fontWeight: isInteraction ? 500 : 400,
                }}
              >
                {item.description}
              </div>
              {item.followUpDate && (
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium" style={{ color: '#C8A951' }}>
                  <Clock size={10} />
                  Follow up by {item.followUpDate}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to build timeline items from client detail data
export function buildTimelineItems(
  interactions: {
    id: string;
    interaction_type: string;
    notes: string | null;
    follow_up_date: string | null;
    created_at: string;
  }[]
): TimelineItem[] {
  return interactions.map(i => ({
    id: i.id,
    date: i.created_at,
    dateShort: formatDateShort(i.created_at),
    description: i.notes || `${i.interaction_type} logged`,
    type: 'interaction' as const,
    tag: i.interaction_type,
    followUpDate: i.follow_up_date ? formatDateShort(i.follow_up_date) : null,
  }));
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
}
