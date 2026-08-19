// ============================================================================
// CarrierFilter — the chips that trim the carrier lane to what an agent sells.
// ----------------------------------------------------------------------------
// State lives in useMyCarriers (per browser, since the hub has one shared
// login). Nothing is hidden until the agent taps a carrier, so the default view
// is always complete.
// ============================================================================

export function CarrierFilter({
  carriers,
  selected,
  onToggle,
  onClear,
}: {
  carriers: string[];
  selected: string[];
  onToggle: (carrier: string) => void;
  onClear: () => void;
}) {
  if (carriers.length === 0) return null;
  const filtering = selected.length > 0;

  return (
    <div className="cfilter">
      <span className="cfilter__lbl">{filtering ? 'Showing' : 'All carriers ·'}</span>
      {carriers.map((c) => {
        const on = selected.includes(c);
        return (
          <button
            key={c}
            type="button"
            className={on ? 'cfilter__c cfilter__c--on' : 'cfilter__c'}
            aria-pressed={on}
            onClick={() => onToggle(c)}
          >
            {c}
          </button>
        );
      })}
      {filtering ? (
        <button type="button" className="cfilter__clear" onClick={onClear}>
          Show all
        </button>
      ) : (
        <span className="cfilter__hint">tap the ones you sell</span>
      )}
    </div>
  );
}
