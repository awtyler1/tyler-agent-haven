// ============================================================================
// HUB FEED — the routing rules behind the agent hub home page.
// ----------------------------------------------------------------------------
// The home page answers two questions, in this order:
//
//   1. "What needs me?"      → buildNeedsYou()  — dated + actionable, capped
//   2. "What's going on?"    → buildLanes()     — split by SOURCE (TIG vs carrier)
//
// Everything on the page comes from one of two places, which is exactly how it
// gets posted: it is either OURS (a TIG training, meeting, or team event) or a
// CARRIER'S (an event or update we relay). That split is the organizing idea of
// the page, so it lives here as data routing rather than as layout.
//
// Nothing appears twice: whatever the strip takes, the lanes skip.
// ============================================================================

import { calendarEvents, type CalEvent } from '@/data/calendarContent';
import { boardItems, type BoardItem } from '@/data/hubContent';

export type FeedSource = 'tig' | 'carrier' | 'key';

/** Carriers we recognise in titles when an event has no explicit `carrier`. */
const CARRIER_PATTERNS: Array<[string, RegExp]> = [
  ['Aetna', /aetna/i],
  ['Humana', /humana/i],
  ['UnitedHealthcare', /\buhc\b|unitedhealthcare|united healthcare/i],
  ['Devoted', /devoted/i],
  ['Wellcare', /wellcare|well ?care/i],
  ['Anthem', /anthem/i],
  ['Cigna', /cigna/i],
];

const MARKET_PATTERNS: Array<[string, RegExp]> = [
  ['Lexington', /lexington/i],
  ['Louisville', /louisville/i],
  ['Eastern KY', /prestonsburg|pikeville|hazard|eastern ky/i],
  ['Ashland', /ashland/i],
  ['Somerset', /somerset/i],
  ['Owensboro', /owensboro/i],
  ['Virtual', /virtual|zoom|teams|webinar|online/i],
];

/** Which carrier an event belongs to, or null if it is not carrier content. */
export function carrierOf(e: CalEvent): string | null {
  if (e.carrier) return e.carrier;
  const hay = `${e.title} ${e.detail ?? ''} ${e.location ?? ''}`;
  for (const [name, re] of CARRIER_PATTERNS) if (re.test(hay)) return name;
  return null;
}

/** Where an event happens, for the market filter. */
export function marketOf(e: CalEvent): string | null {
  if (e.market) return e.market;
  const hay = `${e.location ?? ''} ${e.title} ${e.detail ?? ''}`;
  for (const [name, re] of MARKET_PATTERNS) if (re.test(hay)) return name;
  return null;
}

/**
 * Who an item came from. TIG events are ours. Anything with a carrier attached
 * is theirs (including a carrier-driven deadline). Everything else is a key
 * industry date that belongs to neither lane.
 */
export function sourceOf(e: CalEvent): FeedSource {
  if (e.category === 'tig') return 'tig';
  if (e.category === 'carrier') return 'carrier';
  return carrierOf(e) ? 'carrier' : 'key';
}

// ── The "Needs you" strip ────────────────────────────────────────────────────

export interface NeedsYouItem {
  key: string;
  source: FeedSource;
  /** Chip label: 'TIG', a carrier name, or 'Key date'. */
  badge: string;
  title: string;
  /** One line of why-it-matters. Never a paragraph. */
  note?: string;
  /** Big right-hand label: 'Today', 'Friday', 'Tue 25'. */
  when: string;
  /** Small line under it: the time, or a nudge. */
  whenSub?: string;
  link?: string;
  linkLabel?: string;
  /** Sort key. Undated bulletins sort first. */
  date: string;
}

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(toIso + 'T00:00:00').getTime() - new Date(fromIso + 'T00:00:00').getTime()) / DAY,
  );
}

/** 'Today' · 'Tomorrow' · 'Friday' (this week) · 'Tue 25' (further out). */
export function relativeWhen(todayIso: string, dateIso: string): string {
  const d = daysBetween(todayIso, dateIso);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  const dt = new Date(dateIso + 'T00:00:00');
  if (d < 7) return dt.toLocaleDateString('en-US', { weekday: 'long' });
  return dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

/**
 * What genuinely needs an agent in the near term, newest first, hard-capped.
 *
 * Eligibility, in plain terms:
 *   • a pinned bulletin from hubContent (always)
 *   • an event flagged `urgent`, or flagged `hubBoard` (worth calling out early)
 *   • anything actionable inside the next 7 days
 *   • a deadline inside the next 21 days (deadlines deserve a longer runway)
 *
 * Holidays, out-of-office, and `hubHide` events never qualify.
 */
export function buildNeedsYou(
  todayIso: string,
  cap = 3,
  events: CalEvent[] = calendarEvents,
  pinned: BoardItem[] = boardItems,
): { items: NeedsYouItem[]; overflow: number; usedEventIds: Set<string> } {
  const fromBoard: NeedsYouItem[] = pinned
    .filter((b) => !b.date || b.date >= todayIso)
    .map((b) => ({
      key: `board-${b.id}`,
      source: 'tig' as FeedSource,
      badge: 'TIG',
      title: b.title,
      note: b.note,
      when: b.when,
      whenSub: b.whenSub,
      link: b.link,
      linkLabel: b.linkLabel,
      date: b.date ?? todayIso,
    }));

  const seenSeries = new Set<string>();
  const fromEvents: NeedsYouItem[] = [];
  for (const e of events) {
    if (e.date < todayIso) continue;
    if (e.hubHide) continue;
    if (e.category === 'holiday' || e.category === 'ooo') continue;

    // A standing weekly meeting is not news. If it took a slot here it would
    // take one every week forever, which is how a priority list gets ignored.
    // Recurring series live in their lane unless explicitly flagged urgent.
    if (e.seriesId && !e.urgent) continue;

    const out = daysBetween(todayIso, e.date);
    const eligible =
      e.urgent ||
      e.hubBoard ||
      out <= 7 ||
      (e.category === 'deadline' && out <= 21);
    if (!eligible) continue;

    if (e.seriesId) {
      if (seenSeries.has(e.seriesId)) continue;
      seenSeries.add(e.seriesId);
    }

    const source = sourceOf(e);
    const carrier = carrierOf(e);
    fromEvents.push({
      key: `event-${e.id}`,
      source,
      badge: source === 'tig' ? 'TIG' : carrier ?? 'Key date',
      title: e.title,
      note: undefined,
      when: e.seriesLabel ?? relativeWhen(todayIso, e.date),
      whenSub: e.time,
      link: e.link,
      linkLabel: e.linkLabel,
      date: e.date,
    });
  }

  const all = [...fromBoard, ...fromEvents].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    // Same day: ours first, then carriers.
    if (a.source !== b.source) return a.source === 'tig' ? -1 : 1;
    return 0;
  });

  const items = all.slice(0, cap);
  const usedEventIds = new Set(
    items.filter((i) => i.key.startsWith('event-')).map((i) => i.key.slice('event-'.length)),
  );
  return { items, overflow: all.length - items.length, usedEventIds };
}

/** Series ids already represented in the strip, so the lanes can skip them. */
export function usedSeriesIds(usedEventIds: Set<string>, events: CalEvent[] = calendarEvents): Set<string> {
  const out = new Set<string>();
  for (const e of events) if (e.seriesId && usedEventIds.has(e.id)) out.add(e.seriesId);
  return out;
}

// ── The two lanes ────────────────────────────────────────────────────────────

export interface LaneItem {
  event: CalEvent;
  carrier: string | null;
  market: string | null;
  when: string;
  /** Extra occurrences collapsed into this row, e.g. 3 more weekly sessions. */
  alsoCount: number;
}

/** The browse lanes: ours on the left, our carriers' on the right. */
export function buildLanes(
  todayIso: string,
  usedEventIds: Set<string>,
  cap = 3,
  events: CalEvent[] = calendarEvents,
): { tig: LaneItem[]; carrier: LaneItem[]; carrierTotal: number } {
  const seriesCount = new Map<string, number>();
  for (const e of events) {
    if (e.date < todayIso || !e.seriesId) continue;
    seriesCount.set(e.seriesId, (seriesCount.get(e.seriesId) ?? 0) + 1);
  }

  const takenSeries = usedSeriesIds(usedEventIds, events);
  const seenSeries = new Set<string>();
  const tig: LaneItem[] = [];
  const carrier: LaneItem[] = [];

  for (const e of events) {
    if (e.date < todayIso) continue;
    if (e.hubHide) continue;
    if (usedEventIds.has(e.id)) continue;
    if (e.category === 'holiday' || e.category === 'ooo') continue;

    if (e.seriesId) {
      // Skip the whole series if the strip already shows one of its dates,
      // otherwise the next occurrence reappears here as a near-duplicate.
      if (takenSeries.has(e.seriesId)) continue;
      if (seenSeries.has(e.seriesId)) continue;
      seenSeries.add(e.seriesId);
    }

    const source = sourceOf(e);
    if (source === 'key') continue; // key industry dates live on the Calendar

    const item: LaneItem = {
      event: e,
      carrier: carrierOf(e),
      market: marketOf(e),
      when: e.seriesLabel ?? relativeWhen(todayIso, e.date),
      alsoCount: e.seriesId ? Math.max(0, (seriesCount.get(e.seriesId) ?? 1) - 1) : 0,
    };

    if (source === 'tig') tig.push(item);
    else carrier.push(item);
  }

  // Soonest first. The source list is authored in topic groups, not date order.
  const byDate = (a: LaneItem, b: LaneItem) => a.event.date.localeCompare(b.event.date);
  tig.sort(byDate);
  carrier.sort(byDate);

  return {
    tig: tig.slice(0, cap),
    carrier: carrier.slice(0, cap),
    carrierTotal: carrier.length,
  };
}

export { iso };
