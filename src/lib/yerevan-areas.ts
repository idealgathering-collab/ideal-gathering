// Canonical Yerevan area catalogue: the 12 administrative districts plus a few
// well-known named areas people actually use when describing a meeting spot.
// Bounds are deliberately rough — they only need to be good enough to label a pin.

export type AreaBounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };

export type YerevanArea = {
  /** Stable id, also the canonical English label stored in the database. */
  id: string;
  en: string;
  ru: string;
  fa: string;
  center: { lat: number; lng: number };
  bounds: AreaBounds;
  /** Small, well-known pockets inside a district — matched before districts. */
  named?: boolean;
  /** Shown on the landing page. */
  featured?: boolean;
};

export const YEREVAN_CENTER = { lat: 40.1792, lng: 44.4991 };

/** Rough bounding box of the whole city — used to decide "is this pin in Yerevan at all". */
export const YEREVAN_BOUNDS: AreaBounds = {
  minLat: 40.08,
  maxLat: 40.26,
  minLng: 44.36,
  maxLng: 44.65,
};

export const YEREVAN_AREAS: YerevanArea[] = [
  // Named pockets (checked first).
  {
    id: "Cascade",
    en: "Cascade",
    ru: "Каскад",
    fa: "کاسکاد",
    center: { lat: 40.19, lng: 44.5155 },
    bounds: { minLat: 40.186, maxLat: 40.1955, minLng: 44.5105, maxLng: 44.5205 },
    named: true,
    featured: true,
  },
  {
    id: "Northern Avenue",
    en: "Northern Avenue",
    ru: "Северный проспект",
    fa: "خیابان شمالی",
    center: { lat: 40.1812, lng: 44.5142 },
    bounds: { minLat: 40.1785, maxLat: 40.1845, minLng: 44.5115, maxLng: 44.5175 },
    named: true,
  },
  {
    id: "Kond",
    en: "Kond",
    ru: "Конд",
    fa: "کُند",
    center: { lat: 40.1836, lng: 44.5015 },
    bounds: { minLat: 40.1795, maxLat: 40.1875, minLng: 44.4965, maxLng: 44.5065 },
    named: true,
  },
  // Administrative districts.
  {
    id: "Kentron",
    en: "Kentron",
    ru: "Кентрон",
    fa: "کِنترون",
    center: { lat: 40.183, lng: 44.513 },
    bounds: { minLat: 40.163, maxLat: 40.2, minLng: 44.488, maxLng: 44.537 },
    featured: true,
  },
  {
    id: "Arabkir",
    en: "Arabkir",
    ru: "Арабкир",
    fa: "آرابکیر",
    center: { lat: 40.205, lng: 44.496 },
    bounds: { minLat: 40.192, maxLat: 40.226, minLng: 44.474, maxLng: 44.518 },
    featured: true,
  },
  {
    id: "Ajapnyak",
    en: "Ajapnyak",
    ru: "Аджапняк",
    fa: "آجاپنیاک",
    center: { lat: 40.199, lng: 44.452 },
    bounds: { minLat: 40.176, maxLat: 40.232, minLng: 44.4, maxLng: 44.482 },
  },
  {
    id: "Avan",
    en: "Avan",
    ru: "Аван",
    fa: "آوان",
    center: { lat: 40.218, lng: 44.558 },
    bounds: { minLat: 40.2, maxLat: 40.245, minLng: 44.535, maxLng: 44.595 },
  },
  {
    id: "Davtashen",
    en: "Davtashen",
    ru: "Давташен",
    fa: "داوتاشِن",
    center: { lat: 40.224, lng: 44.472 },
    bounds: { minLat: 40.212, maxLat: 40.246, minLng: 44.45, maxLng: 44.494 },
  },
  {
    id: "Erebuni",
    en: "Erebuni",
    ru: "Эребуни",
    fa: "اِرِبونی",
    center: { lat: 40.135, lng: 44.525 },
    bounds: { minLat: 40.1, maxLat: 40.163, minLng: 44.495, maxLng: 44.56 },
  },
  {
    id: "Kanaker-Zeytun",
    en: "Kanaker-Zeytun",
    ru: "Канакер-Зейтун",
    fa: "کاناکِر-زیتون",
    center: { lat: 40.213, lng: 44.533 },
    bounds: { minLat: 40.196, maxLat: 40.235, minLng: 44.518, maxLng: 44.556 },
  },
  {
    id: "Malatia-Sebastia",
    en: "Malatia-Sebastia",
    ru: "Малатия-Себастия",
    fa: "مالاتیا-سباستیا",
    center: { lat: 40.16, lng: 44.452 },
    bounds: { minLat: 40.136, maxLat: 40.184, minLng: 44.4, maxLng: 44.487 },
  },
  {
    id: "Nor Nork",
    en: "Nor Nork",
    ru: "Нор Норк",
    fa: "نور نورک",
    center: { lat: 40.202, lng: 44.572 },
    bounds: { minLat: 40.18, maxLat: 40.226, minLng: 44.548, maxLng: 44.62 },
    featured: true,
  },
  {
    id: "Nork-Marash",
    en: "Nork-Marash",
    ru: "Норк-Мараш",
    fa: "نورک-ماراش",
    center: { lat: 40.178, lng: 44.548 },
    bounds: { minLat: 40.164, maxLat: 40.192, minLng: 44.537, maxLng: 44.566 },
  },
  {
    id: "Nubarashen",
    en: "Nubarashen",
    ru: "Нубарашен",
    fa: "نوبراشِن",
    center: { lat: 40.118, lng: 44.545 },
    bounds: { minLat: 40.09, maxLat: 40.14, minLng: 44.51, maxLng: 44.59 },
  },
  {
    id: "Shengavit",
    en: "Shengavit",
    ru: "Шенгавит",
    fa: "شِنگاویت",
    center: { lat: 40.142, lng: 44.479 },
    bounds: { minLat: 40.108, maxLat: 40.166, minLng: 44.43, maxLng: 44.51 },
  },
];

export const YEREVAN_AREA_NAMES: string[] = YEREVAN_AREAS.map((a) => a.id);

function inBounds(lat: number, lng: number, b: AreaBounds) {
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

function distSq(a: { lat: number; lng: number }, lat: number, lng: number) {
  const dLat = a.lat - lat;
  const dLng = (a.lng - lng) * 0.76; // rough cos(40°) correction
  return dLat * dLat + dLng * dLng;
}

/**
 * Resolve a pin to a Yerevan area id.
 * Named pockets win over districts; anything inside the city box but outside all
 * district boxes falls back to the nearest district center. Outside the city → null.
 */
export function areaForPoint(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!inBounds(lat, lng, YEREVAN_BOUNDS)) return null;

  const named = YEREVAN_AREAS.filter((a) => a.named);
  for (const a of named) if (inBounds(lat, lng, a.bounds)) return a.id;

  const districts = YEREVAN_AREAS.filter((a) => !a.named);
  const hits = districts.filter((a) => inBounds(lat, lng, a.bounds));
  const pool = hits.length > 0 ? hits : districts;

  let best = pool[0];
  let bestD = distSq(best.center, lat, lng);
  for (const a of pool.slice(1)) {
    const d = distSq(a.center, lat, lng);
    if (d < bestD) {
      best = a;
      bestD = d;
    }
  }
  return best.id;
}

export function areaLabel(id: string | null | undefined, lang: "en" | "ru" | "fa"): string {
  if (!id) return "";
  const area = YEREVAN_AREAS.find((a) => a.id === id);
  if (!area) return id;
  return area[lang] ?? area.en;
}

export function isYerevan(city: string | null | undefined): boolean {
  const c = (city ?? "").trim().toLowerCase();
  return c === "yerevan" || c === "երևան" || c === "ереван" || c === "ایروان";
}
