// Static country + city catalogue for profile dropdowns.
// TR is our launch market; a few global cities help early expat/international users.

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "TR", name: "Türkiye" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "OTHER", name: "Other" },
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  TR: [
    "İstanbul",
    "Ankara",
    "İzmir",
    "Bursa",
    "Antalya",
    "Adana",
    "Konya",
    "Gaziantep",
    "Eskişehir",
    "Kayseri",
    "Trabzon",
    "Diyarbakır",
    "Mersin",
    "Samsun",
    "Sakarya",
    "Muğla",
  ],
  US: ["New York", "Los Angeles", "San Francisco", "Chicago", "Miami", "Austin", "Seattle", "Boston"],
  GB: ["London", "Manchester", "Edinburgh", "Bristol", "Birmingham"],
  DE: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  FR: ["Paris", "Lyon", "Marseille", "Bordeaux", "Nice"],
  NL: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah"],
  OTHER: [],
};

export function citiesFor(country: string | null | undefined): string[] {
  if (!country) return [];
  return CITIES_BY_COUNTRY[country] ?? [];
}

export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
