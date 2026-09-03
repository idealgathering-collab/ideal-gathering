export const SITE_URL = "https://www.idealgathering.com";

export const SEO_LANGS = ["en", "ru", "fa"] as const;
export type SeoLang = (typeof SEO_LANGS)[number];

export const OG_LOCALE: Record<SeoLang, string> = {
  en: "en_US",
  ru: "ru_RU",
  fa: "fa_IR",
};

export function normalizeLang(value: unknown): SeoLang {
  return value === "ru" || value === "fa" ? value : "en";
}

type Copy = { title: string; description: string };

export const PAGE_SEO: Record<string, Record<SeoLang, Copy>> = {
  "/": {
    en: {
      title: "Just Gather — Small-Group Meetups | Ideal Gathering",
      description:
        "An open platform for small-group meetups. Create a gathering for anything, anywhere — coffee, a hike, a game night — and get matched with the right people.",
    },

    ru: {
      title: "Ideal Gathering — Больше никто не будет один",
      description:
        "Настоящие столы в настоящих кафе. Одна тема, несколько стульев и люди, с которыми стоит познакомиться. Присоединяйся к встрече или организуй свою.",
    },
    fa: {
      title: "Ideal Gathering — دیگر هیچ‌کس تنها نخواهد بود",
      description:
        "میزهای واقعی در کافه‌های واقعی. یک موضوع، چند صندلی و آدم‌هایی که ارزش شناختن دارند. به یک گردهمایی بپیوندید یا خودتان میزبان شوید.",
    },
  },
  "/explore": {
    en: {
      title: "Explore Gatherings · Ideal Gathering",
      description:
        "Browse upcoming gatherings around a subject at cafes and restaurants near you.",
    },
    ru: {
      title: "Найти встречи · Ideal Gathering",
      description:
        "Смотри предстоящие встречи по интересам в кафе и ресторанах рядом с тобой.",
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
    ru: {
      title: "Партнёрство — Ideal Gathering",
      description:
        "Превратите тихие часы вашего кафе в тематические встречи. Каждую встречу утверждаете вы — полный контроль, без обязательств.",
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
    ru: {
      title: "Условия использования — Ideal Gathering",
      description:
        "Правила пользования Ideal Gathering: допустимое использование, ответственность организатора и площадки, и ограничение ответственности.",
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
        "How Ideal Gathering collects, uses, and protects your data. Privacy notice for users in Armenia.",
    },
    ru: {
      title: "Политика конфиденциальности — Ideal Gathering",
      description:
        "Как Ideal Gathering собирает, использует и защищает ваши данные. Уведомление с учётом требований KVKK для пользователей из Турции.",
    },
    fa: {
      title: "سیاست حریم خصوصی — Ideal Gathering",
      description:
        "Ideal Gathering چگونه داده‌های شما را جمع‌آوری، استفاده و محافظت می‌کند. اطلاعیهٔ سازگار با KVKK برای کاربران ترکیه.",
    },
  },
  "/our-story": {
    en: {
      title: "Our Story — Ideal Gathering",
      description:
        "How Ideal Gathering started: a weekly table of friends, scattered by life, rebuilt into something anyone can have again.",
    },
    ru: {
      title: "Наша история — Ideal Gathering",
      description:
        "Как появился Ideal Gathering: еженедельный стол друзей, которых разбросала жизнь, — и то, как мы вернули это каждому.",
    },
    fa: {
      title: "Our Story — Ideal Gathering",
      description:
        "How Ideal Gathering started: a weekly table of friends, scattered by life, rebuilt into something anyone can have again.",
    },
  },
  "/auth": {
    en: {
      title: "Sign In or Join — Ideal Gathering",
      description:
        "Create your free Ideal Gathering account to join a table near you, or sign back in to see your upcoming gatherings.",
    },
    ru: {
      title: "Войти или присоединиться — Ideal Gathering",
      description:
        "Создай бесплатный аккаунт Ideal Gathering, чтобы занять место за столом рядом с тобой, или войди, чтобы увидеть предстоящие встречи.",
    },
    fa: {
      title: "ورود یا عضویت — Ideal Gathering",
      description:
        "برای پیوستن به یک میز در نزدیکی خود حساب رایگان Ideal Gathering بسازید یا برای دیدن گردهمایی‌های پیش‌رو وارد شوید.",
    },
  },
  "/venue/auth": {
    en: {
      title: "Venue Sign In — Ideal Gathering",
      description:
        "Cafés and restaurants: create a venue account to list your tables and host themed gatherings during quiet hours.",
    },
    ru: {
      title: "Вход для заведений — Ideal Gathering",
      description:
        "Кафе и рестораны: создайте аккаунт заведения, чтобы добавить свои столы и принимать тематические встречи в тихие часы.",
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
    ru: {
      title: "Лист ожидания — Ideal Gathering",
      description:
        "Расскажи, в каком ты городе и что тебе интересно, — и мы пригласим тебя, когда рядом откроются новые столы.",
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
 * Localized title/description/OG tags, hreflang alternates and a WebPage
 * JSON-LD node for a public route.
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLdWebPage(path, lang)),
      },
    ],
  };
}


/* ---------------------------------------------------------------------------
 * Schema.org structured data (localized)
 * ------------------------------------------------------------------------- */

const SCHEMA_LOCALE: Record<SeoLang, string> = { en: "en", ru: "ru", fa: "fa" };

export function jsonLdOrganization(lang: SeoLang) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Ideal Gathering",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: PAGE_SEO["/"][lang].description,
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

/** Per-page WebPage node, tied to the site's WebSite/Organization graph. */
export function jsonLdWebPage(path: string, lang: SeoLang) {
  const copy = PAGE_SEO[path]?.[lang] ?? PAGE_SEO["/"][lang];
  const url = urlFor(path, lang);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: copy.title,
    description: copy.description,
    inLanguage: SCHEMA_LOCALE[lang],
    isPartOf: { "@id": `${SITE_URL}/#website` },
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

/* ---------------------------------------------------------------------------
 * Gathering detail head + sitemap route list
 * ------------------------------------------------------------------------- */

/** Public routes that belong in the sitemap. */
export const PUBLIC_ROUTES = [
  "/",
  "/explore",
  "/partnership",
  "/waitlist",
  "/terms",
  "/privacy",
  "/our-story",
] as const;

const GATHERING_FALLBACK: Record<
  SeoLang,
  (args: { when: string; where: string; seats: number }) => string
> = {
  en: ({ when, where, seats }) =>
    `A gathering around one subject on ${when}${where ? ` at ${where}` : ""}. ${seats} seat${seats === 1 ? "" : "s"} at the table — join on Ideal Gathering.`,
  ru: ({ when, where, seats }) =>
    `Встреча на одну тему ${when}${where ? ` в ${where}` : ""}. За столом ${seats} мест — присоединяйся на Ideal Gathering.`,
  fa: ({ when, where, seats }) =>
    `گردهمایی حول یک موضوع در ${when}${where ? ` در ${where}` : ""}. ${seats} صندلی سر میز — در Ideal Gathering بپیوندید.`,
};

const GATHERING_AT: Record<SeoLang, string> = { en: "at", ru: "—", fa: "در" };

export type GatheringHeadInput = SchemaGathering & {
  status?: string | null;
  cover_url?: string | null;
};

function clampTitle(value: string) {
  return value.length <= 60 ? value : `${value.slice(0, 57).trimEnd()}…`;
}

/**
 * Localized title/description/OG/canonical/hreflang + Event JSON-LD for a
 * single gathering. Pass `null` for a missing or non-public gathering.
 */
export function gatheringHead(
  g: GatheringHeadInput | null,
  rawLang: unknown,
  id: string,
) {
  const lang = normalizeLang(rawLang);
  const path = `/gatherings/${id}`;
  const self = urlFor(path, lang);

  if (!g) {
    return {
      meta: [
        { title: "Gathering not found — Ideal Gathering" },
        {
          name: "description",
          content:
            "This gathering is no longer available. Browse upcoming gatherings on Ideal Gathering.",
        },
        { name: "robots", content: "noindex, follow" },
      ],
      links: [{ rel: "canonical", href: self }],
    };
  }

  const venue = g.business?.name ?? g.venue_name ?? "";
  const title = clampTitle(
    venue ? `${g.subject} ${GATHERING_AT[lang]} ${venue}` : `${g.subject} — Ideal Gathering`,
  );
  const when = new Date(g.starts_at).toLocaleDateString(lang, {
    month: "long",
    day: "numeric",
  });
  const description = (
    g.description?.trim() ||
    GATHERING_FALLBACK[lang]({
      when,
      where: venue || g.neighborhood || "",
      seats: Math.max(0, g.seats - (g.attendee_count ?? 0)),
    })
  ).slice(0, 300);

  const image = g.business?.cover_url ?? g.cover_url ?? null;
  const past = new Date(g.starts_at).getTime() < Date.now() - 3 * 60 * 60 * 1000;
  const indexable = g.status !== "approved" ? false : !past;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: self },
      { property: "og:locale", content: OG_LOCALE[lang] },
      { name: "twitter:card", content: "summary_large_image" },
      ...(image
        ? [
            { property: "og:image", content: image },
            { name: "twitter:image", content: image },
          ]
        : []),
      ...(indexable ? [] : [{ name: "robots", content: "noindex, follow" }]),
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLdGathering(g, lang)),
      },
    ],
  };
}
