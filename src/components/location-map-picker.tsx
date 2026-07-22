import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationAutocomplete, type LocationValue } from "@/components/location-autocomplete";
import { reverseGeocode, extractCity } from "@/lib/nominatim";
import { useT } from "@/i18n";

export type MapLocationValue = LocationValue & {
  street_number: string;
  description: string;
};

type Props = {
  value: MapLocationValue | null;
  onChange: (v: MapLocationValue | null) => void;
  countryCode?: string | null;
  /** Default center — falls back to Istanbul. */
  defaultCenter?: { lat: number; lng: number };
};

const DEFAULT_CENTER = { lat: 41.0082, lng: 28.9784 };

export function LocationMapPicker({ value, onChange, countryCode, defaultCenter }: Props) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const reverseAbort = useRef<AbortController | null>(null);
  const reverseTimer = useRef<number | null>(null);

  const [searchText, setSearchText] = useState(value?.display_name ?? "");
  const [address, setAddress] = useState(value?.address ?? "");
  const [city, setCity] = useState(value?.city ?? "");
  const [displayName, setDisplayName] = useState(value?.display_name ?? "");
  const [streetNumber, setStreetNumber] = useState(value?.street_number ?? "");
  const [description, setDescription] = useState(value?.description ?? "");
  const [reversing, setReversing] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Init map (client only).
  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;

      // Fix default marker icons under Vite bundling.
      const iconRetinaUrl = (await import("leaflet/dist/images/marker-icon-2x.png")).default;
      const iconUrl = (await import("leaflet/dist/images/marker-icon.png")).default;
      const shadowUrl = (await import("leaflet/dist/images/marker-shadow.png")).default;
      // @ts-expect-error - _getIconUrl exists at runtime
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

      const center = value
        ? { lat: value.lat, lng: value.lng }
        : defaultCenter ?? DEFAULT_CENTER;
      const map = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: value ? 16 : 12,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([center.lat, center.lng], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        handlePin(p.lat, p.lng);
      });
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        handlePin(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);

      // If we have no initial value, still fetch a reverse geocode for the default so address is filled.
      if (!value) handlePin(center.lat, center.lng);
    })();
    return () => {
      disposed = true;
      reverseAbort.current?.abort();
      if (reverseTimer.current) window.clearTimeout(reverseTimer.current);
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePin(lat: number, lng: number) {
    if (reverseTimer.current) window.clearTimeout(reverseTimer.current);
    reverseTimer.current = window.setTimeout(async () => {
      reverseAbort.current?.abort();
      const ctrl = new AbortController();
      reverseAbort.current = ctrl;
      setReversing(true);
      try {
        const r = await reverseGeocode(lat, lng, ctrl.signal);
        if (!r) return;
        const c = extractCity(r.address);
        const road = [r.address?.road, r.address?.house_number].filter(Boolean).join(" ");
        const addr = road ? `${road}, ${c || r.address?.country || ""}`.replace(/,\s*$/, "") : r.display_name;
        setDisplayName(r.display_name);
        setAddress(addr);
        setCity(c);
        setSearchText(r.display_name);
        emit({
          display_name: r.display_name,
          address: addr,
          city: c,
          lat,
          lng,
          street_number: streetNumber,
          description,
        });
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          // silent
        }
      } finally {
        setReversing(false);
      }
    }, 350);
  }

  function emit(next: MapLocationValue) {
    onChange(next);
  }

  function onAutocompletePick(v: LocationValue) {
    setSearchText(v.display_name);
    setDisplayName(v.display_name);
    setAddress(v.address);
    setCity(v.city);
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([v.lat, v.lng]);
      mapRef.current.setView([v.lat, v.lng], 17, { animate: false });
    }
    emit({
      display_name: v.display_name,
      address: v.address,
      city: v.city,
      lat: v.lat,
      lng: v.lng,
      street_number: streetNumber,
      description,
    });
  }

  function updateStreetNumber(next: string) {
    setStreetNumber(next);
    if (value || address) {
      const latlng = markerRef.current?.getLatLng();
      emit({
        display_name: displayName,
        address,
        city,
        lat: latlng?.lat ?? value?.lat ?? 0,
        lng: latlng?.lng ?? value?.lng ?? 0,
        street_number: next,
        description,
      });
    }
  }

  function updateDescription(next: string) {
    setDescription(next);
    if (value || address) {
      const latlng = markerRef.current?.getLatLng();
      emit({
        display_name: displayName,
        address,
        city,
        lat: latlng?.lat ?? value?.lat ?? 0,
        lng: latlng?.lng ?? value?.lng ?? 0,
        street_number: streetNumber,
        description: next,
      });
    }
  }

  return (
    <div className="grid gap-3">
      <LocationAutocomplete
        value={searchText}
        onChange={setSearchText}
        onSelect={onAutocompletePick}
        countryCodes={(countryCode ?? "tr").toLowerCase()}
        placeholder={t("savedLoc.addressPh")}
      />

      <div className="relative overflow-hidden rounded-2xl border border-border">
        <div ref={containerRef} className="h-72 w-full" />
        {!mapReady && (
          <div className="absolute inset-0 grid place-items-center bg-muted/40 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("savedLoc.pinHint")}</p>

      <div className="grid gap-2">
        <Label>{t("savedLoc.address")}</Label>
        <div className="flex items-start gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="line-clamp-3 flex-1">
            {reversing ? `${t("common.loading")}` : address || displayName || "—"}
          </span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="street_number">{t("savedLoc.streetNumber")} *</Label>
        <Input
          id="street_number"
          maxLength={80}
          value={streetNumber}
          placeholder={t("savedLoc.streetNumberPh")}
          onChange={(e) => updateStreetNumber(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="loc_description">{t("savedLoc.description")} *</Label>
        <Textarea
          id="loc_description"
          maxLength={200}
          rows={2}
          value={description}
          placeholder={t("savedLoc.descriptionPh")}
          onChange={(e) => updateDescription(e.target.value)}
        />
      </div>
    </div>
  );
}
