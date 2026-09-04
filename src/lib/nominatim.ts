import { YEREVAN_BOUNDS } from "@/lib/yerevan-areas";

/** Yerevan bias box: left,top,right,bottom. */
const YEREVAN_VIEWBOX = `${YEREVAN_BOUNDS.minLng},${YEREVAN_BOUNDS.maxLat},${YEREVAN_BOUNDS.maxLng},${YEREVAN_BOUNDS.minLat}`;

// Shared Nominatim rate limiter (1.1s between requests per usage policy).
let lastRequestAt = 0;

export async function nominatimRateLimit() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastRequestAt));
  if (wait) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export type ReverseResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
    house_number?: string;
    country?: string;
  };
};

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseResult | null> {
  await nominatimRateLimit();
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
    "accept-language": (typeof navigator !== "undefined" && navigator.language) || "en",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    signal,
    headers: {
      "Accept-Language": (typeof navigator !== "undefined" && navigator.language) || "en",
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as ReverseResult;
}

export function extractCity(a: ReverseResult["address"] | undefined): string {
  if (!a) return "";
  return (
    a.city || a.town || a.village || a.municipality || a.suburb || a.neighbourhood || a.county || ""
  );
}

/** Forward-geocode a free-text place (e.g. a city) to coordinates. Cached per session. */
const forwardCache = new Map<string, { lat: number; lng: number } | null>();

export async function geocodePlace(
  query: string,
  signal?: AbortSignal,
): Promise<{ lat: number; lng: number } | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (forwardCache.has(key)) return forwardCache.get(key) ?? null;
  await nominatimRateLimit();
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    limit: "1",
    countrycodes: "am",
    viewbox: YEREVAN_VIEWBOX,
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = json?.[0];
    const out = first ? { lat: Number(first.lat), lng: Number(first.lon) } : null;
    forwardCache.set(key, out);
    return out;
  } catch {
    return null;
  }
}
