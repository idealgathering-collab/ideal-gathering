// Static country + city + neighborhood catalogue for profile dropdowns.
// TR + IR are our primary markets; a few global cities help early expat/international users.

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "AM", name: "Armenia" },
  { code: "TR", name: "Türkiye" },
  { code: "IR", name: "Iran" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "OTHER", name: "Other" },
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  AM: [
    "Yerevan",
    "Gyumri",
    "Vanadzor",
    "Vagharshapat (Etchmiadzin)",
    "Hrazdan",
    "Abovyan",
    "Kapan",
    "Armavir",
    "Gavar",
    "Artashat",
    "Ijevan",
    "Charentsavan",
    "Sevan",
    "Dilijan",
    "Goris",
    "Alaverdi",
  ],
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
  IR: [
    "Tehran",
    "Isfahan",
    "Shiraz",
    "Mashhad",
    "Tabriz",
    "Karaj",
    "Qom",
    "Ahvaz",
    "Kermanshah",
    "Urmia",
    "Rasht",
    "Yazd",
    "Kish",
    "Bandar Abbas",
  ],
  US: ["New York", "Los Angeles", "San Francisco", "Chicago", "Miami", "Austin", "Seattle", "Boston"],
  GB: ["London", "Manchester", "Edinburgh", "Bristol", "Birmingham"],
  DE: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  FR: ["Paris", "Lyon", "Marseille", "Bordeaux", "Nice"],
  NL: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah"],
  OTHER: [],
};

// Recognizable districts/neighborhoods per city. Any city not listed here
// falls back to a free-text input in the profile UI.
export const NEIGHBORHOODS_BY_CITY: Record<string, string[]> = {
  "Yerevan": [
    "Kentron",
    "Arabkir",
    "Ajapnyak",
    "Avan",
    "Davtashen",
    "Erebuni",
    "Kanaker-Zeytun",
    "Malatia-Sebastia",
    "Nor Nork",
    "Nork-Marash",
    "Nubarashen",
    "Shengavit",
    "Cascade",
    "Kond",
  ],
  "İstanbul": [
    "Kadıköy",
    "Beşiktaş",
    "Şişli",
    "Beyoğlu",
    "Üsküdar",
    "Bakırköy",
    "Fatih",
    "Sarıyer",
    "Ataşehir",
    "Maltepe",
    "Kartal",
    "Bahçelievler",
    "Nişantaşı",
    "Karaköy",
    "Moda",
  ],
  "Tehran": [
    "Tajrish",
    "Vanak",
    "Elahieh",
    "Niavaran",
    "Sa'adat Abad",
    "Jordan",
    "Darrous",
    "Zafaraniyeh",
    "Fereshteh",
    "Pasdaran",
    "Shahrak-e Gharb",
    "Yousef Abad",
    "Ekbatan",
    "Gisha",
  ],
};

export function citiesFor(country: string | null | undefined): string[] {
  if (!country) return [];
  return CITIES_BY_COUNTRY[country] ?? [];
}

export function neighborhoodsFor(city: string | null | undefined): string[] {
  if (!city) return [];
  return NEIGHBORHOODS_BY_CITY[city] ?? [];
}

export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
