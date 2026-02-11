import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import type { NoteTag } from '@/types/book';

const NOTE_TAGS: { label: string; value: NoteTag; color: string }[] = [
  { label: 'Service Call', value: 'service_call', color: '#2D8B4E' },
  { label: 'Plan Question', value: 'plan_question', color: '#3B6FB5' },
  { label: 'Retention', value: 'retention', color: '#C8A951' },
  { label: 'Complaint', value: 'complaint', color: '#C75A3A' },
  { label: 'General', value: 'general', color: '#5C5347' },
];

interface NoteComposerProps {
  onSave: (params: { notes: string; tag: NoteTag | null; followUpDate: string | null }) => void;
  saving?: boolean;
}

export function NoteComposer({ onSave, saving }: NoteComposerProps) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState<NoteTag | null>(null);
  const [followUp, setFollowUp] = useState('');

  const handleSave = () => {
    if (!text.trim()) return;
    onSave({
      notes: text.trim(),
      tag,
      followUpDate: followUp || null,
    });
    setText('');
    setTag(null);
    setFollowUp('');
  };

  return (
    <div
      className="rounded-[14px] p-4.5 mb-5"
      style={{
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(59,111,181,0.15)',
        animation: 'fadeSlideDown 0.15s ease-out',
      }}
    >
      {/* Tag pills */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {NOTE_TAGS.map(t => (
          <button
            key={t.value}
            onClick={() => setTag(tag === t.value ? null : t.value)}
            className="px-2.5 py-1.5 rounded-[7px] cursor-pointer text-[12px] transition-all duration-150 border"
            style={{
              fontWeight: tag === t.value ? 600 : 400,
              background: tag === t.value ? `${t.color}0D` : 'rgba(200,190,170,0.06)',
              borderColor: tag === t.value ? `${t.color}30` : 'rgba(200,190,170,0.15)',
              color: tag === t.value ? t.color : '#8B7E6A',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What happened on this call?"
        rows={3}
        className="w-full px-3.5 py-3 rounded-[10px] text-[14px] outline-none resize-y leading-relaxed"
        style={{
          border: '1px solid rgba(200,190,170,0.15)',
          background: 'rgba(255,255,255,0.6)',
          color: '#2C2418',
          fontFamily: 'inherit',
        }}
        onFocus={e => (e.target.style.borderColor = 'rgba(59,111,181,0.25)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(200,190,170,0.15)')}
      />

      {/* Follow-up date + Save */}
      <div className="flex items-center gap-2.5 mt-3">
        <div className="flex items-center gap-1.5 flex-1">
          <Calendar size={14} color="#8B7E6A" />
          <input
            type="text"
            placeholder="Follow up by (MM/DD/YYYY)"
            value={followUp}
            onChange={e => setFollowUp(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{
              border: '1px solid rgba(200,190,170,0.15)',
              background: 'rgba(255,255,255,0.5)',
              color: '#2C2418',
              fontFamily: 'inherit',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(59,111,181,0.25)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(200,190,170,0.15)')}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className="px-5 py-2.5 rounded-[10px] border-none text-[13px] font-semibold transition-all duration-150"
          style={{
            background: text.trim() ? '#3B6FB5' : 'rgba(200,190,170,0.15)',
            color: text.trim() ? '#fff' : '#A09888',
            cursor: text.trim() ? 'pointer' : 'default',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      </div>

      {followUp && (
        <div className="flex items-center gap-1.5 mt-2 text-[12px]" style={{ color: '#C8A951' }}>
          <Clock size={12} />
          <span>This will create a follow-up reminder</span>
        </div>
      )}
    </div>
  );
}
