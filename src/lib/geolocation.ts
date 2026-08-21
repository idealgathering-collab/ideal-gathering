import { useCallback, useRef, useState } from "react";

export type GeoFix = { lat: number; lng: number };
export type GeoStatus = "idle" | "locating" | "ready" | "denied" | "unavailable";

/** Module-level cache of the last successful fix so repeat uses don't re-prompt. */
let cachedFix: GeoFix | null = null;

export function getCachedFix() {
  return cachedFix;
}

export function geolocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/** Silent permission probe — never prompts. Returns null when unknown. */
export async function probeGeolocationPermission(): Promise<
  "granted" | "prompt" | "denied" | null
> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return null;
  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state as "granted" | "prompt" | "denied";
  } catch {
    return null;
  }
}

export function getCurrentPositionOnce(timeoutMs = 10000): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    if (!geolocationSupported()) return reject(new Error("unavailable"));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        cachedFix = fix;
        resolve(fix);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

/** Reads the device position only if permission was already granted (no prompt). */
export async function getPositionIfGranted(): Promise<GeoFix | null> {
  if (cachedFix) return cachedFix;
  if (!geolocationSupported()) return null;
  const state = await probeGeolocationPermission();
  if (state !== "granted") return null;
  try {
    return await getCurrentPositionOnce(8000);
  } catch {
    return null;
  }
}

export function useDeviceLocation() {
  const [status, setStatus] = useState<GeoStatus>(cachedFix ? "ready" : "idle");
  const [fix, setFix] = useState<GeoFix | null>(cachedFix);
  const busy = useRef(false);

  const request = useCallback(async (): Promise<GeoFix | null> => {
    if (!geolocationSupported()) {
      setStatus("unavailable");
      return null;
    }
    if (cachedFix) {
      setFix(cachedFix);
      setStatus("ready");
      return cachedFix;
    }
    if (busy.current) return null;
    busy.current = true;
    setStatus("locating");
    try {
      const next = await getCurrentPositionOnce();
      setFix(next);
      setStatus("ready");
      return next;
    } catch {
      setStatus("denied");
      return null;
    } finally {
      busy.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setFix(null);
    setStatus("idle");
  }, []);

  return { status, fix, request, reset, supported: geolocationSupported() };
}

export function haversineKm(a: GeoFix, b: GeoFix) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number, lang?: string) {
  const l = lang || "en";
  if (km < 1) {
    const m = Math.max(10, Math.round((km * 1000) / 10) * 10);
    return `${new Intl.NumberFormat(l).format(m)} m`;
  }
  const value = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${new Intl.NumberFormat(l, { maximumFractionDigits: 1 }).format(value)} km`;
}
