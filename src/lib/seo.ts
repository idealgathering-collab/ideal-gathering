import { brand } from "@/config/brand";
export const SITE_URL = brand.siteUrl;

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
      title: `Find Your Gathering · Early Access | ${brand.name}`,
      description:
        "Find the right people for real-life activities and make gatherings easier to organize. Request Havato early access as invitations expand.",
    },

    ru: {
      title: `${brand.name} — Больше никто не будет один`,
      description:
        "Настоящие столы в настоящих кафе. Одна тема, несколько стульев и люди, с которыми стоит познакомиться. Присоединяйся к встрече или организуй свою.",
    },
    fa: {
      title: `هواتو — دورهمی و دسترسی زودهنگام`,
      description:
        "آدم‌های مناسب را برای فعالیت‌های واقعی پیدا کن و دورهمی‌ها را راحت‌تر هماهنگ کن. برای دعوت به هواتو، درخواست دسترسی زودهنگام ثبت کن.",
    },
  },
  "/explore": {
    en: {
      title: `Explore Gatherings · ${brand.name}`,
      description:
        "Browse upcoming gatherings around a subject at cafes and restaurants near you.",
    },
    ru: {
      title: `Найти встречи · ${brand.name}`,
      description:
        "Смотри предстоящие встречи по интересам в кафе и ресторанах рядом с тобой.",
    },
    fa: {
      title: `کشف گردهمایی‌ها · ${brand.name}`,
      description:
        "گردهمایی‌های پیش‌ رو را در کافه‌ها و رستوران‌های نزدیک خود بر اساس موضوع ببینید.",
    },
  },
  "/partnership": {
    en: {
      title: `Partnership — ${brand.name}`,
      description:
        "Turn quiet hours into themed Gatherings at your cafe or restaurant. You approve every Gathering — full control, no bidding, no commitment.",
    },
    ru: {
      title: `Партнёрство — ${brand.name}`,
      description:
        "Превратите тихие часы вашего кафе в тематические встречи. Каждую встречу утверждаете вы — полный контроль, без обязательств.",
    },
    fa: {
      title: `همکاری — ${brand.name}`,
      description:
        "ساعت‌های خلوت کافه یا رستوران خود را به گردهمایی‌های موضوعی تبدیل کنید. هر گردهمایی را شما تأیید می‌کنید — کنترل کامل و بدون تعهد.",
    },
  },
  "/terms": {
    en: {
      title: `Terms of Service — ${brand.name}`,
      description:
        `The rules for using ${brand.name}: acceptable use, host and venue responsibilities, and liability.`,
    },
    ru: {
      title: `Условия использования — ${brand.name}`,
      description:
        `Правила пользования ${brand.name}: допустимое использование, ответственность организатора и площадки, и ограничение ответственности.`,
    },
    fa: {
      title: `شرایط استفاده — هواتو`,
      description:
        `قوانین استفاده از ${brand.name}: استفادهٔ مجاز، مسئولیت میزبان و مکان، و حدود مسئولیت.`,
    },
  },
  "/privacy": {
    en: {
      title: `Privacy Policy — ${brand.name}`,
      description:
        `How ${brand.name} handles early-access and account information, service providers, deletion requests, and applicable privacy rights.`,
    },
    ru: {
      title: `Политика конфиденциальности — ${brand.name}`,
      description:
        `Как ${brand.name} обрабатывает данные раннего доступа и аккаунтов, запросы на удаление и применимые права на конфиденциальность.`,
    },
    fa: {
      title: `سیاست حریم خصوصی — هواتو`,
      description:
        `${brand.name}: اطلاعات دسترسی زودهنگام و حساب، ارائه‌دهندگان خدمات، درخواست حذف و حقوق حریم خصوصی مربوط.`,
    },
  },
  "/our-story": {
    en: {
      title: `Our Story — ${brand.name}`,
      description:
        `How ${brand.name} started: a weekly table of friends, scattered by life, rebuilt into something anyone can have again.`,
    },
    ru: {
      title: `Наша история — ${brand.name}`,
      description:
        `Как появился ${brand.name}: еженедельный стол друзей, которых разбросала жизнь, — и то, как мы вернули это каждому.`,
    },
    fa: {
      title: `داستان ما — هواتو`,
      description:
        `داستان ${brand.name}: یک دورهمی هفتگی دوستانه، پراکنده شدن آن جمع و تلاش برای اینکه هیچ‌کس تنها نماند.`,
    },
  },
  "/auth": {
    en: {
      title: `Sign In or Join — ${brand.name}`,
      description:
        `Create your free ${brand.name} account to join a table near you, or sign back in to see your upcoming gatherings.`,
    },
    ru: {
      title: `Войти или присоединиться — ${brand.name}`,
      description:
        `Создай бесплатный аккаунт ${brand.name}, чтобы занять место за столом рядом с тобой, или войди, чтобы увидеть предстоящие встречи.`,
    },
    fa: {
      title: `ورود یا عضویت — ${brand.name}`,
      description:
        `برای پیوستن به یک میز در نزدیکی خود حساب رایگان ${brand.name} بسازید یا برای دیدن گردهمایی‌های پیش‌رو وارد شوید.`,
    },
  },
  "/venue/auth": {
    en: {
      title: `Venue Sign In — ${brand.name}`,
      description:
        "Cafés and restaurants: create a venue account to list your tables and host themed gatherings during quiet hours.",
    },
    ru: {
      title: `Вход для заведений — ${brand.name}`,
      description:
        "Кафе и рестораны: создайте аккаунт заведения, чтобы добавить свои столы и принимать тематические встречи в тихие часы.",
    },
    fa: {
      title: `ورود مکان‌ها — ${brand.name}`,
      description:
        "کافه‌ها و رستوران‌ها: برای ثبت میزها و میزبانی گردهمایی‌های موضوعی در ساعت‌های خلوت، حساب مکان بسازید.",
    },
  },
  "/waitlist": {
    en: {
      title: `Early Access — ${brand.name}`,
      description:
        "Request an invitation to Havato. Early Access opens gradually as availability expands.",
    },
    ru: {
      title: `Лист ожидания — ${brand.name}`,
      description:
        "Расскажи, в каком ты городе и что тебе интересно, — и мы пригласим тебя, когда рядом откроются новые столы.",
    },
    fa: {
      title: `دسترسی زودهنگام — هواتو`,
      description:
        "برای دعوت به هواتو درخواست ثبت کن. با گسترش ظرفیت، دسترسی به‌تدریج فراهم می‌شود.",
    },
  },
};

export function urlFor(path: string, lang: SeoLang) {
  const base = `${SITE_URL}${path === "/" ? "/" : path}`;
  if (["/", "/our-story", "/terms", "/privacy", "/waitlist"].includes(path))
    return `${base}?lang=${lang === "en" ? "en" : "fa"}`;
  return lang === "en" ? base : `${base}?lang=${lang}`;
}

/**
 * Localized title/description/OG tags, hreflang alternates and a WebPage
 * JSON-LD node for a public route.
 */
export function localizedHead(path: string, rawLang: unknown) {
  const publicPage = ["/", "/our-story", "/terms", "/privacy", "/waitlist"].includes(path);
  const lang = publicPage ? (rawLang === "en" ? "en" : "fa") : normalizeLang(rawLang);
  const languages = publicPage ? (["fa", "en"] as const) : SEO_LANGS;
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
      ...languages.map((l) => ({
        rel: "alternate",
        hrefLang: l,
        href: urlFor(path, l),
      })),
      { rel: "alternate", hrefLang: "x-default", href: urlFor(path, publicPage ? "fa" : "en") },
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
    name: brand.name,
    url: SITE_URL,
    logo: new URL(brand.logoUrl, SITE_URL).href,
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
    publisher: { "@id": `${SITE_URL}/#organization`, name: brand.name },
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
    publisher: { "@id": `${SITE_URL}/#organization`, name: brand.name },
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
    `A gathering around one subject on ${when}${where ? ` at ${where}` : ""}. ${seats} seat${seats === 1 ? "" : "s"} at the table — join on ${brand.name}.`,
  ru: ({ when, where, seats }) =>
    `Встреча на одну тему ${when}${where ? ` в ${where}` : ""}. За столом ${seats} мест — присоединяйся на ${brand.name}.`,
  fa: ({ when, where, seats }) =>
    `گردهمایی حول یک موضوع در ${when}${where ? ` در ${where}` : ""}. ${seats} صندلی سر میز — در ${brand.name} بپیوندید.`,
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
        { title: `Gathering not found — ${brand.name}` },
        {
          name: "description",
          content:
            `This gathering is no longer available. Browse upcoming gatherings on ${brand.name}.`,
        },
        { name: "robots", content: "noindex, follow" },
      ],
      links: [{ rel: "canonical", href: self }],
    };
  }

  const venue = g.business?.name ?? g.venue_name ?? "";
  const title = clampTitle(
    venue ? `${g.subject} ${GATHERING_AT[lang]} ${venue}` : `${g.subject} — ${brand.name}`,
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
