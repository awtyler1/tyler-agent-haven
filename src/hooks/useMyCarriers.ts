import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// useMyCarriers — "show me the carriers I actually sell."
// ----------------------------------------------------------------------------
// The hub runs on ONE shared agent login, so there is no per-agent identity to
// read certifications from. This stores the choice per BROWSER instead, which
// is the right trade here: no account needed, instant, reversible, and it
// survives between visits on the device the agent actually works from.
//
// Empty selection = show everything. That is the honest default: we never hide
// a carrier the agent has not chosen to hide.
// ============================================================================

const STORAGE_KEY = 'tig-hub-my-carriers-v1';

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useMyCarriers() {
  const [selected, setSelected] = useState<string[]>([]);

  // Read after mount so the prerendered HTML and the first client render match.
  useEffect(() => setSelected(read()), []);

  const toggle = useCallback((carrier: string) => {
    setSelected((prev) => {
      const next = prev.includes(carrier)
        ? prev.filter((c) => c !== carrier)
        : [...prev, carrier];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* private mode — the filter just won't persist */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { selected, toggle, clear };
}
