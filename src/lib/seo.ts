export const SITE_URL = "https://www.idealgathering.com";

export const SEO_LANGS = ["en", "tr", "fa"] as const;
export type SeoLang = (typeof SEO_LANGS)[number];

export const OG_LOCALE: Record<SeoLang, string> = {
  en: "en_US",
  tr: "tr_TR",
  fa: "fa_IR",
};

export function normalizeLang(value: unknown): SeoLang {
  return value === "tr" || value === "fa" ? value : "en";
}

type Copy = { title: string; description: string };

export const PAGE_SEO: Record<string, Record<SeoLang, Copy>> = {
  "/": {
    en: {
      title: "Ideal Gathering — No One Will Be Alone Anymore",
      description:
        "Real tables at real cafés in Istanbul. One subject, a few seats, and people worth meeting. Join a gathering or host your own.",
    },
    tr: {
      title: "Ideal Gathering — Kimse Artık Yalnız Olmayacak",
      description:
        "İstanbul'un kafelerinde gerçek masalar. Bir konu, birkaç sandalye ve tanışmaya değer insanlar. Bir buluşmaya katıl ya da kendin düzenle.",
    },
    fa: {
      title: "Ideal Gathering — دیگر هیچ‌کس تنها نخواهد بود",
      description:
        "میزهای واقعی در کافه‌های استانبول. یک موضوع، چند صندلی و آدم‌هایی که ارزش شناختن دارند. به یک گردهمایی بپیوندید یا خودتان میزبان شوید.",
    },
  },
  "/explore": {
    en: {
      title: "Explore Gatherings · Ideal Gathering",
      description:
        "Browse upcoming gatherings around a subject at cafes and restaurants near you.",
    },
    tr: {
      title: "Buluşmaları Keşfet · Ideal Gathering",
      description:
        "Yakınındaki kafe ve restoranlarda bir konu etrafında düzenlenen yaklaşan buluşmalara göz at.",
    },
    fa: {
      title: "کشف گردهمایی‌ها · Ideal Gathering",
      description:
        "گردهمایی‌های پیش‌ رو را در کافه‌ها و رستوران‌های نزدیک خود بر اساس موضوع ببینید.",
    },
  },
  "/partnership": {
    en: {
      title: "Partnership — Ideal Gathering",
      description:
        "Turn quiet hours into themed Gatherings at your cafe or restaurant. You approve every Gathering — full control, no bidding, no commitment.",
    },
    tr: {
      title: "İş Ortaklığı — Ideal Gathering",
      description:
        "Kafenizin sakin saatlerini temalı buluşmalara dönüştürün. Her buluşmayı siz onaylarsınız — tam kontrol, taahhüt yok.",
    },
    fa: {
      title: "همکاری — Ideal Gathering",
      description:
        "ساعت‌های خلوت کافه یا رستوران خود را به گردهمایی‌های موضوعی تبدیل کنید. هر گردهمایی را شما تأیید می‌کنید — کنترل کامل و بدون تعهد.",
    },
  },
  "/terms": {
    en: {
      title: "Terms of Service — Ideal Gathering",
      description:
        "The rules for using Ideal Gathering: acceptable use, host and venue responsibilities, and liability.",
    },
    tr: {
      title: "Kullanım Koşulları — Ideal Gathering",
      description:
        "Ideal Gathering kullanım kuralları: kabul edilebilir kullanım, ev sahibi ve mekân sorumlulukları ve yasal sorumluluk.",
    },
    fa: {
      title: "شرایط استفاده — Ideal Gathering",
      description:
        "قوانین استفاده از Ideal Gathering: استفادهٔ مجاز، مسئولیت میزبان و مکان، و حدود مسئولیت.",
    },
  },
  "/privacy": {
    en: {
      title: "Privacy Policy — Ideal Gathering",
      description:
        "How Ideal Gathering collects, uses, and protects your data. KVKK-aware notice for users in Türkiye.",
    },
    tr: {
      title: "Gizlilik Politikası — Ideal Gathering",
      description:
        "Ideal Gathering verilerinizi nasıl topluyor, kullanıyor ve koruyor. Türkiye'deki kullanıcılar için KVKK uyumlu bilgilendirme.",
    },
    fa: {
      title: "سیاست حریم خصوصی — Ideal Gathering",
      description:
        "Ideal Gathering چگونه داده‌های شما را جمع‌آوری، استفاده و محافظت می‌کند. اطلاعیهٔ سازگار با KVKK برای کاربران ترکیه.",
    },
  },
  "/auth": {
    en: {
      title: "Sign In or Join — Ideal Gathering",
      description:
        "Create your free Ideal Gathering account to join a table in Istanbul, or sign back in to see your upcoming gatherings.",
    },
    tr: {
      title: "Giriş Yap veya Katıl — Ideal Gathering",
      description:
        "İstanbul'da bir masaya katılmak için ücretsiz Ideal Gathering hesabını oluştur ya da yaklaşan buluşmalarını görmek için giriş yap.",
    },
    fa: {
      title: "ورود یا عضویت — Ideal Gathering",
      description:
        "برای پیوستن به یک میز در استانبول حساب رایگان Ideal Gathering بسازید یا برای دیدن گردهمایی‌های پیش‌رو وارد شوید.",
    },
  },
  "/venue/auth": {
    en: {
      title: "Venue Sign In — Ideal Gathering",
      description:
        "Cafés and restaurants: create a venue account to list your tables and host themed gatherings during quiet hours.",
    },
    tr: {
      title: "Mekân Girişi — Ideal Gathering",
      description:
        "Kafeler ve restoranlar: masalarınızı listelemek ve sakin saatlerde temalı buluşmalara ev sahipliği yapmak için mekân hesabı oluşturun.",
    },
    fa: {
      title: "ورود مکان‌ها — Ideal Gathering",
      description:
        "کافه‌ها و رستوران‌ها: برای ثبت میزها و میزبانی گردهمایی‌های موضوعی در ساعت‌های خلوت، حساب مکان بسازید.",
    },
  },
  "/waitlist": {
    en: {
      title: "Guest Waitlist — Ideal Gathering",
      description:
        "Tell us your city and interests and we'll invite you as new tables open up at cafés near you.",
    },
    tr: {
      title: "Misafir Listesi — Ideal Gathering",
      description:
        "Şehrini ve ilgi alanlarını paylaş; yakınındaki kafelerde yeni masalar açıldıkça seni davet edelim.",
    },
    fa: {
      title: "فهرست انتظار مهمان — Ideal Gathering",
      description:
        "شهر و علاقه‌مندی‌های خود را بگویید تا با باز شدن میزهای تازه در کافه‌های نزدیک، دعوت‌تان کنیم.",
    },
  },
};

export function urlFor(path: string, lang: SeoLang) {
  const base = `${SITE_URL}${path === "/" ? "/" : path}`;
  return lang === "en" ? base : `${base}?lang=${lang}`;
}

/**
 * Localized title/description/OG tags plus hreflang alternates for a public route.
 */
export function localizedHead(path: string, rawLang: unknown) {
  const lang = normalizeLang(rawLang);
  const copy = PAGE_SEO[path]?.[lang] ?? PAGE_SEO["/"][lang];
  const self = urlFor(path, lang);

  return {
    meta: [
      { title: copy.title },
      { name: "description", content: copy.description },
      { property: "og:title", content: copy.title },
      { property: "og:description", content: copy.description },
      { property: "og:url", content: self },
      { property: "og:locale", content: OG_LOCALE[lang] },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: self },
      ...SEO_LANGS.map((l) => ({
        rel: "alternate",
        hrefLang: l,
        href: urlFor(path, l),
      })),
      { rel: "alternate", hrefLang: "x-default", href: urlFor(path, "en") },
    ],
  };
}

/* ---------------------------------------------------------------------------
 * Schema.org structured data (localized)
 * ------------------------------------------------------------------------- */

const SCHEMA_LOCALE: Record<SeoLang, string> = { en: "en", tr: "tr", fa: "fa" };

export function jsonLdOrganization(lang: SeoLang) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Ideal Gathering",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: PAGE_SEO["/"][lang].description,
    areaServed: { "@type": "City", name: "Istanbul" },
    inLanguage: SCHEMA_LOCALE[lang],
  };
}

export function jsonLdWebSite(lang: SeoLang) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: PAGE_SEO["/"][lang].title,
    description: PAGE_SEO["/"][lang].description,
    inLanguage: SCHEMA_LOCALE[lang],
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export type SchemaVenue = {
  id?: string | null;
  name: string;
  city?: string | null;
  address?: string | null;
  cover_url?: string | null;
};

/** Restaurant / cafe venue node, reusable as an Event location. */
export function jsonLdVenue(venue: SchemaVenue, lang: SeoLang) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    ...(venue.id ? { "@id": `${SITE_URL}/businesses/${venue.id}#venue` } : {}),
    name: venue.name,
    inLanguage: SCHEMA_LOCALE[lang],
    ...(venue.cover_url ? { image: venue.cover_url } : {}),
    ...(venue.city || venue.address
      ? {
          address: {
            "@type": "PostalAddress",
            ...(venue.address ? { streetAddress: venue.address } : {}),
            ...(venue.city ? { addressLocality: venue.city } : {}),
            addressCountry: "TR",
          },
        }
      : {}),
  };
}

export type SchemaGathering = {
  id: string;
  subject: string;
  description?: string | null;
  starts_at: string;
  seats: number;
  attendee_count?: number;
  venue_name?: string | null;
  neighborhood?: string | null;
  business?: SchemaVenue | null;
};

export function jsonLdGathering(g: SchemaGathering, lang: SeoLang) {
  const url = `${SITE_URL}/gatherings/${g.id}`;
  const start = new Date(g.starts_at);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const venue: SchemaVenue | null = g.business
    ? g.business
    : g.venue_name
      ? { name: g.venue_name, city: g.neighborhood ?? null }
      : null;
  const full =
    typeof g.attendee_count === "number" && g.attendee_count >= g.seats;

  return {
    "@context": "https://schema.org",
    "@type": "SocialEvent",
    "@id": `${url}#event`,
    url,
    name: g.subject,
    ...(g.description ? { description: g.description } : {}),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    inLanguage: SCHEMA_LOCALE[lang],
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    maximumAttendeeCapacity: g.seats,
    ...(typeof g.attendee_count === "number"
      ? { remainingAttendeeCapacity: Math.max(0, g.seats - g.attendee_count) }
      : {}),
    ...(venue ? { location: jsonLdVenue(venue, lang) } : {}),
    organizer: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      url,
      price: "0",
      priceCurrency: "TRY",
      availability: full
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    },
  };
}

export function jsonLdGatheringList(list: SchemaGathering[], lang: SeoLang) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: PAGE_SEO["/explore"][lang].title,
    inLanguage: SCHEMA_LOCALE[lang],
    numberOfItems: list.length,
    itemListElement: list.slice(0, 25).map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: jsonLdGathering(g, lang),
    })),
  };
}
