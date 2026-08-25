export type SortMode = "fit" | "soon" | "near";

export function isSortMode(v: unknown): v is SortMode {
  return v === "fit" || v === "soon" || v === "near";
}

export type SortableItem = {
  id: string;
  starts_at: string;
  /** 0-100 table chemistry, or null when unscored. */
  fit?: number | null;
  /** Composite recommend rank (chemistry + taste). Preferred over `fit` when sorting. */
  rank?: number | null;
  distanceKm?: number | null;
};

function rankOf(item: SortableItem): number | null {
  if (typeof item.rank === "number") return item.rank;
  if (typeof item.fit === "number") return item.fit;
  return null;
}

function bySoonest(a: SortableItem, b: SortableItem) {
  return a.starts_at.localeCompare(b.starts_at);
}

/**
 * Pure ordering for the Explore feed. Unscored / unlocated items always sink
 * to the bottom, with soonest-first as the stable tie-break.
 */
export function sortGatherings<T extends SortableItem>(items: T[], mode: SortMode): T[] {
  const copy = [...items];
  if (mode === "soon") return copy.sort(bySoonest);
  if (mode === "near") {
    return copy.sort((a, b) => {
      const da = typeof a.distanceKm === "number" ? a.distanceKm : null;
      const db = typeof b.distanceKm === "number" ? b.distanceKm : null;
      if (da === null && db === null) return bySoonest(a, b);
      if (da === null) return 1;
      if (db === null) return -1;
      if (da !== db) return da - db;
      return bySoonest(a, b);
    });
  }
  return copy.sort((a, b) => {
    const fa = rankOf(a);
    const fb = rankOf(b);
    if (fa === null && fb === null) return bySoonest(a, b);
    if (fa === null) return 1;
    if (fb === null) return -1;
    if (fa !== fb) return fb - fa;
    return bySoonest(a, b);
  });
}

/** Top N ranked gatherings for the "Recommended for you" band. */
export function pickRecommended<T extends SortableItem>(items: T[], count = 3): T[] {
  return sortGatherings(
    items.filter((i) => rankOf(i) !== null),
    "fit",
  ).slice(0, count);
}
