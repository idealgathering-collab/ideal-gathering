import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LocationValue = {
  display_name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  place_id: number;
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

type Props = {
  id?: string;
  value: string;
  onChange: (text: string) => void;
  onSelect: (v: LocationValue) => void;
  placeholder?: string;
  cityOnly?: boolean;
  required?: boolean;
  countryCodes?: string; // e.g. "tr"
};

// Client-side rate limit: min 1.1s between requests per Nominatim policy
let lastRequestAt = 0;
async function rateLimit() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastRequestAt));
  if (wait) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export function LocationAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  cityOnly = false,
  required,
  countryCodes = "tr",
}: Props) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function scheduleSearch(q: string) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => runSearch(q), 400);
  }

  async function runSearch(q: string) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      setLoading(true);
      await rateLimit();
      const params = new URLSearchParams({
        q,
        format: "jsonv2",
        addressdetails: "1",
        limit: "6",
        "accept-language": navigator.language || "en",
      });
      if (countryCodes) params.set("countrycodes", countryCodes);
      if (cityOnly) params.set("featuretype", "city");
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: ctrl.signal,
        headers: {
          // Browsers block setting User-Agent; Referer is auto-sent. Identify via a custom header.
          "Accept-Language": navigator.language || "en",
        },
      });
      if (!res.ok) throw new Error("search failed");
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(true);
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }

  function pick(r: NominatimResult) {
    const a = r.address ?? {};
    const city = a.city || a.town || a.village || a.municipality || a.suburb || a.neighbourhood || a.county || "";
    const road = [a.road, a.house_number].filter(Boolean).join(" ");
    const address = road ? `${road}, ${city || a.country || ""}`.trim().replace(/,\s*$/, "") : r.display_name;
    const chosen: LocationValue = {
      display_name: r.display_name,
      address: cityOnly ? (city || r.display_name) : address,
      city,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    };
    onChange(cityOnly ? city || r.display_name : r.display_name);
    onSelect(chosen);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            scheduleSearch(e.target.value);
          }}
          onFocus={() => results.length && setOpen(true)}
          className="ps-9"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
          <ul className="max-h-72 overflow-y-auto py-1">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            © OpenStreetMap contributors
          </p>
        </div>
      )}
    </div>
  );
}
