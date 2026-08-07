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
};

function urlFor(path: string, lang: SeoLang) {
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
