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
