import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

// ============================================================================
// BoardZone — the cockpit primitive.
// ----------------------------------------------------------------------------
// This is the single component that makes the dashboard STOP SHIFTING. Every
// zone on the hub home is a <BoardZone>. It enforces the four Homestead rules
// so no future content edit can reintroduce layout shift:
//
//   1. Reserved slot   — a zone ALWAYS renders its frame. It never returns null
//                        and never collapses out of the grid.
//   2. Resting state   — an empty list shows a calm one-line message instead of
//                        vanishing and pulling the page up.
//   3. Fixed order     — enforced by where the parent grid places each zone.
//   4. Hard cap        — a zone shows at most `cap` items, then an explicit
//                        "View all N →" link. Overflow is signposted, never a
//                        silent scrollbar and never spilled down the page.
//
// The zone's visual styling lives in the cockpit stylesheet in Index.tsx (the
// `.zone*` classes). This component owns the BEHAVIOUR; the page owns the look.
// See HOMESTEAD.md § "Dashboard (The Cockpit)" for the full pattern.
// ============================================================================

export interface ZoneLink {
  label: string;
  /** In-app route (react-router). */
  to?: string;
  /** External URL — opens in a new tab. Takes precedence over `to`. */
  href?: string;
}

export interface BoardZoneProps<T> {
  title: string;
  /** Emoji or short glyph shown before the title. */
  icon?: string;
  /** Dark emerald zone (the Board, 1:1) or white card (everything else). */
  variant?: 'card' | 'dark';
  /** Small pill beside the title, e.g. "next 7 days". */
  hint?: string;
  /** Right-aligned muted meta text, e.g. "Austin & Andrew · Jul 20". */
  meta?: string;
  /** Right-aligned header link. Ignored if `meta` is set. */
  more?: ZoneLink;
  /** Always-shown block above the list (e.g. the season banner). Counts as
   *  content, so a zone with `fixed` never looks empty. */
  fixed?: ReactNode;
  /** The capped list. */
  items?: T[];
  /** Max items shown before the "View all" link appears. Default 3. */
  cap?: number;
  renderItem?: (item: T, index: number) => ReactNode;
  itemKey?: (item: T, index: number) => string | number;
  /** Resting-state line shown when the list is empty. */
  empty?: string;
  /** Overflow signpost. `label` receives the true total so it can read
   *  "View all 5 →". */
  viewAll?: { label: (total: number) => string } & Omit<ZoneLink, 'label'>;
  /** Escape hatch: a fully custom body (used by Spotlight). Overrides the
   *  list/resting-state logic entirely, but the zone frame is still enforced. */
  children?: ReactNode;
}

function ZoneLinkEl({ link, className }: { link: ZoneLink; className: string }) {
  if (link.href) {
    return (
      <a className={className} href={link.href} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
    );
  }
  if (link.to) {
    return <Link className={className} to={link.to}>{link.label}</Link>;
  }
  return <span className={className}>{link.label}</span>;
}

export function BoardZone<T>({
  title,
  icon,
  variant = 'card',
  hint,
  meta,
  more,
  fixed,
  items,
  cap = 3,
  renderItem,
  itemKey,
  empty = 'Nothing here this week.',
  viewAll,
  children,
}: BoardZoneProps<T>) {
  const list = items ?? [];
  const shown = list.slice(0, cap);
  const overflow = list.length - shown.length;

  // Rule 2: the list area is either the capped items or a single resting line.
  let body: ReactNode;
  if (children !== undefined) {
    body = children;
  } else {
    const hasItems = list.length > 0 && !!renderItem;
    body = (
      <>
        {fixed}
        <div className={fixed ? 'zone__list zone__list--divided' : 'zone__list'}>
          {hasItems ? (
            <>
              {shown.map((item, i) => (
                <div className="zone__item" key={itemKey ? itemKey(item, i) : i}>
                  {renderItem!(item, i)}
                </div>
              ))}
              {overflow > 0 && viewAll && (
                <div className="zone__viewall">
                  <ZoneLinkEl
                    link={{ label: viewAll.label(list.length), to: viewAll.to, href: viewAll.href }}
                    className="zone__viewall-link"
                  />
                </div>
              )}
            </>
          ) : (
            // Resting state — reserved space held, never collapses.
            <div className="zone__rest">{empty}</div>
          )}
        </div>
      </>
    );
  }

  // Rule 1: the frame always renders.
  return (
    <section className={`zone zone--${variant}`} aria-label={title}>
      <div className="zone__h">
        {icon && <span className="zone__ic" aria-hidden="true">{icon}</span>}
        <span className="zone__title">{title}</span>
        {hint && <span className="zone__hint">{hint}</span>}
        {meta ? (
          <span className="zone__meta">{meta}</span>
        ) : more ? (
          <ZoneLinkEl link={more} className="zone__more" />
        ) : null}
      </div>
      <div className="zone__body">{body}</div>
    </section>
  );
}
