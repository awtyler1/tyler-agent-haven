import { useState, useEffect } from 'react';
import { Phone, Mail, MessageSquare, Search } from 'lucide-react';
import type { BookClientWithMeta } from '@/hooks/useBookClients';
import { useClientDetail } from '@/hooks/useClientDetail';
import { useCreateInteraction } from '@/hooks/useClientInteractions';
import { NoteComposer } from './NoteComposer';
import { ActivityTimeline, buildTimelineItems } from './ActivityTimeline';
import { getFlagConfig, getCarrierColor, PLAN_TYPE_RENEWAL } from '@/types/book';
import type { NoteTag } from '@/types/book';
import { NOTE_TAG_TO_INTERACTION } from '@/types/book';

interface ClientDetailProps {
  client: BookClientWithMeta | null;
}

export function ClientDetail({ client }: ClientDetailProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const { data: detail, isLoading } = useClientDetail(client?.id || null);
  const createInteraction = useCreateInteraction();

  // Reset note form when client changes
  useEffect(() => {
    setNoteOpen(false);
  }, [client?.id]);

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-2">
        <Search size={32} color="#A09888" style={{ opacity: 0.4 }} />
        <span className="text-[15px]" style={{ color: '#A09888' }}>Select a client to see details</span>
      </div>
    );
  }

  const flag = client.flag_type ? getFlagConfig(client.flag_type) : null;
  const cc = client.carrier_color;

  // Primary policy from detail or client data
  const primaryPolicy = detail?.policies
    ?.filter(p => p.status === 'active')
    ?.sort((a, b) => (b.effective_date || '').localeCompare(a.effective_date || ''))[0];

  const carrierName = primaryPolicy?.carrier?.name || client.carrier_name || '';
  const planType = primaryPolicy?.plan_type || client.plan_type || '';
  const annualRenewal = PLAN_TYPE_RENEWAL[(planType || 'OTHER').toUpperCase()] || PLAN_TYPE_RENEWAL.OTHER;

  const handleSaveNote = (params: { notes: string; tag: NoteTag | null; followUpDate: string | null }) => {
    if (!client.id) return;
    const interactionMapping = params.tag ? NOTE_TAG_TO_INTERACTION[params.tag] : { type: 'note' as const };

    createInteraction.mutate({
      client_id: client.id,
      interaction_type: interactionMapping.type,
      outcome: 'outcome' in interactionMapping ? interactionMapping.outcome : null,
      notes: params.notes,
      follow_up_date: params.followUpDate,
    }, {
      onSuccess: () => setNoteOpen(false),
    });
  };

  const timelineItems = detail ? buildTimelineItems(detail.interactions) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-7 pt-7 pb-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(200,190,170,0.15)' }}>
        <div className="flex items-center gap-3.5 mb-4.5">
          <div
            className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[19px] font-bold"
            style={{ background: `${cc}12`, color: cc }}
          >
            {client.first_name[0]}{client.last_name[0]}
          </div>
          <div>
            <div className="text-[22px] font-bold tracking-tight" style={{ color: '#2C2418' }}>
              {client.first_name} {client.last_name}
            </div>
            <div className="text-[13px] mt-0.5" style={{ color: '#8B7E6A' }}>
              {client.age !== null ? `Age ${client.age}` : ''}{client.date_of_birth ? ` · DOB ${formatDOB(client.date_of_birth)}` : ''}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <ActionButton
            icon={Phone}
            label="Call"
            color="#2D8B4E"
            disabled={!client.phone}
          />
          <ActionButton
            icon={Mail}
            label="Email"
            color="#3B6FB5"
            disabled={!client.email}
          />
          <button
            onClick={() => setNoteOpen(o => !o)}
            className="flex items-center gap-1.5 rounded-[10px] px-4.5 py-2.5 text-[13px] font-semibold cursor-pointer transition-all duration-150 border"
            style={{
              background: noteOpen ? 'rgba(59,111,181,0.09)' : 'rgba(92,83,71,0.06)',
              borderColor: noteOpen ? 'rgba(59,111,181,0.22)' : 'rgba(92,83,71,0.13)',
              color: noteOpen ? '#3B6FB5' : '#5C5347',
            }}
          >
            <MessageSquare size={14} /> Note
          </button>
        </div>
      </div>

      {/* Body (scrollable) */}
      <div className="px-7 py-5 overflow-y-auto flex-1">
        {/* Inline Note Composer */}
        {noteOpen && (
          <NoteComposer
            onSave={handleSaveNote}
            saving={createInteraction.isPending}
          />
        )}

        {/* Flag banner */}
        {flag && (
          <div
            className="rounded-xl px-4 py-3.5 mb-5 flex items-center gap-2.5"
            style={{
              background: flag.bg,
              border: `1px solid ${flag.color}20`,
            }}
          >
            <span className="text-[13px] font-semibold" style={{ color: flag.color }}>
              {flag.label}
            </span>
          </div>
        )}

        {/* Contact section */}
        <Section title="Contact">
          <InfoRow
            icon={Phone}
            text={client.phone || 'No phone on file'}
            textColor={client.phone ? '#3B6FB5' : '#A09888'}
          />
          <InfoRow
            icon={Mail}
            text={client.last_contacted_at ? `Last contact: ${formatDateShort(client.last_contacted_at)}` : 'Last contact: Never'}
            textColor="#5C5347"
          />
        </Section>

        {/* Coverage section */}
        <Section title="Coverage">
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(200,190,170,0.25)',
            }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              {carrierName && (
                <span
                  className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md"
                  style={{ color: getCarrierColor(carrierName), background: `${getCarrierColor(carrierName)}10` }}
                >
                  {carrierName}
                </span>
              )}
              {planType && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded"
                  style={{ color: '#8B7E6A', background: 'rgba(200,190,170,0.1)' }}
                >
                  {planType}
                </span>
              )}
            </div>
            <div className="text-[14px] font-medium mb-1" style={{ color: '#2C2418' }}>
              {primaryPolicy?.plan_name || client.plan_name || 'No plan on file'}
            </div>
            <div className="text-[12px]" style={{ color: '#8B7E6A' }}>
              Effective {client.effective_date ? formatDateShort(client.effective_date) : 'N/A'}
            </div>
            <div
              className="mt-3 px-3 py-2.5 rounded-lg flex justify-between"
              style={{ background: 'rgba(200,190,170,0.06)' }}
            >
              <span className="text-[12px]" style={{ color: '#8B7E6A' }}>Est. annual renewal</span>
              <span className="text-[14px] font-bold" style={{ color: '#C8A951' }}>${annualRenewal}</span>
            </div>
          </div>
        </Section>

        {/* Activity timeline */}
        <Section title="Activity">
          {isLoading ? (
            <div className="py-4 text-center">
              <span className="text-[13px]" style={{ color: '#A09888' }}>Loading activity...</span>
            </div>
          ) : (
            <ActivityTimeline items={timelineItems} />
          )}
        </Section>
      </div>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div
        className="text-[11px] font-semibold uppercase tracking-wider mb-3"
        style={{ color: '#8B7E6A' }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, text, textColor }: { icon: any; text: string; textColor: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <Icon size={14} color="#8B7E6A" />
      <span className="text-[14px] font-medium" style={{ color: textColor }}>{text}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  color,
  disabled,
}: {
  icon: any;
  label: string;
  color: string;
  disabled?: boolean;
}) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-[10px] px-4.5 py-2.5 text-[13px] font-semibold transition-all duration-150 border"
      style={{
        background: disabled ? 'rgba(200,190,170,0.05)' : `${color}0A`,
        borderColor: disabled ? 'rgba(200,190,170,0.15)' : `${color}15`,
        color: disabled ? '#A09888' : color,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      disabled={disabled}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function formatDOB(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}
